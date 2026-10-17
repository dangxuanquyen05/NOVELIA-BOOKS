# Cẩm Nang 50+ Câu Hỏi & Trả Lời Vấn Đáp Bảo Vệ Đồ Án
## Dự Án: NOVELIA BOOKS — Nền Tảng Thương Mại Điện Tử Sách Trực Tuyến

---

## 📌 PHẦN 1: JAVA 21 & SPRING BOOT 3

### Câu 1: Em hãy giải thích mô hình Dependency Injection (DI) và Inversion of Control (IoC) trong Spring Boot? Trong dự án em áp dụng như thế nào?
**Trả lời:**
- **Inversion of Control (IoC):** Là nguyên lý thiết kế chuyển quyền kiểm soát việc khởi tạo, quản lý vòng đời của đối tượng từ lập trình viên sang cho Spring IoC Container.
- **Dependency Injection (DI):** Là mẫu thiết kế cụ thể thực hiện IoC, trong đó các phụ thuộc (dependencies) của một bean được Spring tiêm vào thay vì đối tượng tự dùng toán tử `new`.
- **Trong dự án:** Sử dụng **Constructor Injection** (tiêm qua hàm tạo) cho toàn bộ các Service và Controller (ví dụ: `OrderServiceImpl(OrderRepository, BookRepository, ...)`). Phương pháp này giúp đối tượng trở thành bất biến (`final`), hỗ trợ viết Unit Test dễ dàng bằng cách truyền Mock object mà không phụ thuộc vào context của Spring.

---

### Câu 2: Annotation `@Transactional` hoạt động như thế nào? Nếu có ngoại lệ xảy ra thì xử lý ra sao?
**Trả lời:**
- `@Transactional` hoạt động dựa trên cơ chế **Spring AOP (Aspect-Oriented Programming)** và mô hình Dynamic Proxy. Khi một phương thức được gọi, proxy mở một Transaction kết nối CSDL, thực thi mã nguồn và gọi `commit()` nếu thành công.
- Mặc định Spring chỉ rollback đối với các `RuntimeException` và `Error`, không rollback với `Checked Exception`.
- Trong dự án, em cấu hình rõ ràng `@Transactional(rollbackFor = Exception.class)` trên các phương thức quan trọng như `createOrder`, `cancelOrder`, `adjustInventory` để đảm bảo bất kỳ ngoại lệ nào xảy ra đều khiến toàn bộ thay đổi dữ liệu được Rollback về trạng thái ban đầu, bảo vệ tính toàn vẹn ACID.

---

### Câu 3: Vấn đề N+1 Query trong JPA/Hibernate là gì? Em phòng tránh và xử lý nó như thế nào trong dự án?
**Trả lời:**
- **N+1 Query:** Xảy ra khi lấy danh sách $N$ bản ghi cha (1 query), sau đó Hibernate tiếp tục sinh thêm $N$ câu queries riêng lẻ để nạp dữ liệu cho mối quan hệ con (do thiết lập `FetchType.LAZY` hoặc vòng lặp duyệt đối tượng).
- **Cách xử lý trong dự án:**
  1. Sử dụng từ khóa `JOIN FETCH` trong JPQL repository đối với các truy vấn cần nạp đồng thời cha và con (ví dụ: `SELECT b FROM Book b LEFT JOIN FETCH b.authors`).
  2. Sử dụng `@EntityGraph` khi cần linh hoạt tải dữ liệu liên quan.
  3. Tuyệt đối không trả Entity JPA trực tiếp ra ngoài Controller mà luôn chuyển đổi sang DTO (`BookResponse`, `OrderResponse`), ngắt đứt quan hệ hai chiều gây vòng lặp tuần hoàn (Infinite Circular Reference).

---

