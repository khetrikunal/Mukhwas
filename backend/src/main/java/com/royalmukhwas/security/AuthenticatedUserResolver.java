package com.royalmukhwas.security;

import com.royalmukhwas.entity.User;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolves the authenticated {@link User} (and its id) from Spring Security's
 * {@link Authentication}. The JWT filter stores the user's email as the
 * principal name; this centralizes the email → User lookup so controllers
 * don't repeat it.
 */
@Component
@RequiredArgsConstructor
public class AuthenticatedUserResolver {

    private final UserRepository userRepository;

    public UUID getUserId(Authentication auth) {
        return getUser(auth).getId();
    }

    public User getUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResourceNotFoundException("Not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));
    }
}
