package com.royalmukhwas.controller;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.entity.Product;
import com.royalmukhwas.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Product>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        Page<Product> products;
        if (search != null && !search.isBlank()) {
            products = productService.search(search, page, size);
        } else if (category != null && !category.isBlank()) {
            products = productService.getByCategory(category, page, size);
        } else {
            products = productService.getAllProducts(page, size, sort);
        }
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<Product>>> getFeatured() {
        return ResponseEntity.ok(ApiResponse.success(productService.getFeatured()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<Product>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(productService.getBySlug(slug)));
    }
}
