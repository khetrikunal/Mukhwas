package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.*;
import com.royalmukhwas.dto.response.*;
import com.royalmukhwas.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Registration successful", authService.register(request)));
    }

    @PostMapping("/register/wholesale")
    public ResponseEntity<ApiResponse<AuthResponse>> registerWholesale(@Valid @RequestBody WholesaleRegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Wholesale registration submitted. Await admin approval.",
                authService.registerWholesale(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (!"ADMIN".equals(response.getRole())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied"));
        }
        return ResponseEntity.ok(ApiResponse.success("Admin login successful", response));
    }

    /**
     * Exchange a refresh token for a new access token. Clients call this from
     * the Axios 401 interceptor before redirecting to /login.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", authService.refresh(request.getRefreshToken())));
    }
}
