package com.royalmukhwas.repository;

import com.royalmukhwas.entity.WholesaleProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WholesaleProfileRepository extends JpaRepository<WholesaleProfile, UUID> {

    Optional<WholesaleProfile> findByUserId(UUID userId);

    List<WholesaleProfile> findByIsApprovedFalse();
}

