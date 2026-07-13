package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.OrderRequest;
import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.User;
import com.royalmukhwas.repository.UserRepository;
import com.royalmukhwas.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping("/place")
    public ResponseEntity<ApiResponse<OrderResponse>> place(@Valid @RequestBody OrderRequest data,
                                                             Authentication auth) {
        UUID userId = getUserId(auth);
        return ResponseEntity.ok(ApiResponse.success("Order placed", orderService.placeOrder(userId, data)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> myOrders(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getUserOrders(getUserId(auth))));
    }

    /** Track-order lookup, scoped to the authenticated user. */
    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable String orderNumber,
                                                               Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getByOrderNumberForOwner(orderNumber, getUserId(auth))));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@PathVariable UUID id, Authentication auth) {
        // Verify ownership before allowing cancellation (prevents IDOR).
        orderService.getByIdForOwner(id, getUserId(auth));
        return ResponseEntity.ok(ApiResponse.success("Order cancelled",
                orderService.updateStatus(id, "CANCELLED")));
    }

    private UUID getUserId(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return user.getId();
    }
}
