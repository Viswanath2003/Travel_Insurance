package com.insurance.auth.service;

import com.insurance.auth.dto.request.ChangePasswordRequest;
import com.insurance.auth.dto.response.UserProfileResponse;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserProfileResponse getCurrentUserProfile();

    UserProfileResponse getUserById(String userId);

    PagedResponse<UserProfileResponse> getAllUsers(Pageable pageable);

    void updateProfile(String userId, String fullName, String phone);

    void changePassword(String userId, ChangePasswordRequest request);

    void lockUser(String userId);

    void unlockUser(String userId);

    void assignRole(String userId, String roleCode);

    void removeRole(String userId, String roleCode);
}
