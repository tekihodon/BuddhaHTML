<script>
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth.js';
  import { userDB } from '../utils/database.js';

  const dispatch = createEventDispatcher();

  let isLogin = true;
  let email = '';
  let password = '';
  let confirmPassword = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  async function handleSubmit() {
    if (isLoading) return;
    
    errorMessage = '';
    successMessage = '';
    
    // Validation
    if (!email || !password) {
      errorMessage = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      errorMessage = 'Mật khẩu xác nhận không khớp';
      return;
    }
    
    if (!isLogin && password.length < 6) {
      errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự';
      return;
    }
    
    isLoading = true;
    
    try {
      if (isLogin) {
        // Đăng nhập
        const user = await userDB.authenticate(email, password);
        authStore.login(user);
        successMessage = 'Đăng nhập thành công!';
      } else {
        // Đăng ký
        const user = await userDB.register(email, password);
        authStore.login(user);
        successMessage = 'Đăng ký thành công!';
      }
    } catch (error) {
      errorMessage = error.message;
    } finally {
      isLoading = false;
    }
  }
  
  function toggleMode() {
    isLogin = !isLogin;
    errorMessage = '';
    successMessage = '';
    password = '';
    confirmPassword = '';
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <!-- Header -->
    <div class="login-header">
      <h1>🙏 Lời Phật Dạy</h1>
      <p>Ứng dụng nghe nhạc Phật giáo</p>
    </div>
    
    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="login-form">
      <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
      
      <!-- Email -->
      <div class="form-group">
        <label for="email" class="form-label">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          on:keypress={handleKeyPress}
          class="form-input"
          placeholder="Nhập email của bạn"
          required
        />
      </div>
      
      <!-- Password -->
      <div class="form-group">
        <label for="password" class="form-label">Mật khẩu</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          on:keypress={handleKeyPress}
          class="form-input"
          placeholder="Nhập mật khẩu"
          required
        />
      </div>
      
      <!-- Confirm Password (only for register) -->
      {#if !isLogin}
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            on:keypress={handleKeyPress}
            class="form-input"
            placeholder="Nhập lại mật khẩu"
            required
          />
        </div>
      {/if}
      
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
      
      <!-- Submit Button -->
      <button type="submit" class="btn btn-primary login-btn" disabled={isLoading}>
        {#if isLoading}
          <div class="loading"></div>
          Đang xử lý...
        {:else}
          {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
        {/if}
      </button>
      
      <!-- Toggle Mode -->
      <div class="toggle-mode">
        <p>
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          <button type="button" class="link-btn" on:click={toggleMode}>
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </form>
   
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  
  .login-card {
    width: 100%;
    max-width: 400px;
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: var(--shadow);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .login-header h1 {
    font-size: 2rem;
    color: var(--accent-color);
    margin-bottom: 0.5rem;
  }
  
  .login-header p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .login-form h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .login-btn {
    width: 100%;
    margin-top: 1rem;
    padding: 1rem;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .toggle-mode {
    text-align: center;
    margin-top: 1.5rem;
  }
  
  .toggle-mode p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .link-btn {
    background: none;
    border: none;
    color: var(--accent-color);
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
    padding: 0;
    margin-left: 0.25rem;
  }
  
  .link-btn:hover {
    color: #ffed4e;
  }
  
  .error-message {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .success-message {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    color: #51cf66;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .demo-info {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    text-align: center;
  }
  
  .demo-info h3 {
    color: var(--accent-color);
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .demo-info p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  .demo-info strong {
    color: var(--text-primary);
  }
  
  @media (max-width: 480px) {
    .login-card {
      padding: 1.5rem;
      margin: 0.5rem;
    }
    
    .login-header h1 {
      font-size: 1.75rem;
    }
  }
</style>