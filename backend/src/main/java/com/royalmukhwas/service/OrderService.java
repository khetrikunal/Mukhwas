package com.royalmukhwas.service;

import com.royalmukhwas.dto.request.OrderRequest;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.*;
import com.royalmukhwas.exception.CustomExceptions.*;
import com.royalmukhwas.repository.*;
import com.royalmukhwas.util.OrderNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    @Value("${app.free-shipping-threshold:499}")
    private BigDecimal freeShippingThreshold;

    @Value("${app.cod-max-amount:2000}")
    private BigDecimal codMaxAmount;

    /**
     * Place an order from a typed {@link OrderRequest}. Retries once on an
     * optimistic-locking conflict — two concurrent orders racing for the same
     * variant stock. After one retry, a persistent conflict surfaces as a
     * {@link ConflictException} so the client gets a clean message instead of a
     * stack trace.
     *
     * <p>Replaces the older {@code Map<String,Object>} overload that needed
     * brittle {@code (Integer) quantity} / {@code UUID.fromString(...)} casts.
     */
    @Transactional
    public OrderResponse placeOrder(UUID userId, OrderRequest request) {
        try {
            return doPlaceOrder(userId, request);
        } catch (ObjectOptimisticLockingFailureException ex) {
            log.warn("Optimistic lock conflict placing order for user {}, retrying once", userId);
            try {
                return doPlaceOrder(userId, request);
            } catch (ObjectOptimisticLockingFailureException ex2) {
                throw new ConflictException(
                        "Your order conflicts with another in-progress order. Please try again.");
            }
        }
    }

    /**
     * Inner placement logic, run in its own transaction so a retry can start
     * fresh (the outer {@link #placeOrder} transaction is propagated, but the
     * version check still re-reads current stock on the second attempt).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OrderResponse doPlaceOrder(UUID userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID addressId = request.getAddressId();
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        Order.OrderType orderType = user.getRole() == User.Role.WHOLESALE
                ? Order.OrderType.WHOLESALE : Order.OrderType.RETAIL;

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderRequest.Item item : request.getItems()) {
            UUID variantId = item.getVariantId();
            int qty = item.getQuantity(); // typed Integer — no more cast fragility

            ProductVariant variant = variantRepository.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));

            if (variant.getStockQuantity() < qty)
                throw new InsufficientStockException("Insufficient stock for: " + variant.getProduct().getName());

            BigDecimal price = (orderType == Order.OrderType.WHOLESALE && variant.getWholesalePrice() != null)
                    ? variant.getWholesalePrice()
                    : variant.getRetailPrice();

            BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(itemTotal);

            orderItems.add(OrderItem.builder()
                    .variant(variant)
                    .product(variant.getProduct())
                    .productName(variant.getProduct().getName())
                    .variantLabel(variant.getLabel())
                    .quantity(qty)
                    .unitPrice(price)
                    .totalPrice(itemTotal)
                    .build());

            // Decrement stock — @Version on ProductVariant guards against overselling.
            variant.setStockQuantity(variant.getStockQuantity() - qty);
            variantRepository.save(variant);
        }

        // Shipping
        BigDecimal shipping = subtotal.compareTo(freeShippingThreshold) >= 0
                ? BigDecimal.ZERO : new BigDecimal("50");

        // Discount via coupon
        BigDecimal discount = BigDecimal.ZERO;
        String couponCode = request.getCouponCode();
        if (couponCode != null && !couponCode.isBlank()) {
            Coupon coupon = couponRepository.findByCode(couponCode)
                    .orElseThrow(() -> new BadRequestException("Invalid coupon code"));
            discount = applyCoupon(coupon, subtotal);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        BigDecimal total = subtotal.add(shipping).subtract(discount);

        // Validate COD limit
        Order.PaymentMethod paymentMethod;
        try {
            paymentMethod = Order.PaymentMethod.valueOf(request.getPaymentMethod());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid payment method: " + request.getPaymentMethod());
        }
        if (paymentMethod == Order.PaymentMethod.COD && total.compareTo(codMaxAmount) > 0)
            throw new BadRequestException("COD not available for orders above ₹" + codMaxAmount);

        Order order = Order.builder()
                .user(user)
                .orderNumber(OrderNumberGenerator.generate())
                .orderType(orderType)
                .status(Order.OrderStatus.PENDING)
                .address(address)
                .subtotal(subtotal)
                .shippingCharge(shipping)
                .discountAmount(discount)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(total)
                .couponCode(couponCode)
                .notes(request.getNotes())
                .paymentStatus(Order.PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .build();

        order = orderRepository.save(order);

        for (OrderItem oi : orderItems) {
            oi.setOrder(order);
        }
        order.setItems(orderItems);

        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    private BigDecimal applyCoupon(Coupon coupon, BigDecimal subtotal) {
        if (!coupon.getIsActive()) throw new BadRequestException("Coupon is inactive");
        if (coupon.getValidFrom() != null && coupon.getValidFrom().isAfter(java.time.LocalDateTime.now()))
            throw new BadRequestException("Coupon is not yet active");
        if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(java.time.LocalDateTime.now()))
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
        return discount;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getByOrderNumber(String orderNumber) {
        return orderMapper.toResponse(
                orderRepository.findByOrderNumber(orderNumber)
                        .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber)));
    }

    @Transactional(readOnly = true)
    public OrderResponse getByIdForOwner(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId))
            throw new ForbiddenException("You do not have access to this order");
        return orderMapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getByOrderNumberForOwner(String orderNumber, UUID userId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        if (!order.getUser().getId().equals(userId))
            throw new ForbiddenException("You do not have access to this order");
        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setStatus(Order.OrderStatus.valueOf(status));

        // Restore stock on cancel
        if (Order.OrderStatus.CANCELLED.name().equals(status)) {
            for (OrderItem item : order.getItems()) {
                ProductVariant variant = item.getVariant();
                variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                variantRepository.save(variant);
            }
        }
        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }
}
