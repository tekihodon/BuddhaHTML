<script>
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import AdminPanel from './components/AdminPanel.svelte';
  import { authStore, currentUser } from './stores/auth.js';
  import { initDatabase } from './utils/database.js';

  let currentView = 'login';
  let isLoading = true;

  onMount(async () => {
    try {
      await initDatabase();
      
      // Kiểm tra session đã lưu
      const user = authStore.checkAuth();
      if (user) {
        currentView = user.isAdmin ? 'admin' : 'dashboard';
      }
    } catch (error) {
      console.error('Lỗi khởi tạo ứng dụng:', error);
    } finally {
      isLoading = false;
    }
  });

  // Lắng nghe thay đổi auth state
  $: if ($currentUser) {
    currentView = $currentUser.isAdmin ? 'admin' : 'dashboard';
    localStorage.setItem('currentUser', JSON.stringify($currentUser));
  } else {
    currentView = 'login';
    localStorage.removeItem('currentUser');
  }

  function handleLogout() {
    authStore.logout();
    currentView = 'login';
  }
</script>

<main>
  {#if isLoading}
    <div class="loading-screen">
      <div class="loading-content">
        <div class="loading"></div>
        <h2>Đang tải Lời Phật Dạy...</h2>
      </div>
    </div>
  {:else if currentView === 'login'}
    <Login />
  {:else if currentView === 'dashboard'}
    <Dashboard on:logout={handleLogout} />
  {:else if currentView === 'admin'}
    <AdminPanel on:logout={handleLogout} />
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .loading-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }

  .loading-content {
    text-align: center;
    color: var(--text-primary);
  }

  .loading-content h2 {
    margin-top: 1rem;
    color: var(--accent-color);
  }
</style>