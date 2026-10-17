# Kịch Bản Trình Diễn Hệ Thống (Demo Walkthrough Script)
## NOVELIA BOOKS — Nền Tảng Thương Mại Điện Tử Sách Trực Tuyến

> **Mục tiêu:** Hướng dẫn từng bước cho sinh viên/nhóm phát triển thực hiện buổi thuyết trình và demo đồ án mượt mà, khoa học, làm nổi bật toàn bộ các tính năng kỹ thuật cốt lõi trước Hội đồng chấm thi.

---

## 🎯 1. Chuẩn Bị Trước Buổi Demo (Checklist 2 Phút)

1. **Khởi động Backend:** Đảm bảo Spring Boot đang chạy tại cổng `http://localhost:8080`.
2. **Khởi động Frontend:** Đảm bảo Vite Dev Server đang chạy tại cổng `http://localhost:5173`.
3. **Mở sẵn 2 trình duyệt hoặc 2 tab (1 Tab Khách hàng, 1 Tab Ẩn danh cho Admin):**
   - **Tab 1 (Khách hàng):** `http://localhost:5173` (Đăng nhập: `reader1@noveliabooks.vn` / `Password123!`)
   - **Tab 2 (Quản trị viên):** `http://localhost:5173/admin` (Đăng nhập: `admin@noveliabooks.vn` / `AdminPass123!`)

---

## 🛒 PHẦN 1: Luồng Nghiệp Vụ Khách Hàng (Storefront)
*(Thời lượng khuyến nghị: 4 - 5 phút)*

### Bước 1.1: Khám Phá Danh Mục & Bộ Lọc Nâng Cao
- **Thao tác:** 
  1. Tại Trang chủ, giới thiệu giao diện thiết kế sang trọng phong cách nhà sách cao cấp.
  2. Bấm vào trang **Tủ Sách (Books)**.
  3. Thử nghiệm tìm kiếm: Nhập từ khóa `"Na Uy"` hoặc `"Murakami"`. Quan sát danh sách sách cập nhật theo thời gian thực.
  4. Thử nghiệm bộ lọc: Chọn Danh mục *"Văn Học Kinh Điển"*, kéo thanh khoảng giá, chọn sắp xếp *"Giá giảm dần"*.
  5. Giải thích kỹ thuật: *"Các tiêu chí lọc và sắp xếp được đồng bộ trên URL params và truy vấn phân trang trực tiếp từ backend MySQL thông qua Spring Data JPA Specification."*

### Bước 1.2: Chi Tiết Sách & Đánh Giá Độc Giả
- **Thao tác:**
  1. Bấm vào cuốn sách tiêu biểu (ví dụ: *Rừng Na Uy*).
  2. Giới thiệu các thông tin: Tác giả, Nhà xuất bản, Loại bìa, Kích thước, Số trang và **Số lượng tồn kho khả dụng thực tế**.
  3. Cuộn xuống phần **Đánh Giá & Nhận Xét**:
     - Cho Hội đồng xem thanh phân bổ sao (5 sao, 4 sao, ...).
     - Cho xem nhận xét mẫu đã được duyệt (*APPROVED*).
  4. Đăng nhập với tài khoản `reader1@noveliabooks.vn`.
  5. Viết một nhận xét mới: Đánh giá 5 sao + Nhập nội dung: `"Chất lượng sách tuyệt vời, giao nhanh!"` -> Bấm **Gửi Đánh Giá**.
  6. Quan sát thông báo: Thông báo ghi rõ đánh giá đã được gửi và đang ở trạng thái **Chờ kiểm duyệt**, chưa hiển thị công khai ngay để chống spam / ngôn từ không phù hợp.

### Bước 1.3: Giỏ Hàng Bền Vững & Kiểm Soát Tồn Kho
- **Thao tác:**
  1. Chọn số lượng `2` cuốn -> Bấm **Thêm Vào Giỏ Hàng**.
  2. Thử nhập số lượng vượt quá tồn kho thực tế -> Hệ thống hiển thị cảnh báo không cho phép đặt vượt quá số lượng trong kho.
  3. Mở trang **Giỏ Hàng (`/cart`)**:
     - Cho thấy giỏ hàng được lưu theo tài khoản trong CSDL (F5 tải lại trang vẫn giữ nguyên).
     - Thử tăng/giảm số lượng và quan sát tổng tiền tạm tính tự động cập nhật.

