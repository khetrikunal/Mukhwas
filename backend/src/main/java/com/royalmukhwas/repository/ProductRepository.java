package com.royalmukhwas.repository;

import com.royalmukhwas.entity.Category;
import com.royalmukhwas.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySlug(String slug);

    Page<Product> findByIsActiveTrue(Pageable pageable);

    Page<Product> findByCategorySlugAndIsActiveTrue(String slug, Pageable pageable);

    List<Product> findByIsFeaturedTrueAndIsActiveTrue();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchProducts(@Param("q") String query, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchProductsAdmin(@Param("q") String query, Pageable pageable);

    Page<Product> findByCategorySlug(String slug, Pageable pageable);

    /**
     * Sort active products by their cheapest variant price, ascending.
     *
     * <p>Uses a correlated subquery so Hibernate does not produce duplicate
     * rows via a JOIN on the @OneToMany {@code variants} collection —
     * the fan-out problem that {@code Sort.by("variants.retailPrice")} causes.
     */
    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "ORDER BY (SELECT MIN(v.retailPrice) FROM ProductVariant v WHERE v.product = p AND v.isActive = true) ASC")
    Page<Product> findAllActiveOrderByMinPriceAsc(Pageable pageable);

    /**
     * Sort active products by their cheapest variant price, descending.
     */
    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "ORDER BY (SELECT MIN(v.retailPrice) FROM ProductVariant v WHERE v.product = p AND v.isActive = true) DESC")
    Page<Product> findAllActiveOrderByMinPriceDesc(Pageable pageable);
}

