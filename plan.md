# Kế Hoạch Phát Triển Frontend (NexusSport)

Bản kế hoạch này chia nhỏ toàn bộ quá trình tích hợp API Backend và xây dựng giao diện người dùng (Client-side) theo từng giai đoạn (Phase). 
**Triết lý thiết kế chủ đạo:** 
- **Uber:** Ưu tiên hiển thị Bản đồ (Map-centric), định vị vị trí người dùng, luồng tìm kiếm cực nhanh và trực quan.
- **Airbnb:** Giao diện chi tiết mượt mà, bo góc (rounded), bóng đổ nhẹ (float shadow), typography sạch sẽ, màu nhấn (Primary Rausch).

---

## 🟢 PHASE 1: Nền tảng & Xác thực (Foundation & Auth) - Đã hoàn thành (Trừ phần cấu hình Interceptor sẽ làm khi cần gọi API bảo mật)
**Mục tiêu:** Xây dựng khung sườn dự án, kết nối API cơ bản và hoàn thiện luồng người dùng đăng nhập/đăng ký.

1. **Setup Core:**
   - [x] Tích hợp font chữ `Inter` và cấu hình Tailwind theo chuẩn màu Airbnb & Stripe (cho Admin).
   - [x] Tổ chức thư mục theo chuẩn SOLID & Clean Architecture.
   - [x] Tạo `ApiService` xử lý HTTP Request và Cookie credentials.
   - [ ] Tạo `AuthInterceptor` để tự động gắn token vào request và xử lý lỗi 401 (Refresh Token).
2. **Authentication Flow (Luồng Xác thực):**
   - [x] UI/UX và logic Đăng nhập (Email + OTP).
   - [x] UI/UX và logic Đăng ký (Register + OTP Verify).
   - [ ] Khôi phục mật khẩu (Forgot Password).
   - [x] Xử lý luồng đăng nhập qua Google Auth (Đã có UI).
3. **Map-centric Homepage & Stripe Admin (Khung Giao diện):**
   - [x] Xây dựng UI Trang chủ với Map background và Floating Panel tìm kiếm (chuẩn Uber & Airbnb).
   - [x] Xây dựng UI Admin Dashboard theo chuẩn Stripe (strike.md).

---

## 🟡 PHASE 2: Tìm Kiếm & Khám Phá Sân Bóng (Fields & Search)
**Mục tiêu:** Hiển thị danh sách sân bóng thật lên Bản đồ và xem chi tiết sân theo phong cách Airbnb.

1. **Bản Đồ Trực Quan (Interactive Map):**
   - [ ] Tích hợp thư viện Map (Leaflet.js hoặc Mapbox).
   - [ ] Lấy vị trí GPS của người dùng (nút "My Location").
   - [ ] Gọi API lấy danh sách Sân (Fields) và render các "Marker hiển thị giá tiền" lên bản đồ.
2. **Bộ Lọc Tìm Kiếm (Advanced Search):**
   - [ ] Xử lý logic search trên Floating Panel: Lọc theo vị trí, khoảng cách, khung giờ trống, và loại sân (5, 7, 11).
3. **Màn Hình Chi Tiết Sân (Field Details):**
   - [ ] Giao diện chi tiết sân: Ảnh cover lớn, Carousel ảnh phụ.
   - [ ] Hiển thị thông tin: Tiện ích, bản đồ nhỏ, chính sách hủy sân.
   - [ ] Module hiển thị Đánh giá (Reviews) ngắn gọn.
   - [ ] Card "Đặt Sân Sticky" nằm bên phải màn hình (hoặc trượt lên ở Mobile).

---

## 🟠 PHASE 3: Luồng Đặt Sân & Thanh Toán (Booking & Payment)
**Mục tiêu:** Xử lý toàn bộ logic nghiệp vụ cốt lõi từ lúc chọn giờ đến lúc thanh toán xong.

1. **Chọn Khung Giờ (Pricing & Availability):**
   - [ ] Render lịch trống của sân.
   - [ ] Hiển thị giá tiền theo khung giờ (Giờ vàng/Giờ thường dựa trên Pricing Module của Backend).
2. **Xử lý Đặt Sân (Booking):**
   - [ ] Form nhập thông tin đặt sân (ghi chú, đội hình).
   - [ ] Chọn và áp dụng Khuyến mãi (Voucher API).
3. **Thanh Toán (Payment Integration):**
   - [ ] Review lại tổng tiền tạm tính.
   - [ ] Tích hợp API tạo link thanh toán (VNPay hoặc cổng tương ứng).
   - [ ] UI Màn hình Thanh toán thành công (Success) / Thất bại (Failed).

---

## 🔵 PHASE 4: Cá Nhân Hóa & Tương Tác (User Profile & History)
**Mục tiêu:** Không gian riêng của người dùng và các tính năng tương tác sau trận đấu.

1. **Dashboard Khách Hàng:**
   - [ ] Màn hình Profile: Cập nhật Avatar, thông tin cá nhân.
   - [ ] Quản lý Lịch sử Đặt Sân: Phân tab (Sắp tới, Đã hoàn thành, Đã hủy).
2. **Tương Tác (Reviews & Feedback):**
   - [ ] Tính năng đánh giá và chấm điểm sao cho sân bóng sau khi đá xong (Review Module).
   - [ ] Gửi phản hồi (Feedback) về hệ thống / chăm sóc khách hàng.
3. **Sân Yêu Thích (Wishlist):**
   - [ ] Quản lý danh sách sân đã bấm "Lưu/Thả tim".

---

## 🟣 PHASE 5: Thời Gian Thực & Tối Ưu Hóa (Real-time & Polish)
**Mục tiêu:** Mang lại trải nghiệm app sống động, mượt mà và thông báo tức thì.

1. **Thông Báo (Notifications):**
   - [ ] Tích hợp Socket.io client kết nối với Event/Notification Module của Backend.
   - [ ] Nhận thông báo push khi: Đặt sân thành công, sắp đến giờ đá, sân hủy lịch.
   - [ ] UI chuông thông báo và Dropdown Notification.
2. **Tối Ưu & Animations:**
   - [ ] Hoàn thiện các skeleton loading (trạng thái chờ dữ liệu).
   - [ ] Tối ưu SEO tĩnh (Angular SSR nếu cần) và hiệu suất tải trang.
