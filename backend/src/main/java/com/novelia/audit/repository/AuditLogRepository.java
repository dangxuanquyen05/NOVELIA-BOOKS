package com.novelia.audit.repository;

import com.novelia.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:performedBy IS NULL OR LOWER(a.performedBy) LIKE LOWER(CONCAT('%', :performedBy, '%'))) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR a.createdAt <= :endDate) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findWithFilter(
            @Param("performedBy") String performedBy,
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT DISTINCT a.action FROM AuditLog a ORDER BY a.action ASC")
    List<String> findDistinctActions();

    @Query("SELECT DISTINCT a.entityType FROM AuditLog a ORDER BY a.entityType ASC")
    List<String> findDistinctEntityTypes();
}
