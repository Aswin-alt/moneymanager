package com.aswin.moneymanager.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

@Configuration(proxyBeanMethods = false)
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
                "categories",      defaultConfig.entryTtl(Duration.ofHours(1)),
                "user_prefs",      defaultConfig.entryTtl(Duration.ofHours(1)),
                "budget_summary",  defaultConfig.entryTtl(Duration.ofMinutes(15)),
                "safe_to_spend",   defaultConfig.entryTtl(Duration.ofMinutes(10)),
                "report_spending", defaultConfig.entryTtl(Duration.ofMinutes(30)),
                "report_trend",    defaultConfig.entryTtl(Duration.ofMinutes(30)),
                "fx_rates",        defaultConfig.entryTtl(Duration.ofHours(24))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}
