import { writable, derived } from 'svelte/store';

// Music stores
export const playlist = writable([]);
export const currentTrack = writable(null);
export const currentTrackIndex = writable(-1);
export const isPlaying = writable(false);
export const currentTime = writable(0);
export const duration = writable(0);
export const volume = writable(1);
export const isLoading = writable(false);

// Audio element reference
let audioElement = null;

// Derived stores
export const progress = derived(
  [currentTime, duration],
  ([$currentTime, $duration]) => {
    return $duration > 0 ? ($currentTime / $duration) * 100 : 0;
  }
);

export const formattedCurrentTime = derived(
  currentTime,
  ($currentTime) => formatTime($currentTime)
);

export const formattedDuration = derived(
  duration,
  ($duration) => formatTime($duration)
);

// Helper function
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Music player actions
export const musicStore = {
  // Initialize audio element
  initAudio: () => {
    if (typeof window !== 'undefined' && !audioElement) {
      audioElement = new Audio();
      
      audioElement.addEventListener('loadedmetadata', () => {
        duration.set(audioElement.duration);
        isLoading.set(false);
      });
      
      audioElement.addEventListener('timeupdate', () => {
        currentTime.set(audioElement.currentTime);
      });
      
      audioElement.addEventListener('ended', () => {
        musicStore.next();
      });
      
      audioElement.addEventListener('loadstart', () => {
        isLoading.set(true);
      });
      
      audioElement.addEventListener('canplay', () => {
        isLoading.set(false);
      });
      
      audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        
        let errorMessage = 'Lỗi phát nhạc: ';
        
        // Check if it's a Google Drive URL
        if (audioElement.src && audioElement.src.includes('drive.google.com')) {
          errorMessage += 'Google Drive chặn truy cập trực tiếp. Vui lòng sử dụng URL từ dịch vụ khác hoặc hosting riêng.';
        } else if (audioElement.src && audioElement.src.includes('localhost')) {
          errorMessage += 'File local không tồn tại hoặc đường dẫn không đúng.';
        } else {
          errorMessage += 'Không thể tải file âm thanh. Kiểm tra URL hoặc định dạng file.';
        }
        
        console.error(errorMessage);
        isLoading.set(false);
        isPlaying.set(false);
        
        // Hiển thị thông báo lỗi cho người dùng
        if (typeof window !== 'undefined') {
          console.warn(errorMessage);
        }
      });
    }
  },
  
  // Load playlist
  loadPlaylist: (tracks) => {
    playlist.set(tracks);
  },
  
  // Play specific track
  playTrack: async (track, index) => {
    if (!audioElement) musicStore.initAudio();
    
    try {
      isLoading.set(true);
      currentTrack.set(track);
      currentTrackIndex.set(index);
      
      // Try main URL first
      let urlsToTry = [track.url];
      
      // Add alternative URLs if available
      if (track.alternativeUrls && Array.isArray(track.alternativeUrls)) {
        urlsToTry = urlsToTry.concat(track.alternativeUrls);
      }
      
      let lastError = null;
      let success = false;
      
      // Try each URL until one works
      for (let i = 0; i < urlsToTry.length && !success; i++) {
        try {
          console.log(`Thử URL ${i + 1}/${urlsToTry.length}:`, urlsToTry[i]);
          
          // Xử lý URL dựa trên loại
          let finalUrl = urlsToTry[i];
          
          // Nếu là URL local, chuyển đổi thành URL server
          if (finalUrl.startsWith('local://')) {
            // Lấy tên file từ URL local
            const fileName = finalUrl.replace('local://', '');
            // Chuyển đổi thành URL server
            finalUrl = `/uploads/${fileName}`;
            console.log('Đã chuyển đổi URL local thành URL server:', finalUrl);
          }
          
          audioElement.src = finalUrl;
          await audioElement.load();
          
          // Restore saved progress if exists (only for first URL)
          if (i === 0) {
            const savedProgress = await musicStore.getSavedProgress(track.id);
            if (savedProgress > 0) {
              audioElement.currentTime = savedProgress;
            }
          }
          
          await audioElement.play();
          isPlaying.set(true);
          success = true;
          console.log(`✅ Phát thành công với URL ${i + 1}`);
        } catch (urlError) {
          console.warn(`❌ URL ${i + 1} thất bại:`, urlError.message);
          lastError = urlError;
        }
      }
      
      if (!success) {
        throw lastError || new Error('Tất cả URL đều thất bại');
      }
      
    } catch (error) {
      console.error('Lỗi phát nhạc:', error);
      
      let errorMessage = 'Không thể phát nhạc. ';
      if (error.name === 'NotSupportedError') {
        errorMessage += 'Định dạng file không được hỗ trợ.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage += 'Trình duyệt chặn tự động phát nhạc.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Lỗi kết nối mạng.';
      } else if (track.source === 'google-drive') {
        errorMessage += 'Google Drive chặn truy cập. Thử upload file lên dịch vụ khác.';
      } else {
        errorMessage += 'Vui lòng kiểm tra URL âm thanh.';
      }
      
      console.error(errorMessage);
      isLoading.set(false);
      isPlaying.set(false);
    }
  },
  
  // Play/pause toggle
  togglePlay: async () => {
    if (!audioElement) return;
    
    try {
      if (audioElement.paused) {
        await audioElement.play();
        isPlaying.set(true);
      } else {
        audioElement.pause();
        isPlaying.set(false);
      }
    } catch (error) {
      console.error('Lỗi toggle play:', error);
    }
  },
  
  // Next track
  next: () => {
    let currentIndex, playlistData;
    currentTrackIndex.subscribe(val => currentIndex = val)();
    playlist.subscribe(val => playlistData = val)();
    
    if (playlistData && currentIndex < playlistData.length - 1) {
      musicStore.playTrack(playlistData[currentIndex + 1], currentIndex + 1);
    } else if (playlistData && playlistData.length > 0) {
      // Loop back to first track
      musicStore.playTrack(playlistData[0], 0);
    }
  },
  
  // Previous track
  previous: () => {
    let currentIndex, playlistData;
    currentTrackIndex.subscribe(val => currentIndex = val)();
    playlist.subscribe(val => playlistData = val)();
    
    if (playlistData && currentIndex > 0) {
      musicStore.playTrack(playlistData[currentIndex - 1], currentIndex - 1);
    } else if (playlistData && playlistData.length > 0) {
      // Loop to last track
      musicStore.playTrack(playlistData[playlistData.length - 1], playlistData.length - 1);
    }
  },
  
  // Seek to position
  seek: (percentage) => {
    if (!audioElement) return;
    
    let durationValue;
    duration.subscribe(val => durationValue = val)();
    
    if (durationValue > 0) {
      const newTime = (percentage / 100) * durationValue;
      audioElement.currentTime = newTime;
      currentTime.set(newTime);
    }
  },
  
  // Set volume
  setVolume: (vol) => {
    if (!audioElement) return;
    
    audioElement.volume = vol;
    volume.set(vol);
  },
  
  // Save progress for current user
  saveProgress: async (trackId, time, userId) => {
    if (!userId || !trackId) return;
    
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          trackId,
          currentTime: time
        })
      });
    } catch (error) {
      console.error('Lỗi lưu progress:', error);
    }
  },
  
  // Get saved progress
  getSavedProgress: async (trackId) => {
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData || !trackId) return 0;
    
    try {
      const user = JSON.parse(currentUserData);
      const response = await fetch(`/api/progress/${user.id}/${trackId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.currentTime || 0;
      }
      return 0;
    } catch (error) {
      console.error('Lỗi lấy progress:', error);
      return 0;
    }
  },
  
  // Auto-save progress periodically
  startAutoSave: () => {
    setInterval(() => {
      let track, time, user;
      currentTrack.subscribe(val => track = val)();
      currentTime.subscribe(val => time = val)();
      
      const currentUserData = localStorage.getItem('currentUser');
      if (currentUserData) {
        try {
          user = JSON.parse(currentUserData);
          if (track && time > 0 && user) {
            musicStore.saveProgress(track.id, time, user.id);
          }
        } catch (error) {
          console.error('Lỗi auto-save:', error);
        }
      }
    }, 5000); // Save every 5 seconds
  }
};