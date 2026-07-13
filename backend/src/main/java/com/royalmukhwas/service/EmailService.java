package com.royalmukhwas.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOrderConfirmation(String to, String orderNumber, String total) {
        sendHtmlEmail(to, "Order Confirmed – " + orderNumber,
                "<h2>Your order has been confirmed!</h2>" +
                "<p>Order Number: <strong>" + orderNumber + "</strong></p>" +
                "<p>Total: <strong>₹" + total + "</strong></p>" +
                "<p>We will notify you once your order is shipped.</p>" +
                "<p>Thank you for shopping with <strong>The Royal Mukhwas</strong>!</p>");
    }

    @Async
    public void sendOrderShipped(String to, String orderNumber, String trackingInfo) {
        sendHtmlEmail(to, "Order Shipped – " + orderNumber,
                "<h2>Your order is on the way!</h2>" +
                "<p>Order Number: <strong>" + orderNumber + "</strong></p>" +
                "<p>Tracking: " + trackingInfo + "</p>");
    }

    @Async
    public void sendWelcome(String to, String name) {
        sendHtmlEmail(to, "Welcome to The Royal Mukhwas!",
                "<h2>Welcome, " + name + "!</h2>" +
                "<p>Thank you for joining The Royal Mukhwas family.</p>" +
                "<p><em>Khane Ki Happy Ending</em></p>");
    }

    @Async
    public void sendWholesaleApproval(String to, String businessName) {
        sendHtmlEmail(to, "Wholesale Account Approved!",
                "<h2>Congratulations!</h2>" +
                "<p>Your wholesale account for <strong>" + businessName + "</strong> has been approved.</p>" +
                "<p>You can now log in and access exclusive wholesale pricing.</p>");
    }

    private void sendHtmlEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(wrapHtml(subject, html), true);
            mailSender.send(message);
        } catch (Exception e) {
            // Log but don't throw — email failure shouldn't break business logic
            System.err.println("Email send failed: " + e.getMessage());
        }
    }

    private String wrapHtml(String title, String body) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'/></head><body style='font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px'>" +
               "<div style='background:#1a3a5c;padding:20px;text-align:center;border-radius:8px 8px 0 0'>" +
               "<h1 style='color:#c9a84c;margin:0;font-size:22px'>👑 The Royal Mukhwas</h1>" +
               "<p style='color:#f5f0e8;font-size:12px;margin:4px 0 0'>Khane Ki Happy Ending</p></div>" +
               "<div style='background:#ffffff;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px'>" +
               body +
               "<hr style='margin:24px 0;border:none;border-top:1px solid #eee'/>" +
               "<p style='font-size:12px;color:#999'>© The Royal Mukhwas – 1824 Vituraya Ventures Private Limited | Baramati, Maharashtra</p></div></body></html>";
    }
}
