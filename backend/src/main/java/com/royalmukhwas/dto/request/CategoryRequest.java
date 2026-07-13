package com.royalmukhwas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameMarathi;

    private String slug; // optional — auto-generated from name if blank

    private String description;

    private String imageUrl;

    private Integer sortOrder;
}
