package com.royalmukhwas.service;

import com.royalmukhwas.entity.*;
import com.royalmukhwas.exception.CustomExceptions.*;
import com.royalmukhwas.repository.*;
import com.royalmukhwas.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;

    public Page<Product> getAllProducts(int page, int size, String sort) {
        Sort sortObj = switch (sort == null ? "newest" : sort) {
            case "price-low"  -> Sort.by("variants.retailPrice").ascending();
            case "price-high" -> Sort.by("variants.retailPrice").descending();
            case "name"       -> Sort.by("name").ascending();
            default           -> Sort.by("createdAt").descending(); // newest / unknown
        };
        return productRepository.findByIsActiveTrue(PageRequest.of(page, size, sortObj));
    }

    public Page<Product> getByCategory(String slug, int page, int size) {
        return productRepository.findByCategorySlugAndIsActiveTrue(slug, PageRequest.of(page, size));
    }

    public Page<Product> search(String query, int page, int size) {
        return productRepository.searchProducts(query, PageRequest.of(page, size));
    }

    public List<Product> getFeatured() {
        return productRepository.findByIsFeaturedTrueAndIsActiveTrue();
    }

    public Product getBySlug(String slug) {
        return productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug));
    }

    @Transactional
    public Product createProduct(Map<String, Object> data) {
        String name = (String) data.get("name");
        UUID categoryId = UUID.fromString((String) data.get("categoryId"));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
                .name(name)
                .nameMarathi((String) data.get("nameMarathi"))
                .slug(SlugGenerator.toSlug(name))
                .description((String) data.get("description"))
                .descriptionMarathi((String) data.get("descriptionMarathi"))
                .ingredients((String) data.get("ingredients"))
                .benefits((String) data.get("benefits"))
                .category(category)
                .isFeatured(Boolean.TRUE.equals(data.get("isFeatured")))
                .isActive(true)
                .metaTitle((String) data.getOrDefault("metaTitle", name))
                .build();

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(UUID id, Map<String, Object> data) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (data.containsKey("name")) product.setName((String) data.get("name"));
        if (data.containsKey("description")) product.setDescription((String) data.get("description"));
        if (data.containsKey("ingredients")) product.setIngredients((String) data.get("ingredients"));
        if (data.containsKey("benefits")) product.setBenefits((String) data.get("benefits"));
        if (data.containsKey("isFeatured")) product.setIsFeatured((Boolean) data.get("isFeatured"));
        if (data.containsKey("isActive")) product.setIsActive((Boolean) data.get("isActive"));

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
    }

    // ── Admin-only methods ────────────────────────────────────────────────────────

    public Page<Product> getAllForAdmin(int page, int size, String search, String category) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (search != null && !search.isBlank()) {
            return productRepository.searchProductsAdmin(search, pageable);
        } else if (category != null && !category.isBlank()) {
            return productRepository.findByCategorySlug(category, pageable);
        }
        return productRepository.findAll(pageable);
    }

    public Product getById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    @Transactional
    public ProductVariant addVariant(UUID productId, Map<String, Object> data) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .weightGrams(toInt(data.get("weightGrams"), 0))
                .label((String) data.getOrDefault("label", ""))
                .retailPrice(toBigDecimal(data.get("retailPrice"), BigDecimal.ZERO))
                .wholesalePrice(toBigDecimal(data.get("wholesalePrice"), null))
                .moq(toInt(data.get("moq"), 1))
                .stockQuantity(toInt(data.get("stockQuantity"), 0))
                .sku((String) data.get("sku"))
                .isActive(true)
                .build();
        return variantRepository.save(variant);
    }

    @Transactional
    public ProductVariant updateVariant(UUID variantId, Map<String, Object> data) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));

        if (data.containsKey("weightGrams")) variant.setWeightGrams(toInt(data.get("weightGrams"), variant.getWeightGrams()));
        if (data.containsKey("label")) variant.setLabel((String) data.get("label"));
        if (data.containsKey("retailPrice")) variant.setRetailPrice(toBigDecimal(data.get("retailPrice"), variant.getRetailPrice()));
        if (data.containsKey("wholesalePrice")) variant.setWholesalePrice(toBigDecimal(data.get("wholesalePrice"), variant.getWholesalePrice()));
        if (data.containsKey("moq")) variant.setMoq(toInt(data.get("moq"), variant.getMoq()));
        if (data.containsKey("stockQuantity")) variant.setStockQuantity(toInt(data.get("stockQuantity"), variant.getStockQuantity()));
        if (data.containsKey("sku")) variant.setSku((String) data.get("sku"));
        if (data.containsKey("isActive")) variant.setIsActive((Boolean) data.get("isActive"));
        return variantRepository.save(variant);
    }

    @Transactional
    public void deleteVariant(UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
        variant.setIsActive(false);
        variantRepository.save(variant);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private static Integer toInt(Object val, Integer defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }

    private static BigDecimal toBigDecimal(Object val, BigDecimal defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        try { return new BigDecimal(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }
}
