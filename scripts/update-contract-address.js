const fs = require('fs');
const path = require('path');

async function updateContractAddress() {
  try {
    // 读取部署信息
    const deploymentPath = path.join(__dirname, '../deployments/monad_testnet.json');
    
    if (!fs.existsSync(deploymentPath)) {
      console.log('❌ 未找到测试网部署信息文件');
      console.log('请先运行: npm run deploy:testnet');
      return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractAddress = deploymentInfo.contractAddress;
    
    console.log('📋 读取到的合约地址:', contractAddress);
    
    // 更新前端配置文件
    const contractUtilPath = path.join(__dirname, '../frontend/utils/contract.js');
    const indexPagePath = path.join(__dirname, '../frontend/pages/index.js');
    
    // 更新 contract.js
    if (fs.existsSync(contractUtilPath)) {
      let contractUtilContent = fs.readFileSync(contractUtilPath, 'utf8');
      contractUtilContent = contractUtilContent.replace(
        /monad_testnet:\s*'[^']*'/,
        `monad_testnet: '${contractAddress}'`
      );
      fs.writeFileSync(contractUtilPath, contractUtilContent);
      console.log('✅ 已更新 frontend/utils/contract.js');
    }
    
    // 更新 index.js
    if (fs.existsSync(indexPagePath)) {
      let indexPageContent = fs.readFileSync(indexPagePath, 'utf8');
      indexPageContent = indexPageContent.replace(
        /monad_testnet:\s*'[^']*'/,
        `monad_testnet: '${contractAddress}'`
      );
      fs.writeFileSync(indexPagePath, indexPageContent);
      console.log('✅ 已更新 frontend/pages/index.js');
    }
    
    console.log('\n🎉 合约地址更新完成!');
    console.log('📋 更新信息:');
    console.log(`   网络: ${deploymentInfo.network}`);
    console.log(`   合约地址: ${contractAddress}`);
    console.log(`   区块浏览器: ${deploymentInfo.blockExplorer}`);
    
    console.log('\n💡 下一步操作:');
    console.log('   1. 启动前端: npm run dev');
    console.log('   2. 在前端界面切换到测试网络');
    console.log('   3. 连接MetaMask并测试功能');
    
  } catch (error) {
    console.error('❌ 更新合约地址失败:', error);
  }
}

updateContractAddress(); 