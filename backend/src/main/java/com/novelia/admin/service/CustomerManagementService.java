package com.novelia.admin.service;

import com.novelia.admin.dto.CustomerDetailResponse;
import com.novelia.admin.dto.CustomerManagementResponse;
import com.novelia.admin.dto.UpdateCustomerStatusRequest;
import com.novelia.common.dto.PageResponse;

public interface CustomerManagementService {
    PageResponse<CustomerManagementResponse> getCustomers(String keyword, int page, int size);
    PageResponse<CustomerManagementResponse> getCustomers(String keyword, String status, String role, int page, int size);
    CustomerDetailResponse getCustomerDetails(Long id);
    CustomerManagementResponse updateCustomerStatus(Long id, UpdateCustomerStatusRequest request, String currentAdminEmail);
}
