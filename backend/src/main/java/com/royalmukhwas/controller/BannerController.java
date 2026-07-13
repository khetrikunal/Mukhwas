package com.royalmukhwas.controller;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.entity.Banner;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BannerController {

    private final BannerRepository bannerRepository;

    /** Public: active banners for homepage carousel. */
    @GetMapping("/api/banners")
    public ResponseEntity<ApiResponse<List<Banner>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(bannerRepository.findByIsActiveTrueOrderBySortOrderAsc()));
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    @GetMapping("/api/admin/banners")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Banner>>> adminGetAll() {
        return ResponseEntity.ok(ApiResponse.success(bannerRepository.findAllByOrderBySortOrderAsc()));
    }

    @PostMapping("/api/admin/banners")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Banner>> create(@RequestBody Map<String, Object> data) {
        Banner banner = Banner.builder()
                .title((String) data.get("title"))
                .subtitle((String) data.get("subtitle"))
                .imageUrl((String) data.get("imageUrl"))
                .linkUrl((String) data.get("linkUrl"))
                .sortOrder(data.get("sortOrder") != null ? ((Number) data.get("sortOrder")).intValue() : 0)
                .isActive(data.get("isActive") == null || Boolean.TRUE.equals(data.get("isActive")))
                .build();
        return ResponseEntity.ok(ApiResponse.success("Banner created", bannerRepository.save(banner)));
    }

    @PutMapping("/api/admin/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Banner>> update(@PathVariable UUID id,
                                                      @RequestBody Map<String, Object> data) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found"));
        if (data.containsKey("title")) banner.setTitle((String) data.get("title"));
        if (data.containsKey("subtitle")) banner.setSubtitle((String) data.get("subtitle"));
        if (data.containsKey("imageUrl")) banner.setImageUrl((String) data.get("imageUrl"));
        if (data.containsKey("linkUrl")) banner.setLinkUrl((String) data.get("linkUrl"));
        if (data.containsKey("sortOrder")) banner.setSortOrder(((Number) data.get("sortOrder")).intValue());
        if (data.containsKey("isActive")) banner.setIsActive((Boolean) data.get("isActive"));
        return ResponseEntity.ok(ApiResponse.success("Banner updated", bannerRepository.save(banner)));
    }

    @DeleteMapping("/api/admin/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        bannerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Banner deleted", null));
    }
}
