import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决ES模块中__dirname的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根图片目录（public/static/img/）
const rootImgDir = path.join(__dirname, 'static', 'img');

// 允许的图片格式（可根据需要添加）
const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

/**
 * 递归处理目录：为每个子目录生成index.json
 * @param {string} dir 当前处理的目录路径
 */
async function processDirectory(dir) {
  try {
    // 读取目录下的所有内容（文件和子目录）
    const entries = await fs.readdir(dir, { withFileTypes: true });

    // 筛选当前目录下的图片文件（排除index.json）
    const imgFiles = entries
      .filter(entry => entry.isFile()) // 只处理文件
      .map(entry => entry.name)
      .filter(filename => {
        const ext = path.extname(filename).toLowerCase();
        return allowedExts.includes(ext) && filename !== 'index.json';
      });

    // 生成当前目录的index.json
    const indexPath = path.join(dir, 'index.json');
    await fs.writeFile(
      indexPath,
      JSON.stringify({
        count: imgFiles.length,
        files: imgFiles,
        // 新增：记录当前目录的相对路径（可选）
        relativePath: path.relative(rootImgDir, dir)
      }, null, 2),
      'utf8'
    );
    console.log(`✅ 生成索引：${dir}（${imgFiles.length}张图片）`);

    // 递归处理所有子目录
    const subDirs = entries
      .filter(entry => entry.isDirectory()) // 只处理子目录
      .map(entry => path.join(dir, entry.name));

    // 遍历处理每个子目录
    for (const subDir of subDirs) {
      await processDirectory(subDir);
    }

  } catch (error) {
    console.error(`❌ 处理目录失败 ${dir}：`, error.message);
  }
}

// 启动处理（从根图片目录开始）
async function start() {
  try {
    // 检查根目录是否存在，不存在则创建
    try {
      await fs.access(rootImgDir);
    } catch {
      await fs.mkdir(rootImgDir, { recursive: true });
      console.log(`📂 创建根目录：${rootImgDir}`);
    }

    console.log(`开始处理图片目录：${rootImgDir}`);
    await processDirectory(rootImgDir);
    console.log('🎉 所有目录处理完成！');
  } catch (error) {
    console.error('❌ 启动失败：', error.message);
  }
}

// 执行
start();
