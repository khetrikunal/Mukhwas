package com.royalmukhwas.repository;

import com.royalmukhwas.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    List<ProductImage> findAllByProductIdInAndIsPrimaryTrue(List<UUID> productIds);

    List<ProductImage> findByProductIdOrderBySortOrderAsc(UUID productId);
}