### Câu 4: Vì sao em không sử dụng `@RequiredArgsConstructor` của Lombok trong các Service/Controller của dự án?
**Trả lời:**
- Trên môi trường Java 21 và một số phiên bản trình biên dịch `javac` mới nhất, tính năng *Flexible Constructor Bodies (JEP 447)* có thể xung đột với cách Lombok sinh mã byte-code cho `@RequiredArgsConstructor`, dẫn đến cảnh báo hoặc lỗi biên dịch.
- Do đó, việc tự viết Constructor tường minh (`Explicit Constructor`) giúp mã nguồn 100% tuân thủ chuẩn Java thuần, tương thích tuyệt đối với mọi trình biên dịch và CI/CD pipeline mà không phụ thuộc vào bộ xử lý chú thích (Annotation Processor) bên ngoài.

---

### Câu 5: Em hãy nêu sự khác biệt giữa `List`, `Set` và `Map` trong Java Collection? Trong dự án em dùng chúng ở đâu?
**Trả lời:**
- **`List`:** Tập hợp có thứ tự (ordered), cho phép phần tử trùng lặp (ví dụ: danh sách sách phân trang `List<BookResponse>`, danh sách sản phẩm trong giỏ `List<CartItem>`).
- **`Set`:** Tập hợp không có thứ tự, không cho phép phần tử trùng lặp, tìm kiếm phần tử nhanh qua hàm băm (ví dụ: `Set<Role>` trong `User.java` để đảm bảo mỗi người dùng không bị gán trùng một vai trò nhiều lần).
- **`Map`:** Cấu trúc ánh xạ Key-Value, mỗi Key là duy nhất (ví dụ: `Map<String, String>` dùng trong xử lý tham số VNPay hoặc đối soát dữ liệu).

---

## 📌 PHẦN 2: REACT 19 & TYPESCRIPT

### Câu 6: Virtual DOM trong React hoạt động như thế nào? Cơ chế Reconciliation (Diffing Algorithm) là gì?
**Trả lời:**
- **Virtual DOM:** Là một bản sao nhẹ bằng JavaScript của cây DOM thực tế trên trình duyệt.
- Khi state thay đổi, React tạo ra một Virtual DOM mới và so sánh nó với Virtual DOM cũ thông qua thuật toán so khớp (**Reconciliation / Diffing Algorithm**). Thuật toán này có độ phức tạp $O(n)$ bằng cách dựa trên hai giả định:
  1. Hai phần tử khác type sẽ tạo ra các cây DOM khác nhau.
  2. Sử dụng thuộc tính `key` để định danh các phần tử con trong một danh sách, giúp React biết chính xác phần tử nào được thêm, sửa, hay xóa thay vì vẽ lại toàn bộ danh sách.
- Sau khi tìm ra các thay đổi tối thiểu, React áp dụng chúng lên Real DOM trong một đợt cập nhật duy nhất (Batch update).

---

### Câu 7: Vì sao em chọn TypeScript thay vì JavaScript thuần cho dự án frontend?
**Trả lời:**
- **Kiểm tra kiểu tĩnh tại thời điểm biên dịch (Compile-time Type Checking):** Phát hiện lỗi logic, thuộc tính sai hoặc `undefined` trước khi chạy ứng dụng trên trình duyệt.
- **Tự động hoàn thiện mã (Autocomplete/IntelliSense):** Nâng cao hiệu suất code và tránh nhầm lẫn tên trường giữa Frontend và Backend DTOs (ví dụ: kiểu `Book`, `Order`, `Coupon`).
- **Tái cấu trúc mã an toàn (Refactoring):** Khi thay đổi một trường trong interface, IDE sẽ báo đỏ ngay lập tức toàn bộ các component đang sử dụng trường cũ.

---

### Câu 8: Axios Interceptor trong dự án của em giải quyết vấn đề gì?
**Trả lời:**
- Em sử dụng hai loại Interceptors trong `api.ts`:
  1. **Request Interceptor:** Tự động kiểm tra `localStorage`, nếu có `accessToken` thì đính kèm header `Authorization: Bearer <token>` vào mọi yêu cầu gửi lên backend mà không cần viết lặp lại ở từng hàm gọi API.
  2. **Response Interceptor:** Tập trung xử lý lỗi toàn cục. Nếu backend trả về mã `401 Unauthorized` (token hết hạn hoặc giả mạo), interceptor sẽ tự động xóa token và chuyển hướng người dùng về trang `/login`.

