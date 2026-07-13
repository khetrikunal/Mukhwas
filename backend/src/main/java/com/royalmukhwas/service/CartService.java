package com.royalmukhwas.service;

import com.royalmukhwas.dto.request.CartItemRequest;
import com.royalmukhwas.dto.request.CartUpdateRequest;
import com.royalmukhwas.dto.response.CartResponse;
import com.royalmukhwas.dto.response.CouponValidationResponse;
import com.royalmukhwas.entity.*;
import com.royalmukhwas.exception.CustomExceptions.BadRequestException;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Server-side shopping cart. One {@link Cart} per user, persisted across
 * sessions/devices. Pricing (wholesale vs retail, coupon discount, shipping)
 * is computed on read so the frontend never re-implements those rules.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final CouponService couponService;
    private final ProductImageRepository productImageRepository;

    @Value("${app.free-shipping-threshold:499}")
    private BigDecimal freeShippingThreshold;

    @Transactional
    public CartResponse getCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(UUID userId, CartItemRequest req) {
        Cart cart = getOrCreateCart(userId);
        ProductVariant variant = variantRepository.findById(req.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
        if (!Boolean.TRUE.equals(variant.getIsActive()))
            throw new BadRequestException("Variant is unavailable");
        if (variant.getStockQuantity() < req.getQuantity())
            throw new BadRequestException("Insufficient stock (available: " + variant.getStockQuantity() + ")");

        Optional<CartItem> existing = cart.getItems().stream()
                .filter(i -> i.getVariant().getId().equals(variant.getId()))
                .findFirst();

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQty = item.getQuantity() + req.getQuantity();
            if (newQty > variant.getStockQuantity())
                throw new BadRequestException("Insufficient stock (available: " + variant.getStockQuantity() + ")");
            item.setQuantity(newQty);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(req.getQuantity())
                    .build();
            cart.getItems().add(item);
        }
        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItem(UUID userId, CartUpdateRequest req) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getVariant().getId().equals(req.getVariantId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not in cart"));

        if (req.getQuantity() <= 0) {
            cart.getItems().remove(item);
        } else {
            if (req.getQuantity() > item.getVariant().getStockQuantity())
                throw new BadRequestException("Insufficient stock (available: " + item.getVariant().getStockQuantity() + ")");
            item.setQuantity(req.getQuantity());
        }
        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(UUID userId, UUID variantId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().removeIf(i -> i.getVariant().getId().equals(variantId));
        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse clear(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cart.setCouponCode(null);
        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse applyCoupon(UUID userId, String code) {
        Cart cart = getOrCreateCart(userId);
        // Validate before storing so we can reject with a clear message.
        BigDecimal subtotal = computeSubtotal(cart, cart.getUser().getRole());
        CouponValidationResponse result = couponService.validate(code, subtotal);
        if (!result.isValid()) {
            throw new BadRequestException(result.getMessage());
        }
        cart.setCouponCode(code.toUpperCase());
        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeCoupon(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.setCouponCode(null);
        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    // ── internals ──────────────────────────────────────────────────────────────

    private Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User userRef = new User();
            userRef.setId(userId);
            Cart cart = Cart.builder().user(userRef).items(new ArrayList<>()).build();
            return cartRepository.save(cart);
        });
    }

    /** Build the response DTO with all totals computed server-side. */
    private CartResponse toResponse(Cart cart) {
        User.Role role = cart.getUser().getRole();
        boolean isWholesale = role == User.Role.WHOLESALE;

        // Preload primary images for the products in this cart (avoids N+1 during item mapping).
        List<UUID> productIds = cart.getItems().stream()
                .map(i -> i.getVariant().getProduct().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, String> primaryImageByProduct = productIds.isEmpty()
                ? Collections.emptyMap()
                : productImageRepository.findAllByProductIdInAndIsPrimaryTrue(productIds).stream()
                        .collect(Collectors.toMap(
                                img -> img.getProduct().getId(),
                                ProductImage::getImageUrl,
                                (a, b) -> a));

        List<CartResponse.CartItemView> itemViews = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int itemCount = 0;

        for (CartItem item : cart.getItems()) {
            ProductVariant v = item.getVariant();
            Product p = v.getProduct();
            BigDecimal unitPrice = (isWholesale && v.getWholesalePrice() != null)
                    ? v.getWholesalePrice() : v.getRetailPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            itemCount += item.getQuantity();

            itemViews.add(CartResponse.CartItemView.builder()
                    .variantId(v.getId())
                    .productId(p.getId())
                    .productName(p.getName())
                    .variantLabel(v.getLabel())
                    .imageUrl(primaryImageByProduct.get(p.getId()))
                    .unitPrice(unitPrice)
                    .quantity(item.getQuantity())
                    .lineTotal(lineTotal)
                    .stockQuantity(v.getStockQuantity())
                    .build());
        }

        // Discount
        BigDecimal discount = BigDecimal.ZERO;
        boolean couponValid = false;
        if (cart.getCouponCode() != null) {
            CouponValidationResponse result = couponService.validate(cart.getCouponCode(), subtotal);
            couponValid = result.isValid();
            if (couponValid) discount = result.getDiscountAmount();
        }

        BigDecimal shipping = subtotal.compareTo(BigDecimal.ZERO) > 0
                && subtotal.compareTo(freeShippingThreshold) < 0
                ? new BigDecimal("50") : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(shipping).subtract(discount).max(BigDecimal.ZERO);

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemViews)
                .couponCode(couponValid ? cart.getCouponCode() : null)
                .couponValid(couponValid)
                .subtotal(subtotal)
                .discount(discount)
                .shipping(shipping)
                .total(total)
                .itemCount(itemCount)
                .build();
    }

    private BigDecimal computeSubtotal(Cart cart, User.Role role) {
        boolean isWholesale = role == User.Role.WHOLESALE;
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            ProductVariant v = item.getVariant();
            BigDecimal unitPrice = (isWholesale && v.getWholesalePrice() != null)
                    ? v.getWholesalePrice() : v.getRetailPrice();
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        return subtotal;
    }
}
