# BuddahaHTML - Google Drive Music Player

Một ứng dụng web hiện đại để phát nhạc từ Google Drive với giao diện đẹp mắt và tính năng quản lý playlist thông minh.

## ✨ Tính năng chính

- 🎵 **Phát nhạc từ Google Drive**: Kết nối trực tiếp với Google Drive để stream nhạc
- 🎨 **Giao diện hiện đại**: Thiết kế responsive với Svelte và TailwindCSS
- 📱 **Responsive Design**: Hoạt động mượt mà trên mọi thiết bị
- 🎛️ **Player Controls**: Điều khiển phát nhạc đầy đủ (play, pause, next, previous, shuffle, repeat)
- 📋 **Playlist Management**: Tạo và quản lý playlist cá nhân
- 🔍 **Tìm kiếm thông minh**: Tìm kiếm bài hát theo tên, nghệ sĩ, album
- 💾 **Local Storage**: Lưu trữ cài đặt và playlist cục bộ
- 🎚️ **Volume Control**: Điều chỉnh âm lượng với thanh trượt
- ⏱️ **Progress Bar**: Hiển thị và điều khiển tiến trình phát nhạc

## 🚀 Công nghệ sử dụng

### Frontend
- **Svelte**: Framework JavaScript hiện đại
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Build tool nhanh chóng
- **TypeScript**: Type-safe JavaScript

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Web framework
- **Google Drive API**: Tích hợp với Google Drive

### Thư viện khác
- **Lucide Icons**: Bộ icon đẹp mắt
- **Google APIs**: Client library cho Google Drive

## 📋 Yêu cầu hệ thống

- Node.js 16.0 trở lên
- NPM hoặc Yarn
- Tài khoản Google (để sử dụng Google Drive API)
- Trình duyệt hiện đại hỗ trợ ES6+

## 🛠️ Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd BuddahaHTML
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình Google Drive API

1. Tạo project tại [Google Cloud Console](https://console.developers.google.com)
2. Bật Google Drive API
3. Tạo API Key và OAuth 2.0 credentials
4. Tạo file `.env` và thêm:

```env
GOOGLE_API_KEY=your_api_key_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Chi tiết thiết lập xem tại: [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md)

### 4. Chạy ứng dụng

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm run build
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 📁 Cấu trúc dự án

```
BuddahaHTML/
├── src/
│   ├── components/          # Svelte components
│   │   ├── AudioPlayer.svelte
│   │   ├── PlaylistManager.svelte
│   │   ├── SearchBar.svelte
│   │   └── ...
│   ├── stores/             # Svelte stores
│   ├── utils/              # Utility functions
│   ├── App.svelte          # Main app component
│   └── main.js             # Entry point
├── public/                 # Static assets
├── server.js               # Express server
├── package.json
├── vite.config.js
└── README.md
```

## 🎯 Cách sử dụng

1. **Kết nối Google Drive**: Đăng nhập và cấp quyền truy cập Google Drive
2. **Chọn folder nhạc**: Chọn folder chứa file nhạc trong Google Drive
3. **Phát nhạc**: Click vào bài hát để phát
4. **Tạo playlist**: Sử dụng tính năng playlist để tổ chức nhạc
5. **Tìm kiếm**: Sử dụng thanh tìm kiếm để tìm bài hát

## 🔧 Scripts có sẵn

- `npm run dev`: Chạy development server
- `npm run build`: Build production
- `npm run preview`: Preview production build
- `npm start`: Chạy production server
- `npm run lint`: Kiểm tra code style

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này được phát hành dưới MIT License. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🐛 Báo lỗi

Nếu bạn gặp lỗi hoặc có đề xuất, vui lòng tạo issue tại [GitHub Issues](../../issues).

## 📞 Liên hệ

- Email: buddahahtml@example.com
- GitHub: [BuddahaHTML](https://github.com/buddahahtml)

---

⭐ Nếu dự án này hữu ích, hãy cho một star nhé!
