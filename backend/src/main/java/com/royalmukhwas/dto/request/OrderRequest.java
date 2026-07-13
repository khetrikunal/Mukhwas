package com.royalmukhwas.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * Typed replacement for the {@code Map<String,Object>} previously accepted by
 * {@code OrderController.place}. Strong typing + Bean Validation eliminate the
 * fragile {@code (Integer) quantity} cast and {@code UUID.fromString(...)}
 * {@code IllegalArgumentException} paths — malformed payloads now get
 * a clean 400 with per-field messages via {@code GlobalExceptionHandler}.
 */
@Data
public class OrderRequest {

    @NotNull
    private UUID addressId;

    @NotBlank
    private String paymentMethod;

    private String couponCode;

    @NotEmpty
    @Valid
    private List<Item> items;

    private String notes;

    @Data
    public static class Item {
        @NotNull
        private UUID variantId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }
}
