package com.royalmukhwas.controller.admin;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.Order;
import com.royalmukhwas.repository.OrderRepository;
import com.royalmukhwas.service.OrderMapper;
import com.royalmukhwas.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        // Map within a read-only transaction so lazy associations resolve before serialization.
        Page<OrderResponse> dto = orders.map(orderMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/wholesale")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> wholesale(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Order> orders = orderRepository.findByOrderTypeOrderByCreatedAtDesc(
                Order.OrderType.WHOLESALE, PageRequest.of(page, size));
        Page<OrderResponse> dto = orders.map(orderMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                orderService.updateStatus(id, body.get("status"))));
    }
}
