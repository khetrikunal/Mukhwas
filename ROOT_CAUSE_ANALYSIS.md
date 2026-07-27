# ROOT CAUSE ANALYSIS: POST /cart/add → HTTP 500

## 1. Root Cause

**StackOverflowError** caused by infinite recursive bidirectional JSON serialization between JPA entities (`Product` ↔ `ProductVariant`) during `CartService.toResponse()`.

## 2. Exact Exception

```
java.lang.StackOverflowError
```

## 3. Exact File & Line Number

| File | Line(s) | Issue |
|------|---------|-------|
| `backend/src/main/java/com/royalmukhwas/entity/Product.java` | Line 63-78 | Missing `@JsonIgnoreProperties({"product"})` on `variants` and `images` fields |
| `backend/src/main/java/com/royalmukhwas/entity/ProductVariant.java` | Line 28-30 | Missing `@JsonIgnoreProperties({"variants", "images"})` on `product` field |

## 4. Complete Fix

### Product.java (lines 63-78)
```java
// BEFORE:
@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<ProductVariant> variants;

@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<ProductImage> images;

// AFTER:
@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
@JsonIgnoreProperties({"product", "hibernateLazyInitializer", "handler"})
private List<ProductVariant> variants;

@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
@JsonIgnoreProperties({"product", "hibernateLazyInitializer", "handler"})
private List<ProductImage> images;
```

### ProductVariant.java (lines 28-30)
```java
// BEFORE:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "product_id", nullable = false)
private Product product;

// AFTER:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "product_id", nullable = false)
@JsonIgnoreProperties({"variants", "images", "hibernateLazyInitializer", "handler"})
private Product product;
```

## 5. Why This Fix Works

The serialization cycle was:
```
Product → variants[] → ProductVariant → product → Product → variants[] → INFINITE
```

By adding `@JsonIgnoreProperties`, we break the cycle at both entry points:
1. When Jackson serializes a `ProductVariant` inside `Product.variants`, it skips the `product` field (avoids going back to Product)
2. When Jackson serializes a `Product` referenced by `ProductVariant.product`, it skips `variants` and `images` collections (avoids going back to variants)

## 6. Verification

- **GET /api/cart** → HTTP 200 ✅ (still works)
- **POST /api/cart/add** → HTTP 200 ✅ (now works, Item added successfully)
- **GET /api/cart** after add → HTTP 200 ✅ (cart now contains the added item)
