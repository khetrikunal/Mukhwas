package com.royalmukhwas.dto.request;

import com.royalmukhwas.entity.Coupon;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CouponRequest {
    @NotBlank
    private String code;

    @NotNull
    private Coupon.DiscountType discountType;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0")
    private BigDecimal maxDiscountAmount;

    @Min(value = 0)
    private Integer usageLimit;

    private String validFrom;   // ISO-8601 datetime, optional
    private String validUntil;  // ISO-8601 datetime, optional
    private Boolean isActive = true;
}
