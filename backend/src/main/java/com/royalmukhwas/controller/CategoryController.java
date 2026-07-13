package com.royalmukhwas.controller;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.CategoryResponse;
import com.royalmukhwas.entity.Category;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.CategoryRepository;
import com.royalmukhwas.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.royalmukhwas.dto.request.CategoryRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> all() {
        List<CategoryResponse> list = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(CategoryController::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<CategoryResponse>> bySlug(@PathVariable String slug) {
        Category c = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + slug));
        return ResponseEntity.ok(ApiResponse.success(toResponse(c)));
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest req) {
        Category c = Category.builder()
                .name(req.getName())
                .nameMarathi(req.getNameMarathi())
                .slug(req.getSlug() != null && !req.getSlug().isBlank()
                        ? SlugGenerator.toSlug(req.getSlug())
                        : SlugGenerator.toSlug(req.getName()))
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .isActive(true)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Category created", toResponse(categoryRepository.save(c))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(@PathVariable UUID id,
                                                               @Valid @RequestBody CategoryRequest req) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (req.getName() != null) c.setName(req.getName());
        if (req.getNameMarathi() != null) c.setNameMarathi(req.getNameMarathi());
        if (req.getSlug() != null && !req.getSlug().isBlank()) c.setSlug(SlugGenerator.toSlug(req.getSlug()));
        if (req.getDescription() != null) c.setDescription(req.getDescription());
        if (req.getImageUrl() != null) c.setImageUrl(req.getImageUrl());
        if (req.getSortOrder() != null) c.setSortOrder(req.getSortOrder());
        return ResponseEntity.ok(ApiResponse.success("Category updated", toResponse(categoryRepository.save(c))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        c.setIsActive(false); // soft delete
        categoryRepository.save(c);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }

    private static CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .nameMarathi(c.getNameMarathi())
                .slug(c.getSlug())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .sortOrder(c.getSortOrder())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
