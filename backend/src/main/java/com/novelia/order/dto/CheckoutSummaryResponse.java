package com.novelia.order.dto;

import com.novelia.cart.dto.CartItemResponse;
import com.novelia.user.dto.AddressResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSummaryResponse {
    private List<CartItemResponse> items;
    private Integer totalItems;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private Boolean isFreeShipping;
    private BigDecimal totalAmount;
    private List<AddressResponse> savedAddresses;
    private AddressResponse defaultAddress;
    private List<String> supportedPaymentMethods;
}
