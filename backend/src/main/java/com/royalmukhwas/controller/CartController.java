package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.CartItemRequest;
import com.royalmukhwas.dto.request.CartUpdateRequest;
import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.CartResponse;
import com.royalmukhwas.security.AuthenticatedUserResolver;
import com.royalmukhwas.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

/**
 * Server-side cart for authenticated users. Routes mirror the existing
 * {@code cartApi} contract in {@code frontend/src/lib/api.ts}.
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final AuthenticatedUserResolver userResolver;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> get(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(cartService.getCart(userResolver.getUserId(auth))));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CartResponse>> add(@Valid @RequestBody CartItemRequest req,
                                                         Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Item added",
                cartService.addItem(userResolver.getUserId(auth), req)));
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<CartResponse>> update(@Valid @RequestBody CartUpdateRequest req,
                                                            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(cartService.updateItem(userResolver.getUserId(auth), req)));
    }

    @DeleteMapping("/remove/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> remove(@PathVariable UUID variantId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(cartService.removeItem(userResolver.getUserId(auth), variantId)));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<CartResponse>> clear(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(cartService.clear(userResolver.getUserId(auth))));
    }

    @PostMapping("/apply-coupon")
    public ResponseEntity<ApiResponse<CartResponse>> applyCoupon(@RequestBody Map<String, String> body,
                                                                 Authentication auth) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Coupon code is required"));
        }
        return ResponseEntity.ok(ApiResponse.success(
                cartService.applyCoupon(userResolver.getUserId(auth), code)));
    }

    @DeleteMapping("/remove-coupon")
    public ResponseEntity<ApiResponse<CartResponse>> removeCoupon(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(cartService.removeCoupon(userResolver.getUserId(auth))));
    }
}
