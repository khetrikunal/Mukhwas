package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.CartItemRequest;
import com.royalmukhwas.dto.request.CartUpdateRequest;
import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.CartResponse;
import com.royalmukhwas.security.AuthenticatedUserResolver;
import com.royalmukhwas.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@Slf4j
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
        UUID userId = userResolver.getUserId(auth);
        // INFO level so this is visible in Render production logs without needing DEBUG enabled.
        // This proves exactly what variantId the backend received — essential for forensics.
        log.info("=== CartController.add() === userId={}, variantId={}, quantity={}",
                userId, req.getVariantId(), req.getQuantity());
        try {
            CartResponse response = cartService.addItem(userId, req);
            log.info("=== CartController.add() SUCCESS === userId={}, itemCount={}", userId, response.getItemCount());
            return ResponseEntity.ok(ApiResponse.success("Item added", response));
        } catch (Exception e) {
            log.error("=== CartController.add() FAILED === userId={}, variantId={}, quantity={}, exceptionType={}, message={}",
                    userId, req.getVariantId(), req.getQuantity(),
                    e.getClass().getName(), e.getMessage(), e);
            throw e;
        }
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
