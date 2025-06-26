import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import database from './src/utils/sqlite-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file an toàn và tránh trùng lặp
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName);
    const baseName = path.basename(originalName, fileExtension);
    const safeFileName = baseName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now() + fileExtension;
    cb(null, safeFileName);
  }
});

const upload = multer({ storage: storage });

// Serve static files from the dist directory after build
app.use(express.static(path.join(__dirname, 'dist')));

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// API endpoint để download file từ Google Drive
app.post('/api/download-from-drive', async (req, res) => {
  try {
    const { fileId, fileName, apiKey } = req.body;
    
    if (!fileId || !fileName || !apiKey) {
      return res.status(400).json({ 
        error: 'Thiếu thông tin: fileId, fileName và apiKey là bắt buộc' 
      });
    }

    console.log(`Đang download file: ${fileName} (ID: ${fileId})`);
    
    // URL để download file từ Google Drive
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    
    // Download file từ Google Drive
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      timeout: 30000 // 30 seconds timeout
    });
    
    // Tạo tên file an toàn và xử lý trùng tên
    let safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    let filePath = path.join(uploadsDir, safeFileName);
    
    // Kiểm tra và xử lý file trùng tên
    let counter = 1;
    const originalName = safeFileName;
    const fileExtension = path.extname(safeFileName);
    const baseName = path.basename(safeFileName, fileExtension);
    
    while (await fs.pathExists(filePath)) {
      safeFileName = `${baseName}_${counter}${fileExtension}`;
      filePath = path.join(uploadsDir, safeFileName);
      counter++;
    }
    
    // Lưu file vào server
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`File đã được lưu: ${filePath}`);
    
    // Trả về thông tin file đã lưu
    const fileStats = await fs.stat(filePath);
    const serverUrl = `/uploads/${safeFileName}`;
    
    res.json({
      success: true,
      message: 'File đã được download và lưu thành công',
      file: {
        originalName: fileName,
        savedName: safeFileName,
        size: fileStats.size,
        url: serverUrl,
        path: filePath
      }
    });
    
  } catch (error) {
    console.error('Lỗi khi download file:', error.message);
    
    let errorMessage = 'Lỗi khi download file từ Google Drive';
    
    if (error.response) {
      if (error.response.status === 403) {
        errorMessage = 'Lỗi quyền truy cập: Kiểm tra API Key hoặc quyền truy cập file';
      } else if (error.response.status === 404) {
        errorMessage = 'File không tồn tại hoặc không thể truy cập';
      } else {
        errorMessage = `Lỗi Google Drive API: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout: File quá lớn hoặc kết nối chậm';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// API endpoint to upload file
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }
    
    // Trả về thông tin file đã upload
    res.json({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Lỗi khi upload file:', error);
    res.status(500).json({ error: 'Không thể upload file' });
  }
});

// API endpoint để lấy danh sách file đã download
app.get('/api/uploaded-files', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      
      fileList.push({
        name: file,
        size: stats.size,
        url: `/uploads/${file}`,
        uploadedAt: stats.mtime
      });
    }
    
    res.json({ files: fileList });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách file' });
  }
});

// API endpoint để xóa file
app.delete('/api/delete-file/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadsDir, fileName);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      res.json({ success: true, message: 'File đã được xóa' });
    } else {
      res.status(404).json({ error: 'File không tồn tại' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa file:', error);
    res.status(500).json({ error: 'Lỗi khi xóa file' });
  }
});

// Initialize database
app.post('/api/database/init', async (req, res) => {
  try {
    await database.init();
    res.json({ success: true, message: 'Database đã được khởi tạo' });
  } catch (error) {
    console.error('Lỗi khởi tạo database:', error);
    res.status(500).json({ error: 'Không thể khởi tạo database' });
  }
});

// User API endpoints
app.post('/api/users/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await database.authenticateUser(email, password);
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await database.registerUser(email, password);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await database.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    const user = await database.updateUser(userId, updates);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await database.deleteUser(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track API endpoints
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await database.getAllTracks();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tracks', async (req, res) => {
  try {
    const trackData = req.body;
    const track = await database.addTrack(trackData);
    res.json(track);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tracks/:id', async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const updates = req.body;
    const track = await database.updateTrack(trackId, updates);
    res.json(track);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tracks/:id', async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const result = await database.deleteTrack(trackId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Settings API endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await database.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    const settings = await database.updateSettings(updates);
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Progress API endpoints
app.post('/api/progress', async (req, res) => {
  try {
    const { userId, trackId, currentTime } = req.body;
    const result = await database.saveProgress(userId, trackId, currentTime);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/progress/:userId/:trackId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const trackId = parseInt(req.params.trackId);
    const progress = await database.getProgress(userId, trackId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const progress = await database.getUserProgress(userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route to serve the SPA for any non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'API endpoint không tồn tại' });
  }
  
  // Serve the SPA's index.html for all other routes
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📁 Thư mục uploads: ${uploadsDir}`);
  console.log(`💻 Ứng dụng web có thể truy cập tại http://localhost:${PORT}`);
});