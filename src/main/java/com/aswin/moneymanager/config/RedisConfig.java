package com.aswin.moneymanager.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Configuration(proxyBeanMethods = false)
@EnableCaching
public class RedisConfig {

    /**
     * Root-typed Redis serializer.
     *
     * Jackson's activateDefaultTyping only wraps NESTED values in polymorphic
     * contexts. When you call mapper.writeValueAsBytes(list), the root ArrayList
     * is never wrapped — so on read, AsArrayTypeDeserializer can't find the type
     * string and throws MismatchedInputException.
     *
     * The fix: serialize via mapper.writerFor(Object.class) so the declared type
     * is always Object, which forces WRAPPER_ARRAY wrapping even at the root level:
     *   List  → ["java.util.ArrayList", [["CategoryResponse", {...}], ...]]
     *   POJO  → ["com.example.Foo", {"field":"value"}]
     * Both round-trip cleanly with mapper.readValue(bytes, Object.class).
     */
    private RedisSerializer<Object> cacheValueSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.WRAPPER_ARRAY
        );

        return new RedisSerializer<>() {
            @Override
            public byte[] serialize(Object value) throws SerializationException {
                if (value == null) return null;
                try {
                    // writerFor(Object.class) makes the root value polymorphic,
                    // so WRAPPER_ARRAY wraps the ArrayList itself, not just its elements.
                    return mapper.writerFor(Object.class).writeValueAsBytes(value);
                } catch (JsonProcessingException e) {
                    throw new SerializationException("Redis serialize error: " + e.getMessage(), e);
                }
            }

            @Override
            public Object deserialize(byte[] bytes) throws SerializationException {
                if (bytes == null || bytes.length == 0) return null;
                try {
                    return mapper.readValue(bytes, Object.class);
                } catch (IOException e) {
                    throw new SerializationException("Redis deserialize error: " + e.getMessage(), e);
                }
            }
        };
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisSerializer<Object> valueSerializer = cacheValueSerializer();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(valueSerializer));

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
