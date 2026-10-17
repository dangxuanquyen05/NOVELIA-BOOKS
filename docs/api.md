# Tài Liệu Đặc Tả Kỹ Thuật RESTful API NOVELIA BOOKS

---

## 1. Chuẩn Thiết Kế & Định Dạng Phản Hồi

Tất cả các API của NOVELIA BOOKS tuân thủ chuẩn RESTful, giao tiếp qua định dạng JSON với cấu trúc phản hồi `ApiResponse<T>` thống nhất:

### Phản hồi thành công (HTTP 200, 201)
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-10-16T22:30:00"
}
```

### Phản hồi lỗi (HTTP 400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "message": "Mô tả chi tiết nguyên nhân lỗi",
  "data": null,
  "timestamp": "2026-10-16T22:30:00"
}
```

---

## 2. Danh Mục Các Phân Hệ API

### 2.1. Giám Sát & Sức Khỏe Máy Chủ (Health Check)
- **`GET /api/health`**
  - Quyền hạn: Công khai (`permitAll`)
  - Mô tả: Kiểm tra trạng thái máy chủ, phiên bản và thời gian hệ thống.

---

### 2.2. Xác Thực & Phân Quyền (Authentication & RBAC)
- **`POST /api/auth/register`**
  - Quyền hạn: Công khai
  - Body: `{ email, password, fullName, phone }`
  - Ghi chú: Mặc định chỉ cấp `ROLE_CUSTOMER`. Ngăn chặn người dùng tự gán `ROLE_ADMIN`.
- **`POST /api/auth/login`**
  - Quyền hạn: Công khai
  - Body: `{ email, password }`
  - Trả về: `accessToken` (JWT Bearer Token) và thông tin `user` (id, email, fullName, roles).
- **`GET /api/auth/me`**
  - Quyền hạn: `authenticated`
  - Header: `Authorization: Bearer <token>`
  - Trả về: Hồ sơ tài khoản hiện tại.

---

### 2.3. Quản Lý Sách, Tác Giả & Danh Mục (Storefront & Catalog)
- **`GET /api/books`**
  - Quyền hạn: Công khai
  - Query params: `page`, `size`, `keyword`, `categoryId`, `categorySlug`, `minPrice`, `maxPrice`, `sortBy` (`newest`, `price_asc`, `price_desc`, `rating`, `title`).
- **`GET /api/books/{slugOrId}`**
  - Quyền hạn: Công khai
  - Trả về: Chi tiết tác phẩm kèm tác giả, danh mục, số lượng tồn kho khả dụng (`stockQuantity`).
- **`POST /api/books`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Body: `{ title, slug, isbn, coverImage, publisher, publicationYear, pages, originalPrice, salePrice, authorIds, categoryIds, initialStock }`
- **`PUT /api/books/{id}`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
- **`DELETE /api/books/{id}`**
  - Quyền hạn: `ROLE_ADMIN` (Soft delete sang trạng thái `ARCHIVED`).
- **`GET /api/categories`** & **`GET /api/authors`**: Danh sách danh mục và tác giả.

---

### 2.4. Giỏ Hàng Bền Vững (Cart Management)
- **`GET /api/cart`**
  - Quyền hạn: `authenticated`
  - Mô tả: Lấy thông tin giỏ hàng của tài khoản đăng nhập. Tự động xác thực tồn kho khả dụng và đơn giá mới nhất.
- **`POST /api/cart/items`**
  - Quyền hạn: `authenticated`
  - Body: `{ bookId, quantity }`
  - Ràng buộc: `quantity >= 1`, tổng số lượng trong giỏ không vượt quá tồn kho thực tế.
- **`PUT /api/cart/items/{itemId}`**
  - Quyền hạn: `authenticated` (Chỉ chủ sở hữu giỏ hàng).
  - Body: `{ quantity }`
