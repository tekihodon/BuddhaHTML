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

### Sử dụng Docker

Ứng dụng đã được đóng gói thành Docker image và đẩy lên Docker Hub.

#### Chạy với Docker

```bash
# Kéo image từ Docker Hub
docker pull tekihodon/buddhahtml:latest

# Chạy container
docker run -d -p 3000:3000 --name buddhahtml tekihodon/buddhahtml:latest
```

#### Chạy với Docker Compose

```bash
# Chạy ứng dụng với Docker Compose
docker-compose up -d
```

#### Build Docker image

```bash
# Build Docker image
docker build -t tekihodon/buddhahtml:latest .

# Push lên Docker Hub (cần đăng nhập trước)
docker login
docker push tekihodon/buddhahtml:latest
```

#### CI/CD với GitHub Actions

Dự án này đã được cấu hình với GitHub Actions để tự động build và push Docker image lên Docker Hub khi có thay đổi trên nhánh main.

Để sử dụng tính năng này, bạn cần thêm các secrets sau vào repository GitHub của bạn:

- `DOCKERHUB_USERNAME`: Tên người dùng Docker Hub của bạn
- `DOCKERHUB_TOKEN`: Token truy cập Docker Hub (không phải mật khẩu)

Workflow sẽ tự động chạy khi:
- Push code lên nhánh main
- Tạo Pull Request vào nhánh main (chỉ build, không push)

Xem hướng dẫn chi tiết về thiết lập CI/CD tại [docs/CICD-SETUP.md](docs/CICD-SETUP.md).

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
- `Dockerfile`: Cấu hình để build Docker image
- `docker-compose.yml`: Cấu hình để chạy ứng dụng với Docker Compose
- `.github/workflows/`: Chứa các workflow GitHub Actions
  - `docker-build-push.yml`: Workflow tự động build và push Docker image
