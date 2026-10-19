-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: novelia_books
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `receiver_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detailed_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_address_user` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `entity_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created_at` (`created_at`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_performed_by` (`performed_by`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'ORDER_CANCEL','2026-10-17 21:59:39.162631','Lý do: Khach muon doi dia chi nhan hang, Tồn kho đã hoàn: true','NOV-20261017-7ED81C','ORDER','0:0:0:0:0:0:0:1','reader1@noveliabooks.vn','SUCCESS','Hủy đơn hàng: NOV-20261017-7ED81C'),(2,'ORDER_CANCEL','2026-10-17 23:22:09.905147','Lý do: Khach hang doi y kiem thu Phase 8, Tồn kho đã hoàn: true','NOV-20261017-7B5ABC','ORDER','0:0:0:0:0:0:0:1','p8_user1_1792254128452@novelia.vn','SUCCESS','Hủy đơn hàng: NOV-20261017-7B5ABC'),(3,'ORDER_CANCEL','2026-10-18 19:37:13.910739','Lý do: Khach hang doi y kiem thu Phase 8, Tồn kho đã hoàn: true','NOV-20261018-14EE64','ORDER','0:0:0:0:0:0:0:1','p8_user1_1792327031865@novelia.vn','SUCCESS','Hủy đơn hàng: NOV-20261018-14EE64'),(4,'ORDER_CANCEL','2026-10-18 19:48:26.466560','Lý do: Khach hang doi y kiem thu Phase 8, Tồn kho đã hoàn: true','NOV-20261018-037AA8','ORDER','0:0:0:0:0:0:0:1','p8_user1_1792327703780@novelia.vn','SUCCESS','Hủy đơn hàng: NOV-20261018-037AA8'),(5,'ORDER_CANCEL','2026-10-18 22:23:42.076527','Lý do: Khach hang doi y kiem thu Phase 8, Tồn kho đã hoàn: true','NOV-20261018-128168','ORDER','0:0:0:0:0:0:0:1','p8_user1_1792337019773@novelia.vn','SUCCESS','Hủy đơn hàng: NOV-20261018-128168'),(6,'ORDER_CANCEL','2026-10-18 22:25:09.677537','Lý do: Khach hang doi y kiem thu Phase 8, Tồn kho đã hoàn: true','NOV-20261018-08CF16','ORDER','0:0:0:0:0:0:0:1','p8_user1_1792337108686@novelia.vn','SUCCESS','Hủy đơn hàng: NOV-20261018-08CF16'),(7,'ORDER_STATUS_UPDATE','2026-10-18 22:26:49.590432','Trạng thái mới: CONFIRMED','NOV-20261018-AD01A2','ORDER','0:0:0:0:0:0:0:1','admin@noveliabooks.vn','SUCCESS','Cập nhật trạng thái đơn: NOV-20261018-AD01A2 (PENDING -> CONFIRMED)'),(8,'ORDER_STATUS_UPDATE','2026-10-18 22:26:55.051758','Trạng thái mới: SHIPPING','NOV-20261018-AD01A2','ORDER','0:0:0:0:0:0:0:1','admin@noveliabooks.vn','SUCCESS','Cập nhật trạng thái đơn: NOV-20261018-AD01A2 (CONFIRMED -> SHIPPING)'),(9,'ORDER_STATUS_UPDATE','2026-10-18 22:27:20.816734','Trạng thái mới: CONFIRMED','NOV-20261017-5CE412','ORDER','0:0:0:0:0:0:0:1','admin@noveliabooks.vn','SUCCESS','Cập nhật trạng thái đơn: NOV-20261017-5CE412 (PENDING -> CONFIRMED)'),(10,'ORDER_STATUS_UPDATE','2026-10-18 22:27:27.401395','Trạng thái mới: SHIPPING','NOV-20261017-5CE412','ORDER','0:0:0:0:0:0:0:1','admin@noveliabooks.vn','SUCCESS','Cập nhật trạng thái đơn: NOV-20261017-5CE412 (CONFIRMED -> SHIPPING)'),(11,'ORDER_STATUS_UPDATE','2026-10-18 22:29:03.591401','Trạng thái mới: DELIVERED','NOV-20261018-AD01A2','ORDER','0:0:0:0:0:0:0:1','admin@noveliabooks.vn','SUCCESS','Cập nhật trạng thái đơn: NOV-20261018-AD01A2 (SHIPPING -> DELIVERED)'),(12,'ORDER_STATUS_UPDATE','2026-10-18 22:29:14.820314','Trạng thái mới: DELIVERED','NOV-20261017-5CE412','ORDER','0:0:0:0:0:0:0:1','admin@noveliabooks.vn','SUCCESS','Cập nhật trạng thái đơn: NOV-20261017-5CE412 (SHIPPING -> DELIVERED)');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authors`
--

DROP TABLE IF EXISTS `authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `biography` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_author_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authors`
--

LOCK TABLES `authors` WRITE;
/*!40000 ALTER TABLE `authors` DISABLE KEYS */;
INSERT INTO `authors` VALUES (1,'Haruki Murakami','haruki-murakami','Một trong những nhà văn đương đại nổi tiếng nhất thế giới với phong cách hiện thực huyền ảo.','https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400','Nhật Bản','2026-10-16 12:41:55'),(2,'Paulo Coelho','paulo-coelho','Tiểu thuyết gia danh tiếng, tác giả cuốn sách Nhà Giả Kim bán chạy hàng đầu mọi thời đại.','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400','Brazil','2026-10-16 12:41:55'),(3,'George Orwell','george-orwell','Nhà văn và nhà báo Anh nổi tiếng với hai kiệt tác 1984 và Trại Súc Vật.','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400','Anh','2026-10-16 12:41:55'),(4,'Albert Camus','albert-camus','Nhà triết học và văn hào đoạt giải Nobel Văn học năm 1957, đại diện của chủ nghĩa phi lý.','https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400','Pháp','2026-10-16 12:41:55'),(5,'Marcus Aurelius','marcus-aurelius','Hoàng đế La Mã và triết gia Khắc kỷ vĩ đại, tác giả tập Suy Tưởng bất hủ.','https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400','La Mã','2026-10-16 12:41:55'),(6,'Arthur Conan Doyle','arthur-conan-doyle','Cha đẻ của nhân vật thám tử lừng danh Sherlock Holmes.','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400','Anh','2026-10-16 12:41:55'),(7,'Nguyễn Nhật Ánh','nguyen-nhat-anh','Nhà văn được nhiều thế hệ độc giả Việt Nam yêu mến với những trang viết trong trẻo về tuổi thơ.','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400','Việt Nam','2026-10-16 12:41:55');
/*!40000 ALTER TABLE `authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_authors`
--

DROP TABLE IF EXISTS `book_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_authors` (
  `book_id` bigint NOT NULL,
  `author_id` bigint NOT NULL,
  PRIMARY KEY (`book_id`,`author_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `book_authors_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `book_authors_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_authors`
--

LOCK TABLES `book_authors` WRITE;
/*!40000 ALTER TABLE `book_authors` DISABLE KEYS */;
INSERT INTO `book_authors` VALUES (1,1),(8,1),(2,2),(4,3),(5,4),(3,5),(6,6),(7,7);
/*!40000 ALTER TABLE `book_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_categories`
--

DROP TABLE IF EXISTS `book_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_categories` (
  `book_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  PRIMARY KEY (`book_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `book_categories_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `book_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_categories`
--

LOCK TABLES `book_categories` WRITE;
/*!40000 ALTER TABLE `book_categories` DISABLE KEYS */;
INSERT INTO `book_categories` VALUES (1,1),(2,1),(4,1),(5,1),(8,1),(3,2),(4,2),(5,2),(2,3),(3,3),(6,4),(1,5),(7,5),(8,5);
/*!40000 ALTER TABLE `book_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publisher` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publication_year` int DEFAULT NULL,
  `pages` int DEFAULT NULL,
  `dimensions` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_type` enum('HARDCOVER','PAPERBACK') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_price` decimal(14,2) NOT NULL,
  `sale_price` decimal(14,2) NOT NULL,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `status` enum('ARCHIVED','DRAFT','PUBLISHED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `average_rating` decimal(3,2) DEFAULT '0.00',
  `review_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `idx_book_slug` (`slug`),
  KEY `idx_book_status` (`status`),
  KEY `idx_book_price` (`sale_price`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','rung-na-uy-bia-cung','9786045638101','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800','NXB Hội Nhà Văn',2023,420,'15.5 x 24 cm','HARDCOVER',210000.00,168000.00,'Kiệt tác văn chương làm rung động hàng triệu trái tim tuổi trẻ khắp thế giới.','Rừng Na Uy xoay quanh những hồi ức hoài niệm đầy day dứt của chàng trai Toru Watanabe về mối tình đầu bi kịch Naoko và cô gái đầy sức sống Midori. Một bản tình ca u uất nhưng diễm lệ về tình yêu, sự mất mát và quá trình trưởng thành.','PUBLISHED',1,4.85,328,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(2,'Nhà Giả Kim (Ấn Bản Giới Hạn Sưu Tầm)','nha-gia-kim-an-ban-gioi-han','9786045638102','https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800','NXB Hội Nhà Văn',2024,224,'14 x 20.5 cm','HARDCOVER',145000.00,116000.00,'Hành trình kỳ diệu đi tìm kho báu và sứ mệnh cuộc đời tại sa mạc Ai Cập.','Tác phẩm kể về chuyến phiêu lưu của cậu bé chăn cừu Santiago người Tây Ban Nha. Cuốn sách như một câu chuyện cổ tích ngụ ngôn dung dị, khơi dậy ước mơ và chỉ dẫn mỗi người lắng nghe tiếng gọi trái tim.','PUBLISHED',1,4.92,512,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(3,'Suy Tưởng (Meditations) - Marcus Aurelius','suy-tuong-marcus-aurelius','9786045638103','https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800','NXB Tri Thức',2023,380,'16 x 24 cm','HARDCOVER',230000.00,184000.00,'Di sản triết học Khắc kỷ bất hủ của vị hoàng đế thông thái thành Rome.','Tập nhật ký triết học riêng tư mà Marcus Aurelius viết cho chính bản thân giữa những năm tháng trận mạc gian nan. Một cẩm nang giữ gìn sự bình thản tâm hồn, phẩm hạnh và danh dự trước biến thiên thời cuộc.','PUBLISHED',1,4.90,189,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(4,'1984 (Nineteen Eighty-Four)','1984-george-orwell','9786045638104','https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=800','NXB Văn Học',2022,368,'14 x 20.5 cm','PAPERBACK',130000.00,104000.00,'Bức tranh tiên tri rùng mình về một xã hội bị giám sát tuyệt đối.','1984 là cuốn tiểu thuyết viễn tưởng xã hội dystopia kinh điển của George Orwell, phơi bày quyền lực tha hóa và cuộc đấu tranh bảo vệ tư tưởng tự do của cá nhân trước áp chế toàn trị.','PUBLISHED',0,4.78,245,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(5,'Người Lạ (L\'Étranger) - Albert Camus','nguoi-la-albert-camus','9786045638105','https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800','NXB Văn Học',2023,196,'13 x 20 cm','PAPERBACK',95000.00,80000.00,'Tác phẩm định hình chủ nghĩa phi lý đoạt giải Nobel của Albert Camus.','Câu chuyện về Meursault, một người đàn ông dường như dửng dưng với cái chết của mẹ và những quy ước xã hội, vô tình phạm tội ác dưới ánh mặt trời chói chang của bờ biển Algiers.','PUBLISHED',0,4.65,142,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(6,'Sherlock Holmes: Vụ Án Thung Lũng Khủng Khiếp','sherlock-holmes-thung-lung-khung-khiep','9786045638106','https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800','NXB Kim Đồng',2023,310,'14.5 x 20.5 cm','PAPERBACK',115000.00,92000.00,'Vụ kỳ án ly kỳ đối đầu giữa Sherlock Holmes và tổ chức ngầm của Giáo sư Moriarty.','Một mật mã kỳ bí dẫn đường cho thám tử Sherlock Holmes và bác sĩ Watson đến với trang viên Birlstone, hé lộ câu chuyện báo thù đẫm máu vượt đại dương từ những hội kín tại mỏ than nước Mỹ.','PUBLISHED',0,4.70,98,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(7,'Mắt Biếc (Ấn Bản Bìa Cứng Đặc Biệt)','mat-biec-an-ban-dac-biet','9786045638107','https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800','NXB Trẻ',2024,320,'14 x 20.5 cm','HARDCOVER',160000.00,136000.00,'Bản tình ca đượm buồn về mối tình đơn phương thủy chung của làng Đo Đo.','Tác phẩm tiêu biểu nhất của nhà văn Nguyễn Nhật Ánh, khắc họa mối tình sâu nặng suốt một đời của Ngạn dành cho Hà Lan — cô gái có đôi mắt biếc biếc như bầu trời quê hương.','PUBLISHED',1,4.88,410,'2026-10-16 12:41:55','2026-10-16 12:41:55'),(8,'Biên Niên Ký Chim Vặn Dây Cót','bien-nien-ky-chim-van-day-cot','9786045638108','https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800','NXB Hội Nhà Văn',2022,720,'16 x 24 cm','HARDCOVER',280000.00,238000.00,'Thiên tiểu thuyết đồ sộ nhất và giàu chất biểu tượng của Haruki Murakami.','Khởi đầu bằng việc chú mèo của Okada Toru biến mất, cuốn sách mở ra một mê cung ký ức chiến tranh, giếng sâu tâm tưởng và những bí ẩn kỳ quặc đan xen giữa thực tại và vô thức.','PUBLISHED',0,4.82,175,'2026-10-16 12:41:55','2026-10-16 12:41:55');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cart_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_book` (`cart_id`,`book_id`),
  KEY `book_id` (`book_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (6,4,1,2,'2026-10-17 16:20:55'),(12,9,1,2,'2026-10-18 15:20:45');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,1,'2026-10-16 12:58:52'),(2,4,'2026-10-16 15:29:20'),(3,3,'2026-10-16 15:34:24'),(4,6,'2026-10-17 16:20:54'),(5,8,'2026-10-17 16:22:09'),(6,10,'2026-10-18 12:37:13'),(7,12,'2026-10-18 12:48:26'),(8,14,'2026-10-18 12:54:21'),(9,15,'2026-10-18 15:20:45'),(10,17,'2026-10-18 15:23:42'),(11,19,'2026-10-18 15:25:09');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `parent_id` bigint DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  KEY `idx_category_slug` (`slug`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Văn Học Kinh Điển','van-hoc-kinh-dien','Những áng văn bất hủ vượt thời gian, định hình nền văn học thế giới.',1,1,'2026-10-16 12:41:55'),(2,NULL,'Triết Học & Tư Tưởng','triet-hoc-tu-tuong','Hành trình khai phóng tư duy cùng những nhà tư tưởng vĩ đại của nhân loại.',2,1,'2026-10-16 12:41:55'),(3,NULL,'Tâm Lý & Phong Cách Sống','tam-ly-phong-cach-song','Thấu hiểu nội tâm, chữa lành và kiến tạo lối sống điềm tĩnh, sâu sắc.',3,1,'2026-10-16 12:41:55'),(4,NULL,'Tiểu Thuyết Trinh Thám','tieu-thuyet-trinh-tham','Những vụ án ly kỳ, những màn suy luận logic nghẹt thở đỉnh cao.',4,1,'2026-10-16 12:41:55'),(5,NULL,'Văn Học Đương Đại','van-hoc-duong-dai','Tấm gương phản chiếu hơi thở thời đại và những góc khuất tâm hồn con người hiện đại.',5,1,'2026-10-16 12:41:55');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('FIXED_AMOUNT','PERCENTAGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(14,2) NOT NULL,
  `min_order_value` decimal(14,2) DEFAULT '0.00',
  `max_discount_amount` decimal(14,2) DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usage_limit_per_user` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_coupon_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'NOVELIA10','PERCENTAGE',10.00,200000.00,50000.00,100,6,'2026-10-06 23:23:33','2027-04-16 23:23:33',1,'2026-10-16 16:23:33',NULL),(2,'NOVELIA50K','FIXED_AMOUNT',50000.00,350000.00,NULL,50,2,'2026-10-11 23:23:33','2027-01-16 23:23:33',1,'2026-10-16 16:23:33',NULL),(3,'VIPBOOK20','PERCENTAGE',20.00,500000.00,150000.00,20,0,'2026-10-15 23:23:33','2027-10-16 23:23:33',1,'2026-10-16 16:23:33',NULL);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `reserved_quantity` int NOT NULL DEFAULT '0',
  `low_stock_threshold` int DEFAULT '5',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `book_id` (`book_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,1,42,0,5,'2026-10-18 15:25:10'),(2,2,60,0,5,'2026-10-16 12:41:55'),(3,3,29,0,5,'2026-10-18 15:26:06'),(4,4,25,0,5,'2026-10-16 12:41:55'),(5,5,20,0,5,'2026-10-17 14:59:39'),(6,6,35,0,5,'2026-10-16 12:41:55'),(7,7,50,0,5,'2026-10-16 12:41:55'),(8,8,18,0,5,'2026-10-16 12:41:55');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `transaction_type` enum('ADJUSTMENT','CANCEL_RETURN','IMPORT','SALE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_change` int NOT NULL,
  `remaining_quantity` int NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `performed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inv_tx_book` (`book_id`),
  CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (1,5,'SALE',-2,18,'Bán theo đơn hàng #NOV-20261017-7ED81C','2026-10-17 14:59:39','reader1@noveliabooks.vn'),(2,5,'CANCEL_RETURN',2,20,'Hoàn kho do hủy đơn NOV-20261017-7ED81C: Khach muon doi dia chi nhan hang','2026-10-17 14:59:39','reader1@noveliabooks.vn'),(3,1,'SALE',-3,42,'Bán theo đơn hàng #NOV-20261017-5CE412','2026-10-17 16:21:12','admin@noveliabooks.vn'),(4,1,'SALE',-2,40,'Bán theo đơn hàng #NOV-20261017-7B5ABC','2026-10-17 16:22:10','p8_user1_1792254128452@novelia.vn'),(5,1,'CANCEL_RETURN',2,42,'Hoàn kho do hủy đơn NOV-20261017-7B5ABC: Khach hang doi y kiem thu Phase 8','2026-10-17 16:22:10','p8_user1_1792254128452@novelia.vn'),(6,1,'SALE',-2,40,'Bán theo đơn hàng #NOV-20261018-14EE64','2026-10-18 12:37:14','p8_user1_1792327031865@novelia.vn'),(7,1,'CANCEL_RETURN',2,42,'Hoàn kho do hủy đơn NOV-20261018-14EE64: Khach hang doi y kiem thu Phase 8','2026-10-18 12:37:14','p8_user1_1792327031865@novelia.vn'),(8,1,'SALE',-2,40,'Bán theo đơn hàng #NOV-20261018-037AA8','2026-10-18 12:48:26','p8_user1_1792327703780@novelia.vn'),(9,1,'CANCEL_RETURN',2,42,'Hoàn kho do hủy đơn NOV-20261018-037AA8: Khach hang doi y kiem thu Phase 8','2026-10-18 12:48:26','p8_user1_1792327703780@novelia.vn'),(10,1,'SALE',-2,40,'Bán theo đơn hàng #NOV-20261018-128168','2026-10-18 15:23:42','p8_user1_1792337019773@novelia.vn'),(11,1,'CANCEL_RETURN',2,42,'Hoàn kho do hủy đơn NOV-20261018-128168: Khach hang doi y kiem thu Phase 8','2026-10-18 15:23:42','p8_user1_1792337019773@novelia.vn'),(12,1,'SALE',-2,40,'Bán theo đơn hàng #NOV-20261018-08CF16','2026-10-18 15:25:09','p8_user1_1792337108686@novelia.vn'),(13,1,'CANCEL_RETURN',2,42,'Hoàn kho do hủy đơn NOV-20261018-08CF16: Khach hang doi y kiem thu Phase 8','2026-10-18 15:25:10','p8_user1_1792337108686@novelia.vn'),(14,3,'SALE',-1,29,'Bán theo đơn hàng #NOV-20261018-AD01A2','2026-10-18 15:26:06','ducanh0918273645@gmail.com');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `book_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_cover` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(14,2) NOT NULL,
  `quantity` int NOT NULL,
  `total_price` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `book_id` (`book_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,5,'Người Lạ (L\'Étranger) - Albert Camus','https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',80000.00,2,160000.00),(2,2,1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',168000.00,3,504000.00),(3,3,1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',168000.00,2,336000.00),(4,4,1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',168000.00,2,336000.00),(5,5,1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',168000.00,2,336000.00),(6,6,1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',168000.00,2,336000.00),(7,7,1,'Rừng Na Uy (Ấn Bản Kỷ Niệm Bìa Cứng)','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',168000.00,2,336000.00),(8,8,3,'Suy Tưởng (Meditations) - Marcus Aurelius','https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',184000.00,1,184000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_histories`
--

DROP TABLE IF EXISTS `order_status_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_histories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `from_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgair3047h1rin6u8y0fvc1fg5` (`order_id`),
  CONSTRAINT `FKgair3047h1rin6u8y0fvc1fg5` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_histories`
--

LOCK TABLES `order_status_histories` WRITE;
/*!40000 ALTER TABLE `order_status_histories` DISABLE KEYS */;
INSERT INTO `order_status_histories` VALUES (1,'TẠO ĐƠN HÀNG MỚI','reader1@noveliabooks.vn','2026-10-17 21:59:38.918396',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',1),(2,'HỦY ĐƠN HÀNG','reader1@noveliabooks.vn','2026-10-17 21:59:39.154278','PENDING','Khach muon doi dia chi nhan hang','CANCELLED',1),(3,'TẠO ĐƠN HÀNG MỚI','admin@noveliabooks.vn','2026-10-17 23:21:11.584679',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',2),(4,'TẠO ĐƠN HÀNG MỚI','p8_user1_1792254128452@novelia.vn','2026-10-17 23:22:09.546172',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',3),(5,'HỦY ĐƠN HÀNG','p8_user1_1792254128452@novelia.vn','2026-10-17 23:22:09.893297','PENDING','Khach hang doi y kiem thu Phase 8','CANCELLED',3),(6,'TẠO ĐƠN HÀNG MỚI','p8_user1_1792327031865@novelia.vn','2026-10-18 19:37:13.577346',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',4),(7,'HỦY ĐƠN HÀNG','p8_user1_1792327031865@novelia.vn','2026-10-18 19:37:13.905144','PENDING','Khach hang doi y kiem thu Phase 8','CANCELLED',4),(8,'TẠO ĐƠN HÀNG MỚI','p8_user1_1792327703780@novelia.vn','2026-10-18 19:48:26.118148',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',5),(9,'HỦY ĐƠN HÀNG','p8_user1_1792327703780@novelia.vn','2026-10-18 19:48:26.456402','PENDING','Khach hang doi y kiem thu Phase 8','CANCELLED',5),(10,'TẠO ĐƠN HÀNG MỚI','p8_user1_1792337019773@novelia.vn','2026-10-18 22:23:41.773329',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',6),(11,'HỦY ĐƠN HÀNG','p8_user1_1792337019773@novelia.vn','2026-10-18 22:23:42.066872','PENDING','Khach hang doi y kiem thu Phase 8','CANCELLED',6),(12,'TẠO ĐƠN HÀNG MỚI','p8_user1_1792337108686@novelia.vn','2026-10-18 22:25:09.462534',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',7),(13,'HỦY ĐƠN HÀNG','p8_user1_1792337108686@novelia.vn','2026-10-18 22:25:09.674594','PENDING','Khach hang doi y kiem thu Phase 8','CANCELLED',7),(14,'TẠO ĐƠN HÀNG MỚI','ducanh0918273645@gmail.com','2026-10-18 22:26:06.021581',NULL,'Khách hàng tạo đơn hàng trực tuyến','PENDING',8),(15,'CHUYỂN TRẠNG THÁI','admin@noveliabooks.vn','2026-10-18 22:26:49.586843','PENDING',NULL,'CONFIRMED',8),(16,'CHUYỂN TRẠNG THÁI','admin@noveliabooks.vn','2026-10-18 22:26:55.044081','CONFIRMED',NULL,'SHIPPING',8),(17,'CHUYỂN TRẠNG THÁI','admin@noveliabooks.vn','2026-10-18 22:27:20.809972','PENDING',NULL,'CONFIRMED',2),(18,'CHUYỂN TRẠNG THÁI','admin@noveliabooks.vn','2026-10-18 22:27:27.397949','CONFIRMED',NULL,'SHIPPING',2),(19,'THANH TOÁN COD','admin@noveliabooks.vn','2026-10-18 22:29:03.584375','SHIPPING','Tự động ghi nhận thu tiền mặt COD khi giao thành công','DELIVERED',8),(20,'CHUYỂN TRẠNG THÁI','admin@noveliabooks.vn','2026-10-18 22:29:03.586244','SHIPPING',NULL,'DELIVERED',8),(21,'THANH TOÁN COD','admin@noveliabooks.vn','2026-10-18 22:29:14.805160','SHIPPING','Tự động ghi nhận thu tiền mặt COD khi giao thành công','DELIVERED',2),(22,'CHUYỂN TRẠNG THÁI','admin@noveliabooks.vn','2026-10-18 22:29:14.813148','SHIPPING',NULL,'DELIVERED',2);
/*!40000 ALTER TABLE `order_status_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `shipping_fee` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL,
  `status` enum('CANCELLED','CONFIRMED','DELIVERED','PENDING','REFUNDED','SHIPPING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `coupon_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inventory_restored` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_order_user` (`user_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_order_status` (`status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'NOV-20261017-7ED81C',1,160000.00,30000.00,0.00,190000.00,'CANCELLED','Nguyen Van Doc Gia','0987654321','So 123 Duong Sach Nguyen Hue, Ben Nghe, Quan 1, TP. HCM','Giao hang gio hanh chinh | [Hủy bởi Khách: Khach muon doi dia chi nhan hang]','2026-10-17 14:59:39','2026-10-17 14:59:39',NULL,_binary ''),(2,'NOV-20261017-5CE412',3,504000.00,0.00,50000.00,454000.00,'DELIVERED','Nguyen Van A','0901234567','123 Pho Sach, Dong Da, Ha Noi',NULL,'2026-10-17 16:21:12','2026-10-18 15:29:15','NOVELIA10',_binary '\0'),(3,'NOV-20261017-7B5ABC',8,336000.00,30000.00,33600.00,332400.00,'CANCELLED','Nguyen Van A','0901234567','So 123 Pho Sach, Quan Dong Da, Ha Noi','[Hủy bởi Khách: Khach hang doi y kiem thu Phase 8]','2026-10-17 16:22:10','2026-10-17 16:22:10','NOVELIA10',_binary ''),(4,'NOV-20261018-14EE64',10,336000.00,30000.00,33600.00,332400.00,'CANCELLED','Nguyen Van A','0901234567','So 123 Pho Sach, Quan Dong Da, Ha Noi','[Hủy bởi Khách: Khach hang doi y kiem thu Phase 8]','2026-10-18 12:37:14','2026-10-18 12:37:14','NOVELIA10',_binary ''),(5,'NOV-20261018-037AA8',12,336000.00,30000.00,33600.00,332400.00,'CANCELLED','Nguyen Van A','0901234567','So 123 Pho Sach, Quan Dong Da, Ha Noi','[Hủy bởi Khách: Khach hang doi y kiem thu Phase 8]','2026-10-18 12:48:26','2026-10-18 12:48:26','NOVELIA10',_binary ''),(6,'NOV-20261018-128168',17,336000.00,30000.00,33600.00,332400.00,'CANCELLED','Nguyen Van A','0901234567','So 123 Pho Sach, Quan Dong Da, Ha Noi','[Hủy bởi Khách: Khach hang doi y kiem thu Phase 8]','2026-10-18 15:23:42','2026-10-18 15:23:42','NOVELIA10',_binary ''),(7,'NOV-20261018-08CF16',19,336000.00,30000.00,33600.00,332400.00,'CANCELLED','Nguyen Van A','0901234567','So 123 Pho Sach, Quan Dong Da, Ha Noi','[Hủy bởi Khách: Khach hang doi y kiem thu Phase 8]','2026-10-18 15:25:09','2026-10-18 15:25:10','NOVELIA10',_binary ''),(8,'NOV-20261018-AD01A2',14,184000.00,30000.00,0.00,214000.00,'DELIVERED','đặng đức anh','0898904221','fbebcdc, febbbeb, vèedvd, hnoi',NULL,'2026-10-18 15:26:06','2026-10-18 15:29:04',NULL,_binary '\0');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `payment_method` enum('BANK_TRANSFER','COD','VNPAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('FAILED','PAID','REFUNDED','UNPAID') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_order` (`order_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'COD','UNPAID',NULL,190000.00,NULL,'Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-17 14:59:39'),(2,2,'COD','PAID',NULL,454000.00,'2026-10-18 22:29:15','Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-17 16:21:12'),(3,3,'COD','UNPAID',NULL,332400.00,NULL,'Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-17 16:22:10'),(4,4,'COD','UNPAID',NULL,332400.00,NULL,'Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-18 12:37:14'),(5,5,'COD','UNPAID',NULL,332400.00,NULL,'Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-18 12:48:26'),(6,6,'COD','UNPAID',NULL,332400.00,NULL,'Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-18 15:23:42'),(7,7,'COD','UNPAID',NULL,332400.00,NULL,'Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-18 15:25:09'),(8,8,'COD','PAID',NULL,214000.00,'2026-10-18 22:29:04','Thanh toán tiền mặt khi nhận hàng (COD)','2026-10-18 15:26:06');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `moderated_at` datetime(6) DEFAULT NULL,
  `moderated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('APPROVED','PENDING','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified_purchase` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  KEY `idx_review_book` (`book_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,1,NULL,5,'Tác phẩm bìa cứng hoàn thiện cực kỳ tinh xảo, chất giấy vàng kem ngà bảo vệ mắt, dịch thuật chuẩn xác và văn phong lưu loát. Rất đáng sưu tầm trong tủ sách!',1,'2026-10-16 16:23:33','2026-10-14 23:23:33.327995','admin@noveliabooks.vn',NULL,'APPROVED',NULL);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ROLE_ADMIN','Qu???n tr??? vi??n to??n quy???n h??? th???ng','2026-10-16 11:58:05'),(2,'ROLE_STAFF','Nh??n vi??n qu???n l?? kho v?? ????n h??ng','2026-10-16 11:58:05'),(3,'ROLE_CUSTOMER','Kh??ch h??ng mua s??ch','2026-10-16 11:58:05');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipments`
--

DROP TABLE IF EXISTS `shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_carrier` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GiaoHangNhanh',
  `shipping_status` enum('DELIVERED','FAILED_ATTEMPT','IN_TRANSIT','PENDING','PICKED_UP','RETURNED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_delivery` datetime DEFAULT NULL,
  `actual_delivery` datetime DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shipment_order` (`order_id`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (3,1),(3,2),(1,3),(2,3),(4,3),(5,3),(6,3),(7,3),(8,3),(9,3),(10,3),(11,3),(12,3),(13,3),(14,3),(15,3),(16,3),(17,3),(18,3),(19,3),(20,3);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','LOCKED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_email` (`email`),
  KEY `idx_user_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'reader1@noveliabooks.vn','$2a$10$RRXfDTLmyk2DJUNi8MbIiOiXnjkUIswFRLMqCwAWCOVxvvaey2kBu','Nguyen Van Reader','0900000001',NULL,'ACTIVE','2026-10-16 12:20:48','2026-10-16 12:20:48'),(2,'testrunner@noveliabooks.vn','$2a$10$yzoAzIyuAK0ic3DuSJix6e2hAdz3pbf8KIhVLGfJAaG1A1EPID1PG','Kiểm Thử Viên','0987654321',NULL,'ACTIVE','2026-10-16 12:36:37','2026-10-16 12:36:37'),(3,'admin@noveliabooks.vn','$2a$10$c/66pjUNzn3pD.DSG.49u.MwyqH/4qYqrojFKm.nsTA3j3tHiQ6X6','Quản Trị Viên NOVELIA','0900000001',NULL,'ACTIVE','2026-10-16 12:41:55','2026-10-16 12:41:55'),(4,'admin@novelia.vn','$2a$10$sKTNItHHQi5m1dNj0YeQ2u8LcNr18ZUpM.C9FIGgT.kXBxcjV79w6','Admin User',NULL,NULL,'ACTIVE','2026-10-16 15:29:17','2026-10-16 15:29:17'),(5,'p8_user_1792253808570@novelia.vn','$2a$10$C61toTbqkTjANl0qrhN/qu6tx9O/31g8xbE9gwtcNNVGkIYFkF3em','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-17 16:16:49','2026-10-17 16:16:49'),(6,'p8_user1_1792254053416@novelia.vn','$2a$10$crEufi/ctffdADUq0yGpYuoIXz/T3GWSGymiiPPMU/1nIrpGlbNwO','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-17 16:20:54','2026-10-17 16:20:54'),(7,'p8_user2_1792254053416@novelia.vn','$2a$10$etCTJmC4VWJHgrG4XGd79u9MH3n2ZjE1T/em9RBg6McGTZTTIWMqO','Customer Two','0911223344',NULL,'ACTIVE','2026-10-17 16:20:55','2026-10-17 16:20:55'),(8,'p8_user1_1792254128452@novelia.vn','$2a$10$kWTfm8pOURHwpDoGF5K.t.ZlbbjTp/sykjsRiS.v8Uv9J7OprSth.','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-17 16:22:09','2026-10-17 16:22:09'),(9,'p8_user2_1792254128452@novelia.vn','$2a$10$HEQ21snXjQL6Gyef1fV7tOZ2nQkjDf0mN1Xg6VvUB049PJffI647i','Customer Two','0911223344',NULL,'ACTIVE','2026-10-17 16:22:10','2026-10-17 16:22:10'),(10,'p8_user1_1792327031865@novelia.vn','$2a$10$QTJU/Gl.zOYf8tTrDtMn1uItiZcfyR3HG9xJGQkHVuVZx33bnuoJS','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-18 12:37:12','2026-10-18 12:37:12'),(11,'p8_user2_1792327031865@novelia.vn','$2a$10$jhmTjJPrabvxVEom2vbi4.QkERPghfryOzuCKAGBbqM1wPl.seMSu','Customer Two','0911223344',NULL,'ACTIVE','2026-10-18 12:37:14','2026-10-18 12:37:14'),(12,'p8_user1_1792327703780@novelia.vn','$2a$10$H4tw9nZwdfJMvUV/Zwy27OFHMmEUJf2.0dtkshIQxKQRLSsqw1bfC','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-18 12:48:24','2026-10-18 12:48:24'),(13,'p8_user2_1792327703780@novelia.vn','$2a$10$kjPAVUOtETjaapBQVbS/VO0eKdB3t9N37nY9ceKHYqO/SANs4SCeS','Customer Two','0911223344',NULL,'ACTIVE','2026-10-18 12:48:26','2026-10-18 12:48:26'),(14,'ducanh0918273645@gmail.com','$2a$10$J6v6YBYYwPRkvwcLtmLR1OP23qXXtw59iok2NK5Hq4Y3g2BOTvFOO','đặng đức anh','0898904221',NULL,'ACTIVE','2026-10-18 12:54:21','2026-10-18 12:54:21'),(15,'p8_user1_1792336843180@novelia.vn','$2a$10$zkKGW6oyk9G/Pux2NrQ5Q./t2QVQGafUqLg94zBCgOrrUqKs/xk2y','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-18 15:20:44','2026-10-18 15:20:44'),(16,'p8_user2_1792336843180@novelia.vn','$2a$10$pP00R.Uzi6wXDEolnfB7OujACZDSiAWONbnvApGfWj6YN8tYCobme','Customer Two','0911223344',NULL,'ACTIVE','2026-10-18 15:20:45','2026-10-18 15:20:45'),(17,'p8_user1_1792337019773@novelia.vn','$2a$10$.Qxf3T.obDyLMNb/CmjQ/O2oCT2PHobFR7YecLfCOgy2kqfkZxnaG','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-18 15:23:40','2026-10-18 15:23:40'),(18,'p8_user2_1792337019773@novelia.vn','$2a$10$6FRGptbuyDdA8eWeKi8uUeBI03HbF2rPBudixNG6QIfrhARoLQ3RK','Customer Two','0911223344',NULL,'ACTIVE','2026-10-18 15:23:42','2026-10-18 15:23:42'),(19,'p8_user1_1792337108686@novelia.vn','$2a$10$sqfkc0040nN80ynW4JpL7O.E1vhGd15eRHNpTF444ncEReQBLotv6','Bui Tien Dung Phase8','0988776655',NULL,'ACTIVE','2026-10-18 15:25:09','2026-10-18 15:25:09'),(20,'p8_user2_1792337108686@novelia.vn','$2a$10$pbFMr7ELaqzQMsBUKtQvgulnQIMMIqzDI2bJSnrwYsg.RpIviGORG','Customer Two','0911223344',NULL,'ACTIVE','2026-10-18 15:25:10','2026-10-18 15:25:10');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-18 22:40:56
