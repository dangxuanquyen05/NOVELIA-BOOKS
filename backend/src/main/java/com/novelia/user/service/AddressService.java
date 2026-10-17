package com.novelia.user.service;

import com.novelia.user.dto.AddressRequest;
import com.novelia.user.dto.AddressResponse;

import java.util.List;

public interface AddressService {
    List<AddressResponse> getMyAddresses(String userEmail);
    AddressResponse getAddressById(String userEmail, Long id);
    AddressResponse createAddress(String userEmail, AddressRequest request);
    AddressResponse updateAddress(String userEmail, Long id, AddressRequest request);
    void deleteAddress(String userEmail, Long id);
}
