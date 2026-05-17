package com.insurance.auth.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.auth.dto.request.UpdateProfileRequest;
import com.insurance.auth.dto.response.CustomerProfileResponse;
import com.insurance.auth.entity.CustomerProfile;
import com.insurance.auth.entity.ProfileChangeRequest;
import com.insurance.auth.repository.CustomerProfileRepository;
import com.insurance.auth.repository.ProfileChangeRequestRepository;
import com.insurance.auth.service.CustomerProfileService;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerProfileServiceImpl implements CustomerProfileService {

    private final CustomerProfileRepository profileRepository;
    private final ProfileChangeRequestRepository changeRequestRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public CustomerProfileResponse getProfile(String userId) {
        CustomerProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerProfile", userId));
        return toResponse(profile);
    }

    @Override
    @Transactional
    public void submitProfileChangeRequest(String userId, UpdateProfileRequest request) {
        String changesJson;
        try {
            changesJson = objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize profile change request", e);
        }

        ProfileChangeRequest changeRequest = new ProfileChangeRequest();
        changeRequest.setUserId(userId);
        changeRequest.setRequestedChanges(changesJson);
        changeRequest.setStatus(ProfileChangeRequest.RequestStatus.PENDING);
        changeRequestRepository.save(changeRequest);

        log.info("Profile change request submitted for user: {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProfileChangeRequest> getPendingRequests(Pageable pageable) {
        Page<ProfileChangeRequest> page = changeRequestRepository
                .findByStatus(ProfileChangeRequest.RequestStatus.PENDING, pageable);
        return PagedResponse.of(page);
    }

    @Override
    @Transactional
    public void approveProfileChange(String requestId, String adminId) {
        ProfileChangeRequest request = findRequest(requestId);
        UpdateProfileRequest changes = parseChanges(request.getRequestedChanges());

        CustomerProfile profile = profileRepository.findByUserId(request.getUserId())
                .orElseGet(() -> {
                    CustomerProfile p = new CustomerProfile();
                    p.setUserId(request.getUserId());
                    return p;
                });

        applyChanges(profile, changes);
        profileRepository.save(profile);

        request.setStatus(ProfileChangeRequest.RequestStatus.APPROVED);
        request.setReviewedBy(adminId);
        request.setReviewedAt(LocalDateTime.now());
        changeRequestRepository.save(request);

        log.info("Profile change approved for user: {} by admin: {}", request.getUserId(), adminId);
    }

    @Override
    @Transactional
    public void rejectProfileChange(String requestId, String adminId, String notes) {
        ProfileChangeRequest request = findRequest(requestId);
        request.setStatus(ProfileChangeRequest.RequestStatus.REJECTED);
        request.setReviewedBy(adminId);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNotes(notes);
        changeRequestRepository.save(request);

        log.info("Profile change rejected for user: {} by admin: {}", request.getUserId(), adminId);
    }

    private ProfileChangeRequest findRequest(String requestId) {
        return changeRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProfileChangeRequest", requestId));
    }

    private UpdateProfileRequest parseChanges(String json) {
        try {
            return objectMapper.readValue(json, UpdateProfileRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse profile change request", e);
        }
    }

    private void applyChanges(CustomerProfile profile, UpdateProfileRequest changes) {
        if (changes.getDateOfBirth() != null) profile.setDateOfBirth(changes.getDateOfBirth());
        if (changes.getGender() != null) profile.setGender(changes.getGender());
        if (changes.getNationality() != null) profile.setNationality(changes.getNationality());
        if (changes.getPassportNumber() != null) profile.setPassportNumber(changes.getPassportNumber());
        if (changes.getPassportExpiry() != null) profile.setPassportExpiry(changes.getPassportExpiry());
        if (changes.getAddressLine1() != null) profile.setAddressLine1(changes.getAddressLine1());
        if (changes.getAddressLine2() != null) profile.setAddressLine2(changes.getAddressLine2());
        if (changes.getCity() != null) profile.setCity(changes.getCity());
        if (changes.getState() != null) profile.setState(changes.getState());
        if (changes.getPostalCode() != null) profile.setPostalCode(changes.getPostalCode());
        if (changes.getCountry() != null) profile.setCountry(changes.getCountry());
        if (changes.getProfilePhotoUrl() != null) profile.setProfilePhotoUrl(changes.getProfilePhotoUrl());
    }

    private CustomerProfileResponse toResponse(CustomerProfile p) {
        return CustomerProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .nationality(p.getNationality())
                .passportNumber(p.getPassportNumber())
                .passportExpiry(p.getPassportExpiry())
                .addressLine1(p.getAddressLine1())
                .addressLine2(p.getAddressLine2())
                .city(p.getCity())
                .state(p.getState())
                .postalCode(p.getPostalCode())
                .country(p.getCountry())
                .profilePhotoUrl(p.getProfilePhotoUrl())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
