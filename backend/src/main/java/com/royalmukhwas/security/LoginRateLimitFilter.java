package com.royalmukhwas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.royalmukhwas.dto.response.ApiResponse;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory login rate limiter.
 *
 * <p>Throttles {@code POST /api/auth/login} (and {@code /api/auth/admin/login})
 * to {@value #MAX_ATTEMPTS} attempts per {@value #WINDOW_SECONDS} seconds per
 * email address (read from the JSON request body). Abusive or brute-force
 * attempts get a clean {@code 429} with the {@code ApiResponse} envelope.
 *
 * <p>Wraps the request in a {@link CachedBodyHttpServletRequest} so the body can
 * be read once by this filter (to extract the email) and again by the
 * controller's {@code @RequestBody} — without the "I/O error reading input
 * message" failure that naive {@code getInputStream()} calls cause.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class LoginRateLimitFilter extends OncePerRequestFilter {

    static final int MAX_ATTEMPTS = 5;
    static final int WINDOW_SECONDS = 60;

    private final ObjectMapper objectMapper;
    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!"POST".equals(request.getMethod())
                || (!path.equals("/api/auth/login") && !path.equals("/api/auth/admin/login"))) {
            filterChain.doFilter(request, response);
            return;
        }

        // Cache the body so both this filter AND the controller can read it.
        CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);

        String email;
        try {
            email = objectMapper.readTree(cachedRequest.getCachedBody())
                    .path("email").asText("");
        } catch (Exception reading) {
            filterChain.doFilter(cachedRequest, response);
            return;
        }

        String key = (email == null || email.isBlank()) ? clientKey(request) : email.toLowerCase();

        long now = System.currentTimeMillis();
        long windowStart = now - WINDOW_SECONDS * 1000L;
        Deque<Long> dq = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (dq) {
            while (!dq.isEmpty() && dq.peekFirst() < windowStart) dq.pollFirst();
            if (dq.size() >= MAX_ATTEMPTS) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                try {
                    response.getWriter().write(
                        objectMapper.writeValueAsString(
                            ApiResponse.error("Too many login attempts. Please wait and try again shortly.")));
                } catch (IOException ignored) {
                }
                log.warn("Rate limit triggered for login key={} attempts={}", key, dq.size());
                return;
            }
            dq.addLast(now);
        }

        filterChain.doFilter(cachedRequest, response);
    }

    private String clientKey(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            int comma = fwd.indexOf(',');
            return "ip:" + (comma > 0 ? fwd.substring(0, comma) : fwd).trim();
        }
        return "ip:" + req.getRemoteAddr();
    }

    // ── Cached-body request wrapper ─────────────────────────────────────────

    /**
     * Reads the request body once into a {@code byte[]} so it can be served
     * repeatedly to both filters and the controller's {@code @RequestBody}
     * deserializer without consuming the underlying servlet stream.
     */
    static class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private final byte[] cachedBody;

        CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            this.cachedBody = request.getInputStream().readAllBytes();
        }

        byte[] getCachedBody() { return cachedBody; }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream bais = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override public boolean isFinished() { return bais.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener l) {}
                @Override public int read() { return bais.read(); }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(
                    new InputStreamReader(new ByteArrayInputStream(cachedBody), StandardCharsets.UTF_8));
        }
    }
}