### Bước 1.4: Checkout & Áp Dụng Mã Ưu Đãi (Coupon)
- **Thao tác:**
  1. Bấm nút **Tiến Hành Thanh Toán** chuyển sang trang `/checkout`.
  2. Điền thông tin giao hàng hoặc chọn địa chỉ có sẵn từ Sổ địa chỉ.
  3. Trình diễn hộp **Mã Giảm Giá**:
     - Bấm chọn chip mã có sẵn `NOVELIA10` (Giảm 10% tối đa 50.000đ cho đơn từ 200k).
     - Hệ thống gọi API `/api/coupons/validate`, hiển thị dòng **Giảm giá ưu đãi: -33.600 đ** màu xanh lá và trừ thẳng vào tổng thanh toán.
     - *(Tùy chọn nâng cao)*: Thử nhập một mã không tồn tại để cho thấy thông báo lỗi validation thân thiện từ backend.

### Bước 1.5: Thanh Toán Trực Tuyến VNPay Sandbox
- **Thao tác:**
  1. Chọn phương thức thanh toán **Thanh toán qua VNPay (Sandbox)**.
  2. Bấm **Xác Nhận Đặt Hàng**:
     - Hệ thống sinh mã đơn hàng duy nhất `NOV-YYYYMMDD-XXXXXX`.
     - Chữ ký bảo mật **HMAC-SHA512** được băm từ backend với khóa bí mật.
     - Mở Modal Thanh toán Sandbox VNPay: Bấm nút liên kết chuyển tới trang VNPay Demo hoặc bấm nút "Giả lập Thanh toán thành công (Sandbox Success)".
  3. Hệ thống chuyển tiếp về trang Callback `/payment/vnpay-callback`:
     - Backend tiếp nhận callback, giải mã và đối soát chữ ký điện tử.
     - Hiển thị màn hình thông báo **"Thanh toán thành công"** kèm mã đơn hàng và mã giao dịch.

### Bước 1.6: Lịch Sử Đơn Hàng & Hoàn Kho An Toàn
- **Thao tác:**
  1. Chuyển vào trang **Đơn Hàng Của Tôi** (`/orders`).
  2. Xem chi tiết đơn hàng vừa tạo: Có đủ snapshot tên sách, giá lúc mua, cước vận chuyển, số tiền giảm giá và phương thức thanh toán.
  3. *(Nếu đặt đơn COD thử nghiệm)*: Bấm nút **Hủy Đơn Hàng** -> Hệ thống giải phóng tồn kho an toàn và ghi nhận giao dịch `CANCEL_RETURN` trong bảng nhật ký kho.

---

## 🛡️ PHẦN 2: Luồng Nghiệp Vụ Quản Trị Viên (Admin Portal)
*(Thời lượng khuyến nghị: 4 - 5 phút)*

### Bước 2.1: Admin Dashboard & Thống Kê Thời Gian Thực
- **Thao tác (Chuyển sang Tab Admin):**
  1. Truy cập `http://localhost:5173/admin`.
  2. Giới thiệu các **KPI Cards**: Doanh thu thực tế, Tổng số đơn hàng, Số đầu sách, Khách hàng.
  3. Trình diễn **Biểu đồ Doanh thu 7 ngày gần nhất**.
  4. Trình diễn danh sách **Sách Bán Chạy Nhất (Best Sellers)** được tính từ dữ liệu `order_items` thực trong CSDL.
  5. Trình diễn khối **Cảnh Báo Tồn Kho Thấp** cho phép nhân viên phát hiện các đầu sách sắp hết hàng.

### Bước 2.2: Quản Lý Đơn Hàng & Chuyển Trạng Thái (FSM)
- **Thao tác:**
  1. Vào mục **Đơn Hàng (`/admin/orders`)**.
  2. Tìm kiếm đơn hàng của khách hàng vừa đặt ở Phần 1.
  3. Xem chi tiết đơn hàng: Địa chỉ, người nhận, chi tiết sản phẩm, trạng thái thanh toán.
  4. Thực hiện chuyển đổi trạng thái:
     - `PENDING` -> Chuyển sang `CONFIRMED` (Xác nhận đơn).
     - `CONFIRMED` -> Chuyển sang `SHIPPING` (Đang giao hàng).
     - `SHIPPING` -> Chuyển sang `DELIVERED` (Đã giao thành công).
  5. Nhấn mạnh quy tắc nghiệp vụ: Hệ thống chặn việc nhảy trạng thái tùy tiện (ví dụ không thể chuyển từ `PENDING` nhảy thẳng sang `DELIVERED`).

