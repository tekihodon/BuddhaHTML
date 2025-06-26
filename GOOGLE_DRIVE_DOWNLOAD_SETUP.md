# 🎵 Hướng dẫn Download File từ Google Drive

## 📋 Tổng quan

Hệ thống đã được cập nhật để **download file trực tiếp từ Google Drive về server local** thay vì chỉ lưu URL. Điều này giúp:

- ✅ **Phát nhạc ổn định hơn** (không phụ thuộc vào CORS của Google Drive)
- ✅ **Tốc độ phát nhanh hơn** (file đã có sẵn trên server)
- ✅ **Hoạt động offline** (sau khi download)
- ✅ **Không bị giới hạn quota** của Google Drive API khi phát nhạc

## 🚀 Cách sử dụng

### Bước 1: Cài đặt Dependencies

```bash
npm install
```

### Bước 2: Chạy Backend Server

**Cách 1: Chạy riêng biệt**
```bash
# Terminal 1: Chạy backend server
npm run server

# Terminal 2: Chạy frontend
npm run dev
```

**Cách 2: Chạy cùng lúc (Khuyến nghị)**
```bash
npm run dev:full
```

### Bước 3: Cấu hình Google Drive

1. **Thiết lập Google Drive API** (như cũ):
   - Truy cập [Google Cloud Console](https://console.developers.google.com)
   - Tạo project và bật Google Drive API
   - Tạo API Key
   - Chia sẻ folder với "Anyone with the link can view"

2. **Nhập thông tin trong ứng dụng**:
   - API Key
   - Folder ID
   - Nhấn "🔍 Kiểm tra kết nối"
   - Nhấn "🖥️ Kiểm tra Server" để đảm bảo backend hoạt động

### Bước 4: Download và Import

1. **Chọn file** từ danh sách Google Drive
2. **Nhấn "📥 Import"** - Hệ thống sẽ:
   - Download file từ Google Drive về server
   - Lưu vào thư mục `uploads/`
   - Tạo URL local: `http://localhost:3001/uploads/filename.mp3`
   - Thêm vào playlist với URL local

## 🔧 API Endpoints

### Backend Server (Port 3001)

- **POST** `/api/download-from-drive` - Download file từ Google Drive
- **GET** `/api/uploaded-files` - Lấy danh sách file đã download
- **DELETE** `/api/delete-file/:fileName` - Xóa file
- **GET** `/api/health` - Kiểm tra server status

### Cấu trúc Request

```javascript
// Download file từ Google Drive
POST /api/download-from-drive
{
  "fileId": "1ABC123xyz",
  "fileName": "song.mp3",
  "apiKey": "your-google-api-key"
}

// Response
{
  "success": true,
  "message": "File đã được download và lưu thành công",
  "file": {
    "originalName": "song.mp3",
    "savedName": "song.mp3",
    "size": 5242880,
    "url": "http://localhost:3001/uploads/song.mp3",
    "path": "/path/to/uploads/song.mp3"
  }
}
```

## 📁 Cấu trúc File

```
project/
├── server.js              # Backend server
├── uploads/               # Thư mục chứa file đã download
│   ├── song1.mp3
│   ├── song2.mp3
│   └── ...
├── src/
│   └── components/
│       └── GoogleDriveIntegration.svelte  # Updated component
└── package.json           # Updated dependencies
```

## 🛠️ Troubleshooting

### Server không chạy
```bash
# Kiểm tra port 3001 có bị chiếm không
netstat -ano | findstr :3001

# Thử chạy server trực tiếp
node server.js
```

### Lỗi download file
- ✅ Kiểm tra API Key đúng
- ✅ Kiểm tra file được chia sẻ công khai
- ✅ Kiểm tra dung lượng ổ đĩa
- ✅ Kiểm tra kết nối internet

### File không phát được
- ✅ Kiểm tra file đã download trong thư mục `uploads/`
- ✅ Kiểm tra URL: `http://localhost:3001/uploads/filename.mp3`
- ✅ Thử mở URL trực tiếp trong browser

## 🔄 So sánh với phương pháp cũ

| Tính năng | Phương pháp cũ (URL) | Phương pháp mới (Download) |
|-----------|---------------------|----------------------------|
| **Tốc độ phát** | Chậm (phụ thuộc Google) | Nhanh (local server) |
| **Độ ổn định** | Không ổn định (CORS) | Rất ổn định |
| **Offline** | Không hỗ trợ | Hỗ trợ (sau khi download) |
| **Dung lượng** | Không tốn | Tốn dung lượng local |
| **Setup** | Đơn giản | Cần chạy backend |

## 📝 Lưu ý quan trọng

1. **Dung lượng**: File sẽ được lưu trên máy local, cần đảm bảo đủ dung lượng
2. **Backup**: Thư mục `uploads/` nên được backup định kỳ
3. **Security**: Không chia sẻ API Key với người khác
4. **Performance**: Server cần chạy để phát nhạc

## 🎯 Kế hoạch tương lai

- [ ] Thêm progress bar cho quá trình download
- [ ] Hỗ trợ download batch (nhiều file cùng lúc)
- [ ] Tự động sync với Google Drive
- [ ] Nén file để tiết kiệm dung lượng
- [ ] Hỗ trợ streaming trực tiếp (không cần download hoàn toàn)