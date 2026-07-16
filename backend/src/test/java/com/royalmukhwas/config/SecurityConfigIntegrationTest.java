package com.royalmukhwas.config;

import com.royalmukhwas.security.JwtFilter;
import com.royalmukhwas.security.JwtUtil;
import com.royalmukhwas.security.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import com.royalmukhwas.config.SecurityConfig;

import java.io.IOException;
import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Smoke check for {@link SecurityConfig} route authorization — the gate the plan
 * flags as most security-critical. Web slice only (no DB, no JPA, no Boot app
 * context).
 *
 * <p>Asserts that an unauthenticated request cannot reach {@code /api/admin/**}
 * (must be 401) while genuine public routes ({@code /api/products},
 * {@code /api/auth/**}, the Razorpay webhook) respond without auth.
 *
 * <p>Stubs SecurityConfig's constructor dependencies with no-op beans (no real
 * JWT parsing, no DB lookup) so the SecurityFilterChain itself is the only
 * gate. Intentionally avoids {@code @MockBean} — its package location varies
 * across Spring Boot versions (and was removed in 4.x).
 */
@WebMvcTest(controllers = { }) // no production controllers — only our stubs
@AutoConfigureMockMvc
@Import({
        SecurityConfig.class,
        SecurityConfigIntegrationTest.TestSecurityBeans.class,
        SecurityConfigIntegrationTest.TestRoutes.class
})
@TestPropertySource(properties = {
        "app.cors.allowed-origins=http://localhost:3000"
})
class SecurityConfigIntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void adminRoute_unauthenticated_is401() throws Exception {
        mvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void productsRoute_isPublic() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isOk());
    }

    @Test
    void authRoute_isPublic() throws Exception {
        mvc.perform(post("/api/auth/login"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void paymentWebhook_isPublic() throws Exception {
        mvc.perform(post("/api/payment/webhook"))
                .andExpect(status().isOk());
    }

    // Note: actuator health is not loaded by the @WebMvcTest slice. Verified
    // live via /actuator/health only in a full integration test (omitted here
    // — it would require a DB-backed context). The SecurityConfig permit list
    // explicitly includes /actuator/health/**.

    /**
     * Stubs for the two beans SecurityConfig + the security chain depend on.
     * Both are no-ops so no real JWT parsing or DB lookup happens — the
     * SecurityFilterChain itself is the only gate. {@code @Primary} ensures
     * these win over any scanned production beans of the same type.
     */
    @TestConfiguration
    static class TestSecurityBeans {
        @Bean @Primary JwtFilter jwtFilter() { return new NoopJwtFilter(); }
        @Bean @Primary UserDetailsServiceImpl userDetailsService() { return new NoopUserDetailsServiceImpl(); }
        @Bean @Primary JwtUtil jwtUtil() { return new JwtUtil(); }
        @Bean @Primary PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    }

    /** JwtFilter stub: does nothing — lets the SecurityFilterChain decide auth. */
    static class NoopJwtFilter extends JwtFilter {
        NoopJwtFilter() { super(null, null); }
        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            chain.doFilter(req, res);
        }
    }

    /** UserDetailsServiceImpl stub: no DB lookup. */
    static class NoopUserDetailsServiceImpl extends UserDetailsServiceImpl {
        NoopUserDetailsServiceImpl() { super(null); }
        @Override
        public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(String u) {
            return new User("stub", "{noop}stub", Collections.emptyList());
        }
    }

    @TestConfiguration
    static class TestRoutes {
        @Bean Hooks hooks() { return new Hooks(); }
    }

    @RestController
    static class Hooks {
        @GetMapping("/api/products") public String products() { return "[]"; }
        @PostMapping("/api/auth/login") public String login() { return "{}"; }
        @PostMapping("/api/payment/webhook") public String hook() { return "OK"; }
        @GetMapping("/api/admin/dashboard/stats") public String stats() { return "{}"; }
    }
}
