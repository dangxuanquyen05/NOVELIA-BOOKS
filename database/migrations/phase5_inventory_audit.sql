-- ===================================================================
-- NOVELIA BOOKS - Database Migration: Phase 5 Inventory Enhancement
-- Mục đích: Bổ sung trường performed_by cho nhật ký biến động kho và ràng buộc không âm
-- Lưu ý: Không làm mất mát hoặc ảnh hưởng đến dữ liệu hiện có trong database
-- ===================================================================

USE novelia_books;

-- 1. Bổ sung cột performed_by lưu email người thực hiện (Admin / Nhân viên kho / Khách hàng / Hệ thống)
ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS performed_by VARCHAR(100) NULL AFTER note;

-- 2. Đảm bảo ràng buộc kiểm tra số lượng tồn không bao giờ âm
-- (Chỉ áp dụng nếu bảng chưa có constraint)
ALTER TABLE inventory
ADD CONSTRAINT chk_inventory_qty CHECK (quantity >= 0);

ALTER TABLE inventory
ADD CONSTRAINT chk_inventory_reserved CHECK (reserved_quantity >= 0);
