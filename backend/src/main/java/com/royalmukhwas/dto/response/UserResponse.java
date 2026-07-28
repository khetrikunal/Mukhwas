package com.royalmukhwas.dto.response;

import com.royalmukhwas.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Safe public projection of {@link User} — deliberately omits
 * {@code passwordHash}, {@code passwordResetToken}, and
 * {@code passwordResetTokenExpiry} so those fields are never
 * serialised into any API response, even admin-only ones.
 */
@Data
@Builder
public class UserResponse {

    private UUID id;
    private String name;
    private String email;
    private String phone;
    private User.Role role;
    private Boolean isVerified;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Convenience factory to map from the entity. */
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .isVerified(user.getIsVerified())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