---

### Câu 9: Trình bày cách tổ chức State Management trong dự án? Khi nào dùng Context API, khi nào dùng Local State?
**Trả lời:**
- **Local State (`useState`):** Dùng cho các trạng thái cục bộ chỉ một Component cần (dữ liệu nhập form, trạng thái đóng/mở modal, từ khóa tìm kiếm tạm thời).
- **Global State (`Context API`):** Dùng cho các trạng thái cần chia sẻ xuyên suốt toàn bộ ứng dụng:
  - `AuthContext`: Lưu thông tin phiên đăng nhập (`currentUser`, `token`, các quyền `roles`).
  - `CartContext`: Lưu số lượng món đồ trong giỏ hàng để cập nhật Badge giỏ hàng trên thanh Header thời gian thực khi khách bấm "Thêm vào giỏ" ở bất kỳ trang nào.

---

## 📌 PHẦN 3: RESTful API & GIAO THỨC HTTP

### Câu 10: Sự khác biệt giữa phương thức `PUT` và `PATCH`? Tính Idempotent (Bảo toàn trạng thái) là gì?
**Trả lời:**
- **`PUT`:** Dùng để thay thế toàn bộ tài nguyên bằng bản ghi mới. Mang tính chất Idempotent.
- **`PATCH`:** Dùng để cập nhật một phần (partial update) các trường của tài nguyên.
- **Tính Idempotent:** Một phương thức được gọi là Idempotent nếu gọi nó 1 lần hay $N$ lần liên tiếp với cùng dữ liệu đầu vào đều cho ra kết quả trạng thái tài nguyên trên server như nhau.
  - Các method Idempotent: `GET`, `PUT`, `DELETE`.
  - Các method Non-Idempotent: `POST` (mỗi lần gọi có thể tạo ra một bản ghi mới).

---

### Câu 11: Em hãy giải thích các mã trạng thái HTTP (Status Codes) được sử dụng trong dự án?
**Trả lời:**
- `200 OK`: Yêu cầu thành công (truy vấn dữ liệu, cập nhật).
- `201 Created`: Tạo tài nguyên mới thành công (đăng ký tài khoản, tạo sách, tạo đơn hàng).
- `400 Bad Request`: Dữ liệu gửi lên vi phạm validation (ISBN sai định dạng, giá âm, vượt tồn kho).
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ / hết hạn.
- `403 Forbidden`: Đã đăng nhập nhưng không đủ quyền hạn (ví dụ: tài khoản `CUSTOMER` cố tình truy cập API `/api/admin/**`).
- `404 Not Found`: Không tìm thấy tài nguyên (sách, danh mục, đơn hàng không tồn tại).
- `409 Conflict`: Xung đột dữ liệu (email đăng ký đã tồn tại, ISBN trùng lặp).
- `500 Internal Server Error`: Lỗi máy chủ không mong muốn.

---

### Câu 12: Cơ chế CORS (Cross-Origin Resource Sharing) là gì? Vì sao xuất hiện lỗi CORS và cách em giải quyết trong dự án?
**Trả lời:**
- **CORS:** Là chính sách bảo mật của trình duyệt (Same-Origin Policy) nhằm ngăn chặn một trang web ở nguồn gốc này (ví dụ: `http://localhost:5173`) truy xuất tài nguyên từ một nguồn gốc khác (ví dụ: `http://localhost:8080`).
- Khi phát hiện khác Origin, trình duyệt tự động gửi một **Preflight Request** với phương thức `OPTIONS` để hỏi máy chủ xem có cho phép chia sẻ tài nguyên không.
- **Cách giải quyết:** Trong class `SecurityConfig.java`, em cấu hình bean `CorsConfigurationSource`:
  - Khai báo rõ các Origin được phép: `http://localhost:5173`, `http://localhost:3000`.
  - Khai báo các HTTP Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
  - Cho phép gửi kèm Credentials (`allowCredentials = true`) và header `Authorization`.

