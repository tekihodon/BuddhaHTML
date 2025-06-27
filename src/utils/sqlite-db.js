import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(__dirname, '..', '..', 'database.db');

// Initialize SQLite database
class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Lỗi kết nối SQLite:', err);
          reject(err);
        } else {
          console.log('Đã kết nối SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isAdmin BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTracksTable = `
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT,
        url TEXT NOT NULL,
        thumbnail TEXT,
        duration INTEGER DEFAULT 0,
        fileSize INTEGER,
        fileType TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        appName TEXT DEFAULT 'Lời Phật Dạy',
        primaryColor TEXT DEFAULT '#ffd700',
        secondaryColor TEXT DEFAULT '#1a1a2e'
      )
    `;

    const createProgressTable = `
      CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        trackId INTEGER NOT NULL,
        currentTime REAL NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (trackId) REFERENCES tracks (id),
        UNIQUE(userId, trackId)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createUsersTable);
        this.db.run(createTracksTable);
        this.db.run(createSettingsTable);
        this.db.run(createProgressTable, (err) => {
          if (err) {
            reject(err);
          } else {
            this.insertDefaultData().then(resolve).catch(reject);
          }
        });
      });
    });
  }

  async insertDefaultData() {
    return new Promise((resolve, reject) => {
      // Insert default admin user
      const insertAdmin = `
        INSERT OR IGNORE INTO users (id, email, password, isAdmin)
        VALUES (1, 'tekihodon@gmail.com', '123456', 1)
      `;

      // Insert default settings
      const insertSettings = `
        INSERT OR IGNORE INTO settings (id, appName, primaryColor, secondaryColor)
        VALUES (1, 'Lời Phật Dạy', '#ffd700', '#1a1a2e')
      `;

      this.db.serialize(() => {
        this.db.run(insertAdmin);
        this.db.run(insertSettings, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Đã khởi tạo dữ liệu mặc định');
            resolve();
          }
        });
      });
    });
  }

  // User operations
  async authenticateUser(email, password) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, isAdmin, createdAt FROM users WHERE email = ? AND password = ?';
      this.db.get(query, [email, password], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Email hoặc mật khẩu không đúng'));
        } else {
          resolve(row);
        }
      });
    });
  }

  async registerUser(email, password) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
      this.db.run(query, [email, password], (err) => {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            reject(new Error('Email đã được sử dụng'));
          } else {
            reject(err);
          }
        } else {
          // Note: this.lastID is not available in arrow functions with sqlite3
          // We need to get the inserted user differently
          const selectQuery = 'SELECT * FROM users WHERE email = ?';
          this.db.get(selectQuery, [email], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: row.id,
                email: row.email,
                isAdmin: row.isAdmin || false,
                createdAt: row.createdAt
              });
            }
          });
        }
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, isAdmin, createdAt FROM users';
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(userId);
      
      const query = `UPDATE users SET ${fields} WHERE id = ?`;
      const db = this.db; // Save reference to db
      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Người dùng không tồn tại'));
        } else {
          // Get updated user
          const selectQuery = 'SELECT id, email, isAdmin, createdAt FROM users WHERE id = ?';
          db.get(selectQuery, [userId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }

  async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      this.db.run(query, [userId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Người dùng không tồn tại'));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  // Track operations
  async getAllTracks() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tracks ORDER BY createdAt DESC';
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async addTrack(trackData) {
    return new Promise((resolve, reject) => {
      const { title, artist, url, thumbnail, duration, fileSize, fileType } = trackData;
      const query = `
        INSERT INTO tracks (title, artist, url, thumbnail, duration, fileSize, fileType)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const db = this.db; // Save reference to db
      this.db.run(query, [title, artist, url, thumbnail, duration, fileSize, fileType], function(err) {
        if (err) {
          reject(err);
        } else {
          // Get the inserted track
          const selectQuery = 'SELECT * FROM tracks WHERE id = ?';
          db.get(selectQuery, [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }

  async updateTrack(trackId, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(trackId);
      
      const query = `UPDATE tracks SET ${fields} WHERE id = ?`;
      const db = this.db; // Save reference to db
      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Bài hát không tồn tại'));
        } else {
          // Get updated track
          const selectQuery = 'SELECT * FROM tracks WHERE id = ?';
          db.get(selectQuery, [trackId], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }

  async deleteTrack(trackId) {
    return new Promise((resolve, reject) => {
      // Lấy thông tin file trước khi xóa
      const selectQuery = 'SELECT url, thumbnail FROM tracks WHERE id = ?';
      this.db.get(selectQuery, [trackId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Bài hát không tồn tại'));
          return;
        }
        
        // Xóa record khỏi database
        const deleteQuery = 'DELETE FROM tracks WHERE id = ?';
        this.db.run(deleteQuery, [trackId], function(err) {
          if (err) {
            reject(err);
          } else {
            // Trả về thông tin file để server có thể xóa file vật lý
            resolve({ 
              success: true, 
              fileInfo: {
                url: row.url,
                thumbnail: row.thumbnail
              }
            });
          }
        });
      });
    });
  }

  // Settings operations
  async getSettings() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM settings WHERE id = 1';
      this.db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || {
            appName: 'Lời Phật Dạy',
            primaryColor: '#ffd700',
            secondaryColor: '#1a1a2e'
          });
        }
      });
    });
  }

  async updateSettings(updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      const query = `UPDATE settings SET ${fields} WHERE id = 1`;
      const db = this.db; // Save reference to db
      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          // Get updated settings
          const selectQuery = 'SELECT * FROM settings WHERE id = 1';
          db.get(selectQuery, [], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }

  // Progress operations
  async saveProgress(userId, trackId, currentTime) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO progress (userId, trackId, currentTime, updatedAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      this.db.run(query, [userId, trackId, currentTime], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  async getProgress(userId, trackId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT currentTime FROM progress WHERE userId = ? AND trackId = ?';
      this.db.get(query, [userId, trackId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({ currentTime: row ? row.currentTime : 0 });
        }
      });
    });
  }

  async getUserProgress(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT trackId, currentTime FROM progress WHERE userId = ?';
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const progress = {};
          rows.forEach(row => {
            progress[row.trackId] = row.currentTime;
          });
          resolve(progress);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Lỗi đóng database:', err);
        } else {
          console.log('Đã đóng SQLite database');
        }
      });
    }
  }
}

// Export singleton instance
const database = new Database();
export default database;