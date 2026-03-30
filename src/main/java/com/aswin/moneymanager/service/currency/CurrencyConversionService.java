package com.aswin.moneymanager.service.currency;

import com.aswin.moneymanager.entity.CurrencyRate;
import com.aswin.moneymanager.repository.CurrencyRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CurrencyConversionService {

    private final CurrencyRateRepository currencyRateRepository;
    private final RestClient.Builder restClientBuilder;

    private static final String FX_API = "https://api.exchangerate-api.com/v4/latest/";

    /**
     * Convert amount from sourceCurrency to targetCurrency.
     * Returns amount unchanged if currencies are equal or conversion unavailable.
     */
    @Cacheable(cacheNames = "fx_rates", key = "#sourceCurrency + ':' + #targetCurrency")
    public BigDecimal convert(BigDecimal amount, String sourceCurrency, String targetCurrency) {
        if (amount == null || sourceCurrency.equalsIgnoreCase(targetCurrency)) {
            return amount;
        }
        BigDecimal rate = getRate(sourceCurrency, targetCurrency);
        if (rate == null) return amount;
        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getRate(String base, String target) {
        if (base.equalsIgnoreCase(target)) return BigDecimal.ONE;

        return currencyRateRepository.findByBaseCurrencyAndTargetCurrency(
                        base.toUpperCase(), target.toUpperCase())
                .map(CurrencyRate::getRate)
                .orElseGet(() -> fetchAndStore(base.toUpperCase(), target.toUpperCase()));
    }

    @Transactional
    @CacheEvict(cacheNames = "fx_rates", allEntries = true)
    public void refreshRates(String baseCurrency) {
        try {
            RestClient client = restClientBuilder.build();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.get()
                    .uri(FX_API + baseCurrency)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("rates")) {
                log.warn("No rates returned for base currency {}", baseCurrency);
                return;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> rates = (Map<String, Object>) response.get("rates");
            rates.forEach((target, rateObj) -> {
                BigDecimal rate = new BigDecimal(rateObj.toString());
                currencyRateRepository.findByBaseCurrencyAndTargetCurrency(baseCurrency, target)
                        .ifPresentOrElse(
                                existing -> {
                                    existing.setRate(rate);
                                    currencyRateRepository.save(existing);
                                },
                                () -> currencyRateRepository.save(CurrencyRate.builder()
                                        .baseCurrency(baseCurrency)
                                        .targetCurrency(target)
                                        .rate(rate)
                                        .build()));
            });

            log.info("FX rates refreshed for base currency {}, {} pairs updated",
                    baseCurrency, rates.size());
        } catch (Exception e) {
            log.error("Failed to refresh FX rates for {}: {}", baseCurrency, e.getMessage());
        }
    }

    private BigDecimal fetchAndStore(String base, String target) {
        try {
            refreshRates(base);
            return currencyRateRepository.findByBaseCurrencyAndTargetCurrency(base, target)
                    .map(CurrencyRate::getRate)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Could not fetch rate for {}/{}: {}", base, target, e.getMessage());
            return null;
        }
    }
}
