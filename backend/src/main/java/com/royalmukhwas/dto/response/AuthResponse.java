package com.royalmukhwas.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String role;
    private UUID userId;
    private String name;
    private String email;
}
