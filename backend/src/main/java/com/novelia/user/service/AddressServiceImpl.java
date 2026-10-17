package com.novelia.user.service;

import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.user.dto.AddressRequest;
import com.novelia.user.dto.AddressResponse;
import com.novelia.user.entity.Address;
import com.novelia.user.entity.User;
import com.novelia.user.repository.AddressRepository;
import com.novelia.user.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressServiceImpl(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(String userEmail) {
        User user = getUserByEmail(userEmail);
        return addressRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập vào địa chỉ này");
        }

        return mapToResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse createAddress(String userEmail, AddressRequest request) {
        User user = getUserByEmail(userEmail);

        List<Address> existing = addressRepository.findByUserId(user.getId());
        boolean shouldBeDefault = Boolean.TRUE.equals(request.getIsDefault()) || existing.isEmpty();

        if (shouldBeDefault && !existing.isEmpty()) {
            for (Address a : existing) {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            }
        }

        Address address = Address.builder()
                .user(user)
                .receiverName(request.getReceiverName().trim())
                .phone(request.getPhone().trim())
                .province(request.getProvince().trim())
                .district(request.getDistrict().trim())
                .ward(request.getWard().trim())
                .detailedAddress(request.getDetailedAddress().trim())
                .isDefault(shouldBeDefault)
                .build();

        return mapToResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(String userEmail, Long id, AddressRequest request) {
        User user = getUserByEmail(userEmail);
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa địa chỉ này");
        }

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            List<Address> existing = addressRepository.findByUserId(user.getId());
            for (Address a : existing) {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            }
            address.setIsDefault(true);
        } else if (request.getIsDefault() != null) {
            address.setIsDefault(request.getIsDefault());
        }

        address.setReceiverName(request.getReceiverName().trim());
        address.setPhone(request.getPhone().trim());
        address.setProvince(request.getProvince().trim());
        address.setDistrict(request.getDistrict().trim());
        address.setWard(request.getWard().trim());
        address.setDetailedAddress(request.getDetailedAddress().trim());

        return mapToResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public void deleteAddress(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ với ID: " + id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa địa chỉ này");
        }

        addressRepository.delete(address);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    private AddressResponse mapToResponse(Address a) {
        String fullAddress = String.format("%s, %s, %s, %s",
                a.getDetailedAddress(), a.getWard(), a.getDistrict(), a.getProvince());

        return AddressResponse.builder()
                .id(a.getId())
                .receiverName(a.getReceiverName())
                .phone(a.getPhone())
                .province(a.getProvince())
                .district(a.getDistrict())
                .ward(a.getWard())
                .detailedAddress(a.getDetailedAddress())
                .fullAddress(fullAddress)
                .isDefault(a.getIsDefault())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
