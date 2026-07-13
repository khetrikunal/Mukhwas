package com.royalmukhwas.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CategoryResponse {
    private UUID id;
    private String name;
    private String nameMarathi;
    private String slug;
    private String description;
    private String imageUrl;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
