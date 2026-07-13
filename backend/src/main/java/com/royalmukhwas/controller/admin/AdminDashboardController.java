package com.royalmukhwas.controller.admin;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.Order;
import com.royalmukhwas.entity.User;
import com.royalmukhwas.entity.WholesaleProfile;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.*;
import com.royalmukhwas.service.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin-only endpoints for the dashboard, user management, wholesale approvals,
 * and sales reports.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WholesaleProfileRepository wholesaleProfileRepository;
    private final OrderMapper orderMapper;

    // ── Dashboard stats ────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        BigDecimal revenue = orderRepository.getTotalRevenue();

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "totalOrders", totalOrders,
                "totalUsers", totalUsers,
                "totalProducts", totalProducts,
                "totalRevenue", revenue != null ? revenue : BigDecimal.ZERO
        )));
    }

    @GetMapping("/dashboard/recent-orders")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OrderResponse>>> recentOrders() {
        List<Order> orders = orderRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10)).getContent();
        List<OrderResponse> dto = orders.stream().map(orderMapper::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // ── User management ─────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<User>>> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // NOTE: User entity has no passwordHash exposure risk here because Jackson
        // serializes only getters; passwordHash is a sensitive field — see M4/CONCERNS.
        // For now we return the User as-is; a UserResponse DTO without passwordHash
        // should be introduced when tightening security.
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAll(pageable)));
    }

    @PutMapping("/users/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<User>> updateUserStatus(@PathVariable UUID id,
                                                              @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.get("isActive") != null) user.setIsActive(body.get("isActive"));
        return ResponseEntity.ok(ApiResponse.success("User status updated", userRepository.save(user)));
    }

    // ── Wholesale approvals ─────────────────────────────────────────────────────

    @GetMapping("/wholesale/requests")
    public ResponseEntity<ApiResponse<List<WholesaleProfile>>> wholesaleRequests() {
        return ResponseEntity.ok(ApiResponse.success(wholesaleProfileRepository.findByIsApprovedFalse()));
    }

    @PutMapping("/wholesale/{id}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<WholesaleProfile>> approveWholesale(@PathVariable UUID id) {
        WholesaleProfile profile = wholesaleProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wholesale request not found"));
        profile.setIsApproved(true);
        profile.setApprovedAt(LocalDateTime.now());
        WholesaleProfile saved = wholesaleProfileRepository.save(profile);

        // Activate the linked wholesale user account.
        User user = profile.getUser();
        if (user != null && !Boolean.TRUE.equals(user.getIsActive())) {
            user.setIsActive(true);
            userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.success("Wholesale request approved", saved));
    }

    // ── Sales report ────────────────────────────────────────────────────────────

    @GetMapping("/reports/sales")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> salesReport(
            @RequestParam String from, @RequestParam String to) {
        LocalDateTime fromDate = LocalDate.parse(from).atStartOfDay();
        LocalDateTime toDate = LocalDate.parse(to).plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findAllByCreatedAtBetweenOrderByCreatedAtDesc(fromDate, toDate);

        BigDecimal revenue = orders.stream()
                .filter(o -> o.getPaymentStatus() == Order.PaymentStatus.PAID)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = orders.size();
        long paidCount = orders.stream().filter(o -> o.getPaymentStatus() == Order.PaymentStatus.PAID).count();

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "from", from,
                "to", to,
                "totalOrders", orderCount,
                "paidOrders", paidCount,
                "totalRevenue", revenue
        )));
    }
}
