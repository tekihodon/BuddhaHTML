<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let apiKey = '';
  let folderId = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let driveFiles = [];
  let isConnected = false;
  
  // Load saved settings from localStorage
  function loadSettings() {
    const saved = localStorage.getItem('googleDriveSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      apiKey = settings.apiKey || '';
      folderId = settings.folderId || '';
    }
  }
  
  // Save settings to localStorage
  function saveSettings() {
    const settings = { apiKey, folderId };
    localStorage.setItem('googleDriveSettings', JSON.stringify(settings));
  }
  
  // Test connection to Google Drive
  async function testConnection() {
    if (!apiKey || !folderId) {
      errorMessage = 'Vui lòng nhập API Key và Folder ID';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType,webContentLink,webViewLink)`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      // Filter audio files
      driveFiles = data.files.filter(file => 
        file.mimeType.startsWith('audio/') || 
        file.name.toLowerCase().match(/\.(mp3|wav|ogg|m4a|flac|aac)$/)
      );
      
      isConnected = true;
      successMessage = `Kết nối thành công! Tìm thấy ${driveFiles.length} file âm thanh.`;
      saveSettings();
      
    } catch (error) {
      console.error('Google Drive API Error:', error);
      errorMessage = `Lỗi kết nối: ${error.message}`;
      isConnected = false;
    } finally {
      isLoading = false;
    }
  }
  
  // Check backend server status
  async function checkServerStatus() {
    isLoading = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        successMessage = `✅ Server đang hoạt động! Status: ${data.status}`;
      } else {
        throw new Error(`Server response: ${response.status}`);
      }
    } catch (error) {
      console.error('Server check error:', error);
      errorMessage = `❌ Server không hoạt động. Vui lòng chạy: npm run server`;
    } finally {
      isLoading = false;
    }
  }
  
  // Import selected files to track database
  async function importFiles(selectedFiles) {
    if (!selectedFiles || selectedFiles.length === 0) {
      errorMessage = 'Không có file nào được chọn để import.';
      return;
    }
    
    if (!apiKey) {
      errorMessage = 'Vui lòng nhập API Key trước khi import.';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      const importedTracks = [];
      
      for (const file of selectedFiles) {
        // Validate file
        if (!file.id || !file.name) {
          console.warn(`File không hợp lệ: ${file.name || 'Unknown'}`);
          continue;
        }
        
        try {
          // Download file to server
          const response = await fetch('http://localhost:3000/api/download-from-drive', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: file.id,
              fileName: file.name,
              apiKey: apiKey
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            importedTracks.push({
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
              artist: 'Google Drive',
              url: result.file.url, // Use local server URL
              thumbnail: '',
              duration: 0,
              source: 'local-server',
              driveFileId: file.id,
              originalFileName: file.name,
              savedFileName: result.file.savedName,
              fileSize: result.file.size,
              mimeType: file.mimeType,
              alternativeUrls: [
                getDirectStreamingUrl(file.id),
                getDirectDownloadUrl(file.id)
              ]
            });
            
            console.log(`✅ Downloaded: ${file.name} -> ${result.file.url}`);
          }
          
        } catch (fileError) {
          console.error(`❌ Lỗi download file ${file.name}:`, fileError.message);
          // Continue with next file instead of stopping
        }
      }
      
      if (importedTracks.length > 0) {
        dispatch('import', { tracks: importedTracks });
        successMessage = `Đã download và import ${importedTracks.length}/${selectedFiles.length} bài hát từ Google Drive!`;
      } else {
        errorMessage = 'Không thể download file nào. Kiểm tra API Key và quyền truy cập.';
      }
      
    } catch (error) {
      console.error('Lỗi import files:', error);
      errorMessage = `Lỗi import: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }
  
  // Convert Google Drive file ID to direct download URL
  function getDirectDownloadUrl(fileId) {
    // Use the direct download URL that bypasses the download warning page
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }

  // Get direct streaming URL for audio files
  function getDirectStreamingUrl(fileId) {
    // This URL format works better for direct audio streaming
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Alternative URL format for streaming
  function getStreamingUrl(fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  
  // Load settings on component mount
  loadSettings();
</script>

<div class="google-drive-integration">
  <h3>🔗 Tích hợp Google Drive</h3>
  
  <div class="setup-section">
    <div class="info-box">
      <h4>📋 Hướng dẫn thiết lập:</h4>
      <ol>
        <li>Truy cập <a href="https://console.developers.google.com" target="_blank">Google Cloud Console</a></li>
        <li>Tạo project mới hoặc chọn project hiện có</li>
        <li>Bật Google Drive API trong Library</li>
        <li>Tạo API Key trong Credentials</li>
        <li>Chia sẻ folder Google Drive với chế độ "Anyone with the link can view"</li>
        <li>Copy Folder ID từ URL (phần sau /folders/)</li>
      </ol>
    </div>
    
    <div class="form-group">
      <label for="api-key" class="form-label">🔑 Google Drive API Key *</label>
      <input 
        id="api-key"
        type="password" 
        bind:value={apiKey} 
        class="form-input"
        placeholder="Nhập API Key từ Google Cloud Console"
        on:input={saveSettings}
      />
    </div>
    
    <div class="form-group">
      <label for="folder-id" class="form-label">📁 Google Drive Folder ID *</label>
      <input 
        id="folder-id"
        type="text" 
        bind:value={folderId} 
        class="form-input"
        placeholder="Nhập ID của folder chứa nhạc (từ URL)"
        on:input={saveSettings}
      />
      <small class="form-help">Ví dụ: nếu URL là https://drive.google.com/drive/folders/1ABC123xyz, thì ID là 1ABC123xyz</small>
    </div>
    
    <div class="form-actions">
      <button 
        class="btn btn-primary" 
        on:click={testConnection} 
        disabled={isLoading || !apiKey || !folderId}
      >
        {#if isLoading}
          ⏳ Đang kết nối...
        {:else}
          🔍 Kiểm tra kết nối
        {/if}
      </button>
      
      <button 
        class="btn btn-secondary" 
        on:click={checkServerStatus}
        disabled={isLoading}
      >
        🖥️ Kiểm tra Server
      </button>
    </div>
  </div>
  
  <div class="server-section">
    <div class="info-box">
      <h4>🖥️ Backend Server Status:</h4>
      <p>Server cần chạy để download file từ Google Drive về máy local.</p>
      <div class="server-commands">
        <code>npm install</code> → <code>npm run server</code> (Terminal 1)<br>
        <code>npm run dev</code> (Terminal 2)<br>
        <strong>Hoặc:</strong> <code>npm run dev:full</code> (chạy cả hai cùng lúc)
      </div>
    </div>
  </div>
  
  {#if errorMessage}
    <div class="error-message">
      ❌ {errorMessage}
    </div>
  {/if}
  
  {#if successMessage}
    <div class="success-message">
      ✅ {successMessage}
    </div>
  {/if}
  
  {#if isConnected && driveFiles.length > 0}
    <div class="files-section">
      <div class="warning-box">
        <h4>⚠️ Lưu ý quan trọng:</h4>
        <p>Hệ thống sử dụng URL streaming trực tiếp từ Google Drive. Nếu không phát được nhạc:</p>
        <ul>
          <li>🎵 <strong>Mới:</strong> Sử dụng URL streaming (uc?export=view) cho phát nhạc tốt hơn</li>
          <li>📥 URL download (uc?export=download) làm phương án dự phòng</li>
          <li>🔗 Test cả hai loại URL bằng các nút bên dưới</li>
          <li>📁 Đảm bảo file được chia sẻ công khai ("Anyone with the link can view")</li>
          <li>✅ <strong>Khuyến nghị:</strong> Nếu vẫn lỗi, upload lên <a href="https://archive.org" target="_blank">Internet Archive</a> hoặc hosting riêng</li>
        </ul>
      </div>
      <h4>🎵 File âm thanh trong Google Drive:</h4>
      <div class="files-list">
        {#each driveFiles as file}
          <div class="file-item">
            <div class="file-info">
              <h5>{file.name}</h5>
              <p>Type: {file.mimeType}</p>
              <p class="file-id">ID: {file.id}</p>
              <p class="download-url">Streaming URL: {getDirectStreamingUrl(file.id)}</p>
              <p class="download-url">Download URL: {getDirectDownloadUrl(file.id)}</p>
              <a href={file.webViewLink} target="_blank" class="view-link">Xem trong Drive</a>
            </div>
            <div class="file-actions">
              <button 
                class="btn btn-test"
                on:click={() => window.open(getDirectStreamingUrl(file.id), '_blank')}
                title="Test Streaming URL trong tab mới"
              >
                🎵 Test Stream
              </button>
              <button 
                class="btn btn-test"
                on:click={() => window.open(getDirectDownloadUrl(file.id), '_blank')}
                title="Test Download URL trong tab mới"
              >
                📥 Test Download
              </button>
              <button 
                class="btn btn-secondary"
                on:click={() => importFiles([file])}
                disabled={isLoading}
              >
                {#if isLoading}
                  ⏳ Đang import...
                {:else}
                  ➕ Import
                {/if}
              </button>
            </div>
          </div>
        {/each}
      </div>
      
      {#if driveFiles.length > 1}
        <div class="bulk-actions">
          <button 
            class="btn btn-primary"
            on:click={() => importFiles(driveFiles)}
          >
            📥 Import tất cả ({driveFiles.length} files)
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .google-drive-integration {
    background: #ffffff;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 24px;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .google-drive-integration h3 {
    color: #1a1a1a;
    font-weight: 700;
    font-size: 1.4em;
    margin-bottom: 20px;
  }
  
  .info-box {
    background: #f0f8ff;
    border: 2px solid #1976d2;
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 24px;
  }
  
  .info-box h4 {
    margin: 0 0 12px 0;
    color: #0d47a1;
    font-weight: 700;
    font-size: 1.1em;
  }
  
  .info-box ol {
    margin: 0;
    padding-left: 24px;
    color: #1a1a1a;
    font-weight: 500;
  }
  
  .info-box ol li {
    margin-bottom: 6px;
    line-height: 1.5;
  }
  
  .info-box a {
    color: #0d47a1;
    text-decoration: none;
    font-weight: 600;
  }
  
  .info-box a:hover {
    text-decoration: underline;
    color: #1976d2;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 700;
    color: #1a1a1a;
    font-size: 1em;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #d0d0d0;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 500;
    color: #1a1a1a;
    background: #ffffff;
    transition: border-color 0.2s;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }
  
  .form-help {
    display: block;
    margin-top: 6px;
    color: #424242;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
  }
  
  .form-actions {
    margin-top: 20px;
  }
  
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 700;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .btn-primary {
    background: #1976d2;
    color: #ffffff;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #0d47a1;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .btn-secondary {
    background: #424242;
    color: #ffffff;
  }
  
  .btn-secondary:hover {
    background: #1a1a1a;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .error-message {
    background: #ffebee;
    border: 2px solid #d32f2f;
    color: #b71c1c;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    font-weight: 600;
    font-size: 14px;
  }
  
  .success-message {
    background: #e8f5e8;
    border: 2px solid #388e3c;
    color: #1b5e20;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    font-weight: 600;
    font-size: 14px;
  }
  
  .files-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
  }
  
  .warning-box {
    background: #fff8e1;
    border: 2px solid #f57c00;
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 24px;
  }
  
  .warning-box h4 {
    margin: 0 0 12px 0;
    color: #e65100;
    font-weight: 700;
    font-size: 1.1em;
  }
  
  .warning-box p {
    margin: 0 0 12px 0;
    color: #bf360c;
    font-weight: 500;
    line-height: 1.5;
  }
  
  .warning-box ul {
    margin: 0;
    padding-left: 24px;
    color: #bf360c;
    font-weight: 500;
  }
  
  .warning-box ul li {
    margin-bottom: 6px;
    line-height: 1.5;
  }
  
  .warning-box a {
    color: #e65100;
    text-decoration: underline;
    font-weight: 600;
  }
  
  .warning-box a:hover {
    color: #bf360c;
  }
  
  .file-id, .download-url {
    font-size: 12px;
    color: #424242;
    margin: 4px 0;
    word-break: break-all;
    font-weight: 500;
  }
  
  .download-url {
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    border: 1px solid #e0e0e0;
  }
  
  .file-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  
  .btn-test {
    background: #0277bd;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .btn-test:hover {
    background: #01579b;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  
  .btn-test:first-of-type {
    background: #2e7d32;
  }
  
  .btn-test:first-of-type:hover {
    background: #1b5e20;
  }
  
  .files-list {
    max-height: 400px;
    overflow-y: auto;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .file-item:last-child {
    border-bottom: none;
  }
  
  .file-item:hover {
    background: #fafafa;
  }
  
  .server-section {
    margin: 24px 0;
  }
  
  .server-commands {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 6px;
    margin-top: 12px;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.6;
    border: 2px solid #e9ecef;
  }
  
  .server-commands code {
    background: #e9ecef;
    padding: 4px 8px;
    border-radius: 4px;
    color: #1a1a1a;
    font-weight: 600;
  }
  
  .file-info h5 {
    margin: 0 0 8px 0;
    color: #1a1a1a;
    font-weight: 700;
    font-size: 1.1em;
  }
  
  .file-info p {
    margin: 0 0 6px 0;
    color: #424242;
    font-size: 13px;
    font-weight: 500;
  }
  
  .view-link {
    color: #1976d2;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
  }
  
  .view-link:hover {
    text-decoration: underline;
    color: #0d47a1;
  }
  
  .bulk-actions {
    margin-top: 20px;
    text-align: center;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
  }
</style>