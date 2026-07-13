package com.royalmukhwas.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Cart projection with server-computed totals. The frontend mirrors these
 * values rather than recomputing them, so pricing rules (free-shipping
 * threshold, coupon discount) stay single-sourced on the backend.
 */
@Data
@Builder
public class CartResponse {
    private UUID id;
    private List<CartItemView> items;
    private String couponCode;
    private boolean couponValid;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal shipping;
    private BigDecimal total;
    private int itemCount;

    @Data
    @Builder
    public static class CartItemView {
        private UUID variantId;
        private UUID productId;
        private String productName;
        private String variantLabel;
        private String imageUrl;
        private BigDecimal unitPrice;   // current retail price (wholesale price if wholesale user)
        private Integer quantity;
        private BigDecimal lineTotal;
        private Integer stockQuantity;  // so client can warn on low/zero stock
    }
}
