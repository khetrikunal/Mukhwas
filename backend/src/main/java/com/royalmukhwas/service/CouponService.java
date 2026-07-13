package com.royalmukhwas.service;

import com.royalmukhwas.dto.request.CouponRequest;
import com.royalmukhwas.dto.response.CouponValidationResponse;
import com.royalmukhwas.entity.Coupon;
import com.royalmukhwas.exception.CustomExceptions.BadRequestException;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Reads and validates {@link Coupon}s.
 *
 * <p>Validation (used by both the cart coupon-apply flow and the explicit
 * validate endpoint) computes a discount without consuming the coupon.
 * Consumption (incrementing {@code usedCount}) happens only when an order is
 * actually placed — see {@link OrderService#placeOrder}.
 */
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    /**
     * Validate a coupon against a cart subtotal without consuming it.
     *
     * @return a response with {@code valid=true} and the computed discount, or
     *         {@code valid=false} with a reason message.
     */
    public CouponValidationResponse validate(String code, BigDecimal subtotal) {
        Coupon coupon = couponRepository.findByCode(code).orElse(null);
        if (coupon == null) {
            return CouponValidationResponse.builder().code(code).valid(false)
                    .discountAmount(BigDecimal.ZERO).message("Invalid coupon code").build();
        }
        try {
            BigDecimal discount = computeDiscount(coupon, subtotal);
            return CouponValidationResponse.builder().code(code).valid(true)
                    .discountAmount(discount).message("Coupon applied").build();
        } catch (BadRequestException e) {
            return CouponValidationResponse.builder().code(code).valid(false)
                    .discountAmount(BigDecimal.ZERO).message(e.getMessage()).build();
        }
    }

    /** Shared discount math — throws on any rule violation. */
    public BigDecimal computeDiscount(Coupon coupon, BigDecimal subtotal) {
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
        // Never discount more than the subtotal.
        return discount.min(subtotal);
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Coupon> listAll() {
        return couponRepository.findAll();
    }

    @Transactional
    public Coupon create(CouponRequest req) {
        if (couponRepository.findByCode(req.getCode()).isPresent()) {
            throw new BadRequestException("Coupon code already exists");
        }
        return couponRepository.save(buildCouponFromRequest(new Coupon(), req));
    }

    @Transactional
    public Coupon update(java.util.UUID id, CouponRequest req) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        return couponRepository.save(buildCouponFromRequest(c, req));
    }

    @Transactional
    public void delete(java.util.UUID id) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        couponRepository.delete(c);
    }

    private Coupon buildCouponFromRequest(Coupon c, CouponRequest req) {
        c.setCode(req.getCode().toUpperCase());
        c.setDiscountType(req.getDiscountType());
        c.setDiscountValue(req.getDiscountValue());
        c.setMinOrderAmount(req.getMinOrderAmount() != null ? req.getMinOrderAmount() : BigDecimal.ZERO);
        c.setMaxDiscountAmount(req.getMaxDiscountAmount());
        c.setUsageLimit(req.getUsageLimit());
        c.setIsActive(req.getIsActive());
        if (req.getValidFrom() != null) {
            try { c.setValidFrom(LocalDateTime.parse(req.getValidFrom())); }
            catch (DateTimeParseException e) { throw new BadRequestException("validFrom must be ISO-8601 datetime"); }
        }
        if (req.getValidUntil() != null) {
            try { c.setValidUntil(LocalDateTime.parse(req.getValidUntil())); }
            catch (DateTimeParseException e) { throw new BadRequestException("validUntil must be ISO-8601 datetime"); }
        }
        return c;
    }
}
