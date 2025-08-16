const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署HelloWorld合约...");
  
  // 检测网络
  const network = hre.network.name;
  console.log(`📡 当前网络: ${network}`);
  
  let deployer;
  
  if (network === "monad_local") {
    // 本地Monad网络 - 使用预生成的账户
    const accounts = await hre.ethers.getSigners();
    deployer = accounts[0];
    console.log("🏠 使用本地Monad测试账户:", deployer.address);
    
    // 获取余额
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", hre.ethers.formatEther(balance), "MON");
  } else {
    console.log("⚠️  请使用本地Monad网络进行部署");
    console.log("正确命令: npm run deploy");
    process.exit(1);
  }
  
  // 部署合约
  console.log("\n📝 部署合约中...");
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy();
  
  await helloWorld.waitForDeployment();
  
  const contractAddress = await helloWorld.getAddress();
  console.log("✅ HelloWorld合约已部署到:", contractAddress);
  
  // 测试合约功能
  console.log("\n🧪 测试合约功能...");
  const greeting = await helloWorld.getGreeting();
  console.log("📢 初始问候语:", greeting);
  
  const callCount = await helloWorld.getCallCount();
  console.log("🔢 调用次数:", callCount.toString());
  
  // 调用sayHello函数
  console.log("📞 调用sayHello函数...");
  const tx = await helloWorld.sayHello();
  await tx.wait();
  console.log("✅ 调用sayHello成功!");
  
  const newCallCount = await helloWorld.getCallCount();
  console.log("🔢 新的调用次数:", newCallCount.toString());
  
  console.log("\n🎉 本地Monad部署完成!");
  console.log("📋 部署信息:");
  console.log("   网络: 本地Monad (Chain ID: 31337)");
  console.log("   合约地址:", contractAddress);
  console.log("   部署者:", deployer.address);
  
  console.log("\n💡 下一步操作:");
  console.log("   1. 启动前端: npm run dev");
  console.log("   2. 在MetaMask中添加本地Monad网络");
  console.log("   3. 导入测试账户并开始测试");
  
  console.log("\n📝 MetaMask配置信息:");
  console.log("   网络名称: Local Monad");
  console.log("   RPC URL: http://127.0.0.1:8545");
  console.log("   Chain ID: 31337");
  console.log("   货币符号: MON");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }); 