---

## 📌 PHẦN 4: CƠ SỞ DỮ LIỆU & MYSQL

### Câu 13: Vì sao em sử dụng kiểu dữ liệu `DECIMAL(14,2)` thay vì `FLOAT` hoặc `DOUBLE` để lưu giá tiền?
**Trả lời:**
- Kiểu `FLOAT` và `DOUBLE` lưu trữ số thực theo tiêu chuẩn dấu phẩy động nhị phân IEEE 754. Điều này dẫn đến sai số làm tròn khi thực hiện các phép tính số học (ví dụ: `0.1 + 0.2` trong máy tính có thể ra `0.30000000000000004`).
- Đối với hệ thống thương mại điện tử, sự sai lệch dù chỉ 1 đồng cũng vi phạm tính toàn vẹn tài chính và gây lỗi khi đối soát ngân hàng.
- Kiểu `DECIMAL(14,2)` trong MySQL lưu trữ các chữ số dưới dạng chuỗi byte cố định (Fixed-point arithmetic), kết hợp với `java.math.BigDecimal` trong Java đảm bảo độ chính xác số học tuyệt đối 100%.

---

### Câu 14: Em hãy giải thích tính chất ACID của hệ quản trị cơ sở dữ liệu?
**Trả lời:**
- **A (Atomicity - Tính nguyên tử):** "Tất cả hoặc không gì cả". Trong quy trình tạo đơn, nếu thao tác trừ kho thành công nhưng việc tạo dòng thanh toán bị lỗi, toàn bộ transaction sẽ rollback, không có dữ liệu chắp vá.
- **C (Consistency - Tính nhất quán):** Dữ liệu luôn tuân thủ toàn bộ các ràng buộc toàn vẹn, khóa ngoại và check constraints trước và sau giao dịch.
- **I (Isolation - Tính cô lập):** Các giao dịch diễn ra đồng thời không can thiệp hoặc nhìn thấy trạng thái trung gian của nhau.
- **D (Durability - Tính bền vững):** Một khi giao dịch đã Commit thành công, dữ liệu được ghi cố định vào ổ đĩa và không bị mất ngay cả khi hệ thống sập nguồn.

---

### Câu 15: Chỉ mục (Index) trong MySQL hoạt động theo cấu trúc gì? Khi nào nên và không nên đánh Index?
**Trả lời:**
- Hầu hết các Index trong MySQL InnoDB hoạt động theo cấu trúc **B+Tree**. Cây B+Tree giữ cho dữ liệu luôn được sắp xếp, giúp độ phức tạp của thao tác tìm kiếm giảm từ $O(N)$ (quét toàn bảng) xuống còn $O(\log N)$.
- **Nên đánh Index:**
  - Các cột thường xuyên xuất hiện trong mệnh đề `WHERE`, `JOIN ON`, `ORDER BY` (ví dụ: `email`, `slug`, `order_number`, `book_id`, `created_at`).
  - Các cột có độ chọn lọc cao (Cardinality cao - nhiều giá trị khác nhau).
- **Không nên đánh Index:**
  - Bảng có dữ liệu quá nhỏ (quét bảng còn nhanh hơn duyệt cây index).
  - Cột có độ chọn lọc quá thấp (ví dụ cột chỉ có 2 giá trị `true/false` hoặc `Nam/Nữ`).
  - Bảng có tần suất `INSERT/UPDATE/DELETE` cực kỳ dày đặc vì mỗi lần ghi dữ liệu, MySQL đều phải tính toán lại cây B+Tree, làm giảm hiệu năng ghi.

---

## 📌 PHẦN 5: BẢO MẬT & AN TOÀN THÔNG TIN

