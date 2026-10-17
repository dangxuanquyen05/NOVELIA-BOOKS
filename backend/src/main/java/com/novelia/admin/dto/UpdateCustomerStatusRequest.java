package com.novelia.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UpdateCustomerStatusRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // ACTIVE, INACTIVE, LOCKED

    private String reason;

    public UpdateCustomerStatusRequest() {
    }

    public UpdateCustomerStatusRequest(String status) {
        this.status = status;
    }

    public UpdateCustomerStatusRequest(String status, String reason) {
        this.status = status;
        this.reason = reason;
    }
}
