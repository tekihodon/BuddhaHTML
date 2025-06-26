// Database utility functions
// Sử dụng API calls để tương tác với SQLite database trên server

const API_BASE = '';

// Initialize database
export async function initDatabase() {
  try {
    const response = await fetch(`${API_BASE}/api/database/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Lỗi khởi tạo database:', error);
    throw error;
  }
}

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}/api${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
}
// User operations
export const userDB = {
  // Authenticate user
  async authenticate(email, password) {
    return await apiCall('/users/authenticate', 'POST', { email, password });
  },
  
  // Register new user
  async register(email, password) {
    return await apiCall('/users/register', 'POST', { email, password });
  },
  
  // Get all users (admin only)
  async getAllUsers() {
    return await apiCall('/users');
  },
  
  // Update user
  async updateUser(userId, updates) {
    return await apiCall(`/users/${userId}`, 'PUT', updates);
  },
  
  // Delete user
  async deleteUser(userId) {
    return await apiCall(`/users/${userId}`, 'DELETE');
  }
};

// Track operations
export const trackDB = {
  // Get all tracks
  async getAllTracks() {
    return await apiCall('/tracks');
  },
  
  // Add new track
  async addTrack(trackData) {
    return await apiCall('/tracks', 'POST', trackData);
  },
  
  // Update track
  async updateTrack(trackId, updates) {
    return await apiCall(`/tracks/${trackId}`, 'PUT', updates);
  },
  
  // Delete track
  async deleteTrack(trackId) {
    return await apiCall(`/tracks/${trackId}`, 'DELETE');
  }
};

// Settings operations
export const settingsDB = {
  // Get settings
  async getSettings() {
    return await apiCall('/settings');
  },
  
  // Update settings
  async updateSettings(updates) {
    return await apiCall('/settings', 'PUT', updates);
  }
};

// Progress tracking
export const progressDB = {
  // Save listening progress
  async saveProgress(userId, trackId, currentTime) {
    return await apiCall('/progress', 'POST', { userId, trackId, currentTime });
  },
  
  // Get listening progress
  async getProgress(userId, trackId) {
    return await apiCall(`/progress/${userId}/${trackId}`);
  },
  
  // Get all progress for user
  async getUserProgress(userId) {
    return await apiCall(`/progress/${userId}`);
  }
};