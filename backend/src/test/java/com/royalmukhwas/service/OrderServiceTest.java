package com.royalmukhwas.service;

import com.royalmukhwas.dto.request.OrderRequest;
import com.royalmukhwas.dto.response.OrderResponse;
import com.royalmukhwas.entity.*;
import com.royalmukhwas.exception.CustomExceptions.InsufficientStockException;
import com.royalmukhwas.exception.CustomExceptions.BadRequestException;
import com.royalmukhwas.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pure unit test for {@link OrderService} — no Spring context, no DB. Covers the
 * two business paths the plan flags as critical: insufficient-stock at order
 * placement and coupon discount math (percentage with cap + flat). Uses Mockito
 * to stub repository returns so the assertions exercise real service logic.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock AddressRepository addressRepository;
    @Mock CouponRepository couponRepository;
    @Mock UserRepository userRepository;
    @Mock OrderMapper orderMapper;

    @InjectMocks OrderService service;

    @BeforeEach
    void setUp() {
        // Inject @Value fields — Mockito @InjectMocks skips Spring wiring.
        ReflectionTestUtils.setField(service, "freeShippingThreshold", new BigDecimal("499"));
        ReflectionTestUtils.setField(service, "codMaxAmount", new BigDecimal("2000"));
    }

    private OrderRequest baseRequest(UUID addressId, UUID variantId, int qty, String paymentMethod, String coupon) {
        OrderRequest req = new OrderRequest();
        req.setAddressId(addressId);
        req.setPaymentMethod(paymentMethod);
        req.setCouponCode(coupon);
        OrderRequest.Item item = new OrderRequest.Item();
        item.setVariantId(variantId);
        item.setQuantity(qty);
        req.setItems(List.of(item));
        return req;
    }

    private ProductVariant variant(UUID variantId, BigDecimal price, int stock) {
        Product p = Product.builder().name("Mukhwas").build();
        return ProductVariant.builder()
                .id(variantId).product(p).label("100g")
                .retailPrice(price).stockQuantity(stock).build();
    }

    @Test
    void placeOrder_insufficientStock_throws() {
        UUID userId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(
                User.builder().id(userId).email("u@e.com").role(User.Role.CUSTOMER).build()));
        when(addressRepository.findById(addrId)).thenReturn(Optional.of(
                Address.builder().id(addrId).build()));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(
                variant(variantId, new BigDecimal("100"), 1))); // stock=1, asking for 2

        OrderRequest req = baseRequest(addrId, variantId, 2, "RAZORPAY", null);

        InsufficientStockException ex = assertThrows(InsufficientStockException.class,
                () -> service.placeOrder(userId, req));
        assertTrue(ex.getMessage().contains("Mukhwas"));
    }

    @Test
    void placeOrder_percentageCoupon_appliesDiscountWithCap() {
        UUID userId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(
                User.builder().id(userId).email("u@e.com").role(User.Role.CUSTOMER).build()));
        when(addressRepository.findById(addrId)).thenReturn(Optional.of(
                Address.builder().id(addrId).build()));
        // price 100, qty 5 → subtotal 500; 10% off = 50 (below the 75 cap).
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(
                variant(variantId, new BigDecimal("100"), 5)));

        Coupon tenPct = Coupon.builder()
                .code("WELCOME10")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10"))
                .minOrderAmount(new BigDecimal("0"))
                .maxDiscountAmount(new BigDecimal("75"))
                .usageLimit(100).usedCount(0).isActive(true)
                .build();
        when(couponRepository.findByCode("WELCOME10")).thenReturn(Optional.of(tenPct));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any())).thenReturn(OrderResponse.builder().build());

        OrderRequest req = baseRequest(addrId, variantId, 5, "RAZORPAY", "WELCOME10");
        OrderResponse resp = service.placeOrder(userId, req);

        assertNotNull(resp);
        // Verify the coupon discount math: 10% of 500 = 50 (capped at 75 → 50).
        ArgumentCaptorWrapper captured = new ArgumentCaptorWrapper();
        verify(orderRepository, atLeastOnce()).save(captured.captor.capture());
        Order savedOrder = captured.lastSavedOrderWithItems();
        assertEquals(new BigDecimal("50.00"), savedOrder.getDiscountAmount());
        // 500 + 0 shipping (>=499) - 50 = 450
        assertEquals(new BigDecimal("450.00"), savedOrder.getTotalAmount());
        // Coupon was consumed.
        assertEquals(1, tenPct.getUsedCount());
    }

    @Test
    void placeOrder_codAbove2000_rejected() {
        UUID userId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(
                User.builder().id(userId).email("u@e.com").role(User.Role.CUSTOMER).build()));
        when(addressRepository.findById(addrId)).thenReturn(Optional.of(
                Address.builder().id(addrId).build()));
        // price 1000, qty 3 → subtotal 3000; way over COD ceiling.
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(
                variant(variantId, new BigDecimal("1000"), 99)));

        OrderRequest req = baseRequest(addrId, variantId, 3, "COD", null);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.placeOrder(userId, req));
        assertTrue(ex.getMessage().contains("COD"));
    }

    // Convenience wrapper so the test body reads cleanly without a static-import.
    static class ArgumentCaptorWrapper {
        final org.mockito.ArgumentCaptor<Order> captor = org.mockito.ArgumentCaptor.forClass(Order.class);

        Order lastSavedOrderWithItems() {
            Order withItems = null;
            for (Order o : captor.getAllValues()) {
                if (o.getItems() != null && !o.getItems().isEmpty()) withItems = o;
            }
            return withItems != null ? withItems : captor.getValue();
        }
    }
}
