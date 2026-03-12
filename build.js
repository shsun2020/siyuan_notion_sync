const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 输出目录
const outputDir = path.join(__dirname, 'release');
const outputPath = path.join(outputDir, 'package.zip');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 创建归档
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
    zlib: { level: 9 }
});

output.on('close', () => {
    console.log(`Package created: ${outputPath}`);
    console.log(`Total size: ${archive.pointer()} bytes`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

// 添加必要的文件
const filesToInclude = [
    'index.js',
    'index.css',
    'plugin.json',
    'icon.png',
    'preview.png',
    'README.md',
    'README_zh_CN.md',
    'LICENSE'
];

const dirsToInclude = [
    'src',
    'conf'
];

// 添加文件
filesToInclude.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        archive.file(path.join(__dirname, file), { name: file });
        console.log(`Added: ${file}`);
    } else {
        console.warn(`Warning: ${file} not found`);
    }
});

// 添加目录
dirsToInclude.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        archive.directory(dirPath, dir);
        console.log(`Added directory: ${dir}`);
    } else {
        console.warn(`Warning: ${dir} not found`);
    }
});

archive.finalize();