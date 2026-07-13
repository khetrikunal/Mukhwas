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
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WholesaleProfileRepository wholesaleProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;

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
