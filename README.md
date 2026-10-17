# 📚 NOVELIA BOOKS — Nền Tảng Thương Mại Điện Tử Sách Trực Tuyến Tinh Hoa

> **Đồ Án Tốt Nghiệp / Niên Luận Chuyên Ngành Kỹ Thuật Phần Mềm & Khoa Học Máy Tính**  
> Hệ thống thương mại điện tử chuyên biệt cho sách cao cấp, văn học tuyển chọn và ấn bản nghệ thuật. Xây dựng theo kiến trúc hiện đại phân tách Client-Server (Decoupled Architecture), chú trọng bảo mật, toàn vẹn dữ liệu giao dịch và trải nghiệm người dùng cao cấp.

---

## 🏛 1. Kiến Trúc & Công Nghệ

| Thành phần | Công nghệ chính | Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.4.x | RESTful API, Spring Security 6 (JWT Bearer), Spring Data JPA, Hibernate, Bean Validation, HikariCP |
| **Frontend** | React 19, TypeScript 5, Vite | Single Page Application (SPA), Tailwind CSS, React Router v7, Axios Interceptors, Lucide Icons |
| **Database** | MySQL 8.0+ | InnoDB Engine, `utf8mb4_unicode_ci`, Foreign Keys, Check Constraints, B-Tree Indexes |
| **Tích hợp mở rộng** | Payment & Shipping Adapters | VNPay Sandbox (HMAC-SHA512 Checksum), GHN Carrier Integration Framework (Adapter Pattern) |
| **Testing** | JUnit 5, Mockito, MockMvc, H2 | 162/162 Unit & Integration Tests đạt 100% tỷ lệ vượt qua |

---

## 📁 2. Cấu Trúc Thư Mục Dự Án

```
NOVELIA-BOOKS/
├── backend/                               # Máy chủ RESTful API (Spring Boot 3)
│   ├── src/main/java/com/novelia/
│   │   ├── admin/                         # API Thống kê & Quản trị tổng thể
│   │   ├── author/                        # Quản lý tác giả sách
│   │   ├── book/                          # Quản lý sách, tìm kiếm, lọc, phân trang
│   │   ├── cart/                          # Quản lý giỏ hàng bền vững
│   │   ├── category/                      # Danh mục sách phân cấp cha-con
│   │   ├── common/                        # DTO chung (ApiResponse), GlobalExceptionHandler
│   │   ├── config/                        # SecurityConfig, CORS, DataSeeder
│   │   ├── coupon/                        # Mã giảm giá (Phần trăm, Số tiền, Hạn mức)
│   │   ├── inventory/                     # Quản lý tồn kho & Nhật ký biến động kho
│   │   ├── order/                         # Đặt hàng, snapshot giá, chuyển trạng thái
│   │   ├── payment/                       # Module tích hợp thanh toán (VNPay Sandbox)
│   │   ├── review/                        # Đánh giá sách & Kiểm duyệt đánh giá
│   │   ├── shipment/                      # Khung tích hợp đơn vị vận chuyển (GHN)
│   │   └── user/                          # Xác thực (Auth), Người dùng & Địa chỉ
│   ├── src/test/java/com/novelia/         # 162 Unit & Integration tests (16 test suites)
│   ├── src/main/resources/
│   │   └── application.yml                # Cấu hình Datasource, JPA, JWT, VNPay, GHN
│   └── pom.xml                            # Quản lý thư viện Maven
├── frontend/                              # Giao diện người dùng (React + TypeScript)
│   ├── src/
│   │   ├── components/                    # UI Components (Header, Footer, Modals, EmptyState)
│   │   ├── context/                       # AuthContext, CartContext
│   │   ├── pages/
│   │   │   ├── admin/                     # Quản trị (Dashboard, Books, Orders, Inventory, Coupons, Reviews)
│   │   │   ├── customer/                  # Hồ sơ người dùng, Sổ địa chỉ, Lịch sử đơn hàng
│   │   │   └── storefront/                # Trang chủ, Chi tiết sách, Giỏ hàng, Checkout, VNPay Callback
│   │   ├── services/                      # Axios API Services có Interceptors
│   │   └── types/                         # TypeScript interfaces (Book, Order, User, Coupon, Review, ...)
│   ├── package.json
│   └── vite.config.ts
├── database/
│   └── schema.sql                         # Kịch bản DDL tạo bảng, ràng buộc & index hoàn chỉnh
├── docs/                                  # Tài liệu chi tiết phục vụ báo cáo & bảo vệ đồ án
│   ├── architecture.md                    # Tài liệu thiết kế kiến trúc hệ thống
│   ├── database.md                        # Thiết kế CSDL, ERD Mermaid & Chiến lược Indexing
│   ├── api.md                             # Quy chuẩn REST API và danh mục Endpoints
│   ├── demo_guide.md                      # Kịch bản luồng demo thực tế từng bước
│   └── defense_qa.md                      # Cẩm nang 50+ câu hỏi vấn đáp bảo vệ đồ án
├── INTEGRATION_GUIDE.md                   # Hướng dẫn chi tiết cổng thanh toán & vận chuyển
└── README.md                              # Tài liệu hướng dẫn cài đặt & tổng quan
```

