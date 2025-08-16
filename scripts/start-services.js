const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动Monad开发环境...\n');

// 启动本地Hardhat节点
console.log('📡 启动本地Hardhat节点...');
const nodeProcess = spawn('npx', ['hardhat', 'node'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

// 等待节点启动
setTimeout(() => {
  console.log('\n🌐 启动前端开发服务器...');
  
  // 启动前端服务
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务...');
    nodeProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    process.exit(0);
  });

  nodeProcess.on('exit', () => {
    console.log('📡 本地节点已关闭');
    frontendProcess.kill('SIGINT');
  });

  frontendProcess.on('exit', () => {
    console.log('🌐 前端服务已关闭');
    nodeProcess.kill('SIGINT');
  });

}, 3000);

console.log('\n💡 使用说明:');
console.log('   - 本地节点将在 http://127.0.0.1:8545 启动');
console.log('   - 前端将在 http://localhost:3000 启动');
console.log('   - 按 Ctrl+C 停止所有服务');
console.log('   - 确保已运行 npm run deploy 部署本地合约'); 