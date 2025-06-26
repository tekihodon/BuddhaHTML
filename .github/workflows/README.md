# GitHub Actions Workflows

Thư mục này chứa các workflow GitHub Actions được sử dụng để tự động hóa quy trình CI/CD cho dự án Lời Phật Dạy.

## Workflows hiện có

### docker-build-push.yml

Workflow này tự động build và push Docker image lên Docker Hub khi có thay đổi trên nhánh main.

**Chức năng chính:**
- Được kích hoạt khi có push hoặc pull request vào nhánh main
- Sử dụng Docker Buildx để build image
- Đăng nhập vào Docker Hub sử dụng credentials từ GitHub Secrets
- Build Docker image từ Dockerfile trong repository
- Push image lên Docker Hub (chỉ khi event là push, không push khi là pull request)
- Sử dụng cache để tăng tốc quá trình build

**Yêu cầu:**
Để workflow này hoạt động, bạn cần thiết lập các secrets sau trong repository GitHub:
- `DOCKERHUB_USERNAME`: Tên người dùng Docker Hub
- `DOCKERHUB_TOKEN`: Access token của Docker Hub (không phải mật khẩu)

**Tham khảo:**
Xem hướng dẫn chi tiết về thiết lập CI/CD tại [docs/CICD-SETUP.md](../../docs/CICD-SETUP.md).

## Thêm workflow mới

Khi thêm workflow mới, vui lòng cập nhật file README.md này để mô tả chức năng và yêu cầu của workflow đó.