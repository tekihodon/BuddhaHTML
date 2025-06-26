// Database utility functions
// Sử dụng localStorage để simulate database cho web deployment

const DB_VERSION = '1.0';
const DB_KEY = 'loi_phat_day_db';

// Initialize database
export async function initDatabase() {
  try {
    let db = getDatabase();
    
    if (!db || db.version !== DB_VERSION) {
      db = {
        version: DB_VERSION,
        users: [],
        tracks: [],
        settings: {
          appName: 'Lời Phật Dạy',
          primaryColor: '#ffd700',
          secondaryColor: '#1a1a2e'
        }
      };
      
      // Tạo admin account mặc định
      const defaultAdmin = {
        id: 1,
        email: 'tekihodon@gmail.com',
        password: '123456', // Trong thực tế nên hash password
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      
      db.users.push(defaultAdmin);
      
      // Khởi tạo danh sách tracks rỗng
      db.tracks = [];
      saveDatabase(db);
    }
    
    return db;
  } catch (error) {
    console.error('Lỗi khởi tạo database:', error);
    throw error;
  }
}

// Get database from localStorage
function getDatabase() {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Lỗi đọc database:', error);
    return null;
  }
}

// Save database to localStorage
function saveDatabase(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Lỗi lưu database:', error);
    throw error;
  }
}

// User operations
export const userDB = {
  // Authenticate user
  async authenticate(email, password) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Register new user
  async register(email, password) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    // Check if email already exists
    if (db.users.find(u => u.email === email)) {
      throw new Error('Email đã được sử dụng');
    }
    
    const newUser = {
      id: Math.max(...db.users.map(u => u.id), 0) + 1,
      email,
      password, // Trong thực tế nên hash password
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    saveDatabase(db);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
  
  // Get all users (admin only)
  async getAllUsers() {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    return db.users.map(({ password, ...user }) => user);
  },
  
  // Update user
  async updateUser(userId, updates) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('Người dùng không tồn tại');
    }
    
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    saveDatabase(db);
    
    const { password, ...userWithoutPassword } = db.users[userIndex];
    return userWithoutPassword;
  },
  
  // Delete user
  async deleteUser(userId) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('Người dùng không tồn tại');
    }
    
    db.users.splice(userIndex, 1);
    saveDatabase(db);
    
    return true;
  }
};

// Track operations
export const trackDB = {
  // Get all tracks
  async getAllTracks() {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    return db.tracks;
  },
  
  // Add new track
  async addTrack(trackData) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    const newTrack = {
      id: Math.max(...db.tracks.map(t => t.id), 0) + 1,
      ...trackData,
      createdAt: new Date().toISOString()
    };
    
    db.tracks.push(newTrack);
    saveDatabase(db);
    
    return newTrack;
  },
  
  // Update track
  async updateTrack(trackId, updates) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    const trackIndex = db.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) {
      throw new Error('Bài hát không tồn tại');
    }
    
    db.tracks[trackIndex] = { ...db.tracks[trackIndex], ...updates };
    saveDatabase(db);
    
    return db.tracks[trackIndex];
  },
  
  // Delete track
  async deleteTrack(trackId) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    const trackIndex = db.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) {
      throw new Error('Bài hát không tồn tại');
    }
    
    db.tracks.splice(trackIndex, 1);
    saveDatabase(db);
    
    return true;
  }
};

// Settings operations
export const settingsDB = {
  // Get settings
  async getSettings() {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    return db.settings;
  },
  
  // Update settings
  async updateSettings(updates) {
    const db = getDatabase();
    if (!db) throw new Error('Database không khả dụng');
    
    db.settings = { ...db.settings, ...updates };
    saveDatabase(db);
    
    return db.settings;
  }
};

// Progress tracking
export const progressDB = {
  // Save listening progress
  async saveProgress(userId, trackId, currentTime) {
    const key = `progress_${userId}_${trackId}`;
    localStorage.setItem(key, currentTime.toString());
  },
  
  // Get listening progress
  async getProgress(userId, trackId) {
    const key = `progress_${userId}_${trackId}`;
    const progress = localStorage.getItem(key);
    return progress ? parseFloat(progress) : 0;
  },
  
  // Get all progress for user
  async getUserProgress(userId) {
    const progress = {};
    const prefix = `progress_${userId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const trackId = key.replace(prefix, '');
        progress[trackId] = parseFloat(localStorage.getItem(key));
      }
    }
    
    return progress;
  }
};