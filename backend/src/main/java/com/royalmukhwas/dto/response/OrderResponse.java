package com.royalmukhwas.dto.response;

import com.royalmukhwas.entity.Order;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flat projection of an {@link Order} for HTTP responses.
 *
 * <p>This exists to break the bidirectional {@code Order ↔ OrderItem} JSON
 * recursion and to avoid {@code LazyInitializationException} on the Order →
 * User / Address lazy associations once the Hibernate session is closed
 * (controllers are outside the transaction boundary). All nested objects are
 * projected to plain scalar fields or dedicated response DTOs.
 */
@Data
@Builder
public class OrderResponse {
    private UUID id;
    private String orderNumber;
    private Order.OrderType orderType;
    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
    private Order.PaymentMethod paymentMethod;

    private UUID userId;
    private String customerName;
    private String customerEmail;

    // Address snapshot (denormalized so frontend checkout/track never lazy-loads)
    private UUID addressId;
    private String addressFullName;
    private String addressPhone;
    private String addressLine1;
    private String addressLine2;
    private String addressCity;
    private String addressState;
    private String addressPincode;

    // Amounts
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingCharge;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;

    private String couponCode;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String notes;

    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