### Bước 2.3: Quản Lý Kho & Lịch Sử Biến Động Kho
- **Thao tác:**
  1. Vào mục **Quản Lý Tồn Kho (`/admin/inventory`)**.
  2. Cho Hội đồng xem danh sách tồn kho từng đầu sách.
  3. Bấm vào nút **Xem Lịch Sử Giao Dịch** của cuốn sách vừa bán:
     - Cho thấy dòng ghi nhận loại `SALE` khi khách đặt đơn.
     - Cho thấy số lượng tồn trước và sau biến động khớp 100%.
  4. Thử thực hiện tính năng **Điều chỉnh kho**: Nhập thêm `+10` cuốn kèm ghi chú *"Nhập hàng bổ sung đợt 2"*, bấm Lưu -> Số tồn kho tăng lập tức.

### Bước 2.4: Quản Lý & Cấu Hình Mã Khuyến Mãi (Coupons)
- **Thao tác:**
  1. Vào mục **Mã Ưu Đãi (`/admin/coupons`)**.
  2. Xem danh sách các mã đang hoạt động (`NOVELIA10`, `NOVELIA50K`, `VIPBOOK20`).
  3. Thử bấm nút chuyển đổi trạng thái (Kích hoạt / Tắt kích hoạt) một mã và kiểm tra mã đó không còn áp dụng được nữa.
  4. Mở modal **Thêm Mã Mới**: Thiết lập loại giảm (theo % hoặc số tiền), giá trị giảm, đơn tối thiểu, ngày bắt đầu và kết thúc.

### Bước 2.5: Kiểm Duyệt Đánh Giá Độc Giả (Review Moderation)
- **Thao tác:**
  1. Vào mục **Kiểm Duyệt Đánh Giá (`/admin/reviews`)**.
  2. Bấm vào tab **Chờ Kiểm Duyệt (PENDING)**: Thấy ngay bài đánh giá mà tài khoản khách đã gửi ở Bước 1.2.
  3. Thực hiện hành động:
     - Bấm nút **Phê Duyệt (Approve)**.
  4. Chuyển sang Tab Storefront F5 lại trang chi tiết sách: Bài đánh giá lập tức xuất hiện công khai và điểm sao trung bình của sách được tự động tính toán lại.
  5. *(Tùy chọn)*: Trình diễn tính năng **Từ chối (Reject)** kèm nhập lý do từ chối kiểm duyệt.

### Bước 2.6: Quản Lý Danh Mục, Tác Giả & Tác Phẩm Sách
- **Thao tác:**
  1. Vào mục **Quản Lý Sách (`/admin/books`)**.
  2. Trình bày form Thêm / Sửa thông tin sách với các trường validation chặt chẽ: ISBN hợp lệ, Giá bán `<= Giá bìa`, Số lượng tồn khởi tạo.

---

## 💡 3. Các Điểm Nhấn Công Nghệ Cần Nhấn Mạnh Với Hội Đồng

1. **Tính Toàn Vẹn Tài Chính:** Toàn bộ giá trị tiền tệ sử dụng `BigDecimal(14,2)` và cột `DECIMAL(14,2)` trong MySQL, triệt tiêu hoàn toàn lỗi sai số dấu phẩy động của `double/float`.
2. **Snapshot Lịch Sử:** Đơn hàng lưu bản chụp (snapshot) giá và tựa sách tại thời điểm giao dịch, không bị ảnh hưởng nếu sách đổi giá sau này.
3. **An Toàn Kho Hàng:** Trừ kho trong Transaction ACID; chặn over-selling khi nhiều người cùng đặt; hoàn kho tự động khi hủy đơn.
4. **Bảo Mật Chuẩn Doanh Nghiệp:** Spring Security 6 với JWT Bearer, băm mật khẩu BCrypt, không cho khách tự đăng ký Admin, không bao giờ lưu số thẻ tín dụng hay CVV nhạy cảm trên máy chủ.
5. **Minh Bạch Trong Tích Hợp:** Khẳng định rõ VNPay chạy trên môi trường Sandbox chuẩn chữ ký HMAC-SHA512; GHN được xây dựng theo Adapter Pattern sẵn sàng đấu nối và trung thực không sinh mã vận đơn giả lập.
