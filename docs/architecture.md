# Tài Liệu Thiết Kế Kiến Trúc Hệ Thống NOVELIA BOOKS

---

## 1. Mô Hình Kiến Trúc Tổng Thể (System Architecture)

NOVELIA BOOKS được thiết kế theo kiến trúc **Decoupled Client-Server (Khách - Chủ Phân Tách)** hoàn toàn, giao tiếp thông qua giao thức **RESTful API / JSON**:

```mermaid
graph TD
    Client["Storefront & Admin SPA<br/>(React 19 + TypeScript + Vite)"]
    API_Gateway["Reverse Proxy / HTTP Gateway<br/>(CORS + SSL Termination)"]
    
    subgraph Spring_Boot_Backend["Spring Boot 3.4.x (Java 21)"]
        SecFilter["Security Filter Chain<br/>(JWT Authentication & RBAC Authorization)"]
        Controllers["REST Controllers<br/>(@RestController, Bean Validation)"]
        Services["Service Layer<br/>(@Service, @Transactional, Domain Logic)"]
        PaymentAdapter["Payment Adapter<br/>(VNPay HMAC-SHA512 Checksum)"]
        ShippingAdapter["Shipping Carrier Adapter<br/>(GHN Integration Framework)"]
        Repositories["Data Access Layer<br/>(Spring Data JPA / Hibernate)"]
    end
    
    HikariCP["HikariCP Connection Pool"]
    MySQL[("MySQL 8.0 Database<br/>(novelia_books, InnoDB)")]
    VNPayGateway["VNPay Sandbox Gateway<br/>(External Redirect / IPN)"]

    Client -->|HTTP / JSON (Port 5173 -> 8080)| API_Gateway
    API_Gateway --> SecFilter
    SecFilter --> Controllers
    Controllers --> Services
    Services --> PaymentAdapter
    Services --> ShippingAdapter
    Services --> Repositories
    PaymentAdapter -.->|Secure SHA-512 Redirect| VNPayGateway
    Repositories --> HikariCP
    HikariCP --> MySQL
```

---

## 2. Thiết Kế Backend (Spring Boot 3 & Java 21)

### 2.1. Cấu Trúc Package-by-Feature (Mô-đun Hóa Nghiệp Vụ)
Thay vì chia nhỏ theo tầng truyền thống (gây phân tán mã nguồn), dự án tổ chức theo từng miền nghiệp vụ tự trị:
- `com.novelia.user`: Tài khoản, xác thực, phân quyền (RBAC), sổ địa chỉ.
- `com.novelia.book`: Tác phẩm sách, quản lý siêu dữ liệu, phân trang và tìm kiếm.
- `com.novelia.category`: Danh mục sách phân cấp cha-con.
- `com.novelia.author`: Tác giả tác phẩm.
- `com.novelia.cart`: Giỏ hàng bền vững theo người dùng.
- `com.novelia.order`: Đơn đặt hàng, chi tiết đơn, chuyển đổi trạng thái đơn (FSM).
- `com.novelia.inventory`: Tồn kho, nhật ký giao dịch kho (Inventory Transactions).
- `com.novelia.coupon`: Mã giảm giá (% hoặc số tiền), ràng buộc hạn mức và giá trị đơn tối thiểu.
- `com.novelia.review`: Đánh giá sách sao (1-5) và quy trình kiểm duyệt (Moderation).
- `com.novelia.payment`: Tích hợp cổng thanh toán (VNPay Sandbox).
- `com.novelia.shipment`: Khung tích hợp đơn vị vận chuyển (GHN).
- `com.novelia.admin`: Báo cáo, thống kê doanh thu và quản trị hệ thống.

---

### 2.2. Kiến Trúc Bảo Mật (Security & Authentication)

```
[HTTP Request]
       │
       ▼
[JwtAuthenticationFilter] ──(Trích xuất Bearer Token)──► [JwtTokenProvider]
       │                                                         │
  Token Hợp Lệ?                                            Xác thực chữ ký &
       ├──► Có: Nạp UserDetails vào SecurityContextHolder    thời hạn hợp lệ
       └──► Không: Tiếp tục chuỗi filter (với AnonymousUser)
       │
       ▼
[AuthorizationFilter] ──(Kiểm tra @PreAuthorize hoặc AntMatchers)
       ├── Public: /api/books/**, /api/auth/**, /api/health ──► Cho phép
       ├── Customer: /api/cart/**, /api/orders/** ──────────────► Yêu cầu Authenticated
       └── Admin/Staff: /api/admin/**, POST /api/books ────────► Yêu cầu ROLE_ADMIN / ROLE_STAFF
```