### Câu 16: Em hãy trình bày luồng hoạt động của JSON Web Token (JWT)? Vì sao nó được gọi là Stateless?
**Trả lời:**
- **Cấu trúc JWT:** Gồm 3 phần phân cách bởi dấu chấm: `Header.Payload.Signature`.
  - Header: Thuật toán mã hóa (ví dụ: `HS256`).
  - Payload: Chứa thông tin claims (user id, email, danh sách roles, thời điểm hết hạn `exp`).
  - Signature: Chữ ký được sinh ra từ `HMACSHA256(Base64(Header) + "." + Base64(Payload), SecretKey)`.
- **Luồng hoạt động:**
  1. Người dùng gửi email và password lên `/api/auth/login`.
  2. Server xác thực thành công, ký một JWT bằng `SecretKey` và trả về client.
  3. Client lưu token vào `localStorage` và đính kèm vào header các request tiếp theo.
  4. Server chỉ cần dùng `SecretKey` để giải mã và kiểm tra chữ ký của token mà không cần truy vấn bảng session trong database.
- **Stateless:** Server không cần lưu trạng thái phiên đăng nhập trong bộ nhớ RAM hay CSDL, giúp hệ thống mở rộng đa máy chủ (Multi-server / Microservices) cực kỳ dễ dàng.

---

### Câu 17: Hệ thống của em chống tấn công SQL Injection như thế nào?
**Trả lời:**
- Dự án sử dụng **Spring Data JPA** kết hợp **Hibernate**, hoạt động hoàn toàn dựa trên cơ chế **Parameterized Queries (Câu truy vấn tham số hóa / PreparedStatement)**.
- Khi người dùng truyền dữ liệu tìm kiếm (ví dụ keyword chứa ký tự độc hại `' OR '1'='1`), CSDL xử lý giá trị này thuần túy như một chuỗi tham số (literal value) chứ không thông dịch nó như một phần của câu lệnh SQL thực thi.
- Do đó, kẻ tấn công không thể bẻ gãy cấu trúc câu lệnh SQL để truy xuất dữ liệu trái phép.

---

### Câu 18: Vì sao hệ thống không lưu số thẻ tín dụng hoặc mã CVV của khách hàng? Tiêu chuẩn PCI-DSS là gì?
**Trả lời:**
- **Tiêu chuẩn PCI-DSS (Payment Card Industry Data Security Standard):** Là bộ tiêu chuẩn an ninh thông tin bắt buộc đối với các tổ chức xử lý dữ liệu thẻ tín dụng quốc tế (Visa, MasterCard).
- Để tuân thủ PCI-DSS và phòng tránh rủi ro pháp lý cũng như rò rỉ dữ liệu khách hàng khi máy chủ bị tấn công, hệ thống NOVELIA BOOKS **tuyệt đối không bao giờ nhận hay lưu trữ** các thông tin nhạy cảm (Số thẻ 16 số, Ngày hết hạn, Mã bảo mật CVV/CVC) trong cơ sở dữ liệu.
- Thay vào đó, hệ thống ủy quyền toàn bộ quy trình thu thập và xử lý thanh toán cho Cổng thanh toán được cấp phép (VNPay Gateway) thông qua phương thức chuyển hướng an toàn (Secure Redirection).

---

## 📌 PHẦN 6: NGHIỆP VỤ THƯƠNG MẠI ĐIỆN TỬ

### Câu 19: Làm thế nào hệ thống của em giải quyết vấn đề Over-selling (Bán vượt quá số lượng tồn kho khi nhiều người cùng đặt mua tại một thời điểm)?
**Trả lời:**
- Em xử lý ở tầng Service kết hợp Transaction CSDL:
  1. Khi người dùng tạo đơn hàng trong phương thức `@Transactional`, hệ thống kiểm tra số lượng tồn khả dụng:
     `if (book.getInventory().getQuantity() < requestedQuantity) throw new InsufficientStockException();`
  2. Trừ trực tiếp số lượng tồn kho `quantity = quantity - requestedQuantity` và ghi bản ghi `inventory_transactions`.
  3. Ở mức CSDL, trường `quantity` trong bảng `inventory` có ràng buộc kiểm tra số lượng không âm. Nếu hai giao dịch chạy song song cố gắng trừ một cuốn sách chỉ còn 1 bản, giao dịch thứ hai sẽ bị chặn hoặc gặp lỗi hết hàng, đảm bảo số tồn kho không bao giờ bị âm.

