# HƯỚNG DẪN TÍCH HỢP TÍNH NĂNG NÂNG CAO NOVELIA BOOKS

Tài liệu này cung cấp chi tiết kiến trúc, quy tắc nghiệp vụ, cơ chế bảo mật và hướng dẫn vận hành cho 4 module nâng cao của hệ thống **NOVELIA BOOKS**:
1. **Mã giảm giá & Phiếu ưu đãi (Coupons & Discounts)**
2. **Đánh giá sách & Kiểm duyệt nội dung (Reviews & Moderation)**
3. **Module tích hợp Cổng thanh toán (Payment Gateway Framework - VNPay)**
4. **Module tích hợp Đơn vị vận chuyển (Shipping Carrier Framework - Giao Hàng Nhanh)**

---

## 1. Module Mã Giảm Giá & Phiếu Ưu Đãi (Coupon / Voucher)

### 1.1. Nguyên Tắc Nghiệp Vụ
- **Loại ưu đãi hỗ trợ**:
  - `PERCENTAGE`: Giảm theo phần trăm (Ví dụ: 10%, 20%). Có thể thiết lập trần tối đa `maxDiscountAmount` để kiểm soát ngân sách khuyến mãi (Ví dụ: Giảm 10% tối đa 50.000đ).
  - `FIXED_AMOUNT`: Giảm trừ trực tiếp số tiền cố định (Ví dụ: Giảm 50.000đ). Số tiền giảm không vượt quá tổng giá trị đơn hàng.
- **Ràng buộc & Điều kiện**:
  - `minOrderValue`: Giá trị đơn hàng tối thiểu bắt buộc để áp dụng mã.
  - `startDate` & `endDate`: Khung thời gian hiệu lực (hệ thống tự động từ chối nếu chưa tới ngày bắt đầu hoặc đã quá hạn kết thúc).
  - `usageLimit` & `usedCount`: Giới hạn tổng số lượt sử dụng của mã trên toàn hệ thống.
  - `isActive`: Cờ bật/tắt thủ công nhanh từ Quản trị viên.
- **Xử lý giao dịch an toàn (Concurrency & Integrity)**:
  - Khi khách hàng kiểm tra mã tại trang Checkout: Hệ thống chỉ tính toán thử nghiệm (read-only validation), không tăng `usedCount`.
  - Khi khách hàng bấm **Xác Nhận Đặt Hàng**: Số tiền giảm được tính lại trực tiếp ở Backend, lưu snapshot `discountAmount` và `couponCode` vào `orders` table, đồng thời tăng `usedCount` trong cùng một transaction.
  - Nếu mã giảm giá đã được sử dụng trong ít nhất một đơn hàng lịch sử, thao tác xóa từ Admin sẽ tự động chuyển thành **vô hiệu hóa mềm (`isActive = false`)** nhằm bảo toàn tính toàn vẹn của dữ liệu báo cáo kế toán.

### 1.2. Danh Sách Mã Ưu Đãi Mẫu Trong Hệ Thống
- `NOVELIA10`: Giảm 10% (Tối đa 50.000đ) cho đơn hàng từ 200.000đ.
- `NOVELIA50K`: Giảm 50.000đ trực tiếp cho đơn hàng từ 350.000đ.
- `VIPBOOK20`: Giảm 20% (Tối đa 150.000đ) cho đơn hàng từ 500.000đ.

---

## 2. Module Đánh Giá Sách & Kiểm Duyệt Nội Dung (Review & Moderation)

### 2.1. Quy Trình Kiểm Duyệt (Moderation Workflow)
```
[Độc giả gửi đánh giá] ──> [Trạng thái PENDING] ──> [Admin/Staff duyệt]
                                                          │
                                     ┌────────────────────┴────────────────────┐
                                     ▼                                         ▼
                              [Trạng thái APPROVED]                   [Trạng thái REJECTED]
                         (Hiển thị công khai trên web,           (Ẩn khỏi web, lưu trữ lý do
                           cộng vào điểm trung bình)               từ chối để kiểm toán)
```
1. **Gửi đánh giá**:
   - Chỉ người dùng đã đăng nhập mới được gửi đánh giá cho tác phẩm.
   - Thang điểm: 1 đến 5 sao. Bình luận: 10 đến 2000 ký tự.
   - Khi độc giả gửi hoặc chỉnh sửa đánh giá, trạng thái được thiết lập l�### 3.1. Thiết Kế Kiến Trúc & Bảo Mật PCI-DSS
