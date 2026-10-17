package com.novelia.auth.service;

import com.novelia.auth.dto.AuthResponse;
import com.novelia.auth.dto.LoginRequest;
import com.novelia.auth.dto.RegisterRequest;
import com.novelia.common.exception.BadRequestException;
import com.novelia.security.JwtTokenProvider;
import com.novelia.user.dto.UserResponse;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.RoleRepository;
import com.novelia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Kiểm tra email trùng lặp
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email đã được đăng ký trong hệ thống: " + request.getEmail());
        }

        // 2. Phân quyền an toàn: Tuyệt đối không cho phép tự đăng ký quyền ADMIN hoặc STAFF
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ROLE_CUSTOMER")
                        .description("Khách hàng mua sách")
                        .build()));

        Set<Role> roles = new HashSet<>();
        roles.add(customerRole);

        // 3. Mã hóa mật khẩu bằng BCrypt
        User newUser = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .status(User.UserStatus.ACTIVE)
                .roles(roles)
                .build();

        userRepository.save(newUser);

        // 4. Tự động đăng nhập và phát hành JWT Token
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .user(mapToUserResponse(newUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin tài khoản"));

        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .build();
    }

    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin tài khoản"));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus().name())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
