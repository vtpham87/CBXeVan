# CBXeVan – Tiện Ích Cảnh Báo Chu Kỳ Xe Tải VAN Cải Tạo

**Đơn vị phát triển:** FYJ  
**Căn cứ pháp lý:** Thông tư số 30/2026/TT-BXD của Bộ Xây dựng  
**Phiên bản:** `1.0.0` (Manifest V3)  
**Vị trí lưu trữ:** `D:\CBXeVan`  

---

## 1. Giới thiệu & Mục đích

Tiện ích **CBXeVan** được tách độc lập hoàn toàn từ hệ thống kiểm định để chuyên trách một nhiệm vụ quan trọng:
* **Tự động nhận diện** các phương tiện là **Ô tô tải VAN được cải tạo từ xe chở người (xe khách >09 chỗ)** khi mở xem chi tiết GCN hoặc thông tin phương tiện trên Cổng Quản trị GCN Cục ĐKVN: `https://quantrigcn.vr.org.vn/*`.
* **Căn cứ Năm sản xuất và Năm kiểm định** để tính Tuổi xe và tự động đề xuất chu kỳ kiểm định chuẩn xác theo **Thông tư 30/2026/TT-BXD**, giúp Đăng kiểm viên và nhân viên nghiệp vụ không bị cấp nhầm chu kỳ (đặc biệt là lỗi cấp 06 tháng thay vì 03 tháng đối với xe trên 15 năm).
* **Hiển thị Floating Banner nổi bật:** Thiết kế chuẩn Light Mode, độ tương phản cao, dễ nhìn ngay cả ngoài trời nắng.

---

## 2. Bảng quy chiếu chu kỳ theo TT 30/2026/TT-BXD

| Tuổi xe (Năm KĐ - Năm SX) | Chu kỳ đề xuất | Mức độ cảnh báo | Màu sắc | Ghi chú quan trọng |
|---|---|---|---|---|
| **≥ 15 năm** (VD: SX 2007, KĐ 2026 ➜ 19 năm) | **03 THÁNG** | 🚨 ĐẶC BIỆT | Đỏ (`#dc3545`) | Bắt buộc áp chu kỳ 03 tháng theo xe >9 chỗ trước cải tạo. **Tuyệt đối không cấp 06 tháng!** |
| **> 5 năm đến < 15 năm** (VD: SX 2018 ➜ 8 năm) | **06 THÁNG** | ⚠️ NHẮC NHỞ | Vàng cam (`#e0a800`) | Áp dụng chu kỳ 06 tháng |
| **≤ 5 năm** (VD: SX 2023 ➜ 3 năm) | **12 THÁNG** | ℹ️ THÔNG TIN | Xanh dương (`#0d6efd`) | Chu kỳ định kỳ 12 tháng (chu kỳ đầu 24 tháng nếu lần đầu) |

---

## 3. Cấu trúc thư mục tiện ích

```
D:\CBXeVan\
├── manifest.json            # Cấu hình Manifest V3
├── background.js            # Service worker điều khiển badge trạng thái
├── cycle_advisor.js         # Thuật toán bóc tách dữ liệu & tính chu kỳ TT 30/2026
├── content.js               # Content script tự động giám sát trang web & iframes
├── content.css              # Giao diện thanh banner nổi Light Mode
├── popup.html               # Bảng điều khiển trên thanh công cụ trình duyệt
├── popup.js                 # Xử lý tính toán nhanh & xem xe gần nhất
├── popup.css                # Giao diện bảng điều khiển
├── test_simulation.html     # Môi trường giả lập offline có sẵn 5 ca thử nghiệm
├── icons/                   # Bộ icon độ phân giải 16x16, 48x48, 128x128
├── tests/
│   ├── test_cycle_advisor.js# Unit tests kiểm thử tự động
│   └── run_tests.bat        # File chạy test nhanh 1-click
└── README.md                # Tài liệu hướng dẫn này
```

---

## 4. Hướng dẫn cài đặt trên Chrome / Edge (Chỉ mất 30 giây)

1. Mở trình duyệt Google Chrome hoặc Microsoft Edge.
2. Truy cập vào trang quản lý tiện ích:
   * Trên Edge: `edge://extensions`
   * Trên Chrome: `chrome://extensions`
3. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên/bên trái.
4. Bấm vào nút **"Tải tiện ích đã giải nén" (Load unpacked)**.
5. Chọn đúng thư mục: `D:\CBXeVan`.
6. Tiện ích `CBXeVan` sẽ xuất hiện trên thanh công cụ và tự động hoạt động!

---

## 5. Kiểm thử nhanh offline

* Mở trực tiếp file `D:\CBXeVan\test_simulation.html` bằng trình duyệt để bấm thử các ca giả lập xe từ 2007 (03 tháng), 2018 (06 tháng) đến xe thường.
