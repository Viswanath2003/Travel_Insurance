package com.insurance.auth.service;

import com.insurance.auth.dto.request.UpdateProfileRequest;
import com.insurance.auth.dto.response.CustomerProfileResponse;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface CustomerProfileService {

    CustomerProfileResponse getProfile(String userId);

    void submitProfileChangeRequest(String userId, UpdateProfileRequest request);

    PagedResponse<com.insurance.auth.entity.ProfileChangeRequest> getPendingRequests(Pageable pageable);

    void approveProfileChange(String requestId, String adminId);

    void rejectProfileChange(String requestId, String adminId, String notes);
}