- **`DELETE /api/cart/items/{itemId}`**
  - Quyền hạn: `authenticated` (Xóa cuốn sách khỏi giỏ).
- **`DELETE /api/cart`**
  - Quyền hạn: `authenticated` (Làm trống giỏ hàng).

---

### 2.5. Mã Giảm Giá (Coupons)
- **`GET /api/coupons/available`**
  - Quyền hạn: Công khai
  - Mô tả: Danh sách các mã giảm giá đang kích hoạt, còn hạn sử dụng và còn lượt dùng.
- **`POST /api/coupons/validate`**
  - Quyền hạn: Công khai / `authenticated`
  - Body: `{ code: "NOVELIA10", orderValue: 350000 }`
  - Phản hồi: Xác thực mã hợp lệ, tính toán số tiền được giảm `discountAmount` (theo % có trần hoặc số tiền cố định).
- **`GET /api/admin/coupons`**
  - Quyền hạn: `ROLE_ADMIN`
  - Phân trang, tìm kiếm mã ưu đãi.
- **`POST /api/admin/coupons`**
  - Quyền hạn: `ROLE_ADMIN`
  - Body: `{ code, discountType, discountValue, minOrderValue, maxDiscountAmount, usageLimit, startDate, endDate, isActive }`
- **`PUT /api/admin/coupons/{id}/toggle-active`**
  - Quyền hạn: `ROLE_ADMIN` (Bật / tắt nhanh mã ưu đãi).

---

### 2.6. Quy Trình Đặt Hàng & Quản Lý Đơn (Order Management)
- **`POST /api/orders`**
  - Quyền hạn: `authenticated`
  - Headers: `Idempotency-Key` (chống tạo đơn lặp khi mất mạng / retry).
  - Body:
    ```json
    {
      "receiverName": "Nguyễn Văn Độc Giả",
      "receiverPhone": "0912345678",
      "shippingAddress": "123 Đường Sách, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      "note": "Giao giờ hành chính, bọc carton cẩn thận",
      "paymentMethod": "COD", // hoặc "VNPAY"
      "couponCode": "NOVELIA10" // tùy chọn
    }
    ```
  - Xử lý ACID: Trừ kho ngay lập tức, lưu snapshot tên & giá sách, lưu mã giảm giá, sinh mã đơn `NOV-YYYYMMDD-XXXXXX`.
- **`GET /api/orders/my-orders`**
  - Quyền hạn: `authenticated` (Danh sách đơn của chính người dùng).
- **`GET /api/orders/{orderNumber}`**
  - Quyền hạn: `authenticated` (Chủ đơn hoặc Admin/Staff).
- **`PUT /api/orders/{orderNumber}/cancel`**
  - Quyền hạn: `authenticated`
  - Nghiệp vụ: Chỉ cho phép hủy khi đơn ở trạng thái `PENDING`. Tự động hoàn kho an toàn (`CANCEL_RETURN`).
