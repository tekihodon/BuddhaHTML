<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { currentUser } from '../stores/auth.js';
  import { musicStore, playlist, currentTrack, isPlaying, currentTrackIndex } from '../stores/music.js';
  import { trackDB } from '../utils/database.js';
  import MusicPlayer from './MusicPlayer.svelte';
  import UserProfile from './UserProfile.svelte';

  const dispatch = createEventDispatcher();

  let tracks = [];
  let isLoading = true;
  let errorMessage = '';
  let showProfile = false;

  onMount(async () => {
    try {
      // Initialize audio and auto-save
      musicStore.initAudio();
      musicStore.startAutoSave();
      
      // Load tracks
      await loadTracks();
    } catch (error) {
      console.error('Lỗi khởi tạo dashboard:', error);
      errorMessage = 'Không thể tải dữ liệu. Vui lòng thử lại.';
    } finally {
      isLoading = false;
    }
  });

  async function loadTracks() {
    try {
      tracks = await trackDB.getAllTracks();
      musicStore.loadPlaylist(tracks);
    } catch (error) {
      console.error('Lỗi tải danh sách nhạc:', error);
      errorMessage = 'Không thể tải danh sách nhạc.';
    }
  }

  function handleTrackSelect(track, index) {
    musicStore.playTrack(track, index);
  }

  function handleLogout() {
    dispatch('logout');
  }

  function toggleProfile() {
    showProfile = !showProfile;
  }

  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="dashboard">
  <!-- Header -->
  <header class="nav-header">
    <div class="nav-title">
      🙏 Lời Phật Dạy
    </div>
    <div class="nav-actions">
      <button class="btn btn-secondary" on:click={toggleProfile}>
        👤 Hồ sơ
      </button>
      <button class="btn btn-secondary" on:click={handleLogout}>
        🚪 Đăng xuất
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="dashboard-content">
    <div class="container">
      {#if showProfile}
        <UserProfile user={$currentUser} on:close={toggleProfile} />
      {:else}
        <!-- Welcome Section -->
        <section class="welcome-section">
          <h1>Chào mừng, {$currentUser?.email || 'Bạn'}!</h1>
          <p>Hãy thưởng thức những lời Phật dạy an lạc</p>
        </section>

        <!-- Error Message -->
        {#if errorMessage}
          <div class="error-banner">
            {errorMessage}
            <button class="btn btn-secondary" on:click={loadTracks}>
              Thử lại
            </button>
          </div>
        {/if}

        <!-- Loading State -->
        {#if isLoading}
          <div class="loading-section">
            <div class="loading"></div>
            <p>Đang tải danh sách nhạc...</p>
          </div>
        {:else if tracks.length === 0}
          <!-- Empty State -->
          <div class="empty-state">
            <h3>Chưa có bài hát nào</h3>
            <p>Vui lòng liên hệ quản trị viên để thêm nhạc</p>
          </div>
        {:else}
          <!-- Playlist -->
          <section class="playlist-section">
            <h2>Danh sách nhạc ({tracks.length} bài)</h2>
            <div class="playlist">
              {#each tracks as track, index}
                <div 
                  class="playlist-item" 
                  class:active={$currentTrack?.id === track.id}
                  on:click={() => handleTrackSelect(track, index)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleTrackSelect(track, index)}
                >
                  <div class="track-thumbnail">
                    {#if track.thumbnail}
                      <img src={track.thumbnail} alt={track.title} />
                    {:else}
                      <div class="default-thumbnail">🎵</div>
                    {/if}
                  </div>
                  
                  <div class="track-info">
                    <h4>{track.title}</h4>
                    <p>{track.artist || 'Không rõ tác giả'}</p>
                    <span class="track-duration">{formatDuration(track.duration)}</span>
                  </div>
                  
                  <div class="track-actions">
                    {#if $currentTrack?.id === track.id}
                      {#if $isPlaying}
                        <div class="playing-indicator">
                          <div class="wave"></div>
                          <div class="wave"></div>
                          <div class="wave"></div>
                        </div>
                      {:else}
                        <div class="paused-indicator">⏸️</div>
                      {/if}
                    {:else}
                      <div class="play-indicator">▶️</div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      {/if}
    </div>
  </main>

  <!-- Music Player (Fixed at bottom) -->
  {#if $currentTrack}
    <MusicPlayer />
  {/if}
</div>

<style>
  .dashboard {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }

  .nav-header {
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-actions {
    display: flex;
    gap: 0.5rem;
  }

  .dashboard-content {
    flex: 1;
    padding-bottom: 120px; /* Space for music player */
  }

  .welcome-section {
    text-align: center;
    padding: 2rem 0;
    margin-bottom: 2rem;
  }

  .welcome-section h1 {
    color: var(--accent-color);
    margin-bottom: 0.5rem;
  }

  .welcome-section p {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .error-banner {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .loading-section {
    text-align: center;
    padding: 3rem 0;
  }

  .loading-section p {
    margin-top: 1rem;
    color: var(--text-secondary);
  }

  .empty-state {
    text-align: center;
    padding: 3rem 0;
    color: var(--text-secondary);
  }

  .empty-state h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .playlist-section h2 {
    color: var(--text-primary);
    margin-bottom: 1rem;
    font-size: 1.25rem;
  }

  .playlist {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .playlist-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .playlist-item:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(4px);
  }

  .playlist-item.active {
    background: rgba(255, 215, 0, 0.2);
    border-color: var(--accent-color);
  }

  .track-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .track-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-thumbnail {
    width: 100%;
    height: 100%;
    background: var(--button-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .track-info {
    flex: 1;
    min-width: 0;
  }

  .track-info h4 {
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-info p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-duration {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .track-actions {
    flex-shrink: 0;
  }

  .playing-indicator {
    display: flex;
    gap: 2px;
    align-items: end;
    height: 20px;
  }

  .wave {
    width: 3px;
    background: var(--accent-color);
    animation: wave 1s ease-in-out infinite;
  }

  .wave:nth-child(1) { animation-delay: 0s; }
  .wave:nth-child(2) { animation-delay: 0.1s; }
  .wave:nth-child(3) { animation-delay: 0.2s; }

  @keyframes wave {
    0%, 100% { height: 8px; }
    50% { height: 20px; }
  }

  .paused-indicator,
  .play-indicator {
    font-size: 1.2rem;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .nav-actions {
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-actions .btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    .playlist-item {
      padding: 0.75rem;
      gap: 0.75rem;
    }

    .track-thumbnail {
      width: 50px;
      height: 50px;
    }

    .track-info h4 {
      font-size: 0.9rem;
    }

    .track-info p {
      font-size: 0.8rem;
    }
  }
</style>