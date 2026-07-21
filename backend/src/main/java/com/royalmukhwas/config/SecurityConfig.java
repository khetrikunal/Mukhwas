package com.royalmukhwas.config;

import com.royalmukhwas.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * Safe-guarded default origins that are always allowed, regardless of the
     * {@code CORS_ORIGINS} env var.  This prevents a misconfigured env var from
     * breaking the production frontend.
     */
    private static final List<String> DEFAULT_ORIGINS = Arrays.asList(
            "https://www.theroyalmukhwas.com",
            "https://theroyalmukhwas.com",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://mukhwas-peach.vercel.app"
    );

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // CRITICAL: Permit all OPTIONS preflight requests — Spring Security
                // must not block them before the CorsFilter has a chance to respond.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/api/auth/**",
                    "/api/products/**",
                    "/api/categories/**",
                    "/api/banners/**",
                    "/api/payment/webhook",
                    // Springdoc OpenAPI — paths match application.properties config
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/v3/api-docs",
                    // Actuator health check (read-only, safe to expose)
                    "/actuator/health",
                    "/actuator/health/**"
                ).permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Merge configured origins (from CORS_ORIGINS env var) with hard-coded
        // defaults — this ensures production domains are NEVER missed.
        List<String> configured = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        List<String> origins = new ArrayList<>(configured);
        for (String fallback : DEFAULT_ORIGINS) {
            if (!origins.contains(fallback)) {
                origins.add(fallback);
            }
        }

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // Allow all common headers — specific lists cause preflight failures when
        // browsers send headers the list doesn't mention.
        config.setAllowedHeaders(Arrays.asList("*"));
        // For token-based auth (Authorization: Bearer), cookies are not required.
        config.setAllowCredentials(false);
        // Cache preflight response for 1 hour — reduces OPTIONS calls.
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