- **`GET /api/admin/orders`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF` (Lọc theo trạng thái, tìm kiếm theo mã đơn hoặc sđt).
- **`PUT /api/admin/orders/{orderNumber}/status`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Body: `{ newStatus: "CONFIRMED", note: "Xác nhận kho" }`
  - Chuyển đổi trạng thái theo máy trạng thái hữu hạn (FSM: `PENDING` -> `CONFIRMED` -> `SHIPPING` -> `DELIVERED`).

---

### 2.7. Tồn Kho & Quản Lý Kho (Inventory Management)
- **`GET /api/admin/inventory/low-stock`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Trả về: Danh sách sách có tồn kho `<= lowStockThreshold` (mặc định cảnh báo <= 5 cuốn).
- **`GET /api/admin/inventory/transactions/{bookId}`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Trả về: Lịch sử biến động xuất / nhập / hoàn kho.
- **`POST /api/admin/inventory/adjust`**
  - Quyền hạn: `ROLE_ADMIN`
  - Body: `{ bookId, changeQuantity: +20, note: "Nhập sách đợt 2" }`

---

### 2.8. Đánh Giá & Kiểm Duyệt Nhận Xét (Reviews & Moderation)
- **`GET /api/books/{bookId}/reviews`**
  - Quyền hạn: Công khai
  - Trả về: Điểm trung bình, phân bổ sao 1-5, danh sách các nhận xét có trạng thái **`APPROVED`**.
- **`POST /api/books/{bookId}/reviews`**
  - Quyền hạn: `authenticated`
  - Body: `{ rating: 5, comment: "Bìa đẹp, sách chất lượng cao" }`
  - Cơ chế kiểm duyệt: Nhận xét mới lưu ở trạng thái **`PENDING`** (chờ duyệt), chưa hiển thị công khai.
- **`GET /api/admin/reviews`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Query param: `status` (`ALL`, `PENDING`, `APPROVED`, `REJECTED`).
- **`PUT /api/admin/reviews/{id}/moderate`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Body: `{ action: "APPROVE" }` hoặc `{ action: "REJECT", rejectionReason: "Nội dung không phù hợp" }`

---

### 2.9. Tích Hợp Cổng Thanh Toán (VNPay Sandbox)
- **`POST /api/payment/create-url`**
  - Quyền hạn: `authenticated`
  - Body: `{ orderNumber: "NOV-20261016-123456" }`
  - Xử lý: Sinh chuỗi tham số `vnp_*`, băm chữ ký bảo mật **HMAC-SHA512**, trả về đường dẫn URL redirect sang cổng VNPay Sandbox.
- **`GET /api/payment/vnpay-callback`**
  - Quyền hạn: Công khai
  - Tham số: Nhận callback từ VNPay (`vnp_ResponseCode`, `vnp_SecureHash`, `vnp_TxnRef`, ...).
  - Nghiệp vụ: Xác thực tính toàn vẹn chữ ký `HMAC-SHA512`. Đối chiếu số tiền và mã đơn.
  - **Idempotency:** Nếu đơn đã thanh toán trước đó, trả kết quả thành công và không cập nhật trạng thái trùng.
- **`POST /api/payment/simulate-success/{orderNumber}`**
  - Quyền hạn: `ROLE_ADMIN` hoặc hỗ trợ kiểm thử đồ án khi không truy cập Internet.

---

### 2.10. Tích Hợp Đơn Vị Vận Chuyển (GHN Integration Framework)
- **`GET /api/shipments/order/{orderId}`**
  - Quyền hạn: `authenticated`
  - Trả về: Thông tin vận chuyển, mã vận đơn (`trackingNumber`), nhà vận chuyển (`GiaoHangNhanh`).
- **`POST /api/admin/shipments/create-ghn-order`**
  - Quyền hạn: `ROLE_ADMIN`, `ROLE_STAFF`
  - Ràng buộc trung thực dữ liệu: Khung tích hợp chuẩn bị sẵn cấu trúc payload đẩy lên GHN API. Nếu chưa cấu hình Live Token của doanh nghiệp, trường `trackingNumber` là `null`, `liveCarrierConnected = false`, không sinh mã vận đơn giả lập.

---

### 2.11. Báo Cáo & Thống Kê Quản Trị (Admin Dashboard)
- **`GET /api/admin/dashboard-stats`**
  - Quyền hạn: `ROLE_ADMIN`
  - Trả về dữ liệu thực tế từ Database:
    - Tổng doanh thu (chỉ tính các đơn `DELIVERED`, hoặc có thanh toán `PAID`).
    - Tổng số đơn hàng và phân bổ theo từng trạng thái.
    - Tổng số đầu sách và số khách hàng đăng ký.
    - Danh sách các sách bán chạy nhất (Best Sellers) theo số lượng đã bán thực tế.
    - Biểu đồ doanh thu 7 ngày gần nhất.
    - Danh sách các đơn hàng mới nhất cần xử lý.
