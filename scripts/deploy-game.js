const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("开始部署游戏合约...");

  // 部署GameBattle合约
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
    gameBattleAddress: gameBattleAddress,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };

  // 保存到deployments目录
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${network}_game.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("部署信息已保存到:", deploymentFile);

  // 更新前端合约地址
  await updateFrontendAddresses(network, gameBattleAddress);

  console.log("游戏合约部署完成!");
  console.log("GameBattle地址:", gameBattleAddress);
}

async function updateFrontendAddresses(network, gameBattleAddress) {
  const settlePath = path.join(__dirname, '..', 'frontend', 'pages', 'settle.js');
  
  if (fs.existsSync(settlePath)) {
    let content = fs.readFileSync(settlePath, 'utf8');
    
    // 根据网络更新对应的合约地址
    if (network === 'localhost' || network === 'hardhat') {
      content = content.replace(
        /monad_local: '[^']*'/,
        `monad_local: '${gameBattleAddress}'`
      );
    } else if (network === 'monad_testnet') {
      content = content.replace(
        /monad_testnet: '[^']*'/,
        `monad_testnet: '${gameBattleAddress}'`
      );
    }
    
    fs.writeFileSync(settlePath, content);
    console.log("前端合约地址已更新");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 