- **Bảo mật thông tin thẻ nhạy cảm**: Hệ thống NOVELIA BOOKS **tuyệt đối không bao giờ yêu cầu hay lưu trữ** số thẻ tín dụng, ngày hết hạn, mã CVV/CVC của khách hàng trên cơ sở dữ liệu. Toàn bộ thao tác nhập thẻ hoặc quét mã QR được thực hiện trên hạ tầng bảo mật đạt chứng chỉ quốc tế PCI-DSS của VNPay.
- **Thuật toán chữ ký số**: Tuân thủ chuẩn tài liệu chính thức của VNPay:
  - Sắp xếp các tham số bắt đầu bằng `vnp_` theo thứ tự bảng chữ cái (Alphabetical order).
  - Sử dụng thuật toán băm **HMAC-SHA512** với Secret Key bí mật để sinh mã kiểm tra toàn vẹn `vnp_SecureHash`.
- **Cơ chế chống giao dịch trùng & Webhook Retry (Idempotency)**:
  - Trong thanh toán trực tuyến, nhà cung cấp cổng thanh toán có thể gửi lại callback/IPN nhiều lần do mạng chập chờn (Network Retry).
  - Khi nhận callback hoặc IPN, hệ thống kiểm tra trạng thái đơn hàng và bản ghi `Payment`:
    - Nếu đơn đã ở trạng thái `PAID`, hệ thống ngay lập tức ghi nhận `isDuplicateRetry = true` (hoặc phản hồi `RspCode: 02` Order already confirmed) và trả về phản hồi thành công mà **không thực hiện cập nhật lặp lại, không hoàn kho hay trừ kho lần hai**.
- **Chống can thiệp dữ liệu đường truyền**:
  - Hệ thống tính toán lại hash từ các tham số nhận được. Nếu chữ ký không trùng khớp (`calculatedHash != vnp_SecureHash`), hệ thống ngay lập tức từ chối và ghi log cảnh báo nghi vấn giả mạo (`RspCode: 97`).
- **Endpoint IPN Server-to-Server chuẩn VNPay (`GET /api/payment/vnpay-ipn`)**:
  - Phản hồi trực tiếp JSON mã trạng thái:
    - `{"RspCode":"00","Message":"Confirm Success"}`: Xác nhận thành công.
    - `{"RspCode":"01","Message":"Order not found"}`: Không tìm thấy đơn hàng.
    - `{"RspCode":"02","Message":"Order already confirmed"}`: Đơn đã được xác nhận trước đó (Idempotency).
    - `{"RspCode":"04","Message":"Invalid Amount"}`: Số tiền không khớp.
    - `{"RspCode":"97","Message":"Invalid Checksum"}`: Sai chữ ký bảo mật.

### 3.2. Cấu Hình Sandbox & Hướng Dẫn Chuyển Sang Live Production
Hệ thống được cấu hình trong `application.yml`:
```yaml
novelia:
  payment:
    vnpay:
      tmn-code: ${VNPAY_TMN_CODE:NOVELIA1}
      hash-secret: ${VNPAY_HASH_SECRET:NOVELIASECRETKEYVNPAY2026TESTSANDBOX}
      payment-url: ${VNPAY_PAYMENT_URL:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}
      return-url: ${VNPAY_RETURN_URL:http://localhost:5173/payment/vnpay-callback}
      sandbox-mode: true
      live-credentials-configured: false
      connection-timeout-ms: 5000
      read-timeout-ms: 10000
```

> [!NOTE]
> **Khung Tích Hợp (Integration Framework)**: Do dự án hiện tại đang trong môi trường phát triển học thuật/thử nghiệm, hệ thống mặc định chạy ở chế độ **Sandbox Gateway**. Khi quý khách hàng ký hợp đồng thương mại chính thức với Công ty Cổ phần Giải pháp Thanh toán Việt Nam (VNPAY), chỉ cần cấu hình lại các biến môi trường `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, và `VNPAY_PAYMENT_URL=https://vnpayment.vn/paymentv2/vpcpay.html` mà không cần thay đổi bất kỳ dòng mã nguồn nào.

---

