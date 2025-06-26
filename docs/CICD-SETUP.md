# Hướng dẫn thiết lập CI/CD với GitHub Actions và Docker Hub

Tài liệu này hướng dẫn cách thiết lập quy trình CI/CD (Continuous Integration/Continuous Deployment) cho dự án Lời Phật Dạy sử dụng GitHub Actions và Docker Hub.

## Tổng quan

Quy trình CI/CD đã được thiết lập để tự động hóa việc build và push Docker image lên Docker Hub khi có thay đổi trên nhánh main của repository. Điều này giúp:

- Đảm bảo mỗi thay đổi đều được kiểm tra và build thành công
- Tự động cập nhật Docker image mới nhất lên Docker Hub
- Giảm thiểu công việc thủ công trong quá trình triển khai

## Các bước thiết lập

### 1. Tạo tài khoản Docker Hub

1. Đăng ký tài khoản tại [Docker Hub](https://hub.docker.com/)
2. Tạo repository với tên `buddhahtml` (hoặc tên bạn muốn sử dụng)

### 2. Tạo Access Token trên Docker Hub

1. Đăng nhập vào Docker Hub
2. Vào Account Settings > Security > New Access Token
3. Đặt tên cho token (ví dụ: "GitHub Actions")
4. Chọn quyền truy cập (Read & Write)
5. Tạo token và lưu lại giá trị token (bạn sẽ không thể xem lại sau này)

### 3. Thiết lập Secrets trong GitHub Repository

1. Truy cập vào repository GitHub của dự án
2. Vào Settings > Secrets and variables > Actions
3. Thêm hai secrets sau:
   - `DOCKERHUB_USERNAME`: Tên người dùng Docker Hub của bạn
   - `DOCKERHUB_TOKEN`: Access token đã tạo ở bước trước

### 4. Workflow GitHub Actions

File workflow đã được tạo tại `.github/workflows/docker-build-push.yml` với nội dung:

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: tekihodon/buddhahtml:latest
          cache-from: type=registry,ref=tekihodon/buddhahtml:latest
          cache-to: type=inline
```

### 5. Cách hoạt động của Workflow

- **Trigger**: Workflow sẽ được kích hoạt khi có push vào nhánh main hoặc khi có pull request vào nhánh main
- **Checkout**: Lấy mã nguồn từ repository
- **Setup Buildx**: Thiết lập Docker Buildx để build image
- **Login**: Đăng nhập vào Docker Hub sử dụng credentials đã lưu trong secrets
- **Build and Push**: 
  - Build Docker image từ Dockerfile
  - Push image lên Docker Hub (chỉ khi event là push, không push khi là pull request)
  - Sử dụng cache để tăng tốc quá trình build

### 6. Kiểm tra và xử lý lỗi

Khi có push hoặc pull request vào nhánh main, bạn có thể kiểm tra trạng thái của workflow:

1. Vào tab "Actions" trong repository GitHub
2. Chọn workflow "Docker Build and Push" tương ứng với commit của bạn
3. Xem logs để kiểm tra quá trình build và push

Nếu có lỗi xảy ra, hãy kiểm tra:
- Dockerfile có lỗi cú pháp không
- Secrets đã được thiết lập đúng chưa
- Quyền truy cập của token có đủ không

## Sử dụng Docker Image

Sau khi workflow chạy thành công, Docker image mới nhất sẽ được push lên Docker Hub và có thể được sử dụng bằng cách:

```bash
docker pull tekihodon/buddhahtml:latest
docker run -d -p 3000:3000 --name buddhahtml tekihodon/buddhahtml:latest
```

Hoặc sử dụng Docker Compose:

```bash
docker-compose up -d
```

## Tùy chỉnh thêm

### Thêm tags khác

Bạn có thể thêm nhiều tags cho image bằng cách sửa đổi phần `tags` trong workflow:

```yaml
tags: |
  tekihodon/buddhahtml:latest
  tekihodon/buddhahtml:${{ github.sha }}
```

### Thêm kiểm tra bảo mật

Bạn có thể thêm bước kiểm tra bảo mật cho Docker image bằng cách thêm step sử dụng công cụ như Trivy:

```yaml
- name: Scan image for vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'tekihodon/buddhahtml:latest'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'
```

## Kết luận

Với thiết lập CI/CD này, mỗi khi có thay đổi được push lên nhánh main, một Docker image mới sẽ tự động được build và push lên Docker Hub, giúp quá trình triển khai trở nên đơn giản và tự động hơn.