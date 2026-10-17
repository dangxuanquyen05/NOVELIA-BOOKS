package com.novelia.config;

import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.RoleRepository;
import com.novelia.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Slf4j
@Component
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final InventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.novelia.coupon.repository.CouponRepository couponRepository;
    private final com.novelia.review.repository.ReviewRepository reviewRepository;

    public DataSeeder(
            UserRepository userRepository,
            RoleRepository roleRepository,
            CategoryRepository categoryRepository,
            AuthorRepository authorRepository,
            BookRepository bookRepository,
            InventoryRepository inventoryRepository,
            PasswordEncoder passwordEncoder,
            com.novelia.coupon.repository.CouponRepository couponRepository,
            com.novelia.review.repository.ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.categoryRepository = categoryRepository;
        this.authorRepository = authorRepository;
        this.bookRepository = bookRepository;
        this.inventoryRepository = inventoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.couponRepository = couponRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedRolesAndAdmin();
        seedCategoriesAuthorsAndBooks();
        seedCouponsAndReviews();
    }

    private void seedRolesAndAdmin() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Khách hàng").build()));

        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Nhân viên quản lý sách").build()));

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Quản trị viên tối cao").build()));

        if (!userRepository.existsByEmail("admin@noveliabooks.vn")) {
            userRepository.save(User.builder()
                    .email("admin@noveliabooks.vn")
                    .passwordHash(passwordEncoder.encode("AdminPass123!"))
                    .fullName("Quản Trị Viên NOVELIA")
                    .phone("0900000001")
                    .roles(Set.of(adminRole, staffRole))
                    .build());
            log.info("Initialized default admin: admin@noveliabooks.vn / AdminPass123!");
        }

        if (!userRepository.existsByEmail("reader1@noveliabooks.vn")) {
            userRepository.save(User.builder()
                    .email("reader1@noveliabooks.vn")
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .fullName("Nguyễn Văn Độc Giả")
                    .phone("0912345678")
                    .roles(Set.of(customerRole))
                    .build());
            log.info("Initialized default reader: reader1@noveliabooks.vn / Password123!");
        }
    }

    private void seedCategoriesAuthorsAndBooks() {
        if (bookRepository.count() > 0) {
            log.info("Books table already populated. Skipping book seeding.");
            return;
        }

        log.info("Seeding initial curated books, categories, and authors for NOVELIA BOOKS...");

        // 1. Categories
        Category catVanHocKinhDien = categoryRepository.save(Category.builder()
                .name("Văn Học Kinh Điển")
                .slug("van-hoc-kinh-dien")
                .description("Những áng văn bất hủ vượt thời gian, định hình nền văn học thế giới.")
                .displayOrder(1)
                .isActive(true)
                .build());

        Category catTrietHoc = categoryRepository.save(Category.builder()
                .name("Triết Học & Tư Tưởng")
                .slug("triet-hoc-tu-tuong")
                .description("Hành trình khai phóng tư duy cùng những nhà tư tưởng vĩ đại của nhân loại.")
                .displayOrder(2)
                .isActive(true)
                .build());

        Category catTamLy = categoryRepository.save(Category.builder()
                .name("Tâm Lý & Phong Cách Sống")
                .slug("tam-ly-phong-cach-song")
                .description("Thấu hiểu nội tâm, chữa lành và kiến tạo lối sống điềm tĩnh, sâu sắc.")
                .displayOrder(3)
                .isActive(true)
                .build());

        Category catTrinhTham = categoryRepository.save(Category.builder()
                .name("Tiểu Thuyết Trinh Thám")
                .slug("tieu-thuyet-trinh-tham")
                .description("Những vụ án ly kỳ, những màn suy luận logic nghẹt thở đỉnh cao.")
                .displayOrder(4)
                .isActive(true)
                .build());

        Category catVanHocDuongDai = categoryRepository.save(Category.builder()
                .name("Văn Học Đương Đại")
                .slug("van-hoc-duong-dai")
                .description("Tấm gương phản chiếu hơi thở thời đại và những góc khuất tâm hồn con người hiện đại.")
                .displayOrder(5)
                .isActive(true)
                .build());

        // 2. Authors
        Author authMurakami = authorRepository.save(Author.builder()
                .name("Haruki Murakami")
                .slug("haruki-murakami")
                .nationality("Nhật Bản")
                .biography("Một trong những nhà văn đương đại nổi tiếng nhất thế giới với phong cách hiện thực huyền ảo.")
                .avatarUrl("https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400")
                .build());

        Author authPauloCoelho = authorRepository.save(Author.builder()
                .name("Paulo Coelho")
                .slug("paulo-coelho")
                .nationality("Brazil")
                .biography("Tiểu thuyết gia danh tiếng, tác giả cuốn sách Nhà Giả Kim bán chạy hàng đầu mọi thời đại.")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400")
                .build());

        Author authGeorgeOrwell = authorRepository.save(Author.builder()
                .name("George Orwell")
                .slug("george-orwell")
                .nationality("Anh")
                .biography("Nhà văn và nhà báo Anh nổi tiếng với hai kiệt tác 1984 và Trại Súc Vật.")
                .avatarUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400")
                .build());

        Author authCamus = authorRepository.save(Author.builder()
                .name("Albert Camus")
                .slug("albert-camus")
                .nationality("Pháp")
                .biography("Nhà triết học và văn hào đoạt giải Nobel Văn học năm 1957, đại diện của chủ nghĩa phi lý.")
                .avatarUrl("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400")
                .build());

        Author authAurelius = authorRepository.save(Author.builder()
                .name("Marcus Aurelius")
                .slug("marcus-aurelius")
                .nationality("La Mã")
                .biography("Hoàng đế La Mã và triết gia Khắc kỷ vĩ đại, tác giả tập Suy Tưởng bất hủ.")
                .avatarUrl("https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400")
                .build());

        Author authConanDoyle = authorRepository.save(Author.builder()
                .name("Arthur Conan Doyle")
                .slug("arthur-conan-doyle")
                .nationality("Anh")
                .biography("Cha đẻ của nhân vật thám tử lừng danh Sherlock Holmes.")
                .avatarUrl("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400")
                .build());

        Author authNguyenNhatAnh = authorRepository.save(Author.builder()
                .name("Nguyễn Nhật Ánh")
                .slug("nguyen-nhat-anh")
                .nationality("Việt Nam")
                .biography("Nhà văn được nhiều thế hệ độc giả Việt Nam yêu mến với những trang viết trong trẻo về tuổi thơ.")
                .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400")
                .build());

        // 3. Books & Inventory
        createSeedBook(
                "Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)",
                "rung-na-uy-bia-cung",
                "9786045638101",
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
                "NXB Hội Nhà Văn",
                2023,
                420,
                "15.5 x 24 cm",
                Book.CoverType.HARDCOVER,
                new BigDecimal("210000.00"),
                new BigDecimal("168000.00"),
                "Kiệt tác văn chương làm rung động hàng triệu trái tim tuổi trẻ khắp thế giới.",
                "Rừng Na Uy xoay quanh những hồi ức hoài niệm đầy day dứt của chàng trai Toru Watanabe về mối tình đầu bi kịch Naoko và cô gái đầy sức sống Midori. Một bản tình ca u uất nhưng diễm lệ về tình yêu, sự mất mát và quá trình trưởng thành.",
                true,
                new BigDecimal("4.85"),
                328,
                Set.of(authMurakami),
                Set.of(catVanHocKinhDien, catVanHocDuongDai),
                45
        );

        createSeedBook(
                "Nhà Giả Kim (Ấn Bản Giới Hạn Sưu Tầm)",
                "nha-gia-kim-an-ban-gioi-han",
                "9786045638102",
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
                "NXB Hội Nhà Văn",
                2024,
                224,
                "14 x 20.5 cm",
                Book.CoverType.HARDCOVER,
                new BigDecimal("145000.00"),
                new BigDecimal("116000.00"),
                "Hành trình kỳ diệu đi tìm kho báu và sứ mệnh cuộc đời tại sa mạc Ai Cập.",
                "Tác phẩm kể về chuyến phiêu lưu của cậu bé chăn cừu Santiago người Tây Ban Nha. Cuốn sách như một câu chuyện cổ tích ngụ ngôn dung dị, khơi dậy ước mơ và chỉ dẫn mỗi người lắng nghe tiếng gọi trái tim.",
                true,
                new BigDecimal("4.92"),
                512,
                Set.of(authPauloCoelho),
                Set.of(catVanHocKinhDien, catTamLy),
                60
        );

        createSeedBook(
                "Suy Tưởng (Meditations) - Marcus Aurelius",
                "suy-tuong-marcus-aurelius",
                "9786045638103",
                "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800",
                "NXB Tri Thức",
                2023,
                380,
                "16 x 24 cm",
                Book.CoverType.HARDCOVER,
                new BigDecimal("230000.00"),
                new BigDecimal("184000.00"),
                "Di sản triết học Khắc kỷ bất hủ của vị hoàng đế thông thái thành Rome.",
                "Tập nhật ký triết học riêng tư mà Marcus Aurelius viết cho chính bản thân giữa những năm tháng trận mạc gian nan. Một cẩm nang giữ gìn sự bình thản tâm hồn, phẩm hạnh và danh dự trước biến thiên thời cuộc.",
                true,
                new BigDecimal("4.90"),
                189,
                Set.of(authAurelius),
                Set.of(catTrietHoc, catTamLy),
                30
        );

        createSeedBook(
                "1984 (Nineteen Eighty-Four)",
                "1984-george-orwell",
                "9786045638104",
                "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=800",
                "NXB Văn Học",
                2022,
                368,
                "14 x 20.5 cm",
                Book.CoverType.PAPERBACK,
                new BigDecimal("130000.00"),
                new BigDecimal("104000.00"),
                "Bức tranh tiên tri rùng mình về một xã hội bị giám sát tuyệt đối.",
                "1984 là cuốn tiểu thuyết viễn tưởng xã hội dystopia kinh điển của George Orwell, phơi bày quyền lực tha hóa và cuộc đấu tranh bảo vệ tư tưởng tự do của cá nhân trước áp chế toàn trị.",
                false,
                new BigDecimal("4.78"),
                245,
                Set.of(authGeorgeOrwell),
                Set.of(catVanHocKinhDien, catTrietHoc),
                25
        );

        createSeedBook(
                "Người Lạ (L'Étranger) - Albert Camus",
                "nguoi-la-albert-camus",
                "9786045638105",
                "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
                "NXB Văn Học",
                2023,
                196,
                "13 x 20 cm",
                Book.CoverType.PAPERBACK,
                new BigDecimal("95000.00"),
                new BigDecimal("80000.00"),
                "Tác phẩm định hình chủ nghĩa phi lý đoạt giải Nobel của Albert Camus.",
                "Câu chuyện về Meursault, một người đàn ông dường như dửng dưng với cái chết của mẹ và những quy ước xã hội, vô tình phạm tội ác dưới ánh mặt trời chói chang của bờ biển Algiers.",
                false,
                new BigDecimal("4.65"),
                142,
                Set.of(authCamus),
                Set.of(catVanHocKinhDien, catTrietHoc),
                20
        );

        createSeedBook(
                "Sherlock Holmes: Vụ Án Thung Lũng Khủng Khiếp",
                "sherlock-holmes-thung-lung-khung-khiep",
                "9786045638106",
                "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
                "NXB Kim Đồng",
                2023,
                310,
                "14.5 x 20.5 cm",
                Book.CoverType.PAPERBACK,
                new BigDecimal("115000.00"),
                new BigDecimal("92000.00"),
                "Vụ kỳ án ly kỳ đối đầu giữa Sherlock Holmes và tổ chức ngầm của Giáo sư Moriarty.",
                "Một mật mã kỳ bí dẫn đường cho thám tử Sherlock Holmes và bác sĩ Watson đến với trang viên Birlstone, hé lộ câu chuyện báo thù đẫm máu vượt đại dương từ những hội kín tại mỏ than nước Mỹ.",
                false,
                new BigDecimal("4.70"),
                98,
                Set.of(authConanDoyle),
                Set.of(catTrinhTham),
                35
        );

        createSeedBook(
                "Mắt Biếc (Ấn Bản Bìa Cứng Đặc Biệt)",
                "mat-biec-an-ban-dac-biet",
                "9786045638107",
                "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800",
                "NXB Trẻ",
                2024,
                320,
                "14 x 20.5 cm",
                Book.CoverType.HARDCOVER,
                new BigDecimal("160000.00"),
                new BigDecimal("136000.00"),
                "Bản tình ca đượm buồn về mối tình đơn phương thủy chung của làng Đo Đo.",
                "Tác phẩm tiêu biểu nhất của nhà văn Nguyễn Nhật Ánh, khắc họa mối tình sâu nặng suốt một đời của Ngạn dành cho Hà Lan — cô gái có đôi mắt biếc biếc như bầu trời quê hương.",
                true,
                new BigDecimal("4.88"),
                410,
                Set.of(authNguyenNhatAnh),
                Set.of(catVanHocDuongDai),
                50
        );

        createSeedBook(
                "Biên Niên Ký Chim Vặn Dây Cót",
                "bien-nien-ky-chim-van-day-cot",
                "9786045638108",
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
                "NXB Hội Nhà Văn",
                2022,
                720,
                "16 x 24 cm",
                Book.CoverType.HARDCOVER,
                new BigDecimal("280000.00"),
                new BigDecimal("238000.00"),
                "Thiên tiểu thuyết đồ sộ nhất và giàu chất biểu tượng của Haruki Murakami.",
                "Khởi đầu bằng việc chú mèo của Okada Toru biến mất, cuốn sách mở ra một mê cung ký ức chiến tranh, giếng sâu tâm tưởng và những bí ẩn kỳ quặc đan xen giữa thực tại và vô thức.",
                false,
                new BigDecimal("4.82"),
                175,
                Set.of(authMurakami),
                Set.of(catVanHocDuongDai, catVanHocKinhDien),
                18
        );

        log.info("Database seeding completed successfully. 8 books created with full inventories.");
    }

    private void createSeedBook(
            String title,
            String slug,
            String isbn,
            String coverImage,
            String publisher,
            Integer publicationYear,
            Integer pages,
            String dimensions,
            Book.CoverType coverType,
            BigDecimal originalPrice,
            BigDecimal salePrice,
            String shortDescription,
            String description,
            Boolean isFeatured,
            BigDecimal averageRating,
            Integer reviewCount,
            Set<Author> authors,
            Set<Category> categories,
            int stockQuantity
    ) {
        Book book = bookRepository.save(Book.builder()
                .title(title)
                .slug(slug)
                .isbn(isbn)
                .coverImage(coverImage)
                .publisher(publisher)
                .publicationYear(publicationYear)
                .pages(pages)
                .dimensions(dimensions)
                .coverType(coverType)
                .originalPrice(originalPrice)
                .salePrice(salePrice)
                .shortDescription(shortDescription)
                .description(description)
                .status(Book.BookStatus.PUBLISHED)
                .isFeatured(isFeatured)
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .authors(authors)
                .categories(categories)
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(book)
                .quantity(stockQuantity)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build());
    }

    private void seedCouponsAndReviews() {
        if (!couponRepository.existsByCodeIgnoreCase("NOVELIA10")) {
            couponRepository.save(com.novelia.coupon.entity.Coupon.builder()
                    .code("NOVELIA10")
                    .discountType(com.novelia.coupon.entity.Coupon.DiscountType.PERCENTAGE)
                    .discountValue(new BigDecimal("10.00"))
                    .minOrderValue(new BigDecimal("200000.00"))
                    .maxDiscountAmount(new BigDecimal("50000.00"))
                    .usageLimit(100)
                    .usedCount(5)
                    .startDate(java.time.LocalDateTime.now().minusDays(10))
                    .endDate(java.time.LocalDateTime.now().plusMonths(6))
                    .isActive(true)
                    .build());
        }

        if (!couponRepository.existsByCodeIgnoreCase("NOVELIA50K")) {
            couponRepository.save(com.novelia.coupon.entity.Coupon.builder()
                    .code("NOVELIA50K")
                    .discountType(com.novelia.coupon.entity.Coupon.DiscountType.FIXED_AMOUNT)
                    .discountValue(new BigDecimal("50000.00"))
                    .minOrderValue(new BigDecimal("350000.00"))
                    .usageLimit(50)
                    .usedCount(2)
                    .startDate(java.time.LocalDateTime.now().minusDays(5))
                    .endDate(java.time.LocalDateTime.now().plusMonths(3))
                    .isActive(true)
                    .build());
        }

        if (!couponRepository.existsByCodeIgnoreCase("VIPBOOK20")) {
            couponRepository.save(com.novelia.coupon.entity.Coupon.builder()
                    .code("VIPBOOK20")
                    .discountType(com.novelia.coupon.entity.Coupon.DiscountType.PERCENTAGE)
                    .discountValue(new BigDecimal("20.00"))
                    .minOrderValue(new BigDecimal("500000.00"))
                    .maxDiscountAmount(new BigDecimal("150000.00"))
                    .usageLimit(20)
                    .usedCount(0)
                    .startDate(java.time.LocalDateTime.now().minusDays(1))
                    .endDate(java.time.LocalDateTime.now().plusMonths(12))
                    .isActive(true)
                    .build());
        }

        userRepository.findByEmail("reader1@noveliabooks.vn").ifPresent(reader -> {
            bookRepository.findAll().stream().findFirst().ifPresent(firstBook -> {
                if (!reviewRepository.existsByBookIdAndUserId(firstBook.getId(), reader.getId())) {
                    reviewRepository.save(com.novelia.review.entity.Review.builder()
                            .book(firstBook)
                            .user(reader)
                            .rating(5)
                            .comment("Tác phẩm bìa cứng hoàn thiện cực kỳ tinh xảo, chất giấy vàng kem ngà bảo vệ mắt, dịch thuật chuẩn xác và văn phong lưu loát. Rất đáng sưu tầm trong tủ sách!")
                            .status(com.novelia.review.entity.Review.ReviewStatus.APPROVED)
                            .isApproved(true)
                            .moderatedAt(java.time.LocalDateTime.now().minusDays(2))
                            .moderatedBy("admin@noveliabooks.vn")
                            .build());
                }
            });
        });

        log.info("Coupons and sample reviews seeded successfully.");
    }
}
