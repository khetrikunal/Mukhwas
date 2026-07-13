package com.royalmukhwas.service;

import com.royalmukhwas.entity.User;
import com.royalmukhwas.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminBootstrap adminBootstrap;

    @Test
    void run_shouldCreateAdminWhenMissing() {
        when(userRepository.findByEmail("admin@royalmukhwas.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Admin@123")).thenReturn("bcrypt-hash");

        ApplicationArguments args = new DefaultApplicationArguments(new String[]{});
        adminBootstrap.run(args);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertEquals("Admin", saved.getName());
        assertEquals("admin@royalmukhwas.com", saved.getEmail());
        assertEquals("9156996309", saved.getPhone());
        assertEquals(User.Role.ADMIN, saved.getRole());
        assertEquals("bcrypt-hash", saved.getPasswordHash());
        assertTrue(saved.getIsActive());
    }
}
