package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.auth.dto.LoginRequest;
import com.novelia.auth.dto.RegisterRequest;
import com.novelia.security.JwtTokenProvider;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.RoleRepository;
import com.novelia.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthAndSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;

    private Role customerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));
    }

    @Test
    @DisplayName("Đăng ký thành công: Tự động mã hóa BCrypt, gán quyền ROLE_CUSTOMER và cấp JWT")
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("newcustomer@novelia.vn")
                .password("Secr3tPassword!")
                .fullName("Độc Giả Mới")
                .phone("0912345678")
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("newcustomer@novelia.vn"))
                .andExpect(jsonPath("$.data.user.roles[0]").value("ROLE_CUSTOMER"));
    }

    @Test
    @DisplayName("Đăng ký trùng email: Trả về lỗi 400 Bad Request")
    void testRegisterDuplicateEmail() throws Exception {
        userRepository.save(User.builder()
                .email("existing@novelia.vn")
                .passwordHash(passwordEncoder.encode("Password123"))
                .fullName("Existing User")
                .roles(Set.of(customerRole))
                .build());

        RegisterRequest duplicateRequest = RegisterRequest.builder()
                .email("existing@novelia.vn")
                .password("DifferentPassword!")
                .fullName("Duplicate User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Email đã được đăng ký")));
    }

    @Test
    @DisplayName("Đăng nhập thành công: Trả về 200 OK và JWT Token")
    void testLoginSuccess() throws Exception {
        userRepository.save(User.builder()
                .email("validlogin@novelia.vn")
                .passwordHash(passwordEncoder.encode("CorrectPassword"))
                .fullName("Valid User")
                .roles(Set.of(customerRole))
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("validlogin@novelia.vn")
                .password("CorrectPassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("validlogin@novelia.vn"));
    }

    @Test
    @DisplayName("Đăng nhập sai mật khẩu: Trả về 401 Unauthorized")
    void testLoginWrongPassword() throws Exception {
        userRepository.save(User.builder()
                .email("user1@novelia.vn")
                .passwordHash(passwordEncoder.encode("RealPassword"))
                .fullName("User One")
                .roles(Set.of(customerRole))
                .build());

        LoginRequest wrongLogin = LoginRequest.builder()
                .email("user1@novelia.vn")
                .password("WrongPassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác"));
    }

    @Test
    @DisplayName("Bảo vệ API Quản trị: Không có token trả về 401 Unauthorized")
    void testAdminEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard-stats"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Bảo vệ API Quản trị: Token CUSTOMER truy cập trả về 403 Forbidden")
    void testAdminEndpointForbiddenForCustomer() throws Exception {
        userRepository.save(User.builder()
                .email("customer@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Customer User")
                .roles(Set.of(customerRole))
                .build());

        UsernamePasswordAuthenticationToken customerAuth = new UsernamePasswordAuthenticationToken(
                "customer@novelia.vn", null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        String customerJwt = tokenProvider.generateTokenFromUsername("customer@novelia.vn", customerAuth);

        mockMvc.perform(get("/api/admin/dashboard-stats")
                .header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("không có quyền truy cập")));
    }

    @Test
    @DisplayName("Bảo vệ API Quản trị: Token ADMIN truy cập thành công 200 OK")
    void testAdminEndpointAllowedForAdmin() throws Exception {
        userRepository.save(User.builder()
                .email("admin@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Admin User")
                .roles(Set.of(adminRole))
                .build());

        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@novelia.vn", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        String adminJwt = tokenProvider.generateTokenFromUsername("admin@novelia.vn", adminAuth);

        mockMvc.perform(get("/api/admin/dashboard-stats")
                .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roleVerified").value("ROLE_ADMIN"));
    }
}
