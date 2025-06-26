<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { currentUser } from '../stores/auth.js';
  import { userDB, trackDB, settingsDB } from '../utils/database.js';
  import { musicStore, playlist, currentTrack, currentTrackIndex, isPlaying } from '../stores/music.js';
  import MusicPlayer from './MusicPlayer.svelte';
  import UserProfile from './UserProfile.svelte';
  import GoogleDriveIntegration from './GoogleDriveIntegration.svelte';

  const dispatch = createEventDispatcher();

  let activeTab = 'users'; // users, tracks, settings, music
  let users = [];
  let tracks = [];
  let settings = {};
  let isLoading = true;
  let errorMessage = '';
  let successMessage = '';
  let showProfile = false;

  // User management
  let showUserForm = false;
  let editingUser = null;
  let userForm = { email: '', password: '', isAdmin: false };

  // Track management
  let showTrackForm = false;
  let editingTrack = null;
  let trackForm = { title: '', artist: '', url: '', thumbnail: '', duration: 0 };
  let newTrack = { title: '', artist: '', audioUrl: '', thumbnail: '', duration: 0 };
  
  // File upload management
  let uploadStep = 1; // 1: file selection, 2: edit info
  let selectedAudioFile = null;
  let selectedThumbnailFile = null;
  let audioPreviewUrl = '';
  let thumbnailPreviewUrl = '';

  // Settings management
  let settingsForm = { appName: '', primaryColor: '', secondaryColor: '' };

  onMount(async () => {
    try {
      // Initialize audio for admin music playback
      musicStore.initAudio();
      musicStore.startAutoSave();
      
      await loadData();
    } catch (error) {
      console.error('Lỗi khởi tạo admin panel:', error);
      errorMessage = 'Không thể tải dữ liệu quản trị.';
    } finally {
      isLoading = false;
    }
  });

  async function loadData() {
    try {
      [users, tracks, settings] = await Promise.all([
        userDB.getAllUsers(),
        trackDB.getAllTracks(),
        settingsDB.getSettings()
      ]);
      
      // Load tracks into music player
      musicStore.loadPlaylist(tracks);
      
      // Initialize settings form
      settingsForm = { ...settings };
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      throw error;
    }
  }

  function handleLogout() {
    dispatch('logout');
  }

  function toggleProfile() {
    showProfile = !showProfile;
  }

  function clearMessages() {
    errorMessage = '';
    successMessage = '';
  }

  // User Management Functions
  function showAddUser() {
    editingUser = null;
    userForm = { email: '', password: '', isAdmin: false };
    showUserForm = true;
    clearMessages();
  }

  function showEditUser(user) {
    editingUser = user;
    userForm = { email: user.email, password: '', isAdmin: user.isAdmin };
    showUserForm = true;
    clearMessages();
  }

  async function saveUser() {
    try {
      clearMessages();
      
      if (!userForm.email || (!editingUser && !userForm.password)) {
        errorMessage = 'Vui lòng nhập đầy đủ thông tin';
        return;
      }
      
      if (editingUser) {
        // Update user
        const updates = { email: userForm.email, isAdmin: userForm.isAdmin };
        if (userForm.password) {
          updates.password = userForm.password;
        }
        await userDB.updateUser(editingUser.id, updates);
        successMessage = 'Cập nhật người dùng thành công!';
      } else {
        // Add new user
        await userDB.register(userForm.email, userForm.password);
        if (userForm.isAdmin) {
          // Update to admin after creation
          const newUsers = await userDB.getAllUsers();
          const newUser = newUsers.find(u => u.email === userForm.email);
          if (newUser) {
            await userDB.updateUser(newUser.id, { isAdmin: true });
          }
        }
        successMessage = 'Thêm người dùng thành công!';
      }
      
      await loadData();
      showUserForm = false;
    } catch (error) {
      errorMessage = error.message;
    }
  }

  async function deleteUser(user) {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${user.email}"?`)) return;
    
    try {
      clearMessages();
      await userDB.deleteUser(user.id);
      await loadData();
      successMessage = 'Xóa người dùng thành công!';
    } catch (error) {
      errorMessage = error.message;
    }
  }

  // Track Management Functions
  function showAddTrack() {
    editingTrack = null;
    trackForm = { title: '', artist: '', url: '', thumbnail: '', duration: 0 };
    uploadStep = 1;
    selectedAudioFile = null;
    selectedThumbnailFile = null;
    audioPreviewUrl = '';
    thumbnailPreviewUrl = '';
    showTrackForm = true;
    clearMessages();
  }

  function showEditTrack(track) {
    editingTrack = track;
    trackForm = { ...track };
    uploadStep = 2; // Skip file selection for editing
    selectedAudioFile = null;
    selectedThumbnailFile = null;
    audioPreviewUrl = '';
    thumbnailPreviewUrl = '';
    showTrackForm = true;
    clearMessages();
  }

  // File Upload Functions
  function handleAudioFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      selectedAudioFile = file;
      audioPreviewUrl = URL.createObjectURL(file);
      
      // Auto-fill title from filename
      if (!trackForm.title) {
        trackForm.title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
      
      // Get audio duration
      const audio = new Audio(audioPreviewUrl);
      audio.addEventListener('loadedmetadata', () => {
        trackForm.duration = Math.floor(audio.duration);
      });
    } else {
      errorMessage = 'Vui lòng chọn file âm thanh hợp lệ';
    }
  }

  function handleThumbnailFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      selectedThumbnailFile = file;
      thumbnailPreviewUrl = URL.createObjectURL(file);
    } else {
      errorMessage = 'Vui lòng chọn file hình ảnh hợp lệ';
    }
  }

  function proceedToEditStep() {
    // Check if either URL or file is provided
    if (!newTrack.audioUrl && !selectedAudioFile) {
      errorMessage = 'Vui lòng nhập URL âm thanh hoặc chọn file âm thanh trước khi tiếp tục!';
      return;
    }
    
    // Auto-fill track title from filename if file is selected
     if (selectedAudioFile && !newTrack.title) {
       newTrack.title = selectedAudioFile.name.replace(/\.[^/.]+$/, "");
     }
     
     // If URL is provided, clear file selection to avoid conflicts
     if (newTrack.audioUrl && selectedAudioFile) {
       selectedAudioFile = null;
       audioPreviewUrl = null;
       successMessage = 'Đã chọn URL, bỏ qua file đã chọn.';
     }
    
    uploadStep = 2;
    clearMessages();
  }

  function backToFileSelection() {
    uploadStep = 1;
    clearMessages();
  }

  function convertFileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // Handle Google Drive import
  async function handleGoogleDriveImport(event) {
    try {
      const { tracks } = event.detail;
      
      for (const track of tracks) {
        await trackDB.addTrack(track);
      }
      
      await loadData();
      successMessage = `Đã import thành công ${tracks.length} bài hát từ Google Drive!`;
      
    } catch (error) {
      console.error('Lỗi import từ Google Drive:', error);
      errorMessage = 'Có lỗi xảy ra khi import từ Google Drive.';
    }
  }

  async function saveTrack() {
    try {
      clearMessages();
      
      if (!trackForm.title) {
        errorMessage = 'Vui lòng nhập tên bài hát';
        return;
      }
      
      // For new tracks, handle file storage differently
      if (!editingTrack) {
        if (!selectedAudioFile) {
          errorMessage = 'Vui lòng chọn file âm thanh';
          return;
        }
        
        // Upload audio file to server
        const audioFormData = new FormData();
        audioFormData.append('file', selectedAudioFile);
        
        try {
          // Upload audio file to server
          const response = await fetch('/api/upload-file', {
            method: 'POST',
            body: audioFormData
          });
          
          if (!response.ok) {
            throw new Error(`Lỗi upload file: ${response.statusText}`);
          }
          
          const result = await response.json();
          trackForm.url = result.fileUrl; // Use URL from server response
          trackForm.fileSize = selectedAudioFile.size;
          trackForm.fileType = selectedAudioFile.type;
          
          console.log('File âm thanh đã được upload lên server:', result.fileUrl);
        } catch (uploadError) {
          console.error('Lỗi upload file âm thanh:', uploadError);
          errorMessage = `Không thể upload file âm thanh: ${uploadError.message}`;
          return;
        }
        
        // For thumbnail, only convert if it's small enough (< 500KB)
        if (selectedThumbnailFile) {
          if (selectedThumbnailFile.size < 500000) { // 500KB limit
            trackForm.thumbnail = await convertFileToDataUrl(selectedThumbnailFile);
          } else {
            // Upload thumbnail to server
            const thumbnailFormData = new FormData();
            thumbnailFormData.append('file', selectedThumbnailFile);
            
            try {
              const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: thumbnailFormData
              });
              
              if (!response.ok) {
                throw new Error(`Lỗi upload thumbnail: ${response.statusText}`);
              }
              
              const result = await response.json();
              trackForm.thumbnail = result.fileUrl;
              console.log('Thumbnail đã được upload lên server:', result.fileUrl);
            } catch (thumbnailError) {
              console.error('Lỗi upload thumbnail:', thumbnailError);
              errorMessage = `Không thể upload thumbnail: ${thumbnailError.message}`;
              return;
            }
          }
        }
        
        successMessage = 'File âm thanh đã được upload lên server thành công!';
      }
      
      // For editing, only update thumbnail if new file selected
      if (editingTrack && selectedThumbnailFile) {
        if (selectedThumbnailFile.size < 500000) { // 500KB limit
          trackForm.thumbnail = await convertFileToDataUrl(selectedThumbnailFile);
        } else {
          errorMessage = 'Hình ảnh quá lớn (>500KB). Vui lòng chọn hình ảnh nhỏ hơn hoặc sử dụng URL.';
          return;
        }
      }
      
      if (editingTrack) {
        await trackDB.updateTrack(editingTrack.id, trackForm);
        if (!successMessage) successMessage = 'Cập nhật bài hát thành công!';
      } else {
        await trackDB.addTrack(trackForm);
        if (!successMessage) successMessage = 'Thêm bài hát thành công!';
      }
      
      await loadData();
      showTrackForm = false;
      
      // Clean up object URLs
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    } catch (error) {
      if (error.message.includes('quota')) {
        errorMessage = 'Lỗi: Dung lượng lưu trữ đã đầy. Vui lòng xóa một số bài hát cũ hoặc sử dụng URL thay vì upload file.';
      } else {
        errorMessage = error.message;
      }
    }
  }

  async function deleteTrack(track) {
    if (!confirm(`Bạn có chắc muốn xóa bài hát "${track.title}"?`)) return;
    
    try {
      clearMessages();
      
      // Nếu track đang phát, dừng phát và reset
      if ($currentTrack && $currentTrack.id === track.id) {
        if ($isPlaying) {
          musicStore.togglePlay();
        }
        // Reset current track
        currentTrack.set(null);
        currentTrackIndex.set(-1);
      }
      
      // Xóa file trên server nếu là file local
      if (track.url && track.url.includes('localhost')) {
        try {
          const fileName = track.url.split('/').pop();
          const response = await fetch(`http://localhost:3000/api/delete-file/${fileName}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            console.warn('Không thể xóa file trên server:', fileName);
          }
        } catch (fileError) {
          console.warn('Lỗi khi xóa file trên server:', fileError);
        }
      }
      
      // Xóa track khỏi database
      await trackDB.deleteTrack(track.id);
      
      // Cập nhật dữ liệu và musicStore
      await loadData();
      
      successMessage = 'Xóa bài hát thành công!';
    } catch (error) {
      errorMessage = error.message;
    }
  }

  // Settings Management
  async function saveSettings() {
    try {
      clearMessages();
      
      if (!settingsForm.appName) {
        errorMessage = 'Vui lòng nhập tên ứng dụng';
        return;
      }
      
      await settingsDB.updateSettings(settingsForm);
      settings = { ...settingsForm };
      successMessage = 'Cập nhật cài đặt thành công!';
      
      // Apply new colors to CSS variables
      if (settingsForm.primaryColor) {
        document.documentElement.style.setProperty('--accent-color', settingsForm.primaryColor);
        document.documentElement.style.setProperty('--button-primary', settingsForm.primaryColor);
      }
      if (settingsForm.secondaryColor) {
        document.documentElement.style.setProperty('--primary-bg', settingsForm.secondaryColor);
      }
    } catch (error) {
      errorMessage = error.message;
    }
  }

  // Music Player Functions
  function handleTrackSelect(track, index) {
    musicStore.playTrack(track, index);
  }

  function formatDate(dateString) {
    if (!dateString) return 'Không rõ';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'Không rõ';
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="admin-panel">
  <!-- Header -->
  <header class="nav-header">
    <div class="nav-title">
      👑 Quản Trị - {settings.appName || 'Lời Phật Dạy'}
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
  <main class="admin-content">
    <div class="container">
      {#if showProfile}
        <UserProfile user={$currentUser} on:close={toggleProfile} />
      {:else}
        <!-- Tab Navigation -->
        <nav class="tab-nav">
          <button 
            class="tab-btn" 
            class:active={activeTab === 'users'}
            on:click={() => activeTab = 'users'}
          >
            👥 Người dùng ({users.length})
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'tracks'}
            on:click={() => activeTab = 'tracks'}
          >
            🎵 Nhạc ({tracks.length})
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'music'}
            on:click={() => activeTab = 'music'}
          >
            🎧 Nghe nhạc
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'settings'}
            on:click={() => activeTab = 'settings'}
          >
            ⚙️ Cài đặt
          </button>
        </nav>

        <!-- Messages -->
        {#if errorMessage}
          <div class="error-banner">
            {errorMessage}
            <button class="btn btn-secondary" on:click={clearMessages}>✕</button>
          </div>
        {/if}

        {#if successMessage}
          <div class="success-banner">
            {successMessage}
            <button class="btn btn-secondary" on:click={clearMessages}>✕</button>
          </div>
        {/if}

        <!-- Loading State -->
        {#if isLoading}
          <div class="loading-section">
            <div class="loading"></div>
            <p>Đang tải dữ liệu quản trị...</p>
          </div>
        {:else}
          <!-- Tab Content -->
          <div class="tab-content">
            {#if activeTab === 'users'}
              <!-- Users Management -->
              <section class="users-section">
                <div class="section-header">
                  <h2>Quản lý người dùng</h2>
                  <button class="btn btn-primary" on:click={showAddUser}>
                    ➕ Thêm người dùng
                  </button>
                </div>

                {#if showUserForm}
                  <div class="form-modal">
                    <div class="form-card">
                      <h3>{editingUser ? 'Sửa' : 'Thêm'} người dùng</h3>
                      
                      <div class="form-group">
                        <label class="form-label">Email</label>
                        <input 
                          type="email" 
                          bind:value={userForm.email} 
                          class="form-input"
                          placeholder="Nhập email"
                        />
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label">
                          Mật khẩu {editingUser ? '(để trống nếu không đổi)' : ''}
                        </label>
                        <input 
                          type="password" 
                          bind:value={userForm.password} 
                          class="form-input"
                          placeholder="Nhập mật khẩu"
                        />
                      </div>
                      
                      <div class="form-group">
                        <label class="checkbox-label">
                          <input 
                            type="checkbox" 
                            bind:checked={userForm.isAdmin}
                          />
                          Quản trị viên
                        </label>
                      </div>
                      
                      <div class="form-actions">
                        <button class="btn btn-secondary" on:click={() => showUserForm = false}>
                          Hủy
                        </button>
                        <button class="btn btn-primary" on:click={saveUser}>
                          {editingUser ? 'Cập nhật' : 'Thêm'}
                        </button>
                      </div>
                    </div>
                  </div>
                {/if}

                <div class="users-list">
                  {#each users as user}
                    <div class="user-item">
                      <div class="user-info">
                        <h4>{user.email}</h4>
                        <p>{user.isAdmin ? '👑 Quản trị viên' : '👤 Người dùng'}</p>
                        <span class="user-date">Tạo: {formatDate(user.createdAt)}</span>
                      </div>
                      <div class="user-actions">
                        <button class="btn btn-secondary" on:click={() => showEditUser(user)}>
                          ✏️ Sửa
                        </button>
                        {#if user.id !== $currentUser.id}
                          <button class="btn btn-danger" on:click={() => deleteUser(user)}>
                            🗑️ Xóa
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            
            {:else if activeTab === 'tracks'}
              <!-- Tracks Management -->
              <section class="tracks-section">
                <div class="section-header">
                  <h2>Quản lý nhạc</h2>
                  <button class="btn btn-primary" on:click={showAddTrack}>
                    ➕ Thêm bài hát
                  </button>
                </div>
                
                <!-- Google Drive Integration -->
                <GoogleDriveIntegration on:import={handleGoogleDriveImport} />

                {#if showTrackForm}
                  <div class="form-modal">
                    <div class="form-card">
                      <h3>{editingTrack ? 'Sửa' : 'Thêm'} bài hát</h3>
                      
                      {#if !editingTrack}
                        <!-- Step indicator -->
                        <div class="step-indicator">
                          <div class="step" class:active={uploadStep === 1} class:completed={uploadStep > 1}>
                            <span class="step-number">1</span>
                            <span class="step-label">Chọn file</span>
                          </div>
                          <div class="step-divider"></div>
                          <div class="step" class:active={uploadStep === 2}>
                            <span class="step-number">2</span>
                            <span class="step-label">Chỉnh sửa thông tin</span>
                          </div>
                        </div>
                      {/if}
                      
                      {#if uploadStep === 1 && !editingTrack}
                        <!-- Step 1: File Selection -->
                        <div class="upload-section">
                          <div class="storage-warning">
                            <div class="warning-icon">⚠️</div>
                            <div class="warning-content">
                              <strong>Lưu ý về dung lượng:</strong>
                              <p>Do giới hạn localStorage (~5MB), việc upload file lớn có thể gây lỗi. Khuyến nghị:</p>
                              <ul>
                                <li>🎵 File âm thanh: Sử dụng URL từ server thay vì upload</li>
                                <li>🖼️ Hình ảnh: Tối đa 500KB</li>
                                <li>🔗 Hoặc sử dụng URL cho cả âm thanh và hình ảnh</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div class="form-group">
                            <label class="form-label">🎵 Âm thanh * (Chọn một trong hai cách)</label>
                            
                            <!-- URL Input Option -->
                            <div class="input-option">
                              <label class="option-label">🔗 Nhập URL âm thanh (Khuyến nghị)</label>
                              <input 
                                type="url" 
                                bind:value={newTrack.audioUrl}
                                placeholder="https://example.com/audio.mp3"
                                class="form-input"
                              />
                              {#if newTrack.audioUrl}
                                <audio controls class="audio-preview">
                                  <source src={newTrack.audioUrl} />
                                  Trình duyệt không hỗ trợ phát âm thanh.
                                </audio>
                              {/if}
                            </div>
                            
                            <div class="option-divider">HOẶC</div>
                            
                            <!-- File Upload Option -->
                            <div class="input-option">
                              <label class="option-label">📁 Upload file (Không khuyến nghị - giới hạn dung lượng)</label>
                              <div class="file-input-wrapper">
                                <input 
                                  type="file" 
                                  accept="audio/*"
                                  on:change={handleAudioFileSelect}
                                  class="file-input"
                                  id="audio-file"
                                />
                                <label for="audio-file" class="file-input-label">
                                  {#if selectedAudioFile}
                                    ✅ {selectedAudioFile.name}
                                    <br><small>⚠️ Chỉ lưu thông tin tham chiếu, không phát được</small>
                                  {:else}
                                    🎵 Chọn file âm thanh (MP3, WAV, etc.)
                                    <br><small>⚠️ Khuyến nghị sử dụng URL thay thế</small>
                                  {/if}
                                </label>
                              </div>
                              {#if audioPreviewUrl}
                                <audio controls class="audio-preview">
                                  <source src={audioPreviewUrl} type={selectedAudioFile.type} />
                                  Trình duyệt không hỗ trợ phát âm thanh.
                                </audio>
                              {/if}
                            </div>
                          </div>
                          
                          <div class="form-group">
                            <label class="form-label">🖼️ Chọn hình ảnh thumbnail (tùy chọn)</label>
                            <div class="file-input-wrapper">
                              <input 
                                type="file" 
                                accept="image/*"
                                on:change={handleThumbnailFileSelect}
                                class="file-input"
                                id="thumbnail-file"
                              />
                              <label for="thumbnail-file" class="file-input-label">
                                {#if selectedThumbnailFile}
                                  ✅ {selectedThumbnailFile.name}
                                {:else}
                                  🖼️ Chọn hình ảnh (JPG, PNG, etc.)
                                {/if}
                              </label>
                            </div>
                            {#if thumbnailPreviewUrl}
                              <div class="thumbnail-preview">
                                <img src={thumbnailPreviewUrl} alt="Preview" />
                              </div>
                            {/if}
                          </div>
                        </div>
                        
                        <div class="form-actions">
                          <button class="btn btn-secondary" on:click={() => showTrackForm = false}>
                            Hủy
                          </button>
                          <button class="btn btn-primary" on:click={proceedToEditStep} disabled={!selectedAudioFile}>
                            Tiếp tục ➡️
                          </button>
                        </div>
                        
                      {:else}
                        <!-- Step 2: Edit Information -->
                        <div class="edit-section">
                          {#if !editingTrack && selectedAudioFile}
                            <div class="selected-file-info">
                              <h4>📁 File đã chọn:</h4>
                              <p><strong>Âm thanh:</strong> {selectedAudioFile.name}</p>
                              {#if selectedThumbnailFile}
                                <p><strong>Hình ảnh:</strong> {selectedThumbnailFile.name}</p>
                              {/if}
                            </div>
                          {/if}
                          
                          <div class="form-group">
                            <label class="form-label">Tên bài hát *</label>
                            <input 
                              type="text" 
                              bind:value={trackForm.title} 
                              class="form-input"
                              placeholder="Nhập tên bài hát"
                            />
                          </div>
                          
                          <div class="form-group">
                            <label class="form-label">Tác giả</label>
                            <input 
                              type="text" 
                              bind:value={trackForm.artist} 
                              class="form-input"
                              placeholder="Nhập tên tác giả"
                            />
                          </div>
                          
                          {#if editingTrack}
                            <div class="form-group">
                              <label class="form-label">URL âm thanh</label>
                              <input 
                                type="url" 
                                bind:value={trackForm.url} 
                                class="form-input"
                                placeholder="https://example.com/audio.mp3"
                              />
                            </div>
                            
                            <div class="form-group">
                              <label class="form-label">🖼️ Cập nhật hình ảnh thumbnail (tùy chọn)</label>
                              <div class="file-input-wrapper">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  on:change={handleThumbnailFileSelect}
                                  class="file-input"
                                  id="edit-thumbnail-file"
                                />
                                <label for="edit-thumbnail-file" class="file-input-label">
                                  {#if selectedThumbnailFile}
                                    ✅ {selectedThumbnailFile.name}
                                  {:else}
                                    🖼️ Chọn hình ảnh mới
                                  {/if}
                                </label>
                              </div>
                              {#if thumbnailPreviewUrl}
                                <div class="thumbnail-preview">
                                  <img src={thumbnailPreviewUrl} alt="Preview" />
                                </div>
                              {:else if trackForm.thumbnail}
                                <div class="thumbnail-preview">
                                  <img src={trackForm.thumbnail} alt="Current thumbnail" />
                                  <p class="current-label">Hình ảnh hiện tại</p>
                                </div>
                              {/if}
                            </div>
                            
                            <div class="form-group">
                              <label class="form-label">URL hình ảnh (hoặc chọn file ở trên)</label>
                              <input 
                                type="url" 
                                bind:value={trackForm.thumbnail} 
                                class="form-input"
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                          {/if}
                          
                          <div class="form-group">
                            <label class="form-label">Thời lượng (giây)</label>
                            <input 
                              type="number" 
                              bind:value={trackForm.duration} 
                              class="form-input"
                              placeholder="300"
                              min="0"
                              readonly={!editingTrack && selectedAudioFile}
                            />
                            {#if !editingTrack && selectedAudioFile}
                              <small class="form-hint">Thời lượng sẽ được tự động phát hiện từ file</small>
                            {/if}
                          </div>
                        </div>
                        
                        <div class="form-actions">
                          {#if !editingTrack}
                            <button class="btn btn-secondary" on:click={backToFileSelection}>
                              ⬅️ Quay lại
                            </button>
                          {:else}
                            <button class="btn btn-secondary" on:click={() => showTrackForm = false}>
                              Hủy
                            </button>
                          {/if}
                          <button class="btn btn-primary" on:click={saveTrack}>
                            {editingTrack ? 'Cập nhật' : 'Thêm bài hát'}
                          </button>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}

                <div class="tracks-list">
                  {#each tracks as track}
                    <div class="track-item">
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
                        <button class="btn btn-secondary" on:click={() => showEditTrack(track)}>
                          ✏️ Sửa
                        </button>
                        <button class="btn btn-danger" on:click={() => deleteTrack(track)}>
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            
            {:else if activeTab === 'music'}
              <!-- Music Player for Admin -->
              <section class="music-section">
                <h2>Nghe nhạc (Admin)</h2>
                <p>Quản trị viên có thể nghe nhạc và lưu tiến độ như người dùng thường</p>
                
                {#if tracks.length === 0}
                  <div class="empty-state">
                    <h3>Chưa có bài hát nào</h3>
                    <p>Hãy thêm bài hát trong tab "Nhạc"</p>
                  </div>
                {:else}
                  <div class="admin-playlist">
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
                {/if}
              </section>
            
            {:else if activeTab === 'settings'}
              <!-- Settings Management -->
              <section class="settings-section">
                <h2>Cài đặt ứng dụng</h2>
                
                <div class="settings-form">
                  <div class="form-group">
                    <label class="form-label">Tên ứng dụng</label>
                    <input 
                      type="text" 
                      bind:value={settingsForm.appName} 
                      class="form-input"
                      placeholder="Lời Phật Dạy"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Màu chính</label>
                    <div class="color-input-group">
                      <input 
                        type="color" 
                        bind:value={settingsForm.primaryColor} 
                        class="color-input"
                      />
                      <input 
                        type="text" 
                        bind:value={settingsForm.primaryColor} 
                        class="form-input"
                        placeholder="#ffd700"
                      />
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Màu nền</label>
                    <div class="color-input-group">
                      <input 
                        type="color" 
                        bind:value={settingsForm.secondaryColor} 
                        class="color-input"
                      />
                      <input 
                        type="text" 
                        bind:value={settingsForm.secondaryColor} 
                        class="form-input"
                        placeholder="#1a1a2e"
                      />
                    </div>
                  </div>
                  
                  <button class="btn btn-primary" on:click={saveSettings}>
                    💾 Lưu cài đặt
                  </button>
                </div>
              </section>
            {/if}
          </div>
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
  .admin-panel {
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

  .admin-content {
    flex: 1;
    padding-bottom: 120px; /* Space for music player */
  }

  .tab-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--border-color);
    overflow-x: auto;
  }

  .tab-btn {
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .tab-btn:hover {
    color: var(--text-primary);
    background: var(--button-secondary);
  }

  .tab-btn.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
  }

  .error-banner, .success-banner {
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .error-banner {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
  }

  .success-banner {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    color: #51cf66;
  }

  .loading-section {
    text-align: center;
    padding: 3rem 0;
  }

  .loading-section p {
    margin-top: 1rem;
    color: var(--text-secondary);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .section-header h2 {
    color: var(--text-primary);
    margin: 0;
  }

  .form-modal {
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

  .form-card {
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .storage-warning {
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    gap: 0.75rem;
  }

  .warning-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .warning-content {
    flex: 1;
  }

  .warning-content strong {
    color: #ffc107;
    display: block;
    margin-bottom: 0.5rem;
  }

  .warning-content p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .warning-content ul {
    margin: 0.5rem 0;
    padding-left: 1.25rem;
  }

  .warning-content li {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.25rem;
  }

  .input-option {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .option-label {
    display: block;
    font-size: 0.9rem;
    color: var(--accent-color);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .option-divider {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
    font-weight: bold;
    margin: 1rem 0;
    position: relative;
  }

  .option-divider::before,
  .option-divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: rgba(255, 215, 0, 0.3);
  }

  .option-divider::before {
    left: 0;
  }

  .option-divider::after {
    right: 0;
  }

  .form-card h3 {
    color: var(--accent-color);
    margin-bottom: 1.5rem;
  }

  /* Step Indicator */
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  .step.active {
    opacity: 1;
    color: var(--accent-color);
  }

  .step.completed {
    opacity: 1;
    color: var(--success-color, #28a745);
  }

  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .step.active .step-number {
    background: var(--accent-color);
    color: var(--bg-primary);
  }

  .step.completed .step-number {
    background: var(--success-color, #28a745);
    color: white;
  }

  .step-label {
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
  }

  .step-divider {
    width: 60px;
    height: 2px;
    background: var(--border-color);
    margin: 0 1rem;
  }

  /* File Input Styling */
  .file-input-wrapper {
    position: relative;
    margin-bottom: 0.5rem;
  }

  .file-input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .file-input-label {
    display: block;
    padding: 1rem;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    background: var(--bg-primary);
    color: var(--text-secondary);
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }

  .file-input-label:hover {
    border-color: var(--accent-color);
    background: rgba(255, 193, 7, 0.1);
    color: var(--accent-color);
  }

  .file-input:focus + .file-input-label {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
  }

  /* Preview Styling */
  .audio-preview {
    width: 100%;
    margin-top: 0.5rem;
    border-radius: 4px;
  }

  .thumbnail-preview {
    margin-top: 0.5rem;
    text-align: center;
  }

  .thumbnail-preview img {
    max-width: 150px;
    max-height: 150px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    object-fit: cover;
  }

  .current-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  /* Selected File Info */
  .selected-file-info {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .selected-file-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--accent-color);
    font-size: 1rem;
  }

  .selected-file-info p {
    margin: 0.25rem 0;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .form-input:read-only {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
  }

  .form-hint {
    display: block;
    margin-top: 0.25rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-style: italic;
  }

  .upload-section,
  .edit-section {
    min-height: 200px;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .form-actions .btn {
    flex: 1;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }

  .users-list, .tracks-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .user-item, .track-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
  }

  .user-info, .track-info {
    flex: 1;
    min-width: 0;
  }

  .user-info h4, .track-info h4 {
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: 1rem;
  }

  .user-info p, .track-info p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .user-date, .track-duration {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .user-actions, .track-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
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

  .btn-danger {
    background: rgba(255, 0, 0, 0.2);
    color: #ff6b6b;
    border: 1px solid rgba(255, 0, 0, 0.3);
  }

  .btn-danger:hover {
    background: rgba(255, 0, 0, 0.3);
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-input {
    width: 50px;
    height: 40px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
  }

  .settings-form {
    max-width: 500px;
  }

  .admin-playlist {
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

  .empty-state {
    text-align: center;
    padding: 3rem 0;
    color: var(--text-secondary);
  }

  .empty-state h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
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

    .section-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .user-item, .track-item {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .user-actions, .track-actions {
      justify-content: center;
    }

    .form-card {
      padding: 1.5rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .color-input-group {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>