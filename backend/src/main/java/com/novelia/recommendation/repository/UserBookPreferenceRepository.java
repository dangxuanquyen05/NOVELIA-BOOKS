package com.novelia.recommendation.repository;

import com.novelia.recommendation.entity.UserBookPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBookPreferenceRepository extends JpaRepository<UserBookPreference, Long> {
    Optional<UserBookPreference> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
