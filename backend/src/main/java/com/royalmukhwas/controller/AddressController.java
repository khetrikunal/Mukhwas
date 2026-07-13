package com.royalmukhwas.controller;

import com.royalmukhwas.dto.request.AddressRequest;
import com.royalmukhwas.dto.response.AddressResponse;
import com.royalmukhwas.dto.response.ApiResponse;
import com.royalmukhwas.entity.Address;
import com.royalmukhwas.entity.User;
import com.royalmukhwas.exception.CustomExceptions.ResourceNotFoundException;
import com.royalmukhwas.repository.AddressRepository;
import com.royalmukhwas.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final AuthenticatedUserResolver userResolver;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> myAddresses(Authentication auth) {
        UUID userId = userResolver.getUserId(auth);
        List<AddressResponse> list = addressRepository.findByUserId(userId).stream()
                .map(AddressController::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<AddressResponse>> add(@Valid @RequestBody AddressRequest req,
                                                            Authentication auth) {
        User user = userResolver.getUser(auth);
        boolean isFirst = addressRepository.findByUserId(user.getId()).isEmpty();

        Address addr = Address.builder()
                .user(user)
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .addressLine1(req.getAddressLine1())
                .addressLine2(req.getAddressLine2())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .isDefault(isFirst || Boolean.TRUE.equals(req.getIsDefault()))
                .build();

        // If marking this as default, clear previous default.
        if (Boolean.TRUE.equals(addr.getIsDefault()) && !isFirst) {
            addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .ifPresent(prev -> { prev.setIsDefault(false); addressRepository.save(prev); });
        }

        return ResponseEntity.ok(ApiResponse.success("Address added", toResponse(addressRepository.save(addr))));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<AddressResponse>> update(@PathVariable UUID id,
                                                              @Valid @RequestBody AddressRequest req,
                                                              Authentication auth) {
        UUID userId = userResolver.getUserId(auth);
        Address addr = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!addr.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found"); // hide existence from non-owners
        }
        addr.setFullName(req.getFullName());
        addr.setPhone(req.getPhone());
        addr.setAddressLine1(req.getAddressLine1());
        addr.setAddressLine2(req.getAddressLine2());
        addr.setCity(req.getCity());
        addr.setState(req.getState());
        addr.setPincode(req.getPincode());
        return ResponseEntity.ok(ApiResponse.success("Address updated", toResponse(addressRepository.save(addr))));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = userResolver.getUserId(auth);
        Address addr = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!addr.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found");
        }
        addressRepository.delete(addr);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }

    @PutMapping("/{id}/default")
    @Transactional
    public ResponseEntity<ApiResponse<AddressResponse>> setDefault(@PathVariable UUID id, Authentication auth) {
        UUID userId = userResolver.getUserId(auth);
        Address addr = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!addr.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found");
        }
        addressRepository.findByUserIdAndIsDefaultTrue(userId).ifPresent(prev -> {
            prev.setIsDefault(false);
            addressRepository.save(prev);
        });
        addr.setIsDefault(true);
        return ResponseEntity.ok(ApiResponse.success("Default address set", toResponse(addressRepository.save(addr))));
    }

    private static AddressResponse toResponse(Address a) {
        return AddressResponse.builder()
                .id(a.getId())
                .fullName(a.getFullName())
                .phone(a.getPhone())
                .addressLine1(a.getAddressLine1())
                .addressLine2(a.getAddressLine2())
                .city(a.getCity())
                .state(a.getState())
                .pincode(a.getPincode())
                .isDefault(a.getIsDefault())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
