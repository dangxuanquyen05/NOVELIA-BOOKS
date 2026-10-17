package com.novelia.admin.controller;

import com.novelia.admin.dto.CustomerManagementResponse;
import com.novelia.admin.dto.UpdateCustomerStatusRequest;
import com.novelia.admin.service.CustomerManagementService;
import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/customers")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_STAFF')")
public class AdminCustomerController {

    private final CustomerManagementService customerManagementService;

    public AdminCustomerController(CustomerManagementService customerManagementService) {
        this.customerManagementService = customerManagementService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CustomerManagementResponse>>> getCustomers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<CustomerManagementResponse> response = customerManagementService.getCustomers(keyword, status, role, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<com.novelia.admin.dto.CustomerDetailResponse>> getCustomerDetails(@PathVariable Long id) {
        com.novelia.admin.dto.CustomerDetailResponse response = customerManagementService.getCustomerDetails(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CustomerManagementResponse>> updateCustomerStatus(
            org.springframework.security.core.Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerStatusRequest request) {
        CustomerManagementResponse response = customerManagementService.updateCustomerStatus(
                id, request, authentication != null ? authentication.getName() : null);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công", response));
    }
}
