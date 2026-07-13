package com.royalmukhwas.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Flat projection of an {@link com.royalmukhwas.entity.OrderItem} for HTTP
 * responses. Carries only denormalized snapshot fields, so it never triggers
 * lazy-loading or recursion back to the parent Order/Product/Variant graph.
 */
@Data
@Builder
public class OrderItemResponse {
    private UUID id;
    private UUID variantId;
    private UUID productId;
    private String productName;
    private String variantLabel;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
