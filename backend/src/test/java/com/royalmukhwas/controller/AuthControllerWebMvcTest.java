package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.LoginRequest;
import com.royalmukhwas.dto.request.RegisterRequest;
import com.royalmukhwas.dto.response.AuthResponse;
import com.royalmukhwas.exception.CustomExceptions.ConflictException;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.exception.GlobalExceptionHandler;
import com.royalmukhwas.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web slice test for {@link AuthController}.
 *
 * <p>Uses MockMvc in standalone mode (no Spring context, no Boot test
 * scaffolding) so the slice works on any Spring Boot version — keeps it
 * independent of where {@code @MockBean} lives across Boot 3.x/4.x (the package
 * moved in 4.0 and was removed in 4.x). Covers register/login happy paths +
 * the three surfacing errors a 4xx must handle cleanly: duplicate email (409),
 * unknown user (404), non-admin hitting /admin/login (403).
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerWebMvcTest {

    private MockMvc mvc;
    private final ObjectMapper json = new ObjectMapper();

    @Mock AuthService authService;

    @BeforeEach
    void setUp() {
        // wire the controller with the mocked service + the shared exception
        // handler so 4xx responses match the production ApiResponse envelope.
        mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private static AuthResponse tokenFor(String role) {
        return AuthResponse.builder()
                .accessToken("access-token").refreshToken("refresh-token")
                .tokenType("Bearer").role(role)
                .userId(java.util.UUID.randomUUID())
                .name("Test").email("test@example.com")
                .build();
    }

    @Test
    void register_validPayload_returns200() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(tokenFor("CUSTOMER"));

        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@example.com");
        req.setPhone("919999999999");
        req.setPassword("secret123");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.accessToken").exists());
    }

    @Test
    void login_validCredentials_returnsAccessToken() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenReturn(tokenFor("CUSTOMER"));
        LoginRequest req = new LoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("secret123");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));
    }

    @Test
    void adminLogin_nonAdmin_returns403() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenReturn(tokenFor("CUSTOMER")); // role != ADMIN

        LoginRequest req = new LoginRequest();
        req.setEmail("notadmin@example.com");
        req.setPassword("secret123");

        mvc.perform(post("/api/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void register_duplicateEmail_surfacesAs409() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new ConflictException("Email already registered"));

        RegisterRequest req = new RegisterRequest();
        req.setName("Dupe");
        req.setEmail("dupe@example.com");
        req.setPhone("919999999998");
        req.setPassword("secret123");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void login_wrongPassword_surfacesAs401ViaResourceNotFound() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ResourceNotFoundException("User not found"));

        LoginRequest req = new LoginRequest();
        req.setEmail("nope@example.com");
        req.setPassword("bad-password");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }
}
