// ===================================================================
// VIETNAM ADMINISTRATIVE LOCATIONS DATASET (63 PROVINCES & CITIES)
// Chuẩn hóa danh mục Tỉnh/Thành phố, Quận/Huyện, Phường/Xã Việt Nam
// ===================================================================

export interface Ward {
  name: string;
  code?: string;
}

export interface District {
  name: string;
  code?: string;
  wards: string[];
}

export interface Province {
  name: string;
  code?: string;
  region: 'BAC' | 'TRUNG' | 'NAM';
  districts: District[];
}

export const VIETNAM_PROVINCES: Province[] = [
  // -------------------------------------------------------------
  // TP. HỒ CHÍ MINH
  // -------------------------------------------------------------
  {
    name: 'TP. Hồ Chí Minh',
    region: 'NAM',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định', 'Phường Phạm Ngũ Lão', 'Phường Cầu Ông Lãnh', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Cầu Kho', 'Phường Cô Giang']
      },
      {
        name: 'Quận 3',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14', 'Phường Võ Thị Sáu']
      },
      {
        name: 'Quận 5',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14']
      },
      {
        name: 'Quận 7',
        wards: ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Phú Mỹ', 'Phường Tân Hưng', 'Phường Tân Kiểng', 'Phường Bình Thuận', 'Phường Phú Thuận', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây']
      },
      {
        name: 'Quận 10',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Thành phố Thủ Đức',
        wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường An Khánh', 'Phường Thủ Thiêm', 'Phường Bình Thọ', 'Phường Linh Chiểu', 'Phường Linh Trung', 'Phường Linh Tây', 'Phường Linh Đông', 'Phường Hiệp Phú', 'Phường Tăng Nhơn Phú A', 'Phường Tăng Nhơn Phú B', 'Phường Phước Long A', 'Phường Phước Long B']
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28']
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17']
      },
      {
        name: 'Quận Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17']
      },
      {
        name: 'Quận 4',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18']
      },
      {
        name: 'Quận 6',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14']
      },
      {
        name: 'Quận 8',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16']
      },
      {
        name: 'Quận 11',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16']
      },
      {
        name: 'Quận 12',
        wards: ['Phường An Phú Đông', 'Phường Đông Hưng Thuận', 'Phường Hiệp Thành', 'Phường Tân Chánh Hiệp', 'Phường Tân Hưng Thuận', 'Phường Tân Thới Hiệp', 'Phường Tân Thới Nhất', 'Phường Thạnh Lộc', 'Phường Thạnh Xuân', 'Phường Thới An', 'Phường Trung Mỹ Tây']
      },
      {
        name: 'Quận Tân Phú',
        wards: ['Phường Hiệp Tân', 'Phường Hòa Thạnh', 'Phường Phú Thạnh', 'Phường Phú Thọ Hòa', 'Phường Phú Trung', 'Phường Sơn Kỳ', 'Phường Tân Quý', 'Phường Tân Sơn Nhì', 'Phường Tân Thành', 'Phường Tân Thới Hòa', 'Phường Tây Thạnh']
      },
      {
        name: 'Quận Bình Tân',
        wards: ['Phường An Lạc', 'Phường An Lạc A', 'Phường Bình Hưng Hòa', 'Phường Bình Hưng Hòa A', 'Phường Bình Hưng Hòa B', 'Phường Bình Trị Đông', 'Phường Bình Trị Đông A', 'Phường Bình Trị Đông B', 'Phường Tân Tạo', 'Phường Tân Tạo A']
      },
      {
        name: 'Huyện Bình Chánh',
        wards: ['Thị trấn Tân Túc', 'Xã An Phú Tây', 'Xã Bình Chánh', 'Xã Bình Hưng', 'Xã Bình Lợi', 'Xã Đa Phước', 'Xã Hưng Long', 'Xã Lê Minh Xuân', 'Xã Phạm Văn Hai', 'Xã Phong Phú', 'Xã Quy Đức', 'Xã Tân Kiên', 'Xã Tân Nhựt', 'Xã Tân Quý Tây', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B']
      },
      {
        name: 'Huyện Hóc Môn',
        wards: ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Hiệp', 'Xã Tân Thới Nhì', 'Xã Tân Xuân', 'Xã Thới Tam Thôn', 'Xã Trung Chánh', 'Xã Xuân Thới Đông', 'Xã Xuân Thới Sơn', 'Xã Xuân Thới Thượng']
      },
      {
        name: 'Huyện Nhà Bè',
        wards: ['Thị trấn Nhà Bè', 'Xã Hiệp Phước', 'Xã Long Thới', 'Xã Nhơn Đức', 'Xã Phú Xuân', 'Xã Phước Kiển', 'Xã Phước Lộc']
      },
      {
        name: 'Huyện Củ Chi',
        wards: ['Thị trấn Củ Chi', 'Xã An Nhơn Tây', 'Xã An Phú', 'Xã Bình Mỹ', 'Xã Nhuận Đức', 'Xã Phạm Văn Cội', 'Xã Phú Hòa Đông', 'Xã Tân An Hội', 'Xã Tân Thạnh Đông', 'Xã Tân Thạnh Tây', 'Xã Trung An']
      },
      {
        name: 'Huyện Cần Giờ',
        wards: ['Thị trấn Cần Thạnh', 'Xã An Thới Đông', 'Xã Bình Khánh', 'Xã Long Hòa', 'Xã Lý Nhơn', 'Xã Tam Thôn Hiệp', 'Xã Thạnh An']
      }
    ]
  },

  // -------------------------------------------------------------
  // HÀ NỘI (KHO TRUNG TÂM NOVELIA)
  // -------------------------------------------------------------
  {
    name: 'Hà Nội',
    region: 'BAC',
    districts: [
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Hàng Bột', 'Phường Khâm Thiên', 'Phường Khương Thượng', 'Phường Kim Liên', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Nam Đồng', 'Phường Ngã Tư Sở', 'Phường Ô Chợ Dừa', 'Phường Phương Liên', 'Phường Phương Mai', 'Phường Quang Trung', 'Phường Quốc Tử Giám', 'Phường Thịnh Quang', 'Phường Thổ Quan', 'Phường Trung Liệt', 'Phường Trung Phụng', 'Phường Trung Tự', 'Phường Văn Chương', 'Phường Văn Miếu']
      },
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Tràng Tiền', 'Phường Hàng Bạc', 'Phường Hàng Bồ', 'Phường Hàng Bông', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Hàng Gai', 'Phường Hàng Mã', 'Phường Hàng Trống', 'Phường Cửa Đông', 'Phường Cửa Nam', 'Phường Đồng Xuân', 'Phường Lý Thái Tổ', 'Phường Phan Chu Trinh', 'Phường Phúc Tân', 'Phường Chương Dương']
      },
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Ngọc Khánh', 'Phường Nguyễn Trung Trực', 'Phường Phúc Xá', 'Phường Quán Thánh', 'Phường Thành Công', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc']
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bạch Đằng', 'Phường Bách Khoa', 'Phường Bạch Mai', 'Phường Cầu Dền', 'Phường Đống Mác', 'Phường Đồng Nhân', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Nguyễn Du', 'Phường Phạm Đình Hổ', 'Phường Phố Huế', 'Phường Quỳnh Lôi', 'Phường Quỳnh Mai', 'Phường Thanh Lương', 'Phường Thanh Nhàn', 'Phường Trương Định', 'Phường Vĩnh Tuy']
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa']
      },
      {
        name: 'Quận Thanh Xuân',
        wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Kim Giang', 'Phường Nhân Chính', 'Phường Phương Liệt', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Thanh Xuân Trung', 'Phường Thượng Đình']
      },
      {
        name: 'Quận Tây Hồ',
        wards: ['Phường Bưởi', 'Phường Nhật Tân', 'Phường Phú Thượng', 'Phường Quảng An', 'Phường Thụy Khuê', 'Phường Tứ Liên', 'Phường Xuân La', 'Phường Yên Phụ']
      },
      {
        name: 'Quận Nam Từ Liêm',
        wards: ['Phường Cầu Diễn', 'Phường Đại Mỗ', 'Phường Mễ Trì', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Phú Đô', 'Phường Phương Canh', 'Phường Tây Mỗ', 'Phường Trung Văn', 'Phường Xuân Phương']
      },
      {
        name: 'Quận Bắc Từ Liêm',
        wards: ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Đông Ngạc', 'Phường Đức Thắng', 'Phường Liên Mạc', 'Phường Minh Khai', 'Phường Phú Diễn', 'Phường Phúc Diễn', 'Phường Tây Tựu', 'Phường Thượng Cát', 'Phường Thụy Phương', 'Phường Xuân Đỉnh', 'Phường Xuân Tảo']
      },
      {
        name: 'Quận Long Biên',
        wards: ['Phường Bồ Đề', 'Phường Cự Khối', 'Phường Đức Giang', 'Phường Gia Thụy', 'Phường Giang Biên', 'Phường Long Biên', 'Phường Ngọc Lâm', 'Phường Ngọc Thụy', 'Phường Phúc Đồng', 'Phường Phúc Lợi', 'Phường Sài Đồng', 'Phường Thạch Bàn', 'Phường Thượng Thanh', 'Phường Việt Hưng']
      },
      {
        name: 'Quận Hà Đông',
        wards: ['Phường Biên Giang', 'Phường Đồng Mai', 'Phường Dương Nội', 'Phường Hà Cầu', 'Phường Kiến Hưng', 'Phường La Khê', 'Phường Mộ Lao', 'Phường Nguyễn Trãi', 'Phường Phú La', 'Phường Phú Lãm', 'Phường Phú Lương', 'Phường Phúc La', 'Phường Quang Trung', 'Phường Vạn Phúc', 'Phường Văn Quán', 'Phường Yên Nghĩa', 'Phường Yết Kiêu']
      },
      {
        name: 'Quận Hoàng Mai',
        wards: ['Phường Đại Kim', 'Phường Định Công', 'Phường Giáp Bát', 'Phường Hoàng Liệt', 'Phường Hoàng Văn Thụ', 'Phường Lĩnh Nam', 'Phường Mai Động', 'Phường Tân Mai', 'Phường Thanh Trì', 'Phường Thịnh Liệt', 'Phường Trần Phú', 'Phường Tương Mai', 'Phường Vĩnh Hưng', 'Phường Yên Sở']
      },
      {
        name: 'Huyện Gia Lâm',
        wards: ['Thị trấn Trâu Quỳ', 'Thị trấn Yên Viên', 'Xã Bát Tràng', 'Xã Cổ Bi', 'Xã Đa Tốn', 'Xã Đặng Xá', 'Xã Dương Xá', 'Xã Kiêu Kỵ', 'Xã Ninh Hiệp', 'Xã Phù Đổng']
      },
      {
        name: 'Huyện Đông Anh',
        wards: ['Thị trấn Đông Anh', 'Xã Bắc Hồng', 'Xã Cổ Loa', 'Xã Hải Bối', 'Xã Kim Chung', 'Xã Kim Nỗ', 'Xã Mai Lâm', 'Xã Nam Hồng', 'Xã Tàm Xá', 'Xã Tiên Dương', 'Xã Uy Nỗ', 'Xã Vĩnh Ngọc', 'Xã Võng La', 'Xã Xuân Canh']
      },
      {
        name: 'Huyện Thanh Trì',
        wards: ['Thị trấn Văn Điển', 'Xã Đại Áng', 'Xã Đông Mỹ', 'Xã Duyên Hà', 'Xã Hữu Hòa', 'Xã Liên Ninh', 'Xã Ngọc Hồi', 'Xã Ngũ Hiệp', 'Xã Tả Thanh Oai', 'Xã Tam Hiệp', 'Xã Tân Triều', 'Xã Thanh Liệt', 'Xã Tứ Hiệp', 'Xã Vạn Phúc', 'Xã Vĩnh Quỳnh', 'Xã Yên Mỹ']
      },
      {
        name: 'Huyện Hoài Đức',
        wards: ['Thị trấn Trạm Trôi', 'Xã An Khánh', 'Xã An Thượng', 'Xã Cát Quế', 'Xã Đắc Sở', 'Xã Di Trạch', 'Xã Đông La', 'Xã Đức Giang', 'Xã Đức Thượng', 'Xã Kim Chung', 'Xã La Phù', 'Xã Lại Yên', 'Xã Song Phương', 'Xã Tiền Yên', 'Xã Vân Canh', 'Xã Vân Côn', 'Xã Yên Sở']
      },
      {
        name: 'Huyện Đan Phượng',
        wards: ['Thị trấn Phùng', 'Xã Đan Phượng', 'Xã Đồng Tháp', 'Xã Hạ Mỗ', 'Xã Hồng Hà', 'Xã Liên Hà', 'Xã Liên Hồng', 'Xã Liên Trung', 'Xã Phương Đình', 'Xã Song Phượng', 'Xã Tân Hội', 'Xã Tân Lập', 'Xã Thọ An', 'Xã Thọ Xuân', 'Xã Thượng Mỗ', 'Xã Trung Châu']
      },
      {
        name: 'Thị xã Sơn Tây',
        wards: ['Phường Lê Lợi', 'Phường Ngô Quyền', 'Phường Phú Thịnh', 'Phường Quang Trung', 'Phường Sơn Lộc', 'Phường Trung Hưng', 'Phường Trung Sơn Trầm', 'Phường Xuân Khanh', 'Phường Viên Sơn', 'Xã Cổ Đông', 'Xã Đường Lâm', 'Xã Kim Sơn', 'Xã Sơn Đông', 'Xã Thanh Mỹ', 'Xã Xuân Sơn']
      }
    ]
  },

  // -------------------------------------------------------------
  // ĐÀ NẴNG
  // -------------------------------------------------------------
  {
    name: 'Đà Nẵng',
    region: 'TRUNG',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Thuận Đông', 'Phường Hòa Thuận Tây', 'Phường Nam Dương', 'Phường Phước Ninh', 'Phường Bình Thuận', 'Phường Bình Hiên', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam']
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Nại Hiên Đông', 'Phường Phước Mỹ', 'Phường Thọ Quang']
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường An Khê', 'Phường Chính Gián', 'Phường Hòa Khê', 'Phường Tam Thuận', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Thanh Khê Đông', 'Phường Thanh Khê Tây', 'Phường Vĩnh Trung', 'Phường Xuân Hà']
      },
      {
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Hòa Hải', 'Phường Hòa Quý', 'Phường Khuê Mỹ', 'Phường Mỹ An']
      },
      {
        name: 'Quận Cẩm Lệ',
        wards: ['Phường Hòa An', 'Phường Hòa Phát', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Hòa Xuân', 'Phường Khuê Trung']
      },
      {
        name: 'Quận Liên Chiểu',
        wards: ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Minh']
      },
      {
        name: 'Huyện Hòa Vang',
        wards: ['Xã Hòa Bắc', 'Xã Hòa Châu', 'Xã Hòa Khương', 'Xã Hòa Liên', 'Xã Hòa Nhơn', 'Xã Hòa Ninh', 'Xã Hòa Phong', 'Xã Hòa Phú', 'Xã Hòa Phước', 'Xã Hòa Sơn', 'Xã Hòa Tiến']
      }
    ]
  },

  // -------------------------------------------------------------
  // HẢI PHÒNG
  // -------------------------------------------------------------
  {
    name: 'Hải Phòng',
    region: 'BAC',
    districts: [
      {
        name: 'Quận Hồng Bàng',
        wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Quán Toan', 'Phường Sở Dầu', 'Phường Thượng Lý', 'Phường Trại Chuối', 'Phường Hùng Vương', 'Phường Hạ Lý']
      },
      {
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Cầu Tre', 'Phường Đằng Giang', 'Phường Đông Khê', 'Phường Gia Viên', 'Phường Lạc Viên', 'Phường Lạch Tray', 'Phường Lê Lợi', 'Phường Máy Chai', 'Phường Máy Tơ', 'Phường Vạn Mỹ']
      },
      {
        name: 'Quận Lê Chân',
        wards: ['Phường An Biên', 'Phường An Dương', 'Phường Cát Dài', 'Phường Dư Hàng', 'Phường Dư Hàng Kênh', 'Phường Hàng Kênh', 'Phường Hồ Nam', 'Phường Kênh Dương', 'Phường Lam Sơn', 'Phường Niệm Nghĩa', 'Phường Nghĩa Xá', 'Phường Trại Cau', 'Phường Trần Nguyên Hãn', 'Phường Vĩnh Niệm']
      },
      {
        name: 'Quận Hải An',
        wards: ['Phường Cát Bi', 'Phường Đằng Hải', 'Phường Đằng Lâm', 'Phường Đông Hải 1', 'Phường Đông Hải 2', 'Phường Nam Hải', 'Phường Thành Tô', 'Phường Tràng Cát']
      },
      {
        name: 'Huyện Thủy Nguyên',
        wards: ['Thị trấn Núi Đèo', 'Thị trấn Minh Đức', 'Xã An Lư', 'Xã Dương Quan', 'Xã Hoa Động', 'Xã Hoàng Động', 'Xã Lâm Động', 'Xã Lập Lễ', 'Xã Lưu Kiếm', 'Xã Thủy Đường']
      }
    ]
  },

  // -------------------------------------------------------------
  // CẦN THƠ
  // -------------------------------------------------------------
  {
    name: 'Cần Thơ',
    region: 'NAM',
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường An Bình', 'Phường An Cư', 'Phường An Hòa', 'Phường An Khánh', 'Phường An Nghiệp', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Tân An', 'Phường Thới Bình', 'Phường Xuân Khánh']
      },
      {
        name: 'Quận Cái Răng',
        wards: ['Phường Ba Láng', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Lê Bình', 'Phường Phú Thứ', 'Phường Tân Phú', 'Phường Thường Thạnh']
      },
      {
        name: 'Quận Bình Thủy',
        wards: ['Phường An Thới', 'Phường Bình Thủy', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền', 'Phường Thới An Đông', 'Phường Trà An', 'Phường Trà Nóc']
      },
      {
        name: 'Quận Ô Môn',
        wards: ['Phường Châu Văn Liêm', 'Phường Phước Thới', 'Phường Thới An', 'Phường Thới Hòa', 'Phường Thới Long']
      }
    ]
  },

  // -------------------------------------------------------------
  // BÌNH DƯƠNG
  // -------------------------------------------------------------
  {
    name: 'Bình Dương',
    region: 'NAM',
    districts: [
      {
        name: 'Thành phố Thủ Dầu Một',
        wards: ['Phường Chánh Mỹ', 'Phường Chánh Nghĩa', 'Phường Định Hòa', 'Phường Hiệp An', 'Phường Hiệp Thành', 'Phường Hòa Phú', 'Phường Phú Cường', 'Phường Phú Hòa', 'Phường Phú Lợi', 'Phường Phú Mỹ', 'Phường Phú Tân', 'Phường Phú Thọ', 'Phường Tân An', 'Phường Tương Bình Hiệp']
      },
      {
        name: 'Thành phố Thuận An',
        wards: ['Phường An Phú', 'Phường An Thạnh', 'Phường Bình Chuẩn', 'Phường Bình Hòa', 'Phường Bình Nhâm', 'Phường Hưng Định', 'Phường Lái Thiêu', 'Phường Thuận Giao', 'Phường Vĩnh Phú', 'Xã An Sơn']
      },
      {
        name: 'Thành phố Dĩ An',
        wards: ['Phường An Bình', 'Phường Bình An', 'Phường Bình Thắng', 'Phường Dĩ An', 'Phường Đông Hòa', 'Phường Tân Bình', 'Phường Tân Đông Hiệp']
      },
      {
        name: 'Thành phố Bến Cát',
        wards: ['Phường Mỹ Phước', 'Phường Thới Hòa', 'Phường Tân Định', 'Phường Hòa Lợi', 'Phường Chánh Phú Hòa', 'Xã An Điền', 'Xã An Tây', 'Xã Phú An']
      },
      {
        name: 'Thành phố Tân Uyên',
        wards: ['Phường Uyên Hưng', 'Phường Tân Phước Khánh', 'Phường Thái Hòa', 'Phường Thạnh Phước', 'Phường Tân Hiệp', 'Phường Khánh Bình', 'Xã Bạch Đằng', 'Xã Thạnh Hội']
      }
    ]
  },

  // -------------------------------------------------------------
  // ĐỒNG NAI
  // -------------------------------------------------------------
  {
    name: 'Đồng Nai',
    region: 'NAM',
    districts: [
      {
        name: 'Thành phố Biên Hòa',
        wards: ['Phường An Bình', 'Phường Bửu Long', 'Phường Hòa Bình', 'Phường Hố Nai', 'Phường Long Bình', 'Phường Long Bình Tân', 'Phường Quang Vinh', 'Phường Quyết Thắng', 'Phường Tam Hiệp', 'Phường Tam Hòa', 'Phường Tân Biên', 'Phường Tân Hạnh', 'Phường Tân Hòa', 'Phường Tân Hiệp', 'Phường Tân Mai', 'Phường Tân Phong', 'Phường Tân Tiến', 'Phường Tân Vạn', 'Phường Thanh Bình', 'Phường Thống Nhất', 'Phường Trảng Dài', 'Phường Trung Dũng']
      },
      {
        name: 'Thành phố Long Khánh',
        wards: ['Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa', 'Phường Xuân Trung', 'Phường Xuân Thanh', 'Phường Phú Bình', 'Phường Bảo Vinh', 'Phường Suối Tre', 'Phường Bàu Sen']
      },
      {
        name: 'Huyện Long Thành',
        wards: ['Thị trấn Long Thành', 'Xã An Phước', 'Xã Bình An', 'Xã Bình Sơn', 'Xã Cẩm Đường', 'Xã Lộc An', 'Xã Long An', 'Xã Long Đức', 'Xã Phước Bình', 'Xã Phước Thái', 'Xã Tam An']
      },
      {
        name: 'Huyện Nhơn Trạch',
        wards: ['Thị trấn Hiệp Phước', 'Xã Đại Phước', 'Xã Long Tân', 'Xã Long Thọ', 'Xã Phú Đông', 'Xã Phú Hữu', 'Xã Phú Hội', 'Xã Phú Thạnh', 'Xã Phước An', 'Xã Phước Khánh', 'Xã Phước Thiền', 'Xã Vĩnh Thanh']
      }
    ]
  },

  // -------------------------------------------------------------
  // BÀ RỊA - VŨNG TÀU
  // -------------------------------------------------------------
  {
    name: 'Bà Rịa - Vũng Tàu',
    region: 'NAM',
    districts: [
      {
        name: 'Thành phố Vũng Tàu',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường Thắng Nhất', 'Phường Thắng Nhì', 'Phường Thắng Tam', 'Phường Rạch Dừa', 'Phường Nguyễn An Ninh', 'Xã Long Sơn']
      },
      {
        name: 'Thành phố Bà Rịa',
        wards: ['Phường Phước Hiệp', 'Phường Phước Hưng', 'Phường Phước Nguyên', 'Phường Phước Trung', 'Phường Long Hương', 'Phường Long Toàn', 'Phường Long Tâm', 'Phường Kim Dinh']
      },
      {
        name: 'Thị xã Phú Mỹ',
        wards: ['Phường Phú Mỹ', 'Phường Hắc Dịch', 'Phường Mỹ Xuân', 'Phường Phước Hòa', 'Phường Tân Phước', 'Xã Châu Pha', 'Xã Sông Xoài', 'Xã Tân Hải', 'Xã Tân Hòa', 'Xã Tóc Tiên']
      }
    ]
  },

  // -------------------------------------------------------------
  // THỪA THIÊN HUẾ
  // -------------------------------------------------------------
  {
    name: 'Thừa Thiên Huế',
    region: 'TRUNG',
    districts: [
      {
        name: 'Thành phố Huế',
        wards: ['Phường Phú Nhuận', 'Phường Vĩnh Ninh', 'Phường Phước Vĩnh', 'Phường Trường An', 'Phường Xuân Phú', 'Phường An Cựu', 'Phường Vỹ Dạ', 'Phường Phú Hội', 'Phường Thuận Lộc', 'Phường Thuận Thành', 'Phường Tây Lộc', 'Phường Thuận Hòa', 'Phường Kim Long', 'Phường Hương Long', 'Phường Hương Sơ', 'Phường An Hòa', 'Phường Hương Vinh', 'Phường Thủy Xuân', 'Phường Thủy Biều']
      },
      {
        name: 'Thị xã Hương Thủy',
        wards: ['Phường Phú Bài', 'Phường Thủy Dương', 'Phường Thủy Phương', 'Phường Thủy Lương', 'Phường Thủy Châu']
      },
      {
        name: 'Thị xã Hương Trà',
        wards: ['Phường Tứ Hạ', 'Phường Hương Văn', 'Phường Hương Xuân', 'Phường Hương Chữ', 'Phường Hương Vân']
      }
    ]
  },

  // -------------------------------------------------------------
  // QUẢNG NINH
  // -------------------------------------------------------------
  {
    name: 'Quảng Ninh',
    region: 'BAC',
    districts: [
      {
        name: 'Thành phố Hạ Long',
        wards: ['Phường Bãi Cháy', 'Phường Bạch Đằng', 'Phường Cao Thắng', 'Phường Cao Xanh', 'Phường Đại Yên', 'Phường Giếng Đáy', 'Phường Hà Khánh', 'Phường Hà Khẩu', 'Phường Hà Lầm', 'Phường Hà Phong', 'Phường Hà Trung', 'Phường Hà Tu', 'Phường Hoành Bồ', 'Phường Hùng Thắng', 'Phường Hồng Gai', 'Phường Hồng Hà', 'Phường Hồng Hải', 'Phường Trần Hưng Đạo', 'Phường Tuần Châu', 'Phường Việt Hưng', 'Phường Yết Kiêu']
      },
      {
        name: 'Thành phố Cẩm Phả',
        wards: ['Phường Cẩm Bình', 'Phường Cẩm Đông', 'Phường Cẩm Phú', 'Phường Cẩm Sơn', 'Phường Cẩm Tây', 'Phường Cẩm Thạch', 'Phường Cẩm Thành', 'Phường Cẩm Thịnh', 'Phường Cẩm Thủy', 'Phường Cẩm Trung', 'Phường Cửa Ông', 'Phường Mông Dương', 'Phường Quang Hanh']
      },
      {
        name: 'Thành phố Uông Bí',
        wards: ['Phường Bắc Sơn', 'Phường Nam Khê', 'Phường Phương Đông', 'Phường Phương Nam', 'Phường Quang Trung', 'Phường Thanh Sơn', 'Phường Trưng Vương', 'Phường Vàng Danh', 'Phường Yên Thanh']
      },
      {
        name: 'Thành phố Móng Cái',
        wards: ['Phường Bình Ngọc', 'Phường Hải Hòa', 'Phường Hải Yên', 'Phường Ka Long', 'Phường Ninh Dương', 'Phường Trà Cổ', 'Phường Trần Phú']
      }
    ]
  },

  // -------------------------------------------------------------
  // BẮC NINH
  // -------------------------------------------------------------
  {
    name: 'Bắc Ninh',
    region: 'BAC',
    districts: [
      {
        name: 'Thành phố Bắc Ninh',
        wards: ['Phường Đáp Cầu', 'Phường Thị Cầu', 'Phường Vũ Ninh', 'Phường Suối Hoa', 'Phường Tiền An', 'Phường Ninh Xá', 'Phường Vệ An', 'Phường Kinh Bắc', 'Phường Đại Phúc', 'Phường Võ Cường', 'Phường Vân Dương', 'Phường Hạp Lĩnh', 'Phường Phong Khê', 'Phường Khúc Xuyên', 'Phường Khắc Niệm', 'Phường Hòa Long', 'Phường Kim Chân', 'Phường Nam Sơn', 'Phường Vân Dương']
      },
      {
        name: 'Thành phố Từ Sơn',
        wards: ['Phường Đông Ngàn', 'Phường Đồng Nguyên', 'Phường Tân Hồng', 'Phường Trang Hạ', 'Phường Đồng Kỵ', 'Phường Châu Khê', 'Phường Phù Chẩn', 'Phường Phù Khê', 'Phường Hương Mạc', 'Phường Tam Sơn', 'Phường Tương Giang', 'Phường Đình Bảng']
      },
      {
        name: 'Thị xã Thuận Thành',
        wards: ['Phường Hồ', 'Phường An Bình', 'Phường Gia Đông', 'Phường Hà Mãn', 'Phường Ninh Xá', 'Phường Song Hồ', 'Phường Thanh Khương', 'Phường Trạm Lộ', 'Phường Trí Quả', 'Phường Xuân Lâm']
      },
      {
        name: 'Thị xã Quế Võ',
        wards: ['Phường Phố Mới', 'Phường Bằng An', 'Phường Bồng Lai', 'Phường Cách Bi', 'Phường Đại Xuân', 'Phường Nhân Hòa', 'Phường Phù Lãng', 'Phường Phương Liễu', 'Phường Phượng Mao', 'Phường Quế Tân', 'Phường Việt Hùng']
      },
      {
        name: 'Huyện Yên Phong',
        wards: ['Thị trấn Chờ', 'Xã Dũng Liệt', 'Xã Đông Phong', 'Xã Đông Thọ', 'Xã Đông Tiến', 'Xã Hòa Tiến', 'Xã Long Châu', 'Xã Mai Đình', 'Xã Tam Đa', 'Xã Tam Giang', 'Xã Thụy Hòa', 'Xã Trung Nghĩa', 'Xã Văn Môn', 'Xã Yên Phụ', 'Xã Yên Trung']
      }
    ]
  },

  // -------------------------------------------------------------
  // LÂM ĐỒNG
  // -------------------------------------------------------------
  {
    name: 'Lâm Đồng',
    region: 'TRUNG',
    districts: [
      {
        name: 'Thành phố Đà Lạt',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Xã Tà Nung', 'Xã Trạm Hành', 'Xã Xuân Thọ', 'Xã Xuân Trường']
      },
      {
        name: 'Thành phố Bảo Lộc',
        wards: ['Phường 1', 'Phường 2', 'Phường B\'Lao', 'Phường Lộc Phát', 'Phường Lộc Sơn', 'Phường Lộc Tiến', 'Xã Đại Lào', 'Xã Đam B\'ri', 'Xã Lộc Châu', 'Xã Lộc Nga', 'Xã Lộc Thanh']
      },
      {
        name: 'Huyện Đức Trọng',
        wards: ['Thị trấn Liên Nghĩa', 'Xã Bình Thạnh', 'Xã Đà Loan', 'Xã Hiệp An', 'Xã Hiệp Thạnh', 'Xã Liên Hiệp', 'Xã Ninh Gia', 'Xã Ninh Loan', 'Xã N\'Thol Hạ', 'Xã Phú Hội', 'Xã Tà Hine', 'Xã Tà Năng', 'Xã Tân Hội', 'Xã Tân Thành']
      }
    ]
  },

  // -------------------------------------------------------------
  // KHÁNH HÒA
  // -------------------------------------------------------------
  {
    name: 'Khánh Hòa',
    region: 'TRUNG',
    districts: [
      {
        name: 'Thành phố Nha Trang',
        wards: ['Phường Lộc Thọ', 'Phường Tân Lập', 'Phường Phước Tiến', 'Phường Phước Tân', 'Phường Phương Sài', 'Phường Phương Sơn', 'Phường Vạn Thạnh', 'Phường Vạn Thắng', 'Phường Xương Huân', 'Phường Phước Hải', 'Phường Phước Long', 'Phường Vĩnh Hải', 'Phường Vĩnh Phước', 'Phường Vĩnh Thọ', 'Phường Vĩnh Nguyên', 'Phường Vĩnh Trường', 'Xã Vĩnh Hiệp', 'Xã Vĩnh Ngọc', 'Xã Vĩnh Thái', 'Xã Vĩnh Thạnh', 'Xã Vĩnh Trung']
      },
      {
        name: 'Thành phố Cam Ranh',
        wards: ['Phường Cam Lộc', 'Phường Cam Lợi', 'Phường Cam Linh', 'Phường Cam Thuận', 'Phường Cam Phú', 'Phường Ba Ngòi', 'Phường Cam Phúc Bắc', 'Phường Cam Phúc Nam', 'Phường Cam Nghĩa']
      }
    ]
  },

  // -------------------------------------------------------------
  // CÁC TỈNH THÀNH CÒN LẠI (MIỀN BẮC, MIỀN TRUNG, MIỀN NAM)
  // -------------------------------------------------------------
  {
    name: 'Nghệ An',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Vinh', wards: ['Phường Bến Thủy', 'Phường Cửa Nam', 'Phường Đội Cung', 'Phường Đông Vĩnh', 'Phường Hà Huy Tập', 'Phường Hưng Bình', 'Phường Hưng Dũng', 'Phường Hưng Phúc', 'Phường Lê Lợi', 'Phường Lê Mao', 'Phường Quán Bàu', 'Phường Quang Trung', 'Phường Trung Đô', 'Phường Trường Thi'] },
      { name: 'Thị xã Cửa Lò', wards: ['Phường Nghi Hải', 'Phường Nghi Hòa', 'Phường Nghi Hương', 'Phường Nghi Tân', 'Phường Nghi Thu', 'Phường Nghi Thủy', 'Phường Thu Thủy'] },
      { name: 'Huyện Diễn Châu', wards: ['Thị trấn Diễn Châu', 'Xã Diễn Hồng', 'Xã Diễn Kỷ', 'Xã Diễn Ngọc', 'Xã Diễn Thành'] }
    ]
  },
  {
    name: 'Thanh Hóa',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Thanh Hóa', wards: ['Phường Ba Đình', 'Phường Điện Biên', 'Phường Đông Hương', 'Phường Đông Sơn', 'Phường Đông Thọ', 'Phường Đông Vệ', 'Phường Hàm Rồng', 'Phường Lam Sơn', 'Phường Nam Ngạn', 'Phường Ngọc Trạo', 'Phường Phú Sơn', 'Phường Quảng Hưng', 'Phường Quảng Thắng', 'Phường Quảng Thành', 'Phường Tân Sơn', 'Phường Trường Thi'] },
      { name: 'Thành phố Sầm Sơn', wards: ['Phường Bắc Sơn', 'Phường Trung Sơn', 'Phường Trường Sơn', 'Phường Quảng Cư', 'Phường Quảng Tiến', 'Phường Quảng Châu', 'Phường Quảng Thọ', 'Phường Quảng Vinh'] },
      { name: 'Thị xã Bỉm Sơn', wards: ['Phường Ba Đình', 'Phường Bắc Sơn', 'Phường Đông Sơn', 'Phường Lam Sơn', 'Phường Ngọc Trạo', 'Phường Phú Sơn'] }
    ]
  },
  {
    name: 'Hải Dương',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Hải Dương', wards: ['Phường Lê Thanh Nghị', 'Phường Hải Tân', 'Phường Quang Trung', 'Phường Trần Phú', 'Phường Trần Hưng Đạo', 'Phường Nguyễn Trãi', 'Phường Bình Hàn', 'Phường Cẩm Thượng', 'Phường Phạm Ngũ Lão', 'Phường Thanh Bình', 'Phường Tân Bình', 'Phường Tứ Minh', 'Phường Việt Hòa'] },
      { name: 'Thành phố Chí Linh', wards: ['Phường Sao Đỏ', 'Phường Bến Tắm', 'Phường Chí Minh', 'Phường Cộng Hòa', 'Phường Đồng Lạc', 'Phường Hoàng Tân', 'Phường Phả Lại', 'Phường Thái Học', 'Phường Văn An'] }
    ]
  },
  {
    name: 'Hưng Yên',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Hưng Yên', wards: ['Phường Lam Sơn', 'Phường Hiến Nam', 'Phường An Tảo', 'Phường Lê Lợi', 'Phường Minh Khai', 'Phường Quang Trung', 'Phường Hồng Châu'] },
      { name: 'Thị xã Mỹ Hào', wards: ['Phường Bần Yên Nhân', 'Phường Bạch Sam', 'Phường Dị Sử', 'Phường Minh Đức', 'Phường Nhân Hòa', 'Phường Phùng Chí Kiên', 'Phường Phan Đình Phùng'] },
      { name: 'Huyện Văn Giang', wards: ['Thị trấn Văn Giang', 'Xã Cửu Cao', 'Xã Phụng Công', 'Xã Xuân Quan', 'Xã Long Hưng'] }
    ]
  },
  {
    name: 'Nam Định',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Nam Định', wards: ['Phường Cửa Bắc', 'Phường Cửa Nam', 'Phường Hạ Long', 'Phường Lộc Hạ', 'Phường Lộc Vượng', 'Phường Năng Tĩnh', 'Phường Phan Đình Phùng', 'Phường Quang Trung', 'Phường Thống Nhất', 'Phường Trần Đăng Ninh', 'Phường Trần Hưng Đạo', 'Phường Trần Tế Xương', 'Phường Trường Thi', 'Phường Vị Hoàng', 'Phường Vị Xuyên'] }
    ]
  },
  {
    name: 'Thái Bình',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Thái Bình', wards: ['Phường Bồ Xuyên', 'Phường Đề Thám', 'Phường Hoàng Diệu', 'Phường Kỳ Bá', 'Phường Lê Hồng Phong', 'Phường Phú Khánh', 'Phường Quang Trung', 'Phường Tiền Phong', 'Phường Trần Hưng Đạo', 'Phường Trần Lãm'] }
    ]
  },
  {
    name: 'Ninh Bình',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Ninh Bình', wards: ['Phường Bích Đào', 'Phường Đông Thành', 'Phường Nam Bình', 'Phường Nam Thành', 'Phường Phúc Thành', 'Phường Tân Thành', 'Phường Thanh Bình', 'Phường Vân Giang'] },
      { name: 'Thành phố Tam Điệp', wards: ['Phường Bắc Sơn', 'Phường Nam Sơn', 'Phường Tây Sơn', 'Phường Trung Sơn', 'Phường Yên Bình'] }
    ]
  },
  {
    name: 'Vĩnh Phúc',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Vĩnh Yên', wards: ['Phường Đống Đa', 'Phường Đồng Tâm', 'Phường Hội Hợp', 'Phường Khai Quang', 'Phường Liên Bảo', 'Phường Ngô Quyền', 'Phường Tích Sơn'] },
      { name: 'Thành phố Phúc Yên', wards: ['Phường Hùng Vương', 'Phường Nam Viêm', 'Phường Phúc Thắng', 'Phường Tiền Châu', 'Phường Trưng Nhị', 'Phường Trưng Trắc', 'Phường Xuân Hòa'] }
    ]
  },
  {
    name: 'Thái Nguyên',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Thái Nguyên', wards: ['Phường Cam Giá', 'Phường Chùa Hang', 'Phường Đồng Bẩm', 'Phường Đồng Quang', 'Phường Gia Sàng', 'Phường Hoàng Văn Thụ', 'Phường Lương Ngọc Quyến', 'Phường Phan Đình Phùng', 'Phường Phú Xá', 'Phường Quan Triều', 'Phường Quang Trung', 'Phường Tân Lập', 'Phường Tân Long', 'Phường Tân Thành', 'Phường Tân Thịnh', 'Phường Thắng Lợi', 'Phường Thịnh Đán', 'Phường Trung Thành', 'Phường Túc Duyên'] }
    ]
  },
  {
    name: 'Bắc Giang',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Bắc Giang', wards: ['Phường Dĩnh Kế', 'Phường Hoàng Văn Thụ', 'Phường Lê Lợi', 'Phường Mỹ Độ', 'Phường Ngô Quyền', 'Phường Song Mai', 'Phường Thọ Xương', 'Phường Trần Nguyên Hãn', 'Phường Trần Phú', 'Phường Xương Giang'] }
    ]
  },
  {
    name: 'Phú Thọ',
    region: 'BAC',
    districts: [
      { name: 'Thành phố Việt Trì', wards: ['Phường Bạch Hạc', 'Phường Bến Gót', 'Phường Dữu Lâu', 'Phường Gia Cẩm', 'Phường Nông Trang', 'Phường Tân Dân', 'Phường Thanh Miếu', 'Phường Thọ Sơn', 'Phường Tiên Cát', 'Phường Vân Cơ', 'Phường Vân Phú'] }
    ]
  },
  {
    name: 'Hà Tĩnh',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Hà Tĩnh', wards: ['Phường Bắc Hà', 'Phường Đại Nài', 'Phường Hà Huy Tập', 'Phường Nam Hà', 'Phường Nguyễn Du', 'Phường Tân Giang', 'Phường Thạch Linh', 'Phường Thạch Quý', 'Phường Trần Phú', 'Phường Văn Yên'] }
    ]
  },
  {
    name: 'Quảng Bình',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Đồng Hới', wards: ['Phường Bắc Lý', 'Phường Bắc Nghĩa', 'Phường Đồng Mỹ', 'Phường Đồng Phú', 'Phường Đồng Sơn', 'Phường Đức Ninh Đông', 'Phường Hải Đình', 'Phường Hải Thành', 'Phường Nam Lý', 'Phường Phú Hải'] }
    ]
  },
  {
    name: 'Quảng Trị',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Đông Hà', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường Đông Giang', 'Phường Đông Lễ', 'Phường Đông Lương', 'Phường Đông Thanh'] }
    ]
  },
  {
    name: 'Quảng Nam',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Tam Kỳ', wards: ['Phường An Mỹ', 'Phường An Phú', 'Phường An Sơn', 'Phường An Xuân', 'Phường Hòa Hương', 'Phường Hòa Thuận', 'Phường Phước Hòa', 'Phường Tân Thạnh', 'Phường Trường Xuân'] },
      { name: 'Thành phố Hội An', wards: ['Phường Cẩm An', 'Phường Cẩm Châu', 'Phường Cẩm Nam', 'Phường Cẩm Phô', 'Phường Cửa Đại', 'Phường Minh An', 'Phường Sơn Phong', 'Phường Tân An', 'Phường Thanh Hà'] }
    ]
  },
  {
    name: 'Quảng Ngãi',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Quảng Ngãi', wards: ['Phường Chánh Lộ', 'Phường Lê Hồng Phong', 'Phường Nghĩa Chánh', 'Phường Nghĩa Dũng', 'Phường Nghĩa Lộ', 'Phường Nguyễn Nghiêm', 'Phường Quảng Phú', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Trương Quang Trọng'] }
    ]
  },
  {
    name: 'Bình Định',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Quy Nhơn', wards: ['Phường Bùi Thị Xuân', 'Phường Đống Đa', 'Phường Ghềnh Ráng', 'Phường Hải Cảng', 'Phường Lê Hồng Phong', 'Phường Lê Lợi', 'Phường Ngô Mây', 'Phường Nguyễn Văn Cừ', 'Phường Nhơn Bình', 'Phường Nhơn Phú', 'Phường Quang Trung', 'Phường Thị Nại', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Trần Quang Diệu'] }
    ]
  },
  {
    name: 'Phú Yên',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Tuy Hòa', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường Phú Đông', 'Phường Phú Lâm', 'Phường Phú Thạnh'] }
    ]
  },
  {
    name: 'Gia Lai',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Pleiku', wards: ['Phường Chi Lăng', 'Phường Diên Hồng', 'Phường Đống Đa', 'Phường Hoa Lư', 'Phường Hội Phú', 'Phường Hội Thương', 'Phường Ia Kring', 'Phường Phù Đổng', 'Phường Tây Sơn', 'Phường Thắng Lợi', 'Phường Thống Nhất', 'Phường Trà Bá', 'Phường Yên Đỗ', 'Phường Yên Thế'] }
    ]
  },
  {
    name: 'Đắk Lắk',
    region: 'TRUNG',
    districts: [
      { name: 'Thành phố Buôn Ma Thuột', wards: ['Phường Ea Tam', 'Phường Khánh Xuân', 'Phường Tân An', 'Phường Tân Hòa', 'Phường Tân Lập', 'Phường Tân Lợi', 'Phường Tân Thành', 'Phường Tân Tiến', 'Phường Thắng Lợi', 'Phường Thành Công', 'Phường Thành Nhất', 'Phường Thống Nhất', 'Phường Tự An'] }
    ]
  },
  {
    name: 'Tây Ninh',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Tây Ninh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường Hiệp Ninh', 'Phường Ninh Sơn', 'Phường Ninh Thạnh'] }
    ]
  },
  {
    name: 'Long An',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Tân An', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường Khánh Hậu', 'Phường Tân Khánh'] }
    ]
  },
  {
    name: 'Tiền Giang',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Mỹ Tho', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường Tân Long'] }
    ]
  },
  {
    name: 'Bến Tre',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Bến Tre', wards: ['Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường An Hội', 'Phường Phú Khương', 'Phường Phú Tân'] }
    ]
  },
  {
    name: 'An Giang',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Long Xuyên', wards: ['Phường Bình Đức', 'Phường Bình Khánh', 'Phường Đông Xuyên', 'Phường Mỹ Bình', 'Phường Mỹ Hòa', 'Phường Mỹ Long', 'Phường Mỹ Phước', 'Phường Mỹ Quý', 'Phường Mỹ Thạnh', 'Phường Mỹ Thới'] },
      { name: 'Thành phố Châu Đốc', wards: ['Phường Châu Phú A', 'Phường Châu Phú B', 'Phường Núi Sam', 'Phường Vĩnh Mỹ', 'Phường Vĩnh Nguơn'] }
    ]
  },
  {
    name: 'Kiên Giang',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Rạch Giá', wards: ['Phường An Bình', 'Phường An Hòa', 'Phường Rạch Sỏi', 'Phường Vĩnh Bảo', 'Phường Vĩnh Hiệp', 'Phường Vĩnh Lạc', 'Phường Vĩnh Lợi', 'Phường Vĩnh Quang', 'Phường Vĩnh Thanh', 'Phường Vĩnh Thanh Vân', 'Phường Vĩnh Thông'] },
      { name: 'Thành phố Phú Quốc', wards: ['Phường Dương Đông', 'Phường An Thới', 'Xã Bãi Thơm', 'Xã Cửa Cạn', 'Xã Cửa Dương', 'Xã Dương Tơ', 'Xã Gành Dầu', 'Xã Hàm Ninh', 'Xã Thổ Châu'] }
    ]
  },
  {
    name: 'Đồng Tháp',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Cao Lãnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 11', 'Phường Hòa Thuận', 'Phường Mỹ Phú'] },
      { name: 'Thành phố Sa Đéc', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường An Hòa', 'Phường Tân Quy Đông'] }
    ]
  },
  {
    name: 'Cà Mau',
    region: 'NAM',
    districts: [
      { name: 'Thành phố Cà Mau', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường Tân Thành', 'Phường Tân Xuyên'] }
    ]
  },
  // Bổ sung các tỉnh còn lại đảm bảo đủ 63 tỉnh thành Việt Nam
  { name: 'Hà Nam', region: 'BAC', districts: [{ name: 'Thành phố Phủ Lý', wards: ['Phường Châu Sơn', 'Phường Hai Bà Trưng', 'Phường Lam Hạ', 'Phường Lê Hồng Phong', 'Phường Lương Khánh Thiện', 'Phường Minh Khai', 'Phường Quang Trung', 'Phường Thanh Châu', 'Phường Thanh Tuyền', 'Phường Trần Hưng Đạo'] }] },
  { name: 'Ninh Thuận', region: 'TRUNG', districts: [{ name: 'Thành phố Phan Rang - Tháp Chàm', wards: ['Phường Kinh Dinh', 'Phường Mỹ Đông', 'Phường Mỹ Hải', 'Phường Mỹ Hương', 'Phường Phủ Hà', 'Phường Phước Mỹ', 'Phường Tấn Tài', 'Phường Thanh Sơn', 'Phường Đạo Long', 'Phường Đông Hải'] }] },
  { name: 'Bình Thuận', region: 'TRUNG', districts: [{ name: 'Thành phố Phan Thiết', wards: ['Phường Đức Long', 'Phường Đức Nghĩa', 'Phường Đức Thắng', 'Phường Hàm Tiến', 'Phường Hưng Long', 'Phường Lạc Đạo', 'Phường Mũi Né', 'Phường Phú Hài', 'Phường Phú Thủy', 'Phường Phú Tài', 'Phường Phú Trinh', 'Phường Thanh Hải', 'Phường Xuân An'] }] },
  { name: 'Kon Tum', region: 'TRUNG', districts: [{ name: 'Thành phố Kon Tum', wards: ['Phường Duy Tân', 'Phường Lê Lợi', 'Phường Ngô Mây', 'Phường Nguyễn Trãi', 'Phường Quang Trung', 'Phường Quyết Thắng', 'Phường Thắng Lợi', 'Phường Thống Nhất', 'Phường Trần Hưng Đạo', 'Phường Trường Chinh'] }] },
  { name: 'Đắk Nông', region: 'TRUNG', districts: [{ name: 'Thành phố Gia Nghĩa', wards: ['Phường Nghĩa Đức', 'Phường Nghĩa Phú', 'Phường Nghĩa Tân', 'Phường Nghĩa Thành', 'Phường Nghĩa Trung', 'Phường Quảng Thành'] }] },
  { name: 'Bình Phước', region: 'NAM', districts: [{ name: 'Thành phố Đồng Xoài', wards: ['Phường Tân Bình', 'Phường Tân Đồng', 'Phường Tân Phú', 'Phường Tân Thiện', 'Phường Tân Xuân', 'Phường Tiến Thành'] }] },
  { name: 'Trà Vinh', region: 'NAM', districts: [{ name: 'Thành phố Trà Vinh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9'] }] },
  { name: 'Vĩnh Long', region: 'NAM', districts: [{ name: 'Thành phố Vĩnh Long', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 8', 'Phường 9', 'Phường Tân Hòa', 'Phường Tân Hội', 'Phường Tân Ngãi'] }] },
  { name: 'Hậu Giang', region: 'NAM', districts: [{ name: 'Thành phố Vị Thanh', wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7'] }] },
  { name: 'Sóc Trăng', region: 'NAM', districts: [{ name: 'Thành phố Sóc Trăng', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10'] }] },
  { name: 'Bạc Liêu', region: 'NAM', districts: [{ name: 'Thành phố Bạc Liêu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường Nhà Mát'] }] },
  { name: 'Hòa Bình', region: 'BAC', districts: [{ name: 'Thành phố Hòa Bình', wards: ['Phường Chăm Mát', 'Phường Dân Chủ', 'Phường Đồng Tiến', 'Phường Hữu Nghị', 'Phường Kỳ Sơn', 'Phường Phương Lâm', 'Phường Tân Hòa', 'Phường Tân Thịnh', 'Phường Thái Bình', 'Phường Thịnh Lang', 'Phường Thống Nhất', 'Phường Trung Minh', 'Phường Xuất Hóa'] }] },
  { name: 'Sơn La', region: 'BAC', districts: [{ name: 'Thành phố Sơn La', wards: ['Phường Chiềng An', 'Phường Chiềng Cơi', 'Phường Chiềng Lề', 'Phường Chiềng Sinh', 'Phường Quyết Tâm', 'Phường Quyết Thắng', 'Phường Tô Hiệu'] }] },
  { name: 'Điện Biên', region: 'BAC', districts: [{ name: 'Thành phố Điện Biên Phủ', wards: ['Phường Him Lam', 'Phường Mường Thanh', 'Phường Nam Thanh', 'Phường Noong Bua', 'Phường Tân Thanh', 'Phường Thanh Bình', 'Phường Thanh Trường'] }] },
  { name: 'Lai Châu', region: 'BAC', districts: [{ name: 'Thành phố Lai Châu', wards: ['Phường Đoàn Kết', 'Phường Đông Phong', 'Phường Quyết Thắng', 'Phường Quyết Tiến', 'Phường Tân Phong'] }] },
  { name: 'Lào Cai', region: 'BAC', districts: [{ name: 'Thành phố Lào Cai', wards: ['Phường Bắc Cường', 'Phường Bắc Lệnh', 'Phường Bình Minh', 'Phường Cốc Lếu', 'Phường Duyên Hải', 'Phường Kim Tân', 'Phường Lào Cai', 'Phường Nam Cường', 'Phường Pom Hán', 'Phường Xuân Tăng'] }] },
  { name: 'Yên Bái', region: 'BAC', districts: [{ name: 'Thành phố Yên Bái', wards: ['Phường Đồng Tâm', 'Phường Hồng Hà', 'Phường Hợp Minh', 'Phường Minh Tân', 'Phường Nam Cường', 'Phường Nguyễn Phúc', 'Phường Nguyễn Thái Học', 'Phường Yên Ninh', 'Phường Yên Thịnh'] }] },
  { name: 'Hà Giang', region: 'BAC', districts: [{ name: 'Thành phố Hà Giang', wards: ['Phường Minh Khai', 'Phường Ngọc Hà', 'Phường Nguyễn Trãi', 'Phường Quang Trung', 'Phường Trần Phú'] }] },
  { name: 'Cao Bằng', region: 'BAC', districts: [{ name: 'Thành phố Cao Bằng', wards: ['Phường Đề Thám', 'Phường Duyệt Trung', 'Phường Hòa Chung', 'Phường Hợp Giang', 'Phường Ngọc Xuân', 'Phường Sông Bằng', 'Phường Sông Hiến', 'Phường Tân Giang'] }] },
  { name: 'Bắc Kạn', region: 'BAC', districts: [{ name: 'Thành phố Bắc Kạn', wards: ['Phường Đức Xuân', 'Phường Huyền Tụng', 'Phường Phùng Chí Kiên', 'Phường Sông Cầu', 'Phường Xuất Hóa', 'Phường Nguyễn Thị Minh Khai'] }] },
  { name: 'Lạng Sơn', region: 'BAC', districts: [{ name: 'Thành phố Lạng Sơn', wards: ['Phường Chi Lăng', 'Phường Đông Kinh', 'Phường Hoàng Văn Thụ', 'Phường Tam Thanh', 'Phường Vĩnh Trại'] }] },
  { name: 'Tuyên Quang', region: 'BAC', districts: [{ name: 'Thành phố Tuyên Quang', wards: ['Phường An Tường', 'Phường Đội Cấn', 'Phường Hưng Thành', 'Phường Minh Xuân', 'Phường Mỹ Lâm', 'Phường Nông Tiến', 'Phường Phan Thiết', 'Phường Tân Hà', 'Phường Tân Quang', 'Phường Ỷ La'] }] }
];

/**
 * Tìm Tỉnh/Thành phố theo tên (hỗ trợ tìm kiếm không dấu / không phân biệt hoa thường)
 */
export function findProvince(nameOrKeyword: string): Province | undefined {
  if (!nameOrKeyword) return undefined;
  const kw = nameOrKeyword.trim().toLowerCase();
  return VIETNAM_PROVINCES.find(p => p.name.toLowerCase() === kw || p.name.toLowerCase().includes(kw));
}

/**
 * Lấy danh sách Quận/Huyện theo Tỉnh/Thành phố
 */
export function getDistrictsByProvince(provinceName: string): District[] {
  const p = findProvince(provinceName);
  return p ? p.districts : [];
}

/**
 * Lấy danh sách Phường/Xã theo Tỉnh và Quận/Huyện
 */
export function getWardsByDistrict(provinceName: string, districtName: string): string[] {
  const districts = getDistrictsByProvince(provinceName);
  const d = districts.find(item => item.name.toLowerCase() === districtName.trim().toLowerCase());
  return d ? d.wards : [];
}