---

### Câu 20: Vì sao cần phải lưu Snapshot tên sách và giá sách trong bảng `order_items`?
**Trả lời:**
- Trong thực tế kinh doanh, giá bán của một cuốn sách và thậm chí tựa sách có thể được cập nhật sau này (ví dụ: sách tăng giá từ 100.000đ lên 150.000đ hoặc áp dụng đợt khuyến mãi mới).
- Nếu bảng `order_items` chỉ lưu `book_id` và mỗi lần xem đơn lại `JOIN` sang bảng `books` để lấy giá hiện tại, tổng tiền của các đơn hàng trong quá khứ sẽ bị sai lệch hoàn toàn, phá vỡ sổ sách kế toán.
- Bằng cách lưu **Snapshot (Bản chụp bất biến)** của `book_title`, `book_cover` và `price` tại chính thời điểm khách bấm mua vào `order_items`, giá trị đơn hàng được đóng băng vĩnh viễn, phản ánh đúng sự thật lịch sử giao dịch.

---

### Câu 21: Máy trạng thái đơn hàng (Order State Machine) được kiểm soát như thế nào?
**Trả lời:**
- Hệ thống áp dụng mô hình máy trạng thái hữu hạn (Finite State Machine) nghiêm ngặt để ngăn chặn việc chuyển đổi trạng thái tùy tiện:
  - `PENDING` -> Có thể chuyển sang `CONFIRMED` hoặc `CANCELLED`.
  - `CONFIRMED` -> Có thể chuyển sang `SHIPPING` hoặc `CANCELLED`.
  - `SHIPPING` -> Chỉ có thể chuyển sang `DELIVERED` hoặc `CANCELLED`.
  - `DELIVERED` -> Đơn đã hoàn tất, không thể tự ý chuyển về `PENDING`.
  - `CANCELLED` -> Đơn đã kết thúc, không thể kích hoạt lại.
- Khi đơn hàng bị hủy (`CANCELLED`), hệ thống tự động hoàn lại tồn kho cho các cuốn sách trong đơn và ghi nhật ký `CANCEL_RETURN`.

---

### Câu 22: Quy trình tích hợp thanh toán VNPay và kiểm duyệt đánh giá được thiết kế như thế nào?
**Trả lời:**
- **Thanh toán VNPay:**
  - Sử dụng thuật toán băm **HMAC-SHA512** với chuỗi bí mật `vnp_HashSecret` để tạo `vnp_SecureHash`.
  - Khi VNPay gọi Callback về, backend sắp xếp lại toàn bộ các trường theo thứ tự bảng chữ cái (alphabetical order), tính toán mã băm và so khớp với `vnp_SecureHash` gửi kèm. Nếu khớp mới tiến hành cập nhật trạng thái đơn sang `PAID`.
  - Xử lý **Idempotency**: Nếu VNPay gọi callback retry nhiều lần cho một giao dịch đã xử lý xong, hệ thống nhận diện và bỏ qua, không lặp lại transaction.
- **Kiểm duyệt Đánh giá (Review Moderation):**
  - Mọi đánh giá mới của người dùng được đặt mặc định ở trạng thái `PENDING` và `isApproved = false`.
  - Chỉ khi Quản trị viên/Nhân viên vào trang Admin kiểm duyệt và bấm **Duyệt (APPROVE)**, đánh giá mới được hiển thị công khai trên Storefront và tính vào điểm trung bình sao của cuốn sách. Nếu vi phạm, Admin có thể **Từ chối (REJECT)** kèm lý do cụ thể.