1. **Mã hóa mật khẩu:** Sử dụng `BCryptPasswordEncoder` với salt tự động, độ bền bỉ cao chống tấn công từ điển và rainbow tables.
2. **Không lưu trữ phiên (Stateless Session):** Backend hoàn toàn vô trạng thái (`SessionCreationPolicy.STATELESS`), dễ dàng mở rộng theo chiều ngang (Horizontal Scaling).
3. **Chống tấn công leo thang quyền (Privilege Escalation):** API công khai `/api/auth/register` bị cố định cứng chỉ cấp `ROLE_CUSTOMER`. Quyền `ROLE_ADMIN` chỉ được phân bổ bởi Quản trị viên cấp cao trong Database.
4. **Bảo vệ tài nguyên cá nhân (Data Ownership):** Khách hàng chỉ được đọc/ghi giỏ hàng và đơn hàng của chính tài khoản mình. Mọi hành vi sửa/xóa ID của người khác đều bị chặn với mã `403 Forbidden`.

---

### 2.3. Quản Lý Giao Dịch & Nhất Quán Dữ Liệu (ACID Transaction)

Trong quy trình đặt hàng (`OrderServiceImpl.createOrder`):
1. **Cô lập giao dịch:** Đánh dấu `@Transactional(rollbackFor = Exception.class)`.
2. **Snapshot giá và tên sách:** Lưu lại tên sách và đơn giá tại thời điểm người mua chốt đơn vào bảng `order_items`. Đảm bảo giá trị đơn hàng trong quá khứ không bị sai lệch nếu sau này giá bìa sách được cập nhật.
3. **Trừ kho an toàn:** Kiểm tra số lượng tồn khả dụng trong `inventory`. Nếu bất kỳ cuốn sách nào thiếu hàng, toàn bộ giao dịch lập tức Rollback, không phát sinh đơn hàng rác.
4. **Ghi nhật ký kho:** Mỗi lần xuất kho đều tạo bản ghi tương ứng trong `inventory_transactions` với loại `SALE`. Khi đơn bị hủy, hệ thống hoàn kho với loại `CANCEL_RETURN`.
5. **Cơ chế Idempotency chống đơn trùng:** Bảng `orders` có ràng buộc duy nhất trên `order_number`. Client gửi `Idempotency-Key` để tránh trường hợp người dùng click nút "Đặt hàng" nhiều lần hoặc mạng chập chờn gửi lại request.

---

### 2.4. Module Thanh Toán & Vận Chuyển: Phân Định Ranh Giới

```
                 ┌──────────────────────────────────────────────────┐
                 │       Thanh Toán (Payment Integration)           │
                 ├──────────────────────────────────────────────────┤
                 │ - Môi trường: VNPay Sandbox Thử Nghiệm           │
                 │ - Thuật toán: HMAC-SHA512 bảo mật                │
                 │ - Idempotency Callback: Xử lý callback lặp lại   │
                 │ - Tuân thủ PCI-DSS: Tuyệt đối KHÔNG LƯU số thẻ,  │
                 │   ngày hết hạn hoặc CVV trên máy chủ             │
                 └──────────────────────────────────────────────────┘

                 ┌──────────────────────────────────────────────────┐
                 │       Vận Chuyển (Shipping Integration)          │
                 ├──────────────────────────────────────────────────┤
                 │ - Thiết kế: Adapter Pattern (Khung tích hợp)     │
                 │ - Hãng chuyển phát: Giao Hàng Nhanh (GHN)        │
                 │ - Tính trung thực dữ liệu: KHÔNG TẠO MÃ GIẢ LẬP. │
                 │   Khi chưa có API credentials của doanh nghiệp,  │
                 │   trackingNumber để null và trạng thái là PENDING│
                 └──────────────────────────────────────────────────┘
```

---

## 3. Thiết Kế Frontend (React 19 + TypeScript + Vite)

### 3.1. Phân Tách Tầng Giao Diện & Điều Hướng
- **Storefront (Khách hàng):** Duyệt danh mục sách, tìm kiếm thời gian thực, chi tiết sách, đánh giá, giỏ hàng, checkout và nhận kết quả VNPay.
- **Admin Portal (Quản trị):** Dashboard KPI doanh thu, quản lý sách, đơn hàng, tồn kho, mã giảm giá và kiểm duyệt đánh giá.
- **Route Guarding:** Thành phần `ProtectedRoute` kiểm tra vai trò người dùng trong JWT, tự động điều hướng người không đủ quyền về trang đăng nhập hoặc báo lỗi 403.

### 3.2. Quản Lý Trạng Thái & API Client
- **Axios Interceptor:**
  - *Request Interceptor:* Tự động gắn header `Authorization: Bearer <token>` nếu người dùng đã đăng nhập.
  - *Response Interceptor:* Bắt mã `401 Unauthorized` để tự động dọn dẹp token hết hạn và chuyển về màn hình đăng nhập.
- **Xử lý UX toàn diện:** 
  - Hiển thị Skeleton Loading khi đang chờ dữ liệu API.
  - Hiển thị Empty State kèm thông điệp thân thiện và nút hành động khi danh sách rỗng.
  - Hiển thị Error State có nút "Thử lại" khi mạng gặp sự cố.
