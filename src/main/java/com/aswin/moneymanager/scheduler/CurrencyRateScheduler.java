package com.aswin.moneymanager.scheduler;

import com.aswin.moneymanager.service.currency.CurrencyConversionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CurrencyRateScheduler {

    private final CurrencyConversionService currencyConversionService;

    // Common base currencies to keep up to date daily at 02:00
    private static final List<String> BASE_CURRENCIES = List.of("USD", "EUR", "GBP", "INR");

    @Scheduled(cron = "0 0 2 * * *")
    public void refreshDailyRates() {
        log.info("Starting scheduled FX rate refresh");
        BASE_CURRENCIES.forEach(base -> {
            try {
                currencyConversionService.refreshRates(base);
            } catch (Exception e) {
                log.error("FX refresh failed for {}: {}", base, e.getMessage());
            }
        });
        log.info("Scheduled FX rate refresh complete");
    }
}