## 4. Module Tích Hợp Đơn Vị Vận Chuyển (Shipping Carrier Framework)

### 4.1. Nguyên Tắc Nghiệp Vụ & Tính Trung Thực Của Dữ Liệu
- **Tuyệt đối không tạo mã vận đơn giả**:
  - Theo đúng yêu cầu kỹ thuật: Khi hệ thống chưa được cấp API Token và Shop ID thực tế từ đối tác vận chuyển (như Giao Hàng Nhanh - GHN, GHTK, Viettel Post), trường `trackingNumber` trong cơ sở dữ liệu **bắt buộc phải là `null`** hoặc ghi rõ thông báo chờ kết nối.
  - Hệ thống tuyệt đối không tự ý sinh các chuỗi ngẫu nhiên (như `GHN123456789`) để hiển thị như dữ liệu thật cho người dùng.
- **Khung tích hợp Giao Hàng Nhanh (GHN)**:
  - Bản ghi `Shipment` được khởi tạo với trạng thái `PENDING` và ghi chú rõ: *"Khung chuẩn bị tích hợp GHN: Đang chờ cấu hình Live API Token và Shop ID từ nhà vận chuyển. Chưa tạo mã vận đơn để bảo đảm tính trung thực của dữ liệu."*
  - Hỗ trợ nhân viên vận hành cập nhật trạng thái thủ công (`PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `FAILED_ATTEMPT`, `RETURNED`) và tự động đồng bộ trạng thái đơn hàng khi giao thành công.
- **Tính cước vận chuyển linh hoạt (`POST /api/shipments/calculate-fee`)**:
  - Tự động áp dụng chính sách **Freeship toàn quốc** cho đơn hàng sách từ 500.000 VNĐ.
  - Nếu có Live Token GHN: Gọi API cước trực tiếp từ GHN `/shipping-order/fee`.
  - Nếu ở chế độ chuẩn bị / fallback: Tính cước theo biểu phí tiêu chuẩn sách (nội thành Hà Nội/TP.HCM 25.000 VNĐ, liên tỉnh 35.000 VNĐ kèm phụ phí trọng lượng vượt).
- **Đồng bộ trạng thái qua Webhook GHN (`POST /api/shipments/webhook/ghn`)**:
  - Tiếp nhận thông báo hành trình bưu kiện từ máy chủ GHN.
  - Xác thực token bảo mật `X-Webhook-Token`.
  - Xử lý gửi trùng (Idempotency): Nếu vận đơn đã `DELIVERED`, không cập nhật lặp lại.
  - Tự động đồng bộ `Order.status = DELIVERED` khi giao thành công hoặc `CANCELLED` khi đơn bị hủy/hoàn trả.
- **Cơ chế Timeout & Retry tự động (`GhnApiClient`)**:
  - Cấu hình Connection Timeout (5.000ms), Read Timeout (10.000ms).
  - Tự động retry tối đa 3 lần với exponential backoff khi gặp sự cố mạng hoặc lỗi máy chủ đối tác.

### 4.2. Cấu Hình Tích Hợp Live Khi Có Credentials
Cấu hình trong `application.yml`:
```yaml
novelia:
  shipping:
    ghn:
      carrier-name: GiaoHangNhanh
      api-endpoint: https://dev-online-gateway.ghn.vn/shiip/public-api/v2
      api-token: ${GHN_API_TOKEN:}
      shop-id: ${GHN_SHOP_ID:}
      sandbox-mode: true
      connection-timeout-ms: 5000
      read-timeout-ms: 10000
      max-retry-attempts: 3
      retry-backoff-ms: 1000
      webhook-token: ${GHN_WEBHOOK_TOKEN:novelia_ghn_webhook_secret_2026}
```
Khi cấu hình `api-token` và `shop-id`, phương thức `isLiveCredentialsConfigured()` sẽ trả về `true` và hệ thống sẽ gửi request trực tiếp tới API GHN để nhận mã vận đơn thật do bưu cục GHN cấp.

---

## 5. Danh Sách Endpoint REST API Nâng Cao

| Phương thức | Endpoint | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/coupons/validate` | Kiểm tra tính hợp lệ và số tiền giảm của mã ưu đãi | Công khai / Khách hàng |
| `GET` | `/api/coupons/available` | Lấy danh sách các mã ưu đãi đang mở | Công khai |
| `GET` | `/api/admin/coupons` | Quản lý danh sách mã ưu đãi có phân trang | Admin / Staff |
| `POST` | `/api/admin/coupons` | Tạo mới mã ưu đãi | Admin / Staff |
| `PUT` | `/api/admin/coupons/{id}` | Cập nhật thông tin mã ưu đãi | Admin / Staff |
| `PATCH`| `/api/admin/coupons/{id}/toggle` | Bật / Tắt kích hoạt nhanh mã ưu đãi | Admin / Staff |
| `DELETE`| `/api/admin/coupons/{id}` | Xóa hoặc vô hiệu hóa mềm mã ưu đãi | Admin / Staff |
| `GET` | `/api/books/{id}/reviews` | Lấy danh sách đánh giá đã duyệt của sách | Công khai |
| `GET` | `/api/books/{id}/reviews/summary` | Lấy điểm trung bình và phân bổ sao của sách | Công khai |
| `POST` | `/api/books/{id}/reviews` | Độc giả gửi đánh giá (trạng thái `PENDING`) | Đã đăng nhập |
| `GET` | `/api/reviews/my` | Xem danh sách đánh giá của chính mình | Đã đăng nhập |
| `GET` | `/api/admin/reviews` | Xem danh sách đánh giá để kiểm duyệt | Admin / Staff |
| `PUT` | `/api/admin/reviews/{id}/moderate` | Duyệt (`APPROVED`) hoặc Từ chối (`REJECTED`) đánh giá | Admin / Staff |
| `DELETE`| `/api/admin/reviews/{id}` | Xóa bài đánh giá vi phạm | Admin / Staff |
| `POST` | `/api/payment/create-url` | Khởi tạo URL thanh toán VNPay Sandbox | Đã đăng nhập |
| `GET` | `/api/payment/vnpay-callback` | Nhận kết quả và xác thực chữ ký số từ VNPay | Công khai |
| `GET` | `/api/payment/vnpay-ipn` | Webhook IPN Server-to-Server từ máy chủ VNPay | Công khai |
| `POST` | `/api/payment/simulate-success/{orderNumber}` | Mô phỏng thanh toán thành công trong Sandbox | Đã đăng nhập |
| `POST` | `/api/shipments/calculate-fee` | Tính cước vận chuyển ước tính hoặc từ API GHN | Công khai |
| `POST` | `/api/shipments/webhook/ghn` | Tiếp nhận Webhook cập nhật hành trình từ GHN | Công khai (Token bảo mật) |
| `GET` | `/api/shipments/order/{orderId}` | Tra cứu vận chuyển theo đơn hàng | Đã đăng nhập |
| `GET` | `/api/shipments/track/{trackingNumber}` | Tra cứu hành trình theo mã vận đơn | Công khai |
| `GET` | `/api/admin/shipments` | Quản lý tiến trình vận đơn | Admin / Staff |
| `POST` | `/api/admin/shipments` | Khởi tạo tiến trình vận chuyển cho đơn | Admin / Staff |
| `PUT` | `/api/admin/shipments/{id}/status` | Cập nhật trạng thái vận đơn | Admin / Staff |
| `GET` | `/api/admin/audit-logs` | Truy vấn nhật ký kiểm toán hệ thống an ninh | Admin |

---

## 6. Tổng Kết Kiểm Thử Tự Động (Backend & Frontend)

- **Backend**: **162/162 Tests PASS 100%** (`mvn test` exit code 0). Bao gồm các bộ test tích hợp chuyên sâu:
  - [PaymentAndShippingIntegrationTest.java](file:///c:/Users/dangx/OneDrive/Desktop/Đồ%20Án/NOVELIA%20BOOKS/backend/src/test/java/com/novelia/PaymentAndShippingIntegrationTest.java) (15 tests):
    - Khởi tạo link thanh toán VNPay HMAC-SHA512, không lưu thông tin thẻ nhạy cảm (PCI-DSS).
    - Callback hợp lệ cập nhật `PaymentStatus = PAID` và `OrderStatus = CONFIRMED`.
    - Từ chối chữ ký callback giả mạo / tampered (400 Bad Request).
    - Chống xử lý lặp lại callback nhiều lần (Idempotency retry check).
    - Phân biệt trạng thái thanh toán FAILED và giữ nguyên đơn hàng PENDING.
    - VNPay IPN Server-to-Server: thành công (RspCode 00), sai chữ ký (RspCode 97), đã xác nhận trước đó (RspCode 02).
    - Tính cước vận chuyển: chính sách Freeship >= 500k, tính cước nội thành 25k và liên tỉnh 35k.
    - Tuyệt đối không tạo mã vận đơn giả khi thiếu live credentials (`trackingNumber == null`).
    - Chống tạo vận đơn gửi trùng cho cùng đơn hàng (Idempotency).
    - Webhook GHN: Đồng bộ trạng thái DELIVERED sang Order.status, chống xử lý lặp (Idempotency), từ chối webhook sai token.
  - [AdvancedFeaturesTest.java](file:///c:/Users/dangx/OneDrive/Desktop/Đồ%20Án/NOVELIA%20BOOKS/backend/src/test/java/com/novelia/AdvancedFeaturesTest.java) & [PromotionAndReviewApiTest.java](file:///c:/Users/dangx/OneDrive/Desktop/Đồ%20Án/NOVELIA%20BOOKS/backend/src/test/java/com/novelia/PromotionAndReviewApiTest.java): Toàn bộ chức năng mã giảm giá, đánh giá và kiểm duyệt.
  - [AdminSecurityAndAuditLogTest.java](file:///c:/Users/dangx/OneDrive/Desktop/Đồ%20Án/NOVELIA%20BOOKS/backend/src/test/java/com/novelia/AdminSecurityAndAuditLogTest.java): Toàn bộ an ninh quản trị và nhật ký kiểm toán.
- **Frontend**: `npm run build` (`tsc -b && vite build`) hoàn thành thành công 100% trong **1.03s** với **0 lỗi**.
danh sách đánh giá của chính mình | Đã đăng nhập |
| `GET` | `/api/admin/reviews` | Xem danh sách đánh giá để kiểm duyệt | Admin / Staff |
| `PUT` | `/api/admin/reviews/{id}/moderate` | Duyệt (`APPROVED`) hoặc Từ chối (`REJECTED`) đánh giá | Admin / Staff |
| `DELETE`| `/api/admin/reviews/{id}` | Xóa bài đánh giá vi phạm | Admin / Staff |
| `POST` | `/api/payment/create-url` | Khởi tạo URL thanh toán VNPay Sandbox | Đã đăng nhập |
| `GET` | `/api/payment/vnpay-callback` | Nhận kết quả và xác thực chữ ký số từ VNPay | Công khai |
| `POST` | `/api/payment/simulate-success/{orderNumber}` | Mô phỏng thanh toán thành công trong Sandbox | Đã đăng nhập |
| `GET` | `/api/shipments/order/{orderId}` | Tra cứu vận chuyển theo đơn hàng | Đã đăng nhập |
| `GET` | `/api/admin/shipments` | Quản lý tiến trình vận đơn | Admin / Staff |
| `POST` | `/api/admin/shipments` | Khởi tạo tiến trình vận chuyển cho đơn | Admin / Staff |
| `PUT` | `/api/admin/shipments/{id}/status` | Cập nhật trạng thái vận đơn | Admin / Staff |

---

## 6. Tổng Kết Kiểm Thử Tự Động (Backend & Frontend)

- **Backend**: **76/76 Tests PASS 100%** (`mvn test` exit code 0). Bao gồm bộ test tự động [AdvancedFeaturesTest.java](file:///c:/Users/dangx/OneDrive/Desktop/Đồ%20Án/NOVELIA%20BOOKS/backend/src/test/java/com/novelia/AdvancedFeaturesTest.java) kiểm thử:
  - Tính giảm giá %, trần tối đa, điều kiện tối thiểu, hạn dùng, lượt dùng.
  - Kiểm duyệt đánh giá sách, phân quyền Admin/Staff và bảo vệ quyền độc giả.
  - Sinh chữ ký HMAC-SHA512, xác thực callback VNPay, từ chối chữ ký giả mạo, chống giao dịch trùng (Idempotency).
  - Xác nhận khung vận chuyển GHN không tạo mã vận đơn giả khi chưa có live credentials.
- **Frontend**: `npm run build` (`tsc -b && vite build`) hoàn thành thành công 100% với **0 lỗi**.
