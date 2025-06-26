<script>
  import { onMount, onDestroy } from 'svelte';
  import { 
    musicStore, 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    progress,
    formattedCurrentTime,
    formattedDuration,
    volume,
    isLoading
  } from '../stores/music.js';
  import { currentUser } from '../stores/auth.js';

  let isDragging = false;
  let showVolumeControl = false;
  let volumeTimeout;

  onMount(() => {
    // Auto-save progress every 5 seconds
    const saveInterval = setInterval(() => {
      if ($currentTrack && $currentTime > 0 && $currentUser) {
        musicStore.saveProgress($currentTrack.id, $currentTime, $currentUser.id);
      }
    }, 5000);

    return () => {
      clearInterval(saveInterval);
    };
  });

  function handleProgressClick(event) {
    if (!$duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    
    musicStore.seek(percentage);
  }

  function handleProgressDrag(event) {
    if (!isDragging || !$duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const dragX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (dragX / rect.width) * 100));
    
    musicStore.seek(percentage);
  }

  function startDrag() {
    isDragging = true;
  }

  function stopDrag() {
    isDragging = false;
  }

  function handleVolumeChange(event) {
    const newVolume = parseFloat(event.target.value);
    musicStore.setVolume(newVolume);
  }

  function toggleVolumeControl() {
    showVolumeControl = !showVolumeControl;
    
    if (showVolumeControl) {
      clearTimeout(volumeTimeout);
      volumeTimeout = setTimeout(() => {
        showVolumeControl = false;
      }, 3000);
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Keyboard shortcuts
  function handleKeydown(event) {
    if (event.target.tagName === 'INPUT') return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        musicStore.togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        musicStore.previous();
        break;
      case 'ArrowRight':
        event.preventDefault();
        musicStore.next();
        break;
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('mousemove', handleProgressDrag);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('mousemove', handleProgressDrag);
    };
  });
</script>

<div class="player-container">
  <!-- Track Info -->
  <div class="track-info">
    <div class="track-thumbnail">
      {#if $currentTrack?.thumbnail}
        <img src={$currentTrack.thumbnail} alt={$currentTrack.title} />
      {:else}
        <div class="default-thumbnail">🎵</div>
      {/if}
    </div>
    
    <div class="track-details">
      <h4>{$currentTrack?.title || 'Không có bài hát'}</h4>
      <p>{$currentTrack?.artist || 'Không rõ tác giả'}</p>
    </div>
    
    <!-- Volume Control -->
    <div class="volume-section">
      <button 
        class="volume-btn" 
        on:click={toggleVolumeControl}
        title="Điều chỉnh âm lượng"
      >
        {#if $volume === 0}
          🔇
        {:else if $volume < 0.5}
          🔉
        {:else}
          🔊
        {/if}
      </button>
      
      {#if showVolumeControl}
        <div class="volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={$volume}
            on:input={handleVolumeChange}
            class="volume-slider"
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="progress-section">
    <span class="time-display">{$formattedCurrentTime}</span>
    
    <div 
      class="progress-bar" 
      on:click={handleProgressClick}
      on:mousedown={startDrag}
      role="slider"
      tabindex="0"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={$progress}
      aria-label="Tiến độ phát nhạc"
    >
      <div class="progress-fill" style="width: {$progress}%"></div>
      <div class="progress-handle" style="left: {$progress}%"></div>
    </div>
    
    <span class="time-display">{$formattedDuration}</span>
  </div>

  <!-- Player Controls -->
  <div class="player-controls">
    <button 
      class="control-btn" 
      on:click={musicStore.previous}
      title="Bài trước (←)"
      disabled={$isLoading}
    >
      ⏮️
    </button>
    
    <button 
      class="control-btn play-btn" 
      on:click={musicStore.togglePlay}
      title="{$isPlaying ? 'Tạm dừng' : 'Phát'} (Space)"
      disabled={!$currentTrack}
    >
      {#if $isLoading}
        <div class="loading small"></div>
      {:else if $isPlaying}
        ⏸️
      {:else}
        ▶️
      {/if}
    </button>
    
    <button 
      class="control-btn" 
      on:click={musicStore.next}
      title="Bài tiếp theo (→)"
      disabled={$isLoading}
    >
      ⏭️
    </button>
  </div>

  <!-- Keyboard Shortcuts Info -->
  <div class="shortcuts-info">
    <small>Space: Phát/Dừng | ←→: Chuyển bài | Click: Tua</small>
  </div>
</div>

<style>
  .player-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--border-color);
    padding: 1rem;
    z-index: 1000;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  }

  .track-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
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

  .track-details {
    flex: 1;
    min-width: 0;
  }

  .track-details h4 {
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-details p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .volume-section {
    position: relative;
    flex-shrink: 0;
  }

  .volume-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background-color 0.3s ease;
  }

  .volume-btn:hover {
    background: var(--button-secondary);
  }

  .volume-control {
    position: absolute;
    bottom: 100%;
    right: 0;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
    box-shadow: var(--shadow);
  }

  .volume-slider {
    width: 80px;
    height: 4px;
    background: var(--button-secondary);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: var(--accent-color);
    border-radius: 50%;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--accent-color);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .progress-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--button-secondary);
    border-radius: 3px;
    position: relative;
    cursor: pointer;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent-color);
    border-radius: 3px;
    transition: width 0.1s ease;
  }

  .progress-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: var(--accent-color);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .progress-bar:hover .progress-handle {
    opacity: 1;
  }

  .time-display {
    font-size: 0.75rem;
    color: var(--text-secondary);
    min-width: 40px;
    text-align: center;
  }

  .player-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .control-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--button-secondary);
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-size: 1.2rem;
  }

  .control-btn:hover:not(:disabled) {
    background: var(--button-primary);
    color: var(--primary-bg);
    transform: scale(1.05);
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .play-btn {
    width: 56px;
    height: 56px;
    background: var(--button-primary);
    color: var(--primary-bg);
    font-size: 1.4rem;
  }

  .play-btn:hover:not(:disabled) {
    background: #ffed4e;
    transform: scale(1.1);
  }

  .loading.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }

  .shortcuts-info {
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.7rem;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .player-container {
      padding: 0.75rem;
    }

    .track-info {
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .track-thumbnail {
      width: 50px;
      height: 50px;
    }

    .track-details h4 {
      font-size: 0.9rem;
    }

    .track-details p {
      font-size: 0.8rem;
    }

    .player-controls {
      gap: 0.75rem;
    }

    .control-btn {
      width: 44px;
      height: 44px;
      font-size: 1.1rem;
    }

    .play-btn {
      width: 52px;
      height: 52px;
      font-size: 1.3rem;
    }

    .shortcuts-info {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .progress-section {
      gap: 0.5rem;
    }

    .time-display {
      font-size: 0.7rem;
      min-width: 35px;
    }

    .volume-control {
      right: -20px;
    }
  }
</style>