---

## 🚀 3. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu tiên quyết (Prerequisites)
- **Java Development Kit (JDK):** Phiên bản 21 trở lên (`java -version`).
- **Apache Maven:** Phiên bản 3.8+ (`mvn -version`).
- **Node.js:** Phiên bản 18+ hoặc 20+ LTS (`node -v`).
- **MySQL Server:** Phiên bản 8.0+ đang chạy trên cổng mặc định `3306`.

---

### Bước 1: Thiết lập Cơ sở dữ liệu MySQL
1. Mở MySQL Workbench hoặc terminal MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS novelia_books
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```
2. *(Tùy chọn)* Bạn có thể chạy tập lệnh `database/schema.sql` để tạo sẵn bảng, hoặc để ứng dụng Spring Boot tự động đồng bộ qua cấu hình JPA.

---

### Bước 2: Cấu hình và Khởi chạy Backend (Spring Boot)
1. Mở cửa sổ dòng lệnh tại thư mục `backend`:
   ```powershell
   cd backend
   ```
2. Thiết lập thông tin đăng nhập MySQL thông qua biến môi trường (hoặc chỉnh trực tiếp trong `application.yml`):
   ```powershell
   $env:DB_USERNAME="root"
   $env:DB_PASSWORD="your_mysql_password"
   ```
3. Chạy toàn bộ kiểm thử tự động (sử dụng H2 in-memory độc lập, an toàn):
   ```powershell
   mvn clean test
   ```
   *(Kết quả: 162 tests đạt `BUILD SUCCESS`)*
4. Khởi chạy ứng dụng:
   ```powershell
   mvn spring-boot:run
   ```
   Ứng dụng khởi động trên cổng: **`http://localhost:8080`**.
   Khi khởi động lần đầu, `DataSeeder` sẽ tự động khởi tạo dữ liệu mẫu (vai trò, quản trị viên, người dùng, sách chọn lọc, mã giảm giá, đánh giá).
5. Kiểm tra trạng thái máy chủ:
   - Endpoint: `GET http://localhost:8080/api/health`

---

### Bước 3: Cài đặt và Khởi chạy Frontend (React + Vite)
1. Mở cửa sổ dòng lệnh tại thư mục `frontend`:
   ```powershell
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```powershell
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Dev Server):
   ```powershell
   npm run dev
   ```
   Truy cập giao diện tại: **`http://localhost:5173`**.
4. Kiểm tra Typecheck và Đóng gói Production:
   ```powershell
   npm run build
   ```
   *(Biên dịch 0 lỗi TypeScript, tạo thư mục `dist/` hoàn tất)*

---

## 👥 4. Tài Khoản Thử Nghiệm & Hướng Dẫn Tạo Admin

Hệ thống đã nạp sẵn các tài khoản demo an toàn thông qua `DataSeeder`:

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@noveliabooks.vn` | `AdminPass123!` | Toàn quyền Dashboard, Quản lý Sách, Đơn hàng, Tồn kho, Mã ưu đãi, Kiểm duyệt đánh giá |
| **Độc giả mẫu (Customer)** | `reader1@noveliabooks.vn` | `Password123!` | Mua sách, Giỏ hàng, Áp dụng Voucher, Đặt hàng, Gửi đánh giá sách |

### Hướng Dẫn Tạo Thêm Tài Khoản Admin

#### Cách 1: Tự động qua Backend DataSeeder (Khuyên dùng)
Hệ thống tự động kiểm tra sự tồn tại của `admin@noveliabooks.vn` mỗi khi ứng dụng khởi chạy. Nếu chưa có, tài khoản sẽ được tạo với mật khẩu mã hóa BCrypt chuẩn.

#### Cách 2: Tạo thủ công trực tiếp bằng câu lệnh SQL an toàn
Do mật khẩu bắt buộc phải được mã hóa bằng chuẩn `BCrypt` (độ mạnh 10 rounds), chuỗi hash hợp lệ tương ứng với mật khẩu `AdminPass123!` là:
`$2a$10$wT0XkL4vFjPqX2qWjLqgDe.yv4yqVj7u8hO6rI5qM8aQ8qL0vI8eW`

Thực hiện các câu lệnh SQL sau trong CSDL `novelia_books`:
```sql
-- 1. Thêm bản ghi người dùng mới
INSERT INTO users (email, password_hash, full_name, phone, status, created_at, updated_at)
VALUES ('newadmin@noveliabooks.vn', 
        '$2a$10$wT0XkL4vFjPqX2qWjLqgDe.yv4yqVj7u8hO6rI5qM8aQ8qL0vI8eW', 
        'Quản Trị Viên Mới', 
        '0909999888', 
        'ACTIVE', 
        NOW(), NOW());

-- 2. Gán quyền ROLE_ADMIN và ROLE_STAFF
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'newadmin@noveliabooks.vn' 
  AND r.name IN ('ROLE_ADMIN', 'ROLE_STAFF');
