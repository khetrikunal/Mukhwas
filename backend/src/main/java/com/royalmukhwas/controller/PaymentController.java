package com.royalmukhwas.controller;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<String>> createOrder(@RequestBody Map<String, String> body) throws Exception {
        UUID orderId = UUID.fromString(body.get("orderId"));
        JSONObject razorpayOrder = paymentService.createRazorpayOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(razorpayOrder.toString()));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verify(@RequestBody Map<String, String> body) {
        boolean verified = paymentService.verifyPayment(
                body.get("razorpay_order_id"),
                body.get("razorpay_payment_id"),
                body.get("razorpay_signature")
        );
        return ResponseEntity.ok(ApiResponse.success(verified ? "Payment verified" : "Verification failed", verified));
    }

    @PostMapping(value = "/webhook", consumes = "application/json")
    public ResponseEntity<String> webhook(@RequestBody String payload,
                                          @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        boolean ok = paymentService.handleWebhook(payload, signature);
        // Razorpay expects a 200; return 401 on signature failure so it retries.
        return ResponseEntity.status(ok ? 200 : 401).body(ok ? "OK" : "INVALID_SIGNATURE");
    }
}
