// Script to check if dist directory exists and build if necessary
import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Kiểm tra thư mục build...');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.log('🔨 Thư mục dist không tồn tại, đang build ứng dụng...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
    console.log('✅ Build hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi build ứng dụng:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Thư mục dist đã tồn tại, bỏ qua build...');
}