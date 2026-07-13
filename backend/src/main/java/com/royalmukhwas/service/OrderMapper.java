package com.royalmukhwas.service;

import com.royalmukhwas.dto.response.OrderItemResponse;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.Address;
import com.royalmukhwas.entity.Order;
import com.royalmukhwas.entity.OrderItem;
import com.royalmukhwas.entity.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Maps {@link Order} entities to {@link OrderResponse} DTOs.
 *
 * <p>Must be called <em>inside</em> a transaction / open Hibernate session —
 * it traverses lazy associations ({@code items}, {@code user}, {@code address})
 * which is exactly why the mapping happens in the service layer, not the
 * controller.
 */
@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {
        if (order == null) return null;

        User user = order.getUser();
        Address addr = order.getAddress();

        List<OrderItemResponse> items = order.getItems() == null
                ? Collections.emptyList()
                : order.getItems().stream().map(this::toItemResponse).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderType(order.getOrderType())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .userId(user != null ? user.getId() : null)
                .customerName(user != null ? user.getName() : null)
                .customerEmail(user != null ? user.getEmail() : null)
                .addressId(addr != null ? addr.getId() : null)
                .addressFullName(addr != null ? addr.getFullName() : null)
                .addressPhone(addr != null ? addr.getPhone() : null)
                .addressLine1(addr != null ? addr.getAddressLine1() : null)
                .addressLine2(addr != null ? addr.getAddressLine2() : null)
                .addressCity(addr != null ? addr.getCity() : null)
                .addressState(addr != null ? addr.getState() : null)
                .addressPincode(addr != null ? addr.getPincode() : null)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .shippingCharge(order.getShippingCharge())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .couponCode(order.getCouponCode())
                .razorpayOrderId(order.getRazorpayOrderId())
                .razorpayPaymentId(order.getRazorpayPaymentId())
                .notes(order.getNotes())
                .items(items)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .variantLabel(item.getVariantLabel())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }
}
