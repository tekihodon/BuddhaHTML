# Lời Phật Dạy - Ứng dụng nghe nhạc Phật giáo

## Hướng dẫn sử dụng

### Cài đặt

```bash
# Cài đặt các dependencies
npm install
```

### Phát triển

```bash
# Chạy môi trường phát triển (development)
npm run dev:full
```

Lệnh này sẽ khởi động cả server Express (cổng 3000) và server Vite (cổng 3000) để phát triển.

### Triển khai

```bash
# Build ứng dụng
npm run build

# Chạy ứng dụng đã build
npm start
```

Lệnh `npm start` sẽ tự động kiểm tra xem thư mục `dist` đã tồn tại chưa. Nếu chưa, nó sẽ tự động chạy lệnh build trước khi khởi động server.

## Tính năng

- Nghe nhạc Phật giáo
- Tích hợp với Google Drive để tải nhạc
- Quản lý danh sách phát
- Giao diện người dùng thân thiện

## Cấu trúc dự án

- `src/`: Mã nguồn frontend (Svelte)
- `server.js`: Server Express để xử lý API và phục vụ ứng dụng
- `uploads/`: Thư mục lưu trữ các file đã tải từ Google Drive
- `dist/`: Thư mục chứa ứng dụng đã build
