package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.ReviewRequest;
import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.dto.response.ReviewResponse;
import com.royalmukhwas.entity.Product;
import com.royalmukhwas.entity.Review;
import com.royalmukhwas.entity.User;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.ProductRepository;
import com.royalmukhwas.repository.ReviewRepository;
import com.royalmukhwas.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final AuthenticatedUserResolver userResolver;

    /** Public: approved reviews for a product. */
    @GetMapping("/api/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> productReviews(@PathVariable UUID productId) {
        List<Review> reviews = reviewRepository
                .findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId, PageRequest.of(0, 50))
                .getContent();
        return ResponseEntity.ok(ApiResponse.success(reviews.stream()
                .map(ReviewController::toResponse).collect(Collectors.toList())));
    }

    /** Authenticated: submit a review (goes into moderation queue). */
    @PostMapping("/api/products/{productId}/reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> addReview(@PathVariable UUID productId,
                                                                 @Valid @RequestBody ReviewRequest req,
                                                                 Authentication auth) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = userResolver.getUser(auth);

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(req.getRating())
                .comment(req.getComment())
                .isApproved(false) // moderation queue
                .build();
        return ResponseEntity.ok(ApiResponse.success("Review submitted for approval",
                toResponse(reviewRepository.save(review))));
    }

    // ── Admin moderation ───────────────────────────────────────────────────────

    @GetMapping("/api/admin/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> pending() {
        return ResponseEntity.ok(ApiResponse.success(
                reviewRepository.findAllByIsApprovedFalseOrderByCreatedAtDesc().stream()
                        .map(ReviewController::toResponse).collect(Collectors.toList())));
    }

    @PutMapping("/api/admin/reviews/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReviewResponse>> approve(@PathVariable UUID id) {
        Review r = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        r.setIsApproved(true);
        return ResponseEntity.ok(ApiResponse.success("Review approved",
                toResponse(reviewRepository.save(r))));
    }

    @DeleteMapping("/api/admin/reviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        Review r = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        reviewRepository.delete(r);
        return ResponseEntity.ok(ApiResponse.success("Review deleted", null));
    }

    private static ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .productId(r.getProduct() != null ? r.getProduct().getId() : null)
                .productName(r.getProduct() != null ? r.getProduct().getName() : null)
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .userName(r.getUser() != null ? r.getUser().getName() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .isApproved(r.getIsApproved())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
