package com.royalmukhwas.service;

import com.razorpay.*;
import com.royalmukhwas.entity.Order;
import com.royalmukhwas.exception.CustomExceptions.*;
import com.royalmukhwas.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final OrderRepository orderRepository;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    public JSONObject createRazorpayOrder(UUID orderId) throws RazorpayException {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        long amountInPaise = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(100)).longValue();

        JSONObject options = new JSONObject();
        options.put("amount", amountInPaise);
        options.put("currency", "INR");
        options.put("receipt", order.getOrderNumber());
        options.put("notes", new JSONObject().put("orderId", orderId.toString()));

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);
        String razorpayOrderId = razorpayOrder.get("id");

        order.setRazorpayOrderId(razorpayOrderId);
        orderRepository.save(order);

        return razorpayOrder.toJson();
    }

    @Transactional
    public boolean verifyPayment(String razorpayOrderId, String razorpayPaymentId, String signature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);

            if (!computed.equals(signature)) return false;

            Order order = orderRepository.findByRazorpayOrderId(razorpayOrderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found for payment"));

            order.setRazorpayPaymentId(razorpayPaymentId);
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);
            return true;
        } catch (Exception e) {
            throw new PaymentException("Payment verification failed: " + e.getMessage());
        }
    }

    /**
     * Handle a Razorpay webhook: verify the HMAC-SHA256 signature over the raw
     * request body, then reconcile the order status from the event payload.
     *
     * <p>Idempotent: if the order is already PAID, a duplicate
     * {@code payment.captured} event is a no-op.
     *
     * @param rawBody    the raw request body (do NOT re-serialize — signature is over the exact bytes)
     * @param signature  the {@code X-Razorpay-Signature} header
     * @return true if the signature was valid and the event was processed
     */
    @Transactional
    public boolean handleWebhook(String rawBody, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured");
            return false;
        }
        if (signature == null || signature.isBlank()) {
            log.warn("Razorpay webhook missing X-Razorpay-Signature header");
            return false;
        }

        // Verify signature over the raw body.
        String computed;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            computed = HexFormat.of().formatHex(mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new PaymentException("Webhook signature computation failed: " + e.getMessage());
        }
        if (!computed.equals(signature)) {
            log.warn("Razorpay webhook signature mismatch (expected={}, got={})", computed, signature);
            return false;
        }

        // Parse the event and reconcile the order.
        try {
            JSONObject event = new JSONObject(rawBody);
            String eventType = event.optString("event");
            JSONObject payload = event.optJSONObject("payload");
            if (payload == null) return true; // signed but no action

            // payment.captured / payment.authorized
            if (eventType != null && (eventType.contains("payment.captured") || eventType.contains("payment.authorized"))) {
                JSONObject payment = payload.optJSONObject("payment");
                if (payment != null) {
                    JSONObject entity = payment.optJSONObject("entity");
                    if (entity != null) {
                        String razorpayOrderId = entity.optString("order_id");
                        String paymentId = entity.optString("id");
                        if (!razorpayOrderId.isBlank()) {
                            orderRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(order -> {
                                // Idempotent guard
                                if (order.getPaymentStatus() == Order.PaymentStatus.PAID) return;
                                order.setRazorpayPaymentId(paymentId);
                                order.setPaymentStatus(Order.PaymentStatus.PAID);
                                order.setStatus(Order.OrderStatus.CONFIRMED);
                                orderRepository.save(order);
                                log.info("Order {} marked PAID via webhook", order.getOrderNumber());
                            });
                        }
                    }
                }
            }
            // payment.failed → mark FAILED if still PENDING
            if (eventType != null && eventType.contains("payment.failed")) {
                JSONObject payment = payload.optJSONObject("payment");
                if (payment != null) {
                    JSONObject entity = payment.optJSONObject("entity");
                    if (entity != null) {
                        String razorpayOrderId = entity.optString("order_id");
                        if (!razorpayOrderId.isBlank()) {
                            orderRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(order -> {
                                if (order.getPaymentStatus() == Order.PaymentStatus.PENDING) {
                                    order.setPaymentStatus(Order.PaymentStatus.FAILED);
                                    orderRepository.save(order);
                                    log.warn("Order {} marked FAILED via webhook", order.getOrderNumber());
                                }
                            });
                        }
                    }
                }
            }
            return true;
        } catch (Exception e) {
            log.error("Failed to parse Razorpay webhook payload", e);
            throw new PaymentException("Webhook payload parse failed: " + e.getMessage());
        }
    }
}