```
*Lưu ý: API đăng ký công khai `/api/auth/register` được bảo vệ nghiêm ngặt, mặc định chỉ cấp `ROLE_CUSTOMER`, không cho phép người dùng tự leo thang đặc quyền.*

---

## 🎁 5. Dữ Liệu Mã Giảm Giá Sẵn Có Để Demo

| Mã Coupon | Loại giảm giá | Giá trị giảm | Đơn tối thiểu | Giảm tối đa | Hạn mức sử dụng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NOVELIA10` | Phần trăm | 10% | 200.000 đ | 50.000 đ | 100 lượt (Đã dùng 5) |
| `NOVELIA50K`| Số tiền cố định | 50.000 đ | 350.000 đ | 50.000 đ | 50 lượt (Đã dùng 2) |
| `VIPBOOK20` | Phần trăm | 20% | 500.000 đ | 150.000 đ | 20 lượt (Đã dùng 0) |

---

## 📊 6. Ma Trận Tính Năng Đã Hoàn Thành & Phạm Vi Tích Hợp

| Nhóm chức năng | Tình trạng | Chi tiết kỹ thuật |
| :--- | :---: | :--- |
| **Xác thực & Phân quyền (RBAC)** | ✅ 100% | Đăng ký, đăng nhập JWT Bearer, phân quyền 3 cấp (CUSTOMER, STAFF, ADMIN), chặn leo thang quyền. |
| **Quản lý Sách & Danh mục** | ✅ 100% | Tìm kiếm keyword, lọc đa tiêu chí (danh mục, khoảng giá), sắp xếp, phân trang server-side, CRUD sách/tác giả/danh mục. |
| **Giỏ Hàng & Tồn Kho** | ✅ 100% | Lưu giỏ hàng theo user trong DB, xác minh giá và tồn kho thời gian thực, chống mua vượt kho khả dụng. |
| **Quy trình Đặt Hàng & Checkout** | ✅ 100% | Chọn địa chỉ, snapshot giá thời điểm mua, giao dịch ACID trừ kho, sinh mã đơn `NOV-YYYYMMDD-XXXXXX`. |
| **Mã Giảm Giá (Coupon)** | ✅ 100% | Giảm % kèm trần tối đa, giảm tiền mặt, kiểm tra đơn tối thiểu, hạn sử dụng và giới hạn lượt dùng an toàn. |
| **Đánh giá & Kiểm duyệt (Reviews)** | ✅ 100% | Chấm điểm 1-5 sao, nhận xét. Cơ chế kiểm duyệt (Chờ duyệt -> Duyệt/Từ chối kèm lý do). Tính phân bổ sao. |
| **Quản trị & Báo cáo (Admin Portal)**| ✅ 100% | Dashboard thống kê doanh thu thực, biểu đồ, đơn hàng gần đây, cảnh báo kho thấp, cập nhật trạng thái đơn chuẩn FSM. |
| **Cổng Thanh Toán Trực Tuyến** | ⚠️ Sandbox | Tích hợp VNPay qua chữ ký bảo mật HMAC-SHA512 chuẩn kỹ thuật; xử lý Callback, Idempotency chống retry trùng đơn. *Chạy trên môi trường VNPay Sandbox thử nghiệm; không lưu số thẻ nhạy cảm tuân thủ PCI-DSS.* |
| **Đơn vị Vận Chuyển** | ⚠️ Framework | Thiết kế kiến trúc Adapter cho Giao Hàng Nhanh (GHN). *Tuyệt đối không sinh mã vận đơn giả lập khi chưa có hợp đồng & API token doanh nghiệp thật.* |

---

## 📖 7. Danh Mục Tài Liệu Báo Cáo Chuyên Sâu

Hệ thống tài liệu đầy đủ phục vụ buổi bảo vệ đồ án được tổ chức tại thư mục `docs/`:

1. [docs/architecture.md](docs/architecture.md) — Kiến trúc tổng thể, sơ đồ khối, phân luồng nghiệp vụ, Transaction Management & Idempotency.
2. [docs/database.md](docs/database.md) — Chi tiết 15 bảng CSDL, quy chuẩn kiểu dữ liệu `DECIMAL`, ERD Mermaid và chiến lược chỉ mục (Indexes).
3. [docs/api.md](docs/api.md) — Tài liệu đặc tả kỹ thuật RESTful API đầy đủ kèm request/response mẫu và mã lỗi HTTP.
4. [docs/demo_guide.md](docs/demo_guide.md) — Kịch bản luồng demo thực tế từng bước (Khách hàng mua sách, áp mã, thanh toán -> Quản trị xử lý đơn, kiểm duyệt review, quản lý kho).
5. [docs/defense_qa.md](docs/defense_qa.md) — Bộ 50 câu hỏi & trả lời vấn đáp bảo vệ đồ án (Java/Spring Boot, React/TypeScript, Database, Security, Nghiệp vụ).
6. [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) — Tài liệu kỹ thuật tích hợp Cổng thanh toán (VNPay) và Đơn vị vận chuyển (GHN).
