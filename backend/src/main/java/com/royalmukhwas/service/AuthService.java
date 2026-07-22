package com.royalmukhwas.service;

import com.royalmukhwas.dto.request.*;
import com.royalmukhwas.dto.response.AuthResponse;
import com.royalmukhwas.entity.User;
import com.royalmukhwas.entity.WholesaleProfile;
import com.royalmukhwas.exception.CustomExceptions.*;
import com.royalmukhwas.repository.UserRepository;
import com.royalmukhwas.repository.WholesaleProfileRepository;
import com.royalmukhwas.security.JwtUtil;
import com.royalmukhwas.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WholesaleProfileRepository wholesaleProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new ConflictException("Email already registered");
        if (userRepository.existsByPhone(request.getPhone()))
            throw new ConflictException("Phone already registered");

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.CUSTOMER)
                .isVerified(true) // simplify — add OTP flow as enhancement
                .isActive(true)
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse registerWholesale(WholesaleRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new ConflictException("Email already registered");

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.WHOLESALE)
                .isVerified(true)
                .isActive(true)
                .build();
        userRepository.save(user);

        WholesaleProfile profile = WholesaleProfile.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .gstNumber(request.getGstNumber())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .isApproved(false)
                .build();
        wholesaleProfileRepository.save(profile);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getIsActive())
            throw new ForbiddenException("Account is deactivated");

        return buildAuthResponse(user);
    }

    /**
     * Exchange a valid refresh token for a new access token. The refresh token's
     * subject is the user's email; we re-issue a fresh access token without
     * requiring a password. The refresh token itself is not rotated (stateless).
     */
    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);
        if (email == null) {
            throw new BadRequestException("Invalid refresh token");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        if (!jwtUtil.validateToken(refreshToken, userDetails)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getIsActive()) {
            throw new ForbiddenException("Account is deactivated");
        }
        return buildAuthResponse(user);
    }

    /**
     * Generate a cryptographically-secure random reset token, store it on the
     * user record with a 1-hour expiry, and send a password reset email.
     *
     * <p>This method always returns successfully to prevent email enumeration.
     * If the email doesn't exist, the operation silently returns without
     * sending an email.
     */
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Silently return to prevent email enumeration
            return;
        }

        // Generate a secure random token (48 bytes → 64 base64 chars)
        SecureRandom random = new SecureRandom();
        byte[] tokenBytes = new byte[48];
        random.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        // Store token with 1-hour expiry
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        // Build reset link and send email asynchronously
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
    }

    /**
     * Validate the reset token, check expiry, hash the new password, and
     * update the user record. Invalidates the token after use (one-time use).
     */
    @Transactional
    public AuthResponse resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getPasswordResetTokenExpiry() == null ||
                user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            // Clear the expired token so it can't be used again
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiry(null);
            userRepository.save(user);
            throw new BadRequestException("Reset token has expired. Please request a new one.");
        }

        // Hash the new password and update
        user.setPasswordHash(passwordEncoder.encode(newPassword));

        // Invalidate the token (one-time use)
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);

        userRepository.save(user);

        // Log the user in by returning auth tokens
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateToken(userDetails, user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
