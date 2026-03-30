package com.aswin.moneymanager.service;

import com.aswin.moneymanager.dto.request.*;
import com.aswin.moneymanager.dto.response.AuthResponse;
import com.aswin.moneymanager.dto.response.UserResponse;
import com.aswin.moneymanager.entity.User;
import com.aswin.moneymanager.exception.BadRequestException;
import com.aswin.moneymanager.exception.DuplicateResourceException;
import com.aswin.moneymanager.exception.ResourceNotFoundException;
import com.aswin.moneymanager.exception.UnauthorizedException;
import com.aswin.moneymanager.repository.UserRepository;
import com.aswin.moneymanager.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.from:noreply@moneymanager.com}")
    private String mailFrom;

    // ── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .defaultCurrency(request.getDefaultCurrency() != null ? request.getDefaultCurrency() : "USD")
                .build();

        User saved = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessTokenFromEmail(saved.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(saved.getEmail());

        return buildAuthResponse(accessToken, refreshToken, saved);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String tokenId = jwtTokenProvider.getTokenId(refreshToken);
        if (isBlacklisted(tokenId)) {
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        // Rotate: blacklist old refresh token
        blacklistToken(tokenId, jwtTokenProvider.getExpirationFromToken(refreshToken));

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        String newAccessToken = jwtTokenProvider.generateAccessTokenFromEmail(email);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        return buildAuthResponse(newAccessToken, newRefreshToken, user);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    public void logout(String bearerHeader, String refreshToken) {
        // Blacklist the access token
        if (StringUtils.hasText(bearerHeader) && bearerHeader.startsWith("Bearer ")) {
            String accessToken = bearerHeader.substring(7);
            if (jwtTokenProvider.validateToken(accessToken)) {
                blacklistToken(
                        jwtTokenProvider.getTokenId(accessToken),
                        jwtTokenProvider.getExpirationFromToken(accessToken));
            }
        }
        // Blacklist the refresh token
        if (StringUtils.hasText(refreshToken) && jwtTokenProvider.validateToken(refreshToken)) {
            blacklistToken(
                    jwtTokenProvider.getTokenId(refreshToken),
                    jwtTokenProvider.getExpirationFromToken(refreshToken));
        }
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    public void forgotPassword(ForgotPasswordRequest request) {
        // Always return success — never reveal whether the email exists
        userRepository.findByEmail(request.getEmail())
                .filter(User::getIsActive)
                .ifPresent(user -> {
                    String resetToken = UUID.randomUUID().toString();
                    if (redisTemplate != null) {
                        redisTemplate.opsForValue().set(
                                "auth:reset:" + resetToken,
                                user.getEmail(),
                                Duration.ofMinutes(15));
                    }
                    String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
                    sendResetEmail(user.getEmail(), user.getDisplayName(), resetLink);
                    log.info("Password reset token generated for {}", user.getEmail());
                });
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        String email = null;
        if (redisTemplate != null) {
            email = redisTemplate.opsForValue().get("auth:reset:" + request.getToken());
        }
        if (email == null) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        if (redisTemplate != null) {
            redisTemplate.delete("auth:reset:" + request.getToken());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void blacklistToken(String tokenId, Date expiry) {
        if (redisTemplate == null) return;
        long ttlSeconds = Math.max(1, (expiry.getTime() - System.currentTimeMillis()) / 1000);
        redisTemplate.opsForValue().set(
                "auth:blacklist:" + tokenId, "1", Duration.ofSeconds(ttlSeconds));
    }

    private boolean isBlacklisted(String tokenId) {
        if (redisTemplate == null) return false;
        return Boolean.TRUE.equals(redisTemplate.hasKey("auth:blacklist:" + tokenId));
    }

    private void sendResetEmail(String to, String name, String resetLink) {
        if (mailSender == null) {
            log.warn("Mail sender not configured — reset link: {}", resetLink);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject("Money Manager — Password Reset");
            message.setText(String.format(
                    "Hi %s,%n%nClick the link below to reset your password (valid for 15 minutes):%n%n%s%n%n"
                    + "If you did not request a password reset, please ignore this email.",
                    name, resetLink));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", to, e.getMessage());
        }
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .defaultCurrency(user.getDefaultCurrency())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400)
                .user(userResponse)
                .build();
    }
}
