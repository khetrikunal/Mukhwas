package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.CouponRequest;
import com.royalmukhwas.dto.request.CouponValidateRequest;
import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.CouponValidationResponse;
import com.royalmukhwas.entity.Coupon;
import com.royalmukhwas.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
// NOTE: no class-level @RequestMapping — methods carry full paths so the public
// validate endpoint (/api/coupons/validate) and the admin CRUD endpoints
// (/api/admin/coupons) resolve correctly.
public class CouponController {

    private final CouponService couponService;

    /**
     * Public endpoint: validate a coupon code against a cart subtotal.
     * Does NOT consume the coupon — consumption happens at order placement.
     * This backs {@code cartApi.applyCoupon} on the frontend.
     */
    @PostMapping("/api/coupons/validate")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validate(
            @Valid @RequestBody CouponValidateRequest req) {
        CouponValidationResponse result = couponService.validate(req.getCode(), req.getSubtotal());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────

    @GetMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Coupon>>> all() {
        return ResponseEntity.ok(ApiResponse.success(couponService.listAll()));
    }

    @PostMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Coupon>> create(@Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Coupon created", couponService.create(req)));
    }

    @PutMapping("/api/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Coupon>> update(@PathVariable UUID id,
                                                      @Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Coupon updated", couponService.update(id, req)));
    }

    @DeleteMapping("/api/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        couponService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted", null));
    }
}
