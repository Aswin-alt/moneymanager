package com.aswin.moneymanager.service;

import com.aswin.moneymanager.dto.request.PasswordChangeRequest;
import com.aswin.moneymanager.dto.request.UserUpdateRequest;
import com.aswin.moneymanager.dto.response.UserResponse;
import com.aswin.moneymanager.entity.User;
import com.aswin.moneymanager.exception.BadRequestException;
import com.aswin.moneymanager.exception.ResourceNotFoundException;
import com.aswin.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getCurrentUser(String email) {
        return toResponse(findActiveUser(email));
    }

    @Transactional
    public UserResponse updateProfile(String email, UserUpdateRequest request) {
        User user = findActiveUser(email);

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getDefaultCurrency() != null) {
            user.setDefaultCurrency(request.getDefaultCurrency().toUpperCase());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, PasswordChangeRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New passwords do not match");
        }

        User user = findActiveUser(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(String email) {
        User user = findActiveUser(email);
        user.setIsActive(false);
        userRepository.save(user);
    }

    private User findActiveUser(String email) {
        return userRepository.findByEmail(email)
                .filter(User::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .defaultCurrency(user.getDefaultCurrency())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
