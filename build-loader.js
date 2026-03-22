const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const loaderDir = path.join(__dirname, 'packer-sdk', 'loader');
const loaderJs = path.join(loaderDir, 'loader.js');
const loaderExe = path.join(loaderDir, 'loader.exe');

function ensureLoader() {
    if (fs.existsSync(loaderExe)) {
        console.log('✅ 加载器已存在');
        return true;
    }

    console.log('🔨 正在编译加载器...');

    try {
        if (!fs.existsSync(loaderJs)) {
            console.error('❌ loader.js 不存在');
            return false;
        }

        const pkgPath = require.resolve('pkg');
        if (!pkgPath) {
            console.log('📦 安装 pkg...');
            execSync('npm install pkg -g', { stdio: 'inherit' });
        }

        execSync(`npx pkg loader.js --targets node18-win-x64 --output loader.exe`, {
            cwd: loaderDir,
            stdio: 'inherit'
        });

        if (fs.existsSync(loaderExe)) {
            console.log('✅ 加载器编译成功');
            return true;
        } else {
            console.error('❌ 加载器编译失败');
            return false;
        }
    } catch (err) {
        console.error('❌ 编译加载器时出错:', err.message);
        return false;
    }
}

module.exports = { ensureLoader, loaderExe };
