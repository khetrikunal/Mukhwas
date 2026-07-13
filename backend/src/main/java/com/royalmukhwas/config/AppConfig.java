package com.royalmukhwas.config;

import com.cloudinary.Cloudinary;
import com.razorpay.RazorpayClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.Map;

@Configuration
public class AppConfig {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;
    @Value("${cloudinary.api-key}")
    private String apiKey;
    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;
    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(Map.of(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret,
            "secure", true
        ));
    }

    @Bean
    public RazorpayClient razorpayClient() throws Exception {
        // Construct with real keys when available; use a dummy client in dev
        // when RAZORPAY_KEY_ID is unset (empty). The RazorpayClient constructor
        // does not validate credentials — it stores them for later API calls.
        String keyId = razorpayKeyId.isBlank() ? "dummy-key-id" : razorpayKeyId;
        String keySecret = razorpayKeySecret.isBlank() ? "dummy-key-secret" : razorpayKeySecret;
        return new RazorpayClient(keyId, keySecret);
    }
}
