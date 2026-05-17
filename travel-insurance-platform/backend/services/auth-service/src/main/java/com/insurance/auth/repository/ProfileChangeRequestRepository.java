package com.insurance.auth.repository;

import com.insurance.auth.entity.ProfileChangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfileChangeRequestRepository extends JpaRepository<ProfileChangeRequest, String> {

    Page<ProfileChangeRequest> findByStatus(ProfileChangeRequest.RequestStatus status, Pageable pageable);

    List<ProfileChangeRequest> findByUserIdAndStatus(String userId, ProfileChangeRequest.RequestStatus status);
}
