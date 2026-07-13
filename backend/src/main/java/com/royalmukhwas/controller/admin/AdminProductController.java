package com.royalmukhwas.controller.admin;

import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.entity.Product;
import com.royalmukhwas.entity.ProductVariant;
import com.royalmukhwas.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    /** List ALL products (including inactive) with optional search. */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Product>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ApiResponse.success(productService.getAllForAdmin(page, size, search, category)));
    }

    /** Get single product by id (admin). */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Product>> create(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success("Product created", productService.createProduct(data)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> update(@PathVariable UUID id, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", productService.updateProduct(id, data)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }

    /** Add a variant to a product. */
    @PostMapping("/{id}/variants")
    public ResponseEntity<ApiResponse<ProductVariant>> addVariant(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success("Variant added", productService.addVariant(id, data)));
    }

    /** Update a variant. */
    @PutMapping("/variants/{variantId}")
    public ResponseEntity<ApiResponse<ProductVariant>> updateVariant(
            @PathVariable UUID variantId,
            @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success("Variant updated", productService.updateVariant(variantId, data)));
    }

    /** Delete (soft-deactivate) a variant. */
    @DeleteMapping("/variants/{variantId}")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable UUID variantId) {
        productService.deleteVariant(variantId);
        return ResponseEntity.ok(ApiResponse.success("Variant deleted", null));
    }
}
