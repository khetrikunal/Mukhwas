package com.royalmukhwas.service;

import com.royalmukhwas.entity.User;
import com.royalmukhwas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@royalmukhwas.com";
    private static final String ADMIN_PASSWORD = "Admin@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Optional<User> existingAdmin = userRepository.findByEmail(ADMIN_EMAIL);

        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            boolean needsUpdate = false;

            if (admin.getRole() != User.Role.ADMIN) {
                admin.setRole(User.Role.ADMIN);
                needsUpdate = true;
            }
            if (admin.getIsActive() == null || !admin.getIsActive()) {
                admin.setIsActive(true);
                needsUpdate = true;
            }
            if (admin.getPasswordHash() == null || admin.getPasswordHash().isBlank()) {
                admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
                needsUpdate = true;
            }
            if (needsUpdate) {
                userRepository.save(admin);
                log.info("Updated existing admin account for {}", ADMIN_EMAIL);
            }
            return;
        }

        User admin = User.builder()
                .name("Admin")
                .email(ADMIN_EMAIL)
                .phone("9156996309")
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .role(User.Role.ADMIN)
                .isVerified(true)
                .isActive(true)
                .build();

        userRepository.save(admin);
        log.info("Created default admin account for {}", ADMIN_EMAIL);
    }
}
