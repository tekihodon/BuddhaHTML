# 🔗 Hướng dẫn thiết lập Google Drive Integration

## Tổng quan
Tính năng này cho phép admin kết nối với Google Drive để import nhạc trực tiếp từ folder Google Drive vào ứng dụng, giải quyết vấn đề giới hạn dung lượng localStorage.

## Các bước thiết lập

### 1. Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.developers.google.com)
2. Đăng nhập bằng tài khoản Google
3. Tạo project mới hoặc chọn project hiện có
4. Ghi nhớ tên project để sử dụng sau

### 2. Bật Google Drive API
1. Trong Google Cloud Console, vào **APIs & Services** > **Library**
2. Tìm kiếm "Google Drive API"
3. Click vào **Google Drive API** và nhấn **Enable**
4. Đợi API được kích hoạt

### 3. Tạo API Key
1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy API Key được tạo ra
4. (Tùy chọn) Click **Restrict Key** để giới hạn sử dụng:
   - Chọn **HTTP referrers** và thêm domain của bạn
   - Hoặc chọn **IP addresses** và thêm IP server

### 4. Chuẩn bị Google Drive Folder
1. Tạo folder mới trong Google Drive để chứa file nhạc
2. Upload các file nhạc (MP3, WAV, OGG, M4A, FLAC, AAC) vào folder
3. **Quan trọng**: Chia sẻ folder với quyền "Anyone with the link can view":
   - Right-click folder > Share
   - Click "Change to anyone with the link"
   - Chọn "Viewer" permission
   - Copy link chia sẻ

### 5. Lấy Folder ID
Từ URL chia sẻ folder: `https://drive.google.com/drive/folders/1ABC123xyz456`

Folder ID là phần sau `/folders/`: `1ABC123xyz456`

### 6. Cấu hình trong ứng dụng
1. Đăng nhập admin panel
2. Vào tab **Nhạc**
3. Tìm phần **🔗 Tích hợp Google Drive**
4. Nhập:
   - **API Key**: Key từ bước 3
   - **Folder ID**: ID từ bước 5
5. Click **🔍 Kiểm tra kết nối**
6. Nếu thành công, danh sách file nhạc sẽ hiển thị
7. Click **➕ Import** để thêm từng bài hoặc **📥 Import tất cả**

## Lưu ý quan trọng

### Bảo mật
- **Không chia sẻ API Key** với người khác
- Lưu trữ API Key an toàn
- Sử dụng IP/domain restrictions nếu có thể

### Giới hạn
- Google Drive API có [quota limits](https://developers.google.com/drive/api/guides/limits)
- Free tier: 1,000 requests/100 seconds/user
- Đủ cho việc sử dụng thông thường

### File được hỗ trợ
- **Audio**: MP3, WAV, OGG, M4A, FLAC, AAC
- **MIME types**: `audio/*`
- File phải có extension hợp lệ

### Troubleshooting

#### Lỗi "API Key not valid"
- Kiểm tra API Key đã copy đúng
- Đảm bảo Google Drive API đã được enable
- Kiểm tra restrictions của API Key

#### Lỗi "Folder not found"
- Kiểm tra Folder ID đã copy đúng
- Đảm bảo folder đã được share public
- Thử truy cập link chia sẻ trong trình duyệt ẩn danh

#### Không tìm thấy file nhạc
- Kiểm tra file có extension hợp lệ
- Đảm bảo file nằm trực tiếp trong folder (không trong subfolder)
- Refresh lại kết nối

#### Lỗi CORS
- Đảm bảo đang truy cập từ domain được phép
- Kiểm tra API Key restrictions
- Thử disable restrictions tạm thời để test

## Ưu điểm của Google Drive Integration

1. **Không giới hạn dung lượng**: Vượt qua giới hạn 5MB của localStorage
2. **Quản lý tập trung**: Tất cả file nhạc trong một folder
3. **Dễ cập nhật**: Thêm file mới vào Drive và import lại
4. **Chia sẻ dễ dàng**: Có thể chia sẻ folder với team
5. **Backup tự động**: Google Drive tự động backup
6. **Truy cập từ xa**: Có thể quản lý file từ bất kỳ đâu

## Workflow khuyến nghị

1. **Tổ chức file**: Tạo folder riêng cho từng album/playlist
2. **Naming convention**: Đặt tên file theo format "Artist - Title.mp3"
3. **Quality control**: Kiểm tra chất lượng audio trước khi upload
4. **Regular sync**: Import định kỳ khi có file mới
5. **Backup**: Giữ backup local của các file quan trọng

## Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console log trong Developer Tools
2. Network tab để xem API requests
3. Google Cloud Console > APIs & Services > Quotas
4. Google Drive folder permissions

Chúc bạn sử dụng tính năng thành công! 🎵