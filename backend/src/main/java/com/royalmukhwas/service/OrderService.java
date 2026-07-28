package com.royalmukhwas.service;

import com.royalmukhwas.dto.request.OrderRequest;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.*;
import com.royalmukhwas.exception.CustomExceptions.BadRequestException;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Core order lifecycle service: place, query, and update orders.
 *
 * <p>Stock deduction happens atomically inside {@link #placeOrder} using
 * optimistic locking on {@link ProductVariant#getVersion()} — concurrent
 * requests for the last unit will see an {@code ObjectOptimisticLockingFailureException}
 * which the caller should surface as a 409 Conflict via the global exception handler.
 *
 * <p>{@link #updateStatus} is idempotent for the CANCELLED transition: stock
 * is restored only on the first cancellation, never on repeated calls with
 * the same status.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final CartRepository cartRepository;
    private final OrderMapper orderMapper;

    @Value("${app.free-shipping-threshold:499}")
    private BigDecimal freeShippingThreshold;

    // ── Place order ──────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse placeOrder(UUID userId, OrderRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address = addressRepository.findById(req.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        boolean isWholesale = user.getRole() == User.Role.WHOLESALE;

        // Build order items and deduct stock.
        List<OrderItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderRequest.Item reqItem : req.getItems()) {
            ProductVariant variant = variantRepository.findById(reqItem.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Variant not found: " + reqItem.getVariantId()));

            if (!Boolean.TRUE.equals(variant.getIsActive()))
                throw new BadRequestException("Variant is unavailable: " + variant.getSku());

            if (variant.getStockQuantity() < reqItem.getQuantity())
                throw new BadRequestException(
                        "Insufficient stock for " + variant.getLabel()
                        + " (available: " + variant.getStockQuantity() + ")");

            // Deduct stock — version bump triggers optimistic lock on concurrent requests.
            variant.setStockQuantity(variant.getStockQuantity() - reqItem.getQuantity());
            variantRepository.save(variant);

            BigDecimal unitPrice = (isWholesale && variant.getWholesalePrice() != null)
                    ? variant.getWholesalePrice() : variant.getRetailPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(reqItem.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            items.add(OrderItem.builder()
                    .variant(variant)
                    .product(variant.getProduct())
                    .productName(variant.getProduct().getName())
                    .variantLabel(variant.getLabel())
                    .quantity(reqItem.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .build());
        }

        // Coupon discount.
        BigDecimal discount = BigDecimal.ZERO;
        String appliedCoupon = null;
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            String code = req.getCouponCode().toUpperCase();
            Coupon coupon = couponRepository.findByCode(code).orElse(null);
            if (coupon != null) {
                try {
                    // Reuse CouponService logic inline to avoid circular bean dependency.
                    discount = computeDiscount(coupon, subtotal);
                    // Consume the coupon usage slot.
                    coupon.setUsedCount(coupon.getUsedCount() + 1);
                    couponRepository.save(coupon);
                    appliedCoupon = code;
                } catch (BadRequestException e) {
                    log.warn("Coupon '{}' rejected at order placement: {}", code, e.getMessage());
                }
            }
        }

        // Shipping.
        BigDecimal shipping = subtotal.compareTo(BigDecimal.ZERO) > 0
                && subtotal.compareTo(freeShippingThreshold) < 0
                ? new BigDecimal("50") : BigDecimal.ZERO;

        BigDecimal total = subtotal.add(shipping).subtract(discount).max(BigDecimal.ZERO);

        Order.PaymentMethod paymentMethod;
        try {
            paymentMethod = Order.PaymentMethod.valueOf(req.getPaymentMethod().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment method: " + req.getPaymentMethod());
        }

        Order order = Order.builder()
                .user(user)
                .address(address)
                .orderNumber(generateOrderNumber())
                .orderType(isWholesale ? Order.OrderType.WHOLESALE : Order.OrderType.RETAIL)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .subtotal(subtotal)
                .discountAmount(discount)
                .shippingCharge(shipping)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(total)
                .couponCode(appliedCoupon)
                .notes(req.getNotes())
                .build();

        // Link items to the order before cascade-save.
        Order savedOrder = orderRepository.save(order);
        for (OrderItem item : items) {
            item.setOrder(savedOrder);
        }
        savedOrder.setItems(items);
        savedOrder = orderRepository.save(savedOrder);

        // Clear the server-side cart after a successful order so stale items
        // don't reappear when the user logs in again from another device.
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cart.setCouponCode(null);
            cartRepository.save(cart);
        });

        log.info("Order placed: {} for user {}", savedOrder.getOrderNumber(), userId);
        return orderMapper.toResponse(savedOrder);
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Fetch an order by its human-readable order number, enforcing that the
     * requesting user is the owner (prevents IDOR).
     */
    @Transactional(readOnly = true)
    public OrderResponse getByOrderNumberForOwner(String orderNumber, UUID userId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        assertOwner(order, userId);
        return orderMapper.toResponse(order);
    }

    /**
     * Fetch an order by its UUID, enforcing owner access (prevents IDOR).
     * Used by {@link com.royalmukhwas.controller.OrderController#cancel} as a
     * pre-authorisation check before writing any state.
     */
    @Transactional(readOnly = true)
    public OrderResponse getByIdForOwner(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        assertOwner(order, userId);
        return orderMapper.toResponse(order);
    }

    // ── Status update (admin + owner cancel) ─────────────────────────────────

    /**
     * Update order status.
     *
     * <p>Idempotency fix: stock is restored <em>only</em> on the transition
     * <em>into</em> CANCELLED, not on every call that sets CANCELLED. This
     * prevents double-click / retry requests from silently inflating inventory.
     */
    @Transactional
    public OrderResponse updateStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // BUG FIX: this endpoint was not idempotent. Calling it twice with
        // status=CANCELLED (double click, retried request, etc.) restored stock
        // twice for the same order, silently inflating inventory. Only restore
        // stock on the transition INTO cancelled, not every time it's set.
        boolean wasAlreadyCancelled = order.getStatus() == Order.OrderStatus.CANCELLED;
        order.setStatus(Order.OrderStatus.valueOf(status));

        if (Order.OrderStatus.CANCELLED.name().equals(status) && !wasAlreadyCancelled) {
            for (OrderItem item : order.getItems()) {
                ProductVariant variant = item.getVariant();
                variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                variantRepository.save(variant);
            }
        }
        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void assertOwner(Order order, UUID userId) {
        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order not found");
        }
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.valueOf((int) (Math.random() * 9000) + 1000);
        return "RM-" + timestamp + "-" + random;
    }

    /**
     * Standalone discount computation — mirrors {@link CouponService#computeDiscount}
     * so this service can apply and consume coupons without a circular dependency.
     */
    private BigDecimal computeDiscount(Coupon coupon, BigDecimal subtotal) {
        if (!Boolean.TRUE.equals(coupon.getIsActive()))
            throw new BadRequestException("Coupon is inactive");
        if (coupon.getValidFrom() != null && coupon.getValidFrom().isAfter(LocalDateTime.now()))
            throw new BadRequestException("Coupon is not yet active");
        if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDateTime.now()))
            throw new BadRequestException("Coupon has expired");
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit())
            throw new BadRequestException("Coupon usage limit reached");
        if (subtotal.compareTo(coupon.getMinOrderAmount()) < 0)
            throw new BadRequestException("Minimum order amount for this coupon is ₹" + coupon.getMinOrderAmount());

        BigDecimal discount;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscountAmount() != null && discount.compareTo(coupon.getMaxDiscountAmount()) > 0)
                discount = coupon.getMaxDiscountAmount();
        } else {
            discount = coupon.getDiscountValue();
        }
        return discount.min(subtotal);
    }
}