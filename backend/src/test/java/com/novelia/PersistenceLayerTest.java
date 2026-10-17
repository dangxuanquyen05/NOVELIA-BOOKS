package com.novelia;

import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.cart.entity.Cart;
import com.novelia.cart.entity.CartItem;
import com.novelia.cart.repository.CartItemRepository;
import com.novelia.cart.repository.CartRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.coupon.entity.Coupon;
import com.novelia.coupon.repository.CouponRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.inventory.repository.InventoryTransactionRepository;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderItemRepository;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.review.entity.Review;
import com.novelia.review.repository.ReviewRepository;
import com.novelia.shipment.entity.Shipment;
import com.novelia.shipment.repository.ShipmentRepository;
import com.novelia.user.entity.Address;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.AddressRepository;
import com.novelia.user.repository.RoleRepository;
import com.novelia.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class PersistenceLayerTest {

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private AuthorRepository authorRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private InventoryTransactionRepository inventoryTransactionRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private ShipmentRepository shipmentRepository;
    @Autowired private ReviewRepository reviewRepository;

    @Test
    @DisplayName("Kiểm thử persistence cho User, Role và Address")
    void testUserAndRolePersistence() {
        Role adminRole = roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Quản trị").build());
        assertThat(adminRole.getId()).isNotNull();

        User user = User.builder()
                .email("test@noveliabooks.vn")
                .passwordHash("$2a$10$encodedPasswordHashHere")
                .fullName("Nguyễn Văn A")
                .phone("0901234567")
                .status(User.UserStatus.ACTIVE)
                .roles(Set.of(adminRole))
                .build();
        user = userRepository.save(user);
        assertThat(user.getId()).isNotNull();

        Address address = Address.builder()
                .user(user)
                .receiverName("Nguyễn Văn A")
                .phone("0901234567")
                .province("Hồ Chí Minh")
                .district("Quận 1")
                .ward("Bến Nghé")
                .detailedAddress("124 Đồng Khởi")
                .isDefault(true)
                .build();
        address = addressRepository.save(address);
        assertThat(address.getId()).isNotNull();
        assertThat(addressRepository.findByUserId(user.getId())).hasSize(1);
    }

    @Test
    @DisplayName("Kiểm thử persistence cho Author, Category và Book với BigDecimal cho giá")
    void testBookAndCatalogPersistence() {
        Author author = authorRepository.save(Author.builder()
                .name("Paulo Coelho")
                .slug("paulo-coelho")
                .nationality("Brazil")
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Văn Học Kinh Điển")
                .slug("van-hoc-kinh-dien")
                .build());

        BigDecimal originalPrice = new BigDecimal("220000.00");
        BigDecimal salePrice = new BigDecimal("185000.00");

        Book book = Book.builder()
                .title("Nhà Giả Kim")
                .slug("nha-gia-kim")
                .isbn("9786045892345")
                .originalPrice(originalPrice)
                .salePrice(salePrice)
                .status(Book.BookStatus.PUBLISHED)
                .authors(Set.of(author))
                .categories(Set.of(category))
                .build();
        book = bookRepository.save(book);

        Optional<Book> found = bookRepository.findBySlug("nha-gia-kim");
        assertThat(found).isPresent();
        assertThat(found.get().getSalePrice()).isEqualByComparingTo(salePrice);
        assertThat(found.get().getOriginalPrice()).isEqualByComparingTo(originalPrice);
        assertThat(found.get().getAuthors()).hasSize(1);
        assertThat(found.get().getCategories()).hasSize(1);
    }

    @Test
    @DisplayName("Kiểm thử persistence cho Inventory và InventoryTransaction")
    void testInventoryPersistence() {
        Book book = bookRepository.save(Book.builder()
                .title("Khắc Kỷ")
                .slug("khac-ky")
                .originalPrice(new BigDecimal("290000.00"))
                .salePrice(new BigDecimal("245000.00"))
                .build());

        Inventory inventory = inventoryRepository.save(Inventory.builder()
                .book(book)
                .quantity(50)
                .reservedQuantity(5)
                .lowStockThreshold(10)
                .build());
        assertThat(inventory.getAvailableQuantity()).isEqualTo(45);

        InventoryTransaction tx = inventoryTransactionRepository.save(InventoryTransaction.builder()
                .book(book)
                .transactionType(InventoryTransaction.TransactionType.IMPORT)
                .quantityChange(50)
                .remainingQuantity(50)
                .note("Nhập kho đầu kỳ")
                .build());
        assertThat(tx.getId()).isNotNull();
    }

    @Test
    @DisplayName("Kiểm thử persistence cho Giỏ hàng (Cart, CartItem)")
    void testCartPersistence() {
        User user = userRepository.save(User.builder()
                .email("cartuser@novelia.vn")
                .passwordHash("hash")
                .fullName("Trần Thị B")
                .build());

        Book book = bookRepository.save(Book.builder()
                .title("Mỹ Học Zen")
                .slug("my-hoc-zen")
                .originalPrice(new BigDecimal("380000.00"))
                .salePrice(new BigDecimal("320000.00"))
                .build());

        Cart cart = cartRepository.save(Cart.builder().user(user).build());

        CartItem item = cartItemRepository.save(CartItem.builder()
                .cart(cart)
                .book(book)
                .quantity(2)
                .build());
        assertThat(item.getId()).isNotNull();
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(1);
    }

    @Test
    @DisplayName("Kiểm thử persistence cho Coupon với BigDecimal")
    void testCouponPersistence() {
        Coupon coupon = Coupon.builder()
                .code("NOVELIA2026")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000.00"))
                .minOrderValue(new BigDecimal("300000.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .build();
        coupon = couponRepository.save(coupon);

        assertThat(couponRepository.findByCode("NOVELIA2026")).isPresent();
        assertThat(coupon.isValidForOrder(new BigDecimal("500000.00"))).isTrue();
        assertThat(coupon.isValidForOrder(new BigDecimal("200000.00"))).isFalse();
    }

    @Test
    @DisplayName("Kiểm thử persistence cho Order, OrderItem, Payment, Shipment, Review")
    void testOrderWorkflowPersistence() {
        User user = userRepository.save(User.builder()
                .email("orderuser@novelia.vn")
                .passwordHash("hash")
                .fullName("Lê Văn C")
                .build());

        Book book = bookRepository.save(Book.builder()
                .title("Đi Tìm Lẽ Sống")
                .slug("di-tim-le-song")
                .originalPrice(new BigDecimal("160000.00"))
                .salePrice(new BigDecimal("135000.00"))
                .build());

        BigDecimal itemPrice = new BigDecimal("135000.00");
        BigDecimal subtotal = new BigDecimal("270000.00");
        BigDecimal shippingFee = new BigDecimal("30000.00");
        BigDecimal totalAmount = new BigDecimal("300000.00");

        Order order = Order.builder()
                .orderNumber("NOV-2026-0001")
                .user(user)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.PENDING)
                .receiverName("Lê Văn C")
                .receiverPhone("0987654321")
                .shippingAddress("123 Lê Lợi, Q1, TP.HCM")
                .build();
        order = orderRepository.save(order);

        OrderItem orderItem = orderItemRepository.save(OrderItem.builder()
                .order(order)
                .book(book)
                .bookTitle(book.getTitle())
                .price(itemPrice)
                .quantity(2)
                .totalPrice(subtotal)
                .build());
        assertThat(orderItem.getId()).isNotNull();

        Payment payment = paymentRepository.save(Payment.builder()
                .order(order)
                .paymentMethod(Payment.PaymentMethod.VNPAY)
                .paymentStatus(Payment.PaymentStatus.PAID)
                .transactionCode("VNPAY_TX_123456")
                .amount(totalAmount)
                .paidAt(LocalDateTime.now())
                .build());
        assertThat(payment.getId()).isNotNull();

        Shipment shipment = shipmentRepository.save(Shipment.builder()
                .order(order)
                .trackingNumber("GHN_TRK_987654")
                .shippingCarrier("GiaoHangNhanh")
                .shippingStatus(Shipment.ShippingStatus.IN_TRANSIT)
                .build());
        assertThat(shipment.getId()).isNotNull();

        Review review = reviewRepository.save(Review.builder()
                .book(book)
                .user(user)
                .order(order)
                .rating(5)
                .comment("Cuốn sách tuyệt vời, thay đổi nhân sinh quan!")
                .isApproved(true)
                .build());
        assertThat(review.getId()).isNotNull();
    }
}
