const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("开始部署游戏合约到测试网...");

  // 获取部署账户信息
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("部署账户余额为0，请先获取测试代币");
    process.exit(1);
  }

  // 部署HelloWorld合约
  console.log("部署HelloWorld合约...");
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy();
  await helloWorld.waitForDeployment();
  const helloWorldAddress = await helloWorld.getAddress();
  console.log("HelloWorld合约部署到:", helloWorldAddress);

  // 部署GameBattle合约
  console.log("部署GameBattle合约...");
  const GameBattle = await hre.ethers.getContractFactory("GameBattle");
  const gameBattle = await GameBattle.deploy();
  await gameBattle.waitForDeployment();
  const gameBattleAddress = await gameBattle.getAddress();
  console.log("GameBattle合约部署到:", gameBattleAddress);

  // 获取网络信息
  const network = hre.network.name;
  console.log("部署网络:", network);

  // 保存部署信息
  const deploymentInfo = {
    network: network,
    helloWorldAddress: helloWorldAddress,
    gameBattleAddress: gameBattleAddress,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    gasUsed: "估算中..."
  };

  // 保存到deployments目录
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${network}_complete.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("部署信息已保存到:", deploymentFile);

  // 更新前端合约地址
  await updateFrontendAddresses(network, helloWorldAddress, gameBattleAddress);

  console.log("\n=== 部署完成 ===");
  console.log("HelloWorld地址:", helloWorldAddress);
  console.log("GameBattle地址:", gameBattleAddress);
  console.log("网络:", network);
  console.log("部署者:", deployer.address);
  
  // 验证合约
  console.log("\n正在验证合约...");
  try {
    // 测试HelloWorld合约
    const greeting = await helloWorld.getGreeting();
    console.log("HelloWorld问候语:", greeting);
    
    // 测试GameBattle合约
    const owner = await gameBattle.owner();
    console.log("GameBattle所有者:", owner);
    
    console.log("合约验证成功!");
  } catch (error) {
    console.error("合约验证失败:", error.message);
  }
}

async function updateFrontendAddresses(network, helloWorldAddress, gameBattleAddress) {
  // 更新主页面的HelloWorld合约地址
  const indexPath = path.join(__dirname, '..', 'frontend', 'pages', 'index.js');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    if (network === 'monad_testnet') {
      content = content.replace(
        /monad_testnet: '[^']*'/,
        `monad_testnet: '${helloWorldAddress}'`
      );
    }
    
    fs.writeFileSync(indexPath, content);
    console.log("主页面合约地址已更新");
  }

  // 更新结算页面的GameBattle合约地址
  const settlePath = path.join(__dirname, '..', 'frontend', 'pages', 'settle.js');
  if (fs.existsSync(settlePath)) {
    let content = fs.readFileSync(settlePath, 'utf8');
    
    if (network === 'monad_testnet') {
      content = content.replace(
        /monad_testnet: '[^']*'/,
        `monad_testnet: '${gameBattleAddress}'`
      );
    }
    
    fs.writeFileSync(settlePath, content);
    console.log("结算页面合约地址已更新");
  }

  // 更新contract.js
  const contractPath = path.join(__dirname, '..', 'frontend', 'utils', 'contract.js');
  if (fs.existsSync(contractPath)) {
    let content = fs.readFileSync(contractPath, 'utf8');
    
    if (network === 'monad_testnet') {
      content = content.replace(
        /monad_testnet: '[^']*'/,
        `monad_testnet: '${helloWorldAddress}'`
      );
    }
    
    fs.writeFileSync(contractPath, content);
    console.log("工具文件合约地址已更新");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 