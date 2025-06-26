<script>
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth.js';
  import { userDB } from '../utils/database.js';

  export let user;
  
  const dispatch = createEventDispatcher();

  let isChangingPassword = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  function togglePasswordChange() {
    isChangingPassword = !isChangingPassword;
    // Reset form
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    errorMessage = '';
    successMessage = '';
  }

  async function handlePasswordChange() {
    if (isLoading) return;
    
    errorMessage = '';
    successMessage = '';
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      errorMessage = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      errorMessage = 'Mật khẩu mới không khớp';
      return;
    }
    
    if (newPassword.length < 6) {
      errorMessage = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      return;
    }
    
    if (currentPassword === newPassword) {
      errorMessage = 'Mật khẩu mới phải khác mật khẩu hiện tại';
      return;
    }
    
    isLoading = true;
    
    try {
      // Verify current password first
      await userDB.authenticate(user.email, currentPassword);
      
      // Update password
      await userDB.updateUser(user.id, { password: newPassword });
      
      successMessage = 'Đổi mật khẩu thành công!';
      
      // Reset form after success
      setTimeout(() => {
        togglePasswordChange();
      }, 2000);
      
    } catch (error) {
      if (error.message.includes('không đúng')) {
        errorMessage = 'Mật khẩu hiện tại không đúng';
      } else {
        errorMessage = error.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      }
    } finally {
      isLoading = false;
    }
  }

  function handleClose() {
    dispatch('close');
  }

  function formatDate(dateString) {
    if (!dateString) return 'Không rõ';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Không rõ';
    }
  }
</script>

<div class="profile-container">
  <div class="profile-card">
    <!-- Header -->
    <div class="profile-header">
      <h2>👤 Hồ sơ cá nhân</h2>
      <button class="close-btn" on:click={handleClose} title="Đóng">
        ✕
      </button>
    </div>

    <!-- User Info -->
    <div class="user-info">
      <div class="info-item">
        <label>Email:</label>
        <span>{user.email}</span>
      </div>
      
      <div class="info-item">
        <label>Loại tài khoản:</label>
        <span class="account-type" class:admin={user.isAdmin}>
          {user.isAdmin ? '👑 Quản trị viên' : '👤 Người dùng'}
        </span>
      </div>
      
      <div class="info-item">
        <label>Ngày tạo:</label>
        <span>{formatDate(user.createdAt)}</span>
      </div>
    </div>

    <!-- Password Change Section -->
    <div class="password-section">
      {#if !isChangingPassword}
        <button class="btn btn-secondary" on:click={togglePasswordChange}>
          🔒 Đổi mật khẩu
        </button>
      {:else}
        <div class="password-form">
          <h3>Đổi mật khẩu</h3>
          
          <div class="form-group">
            <label for="currentPassword" class="form-label">Mật khẩu hiện tại</label>
            <input
              id="currentPassword"
              type="password"
              bind:value={currentPassword}
              class="form-input"
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword" class="form-label">Mật khẩu mới</label>
            <input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              class="form-input"
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Xác nhận mật khẩu mới</label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              class="form-input"
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>
          
          <!-- Error Message -->
          {#if errorMessage}
            <div class="error-message">
              {errorMessage}
            </div>
          {/if}
          
          <!-- Success Message -->
          {#if successMessage}
            <div class="success-message">
              {successMessage}
            </div>
          {/if}
          
          <!-- Form Actions -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              on:click={togglePasswordChange}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              on:click={handlePasswordChange}
              disabled={isLoading}
            >
              {#if isLoading}
                <div class="loading"></div>
                Đang xử lý...
              {:else}
                Đổi mật khẩu
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Additional Info -->
    <div class="additional-info">
      <h3>Thông tin bổ sung</h3>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-icon">🎵</div>
          <div class="info-content">
            <h4>Tiến độ nghe nhạc</h4>
            <p>Được lưu tự động mỗi 5 giây</p>
          </div>
        </div>
        
        <div class="info-card">
          <div class="info-icon">🔒</div>
          <div class="info-content">
            <h4>Bảo mật</h4>
            <p>Thông tin được mã hóa an toàn</p>
          </div>
        </div>
        
        <div class="info-card">
          <div class="info-icon">📱</div>
          <div class="info-content">
            <h4>Đa thiết bị</h4>
            <p>Đồng bộ trên mọi thiết bị</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .profile-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 2000;
    backdrop-filter: blur(5px);
  }

  .profile-card {
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
  }

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .profile-header h2 {
    color: var(--accent-color);
    margin: 0;
  }

  .close-btn {
    background: var(--button-secondary);
    border: none;
    color: var(--text-primary);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .close-btn:hover {
    background: var(--button-primary);
    color: var(--primary-bg);
  }

  .user-info {
    margin-bottom: 2rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item label {
    font-weight: 500;
    color: var(--text-secondary);
  }

  .info-item span {
    color: var(--text-primary);
    font-weight: 500;
  }

  .account-type {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    background: var(--button-secondary);
    font-size: 0.875rem;
  }

  .account-type.admin {
    background: rgba(255, 215, 0, 0.2);
    color: var(--accent-color);
    border: 1px solid var(--accent-color);
  }

  .password-section {
    margin-bottom: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .password-form h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .form-actions .btn {
    flex: 1;
  }

  .error-message {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .success-message {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    color: #51cf66;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .additional-info h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .info-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  .info-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }

  .info-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--button-secondary);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .info-content h4 {
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }

  .info-content p {
    color: var(--text-secondary);
    font-size: 0.8rem;
    margin: 0;
  }

  @media (max-width: 768px) {
    .profile-container {
      padding: 0.5rem;
    }

    .profile-card {
      padding: 1.5rem;
      max-height: 95vh;
    }

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .info-card {
      padding: 0.75rem;
    }

    .info-icon {
      width: 35px;
      height: 35px;
      font-size: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .profile-card {
      padding: 1rem;
    }

    .profile-header {
      margin-bottom: 1.5rem;
    }

    .profile-header h2 {
      font-size: 1.25rem;
    }
  }
</style>