package com.royalmukhwas.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CouponValidateRequest {
    @NotBlank
    private String code;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal subtotal;
}
