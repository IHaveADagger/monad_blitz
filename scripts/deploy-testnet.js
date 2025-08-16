const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require('readline');

// 创建命令行输入接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 安全输入私钥函数（隐藏输入）
function secureInput(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let input = '';
    stdin.on('data', function(char) {
      char = char + '';
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          stdout.write('\n');
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          input += char;
          stdout.write('*'); // 显示星号而不是实际字符
          break;
      }
    });
  });
}

async function main() {
  console.log("🚀 开始部署HelloWorld合约到Monad测试网...");
  
  // 检测网络
  const network = hre.network.name;
  console.log(`📡 当前网络: ${network}`);
  
  if (network !== "monad_testnet") {
    console.log("⚠️  请使用Monad测试网进行部署");
    console.log("正确命令: npm run deploy:testnet");
    process.exit(1);
  }

  let deployer;
  let privateKey;

  // 检查是否通过环境变量提供了私钥
  if (process.env.DEPLOY_PRIVATE_KEY && process.env.DEPLOY_PRIVATE_KEY !== "your_private_key_here") {
    console.log("🔑 使用环境变量中的私钥");
    privateKey = process.env.DEPLOY_PRIVATE_KEY;
  } else {
    // 命令行输入私钥
    console.log("\n🔐 为了安全起见，请输入您的私钥进行部署:");
    console.log("💡 提示: 私钥输入时会显示为星号，输入完成后按回车");
    console.log("⚠️  注意: 请确保私钥不包含0x前缀");
    
    privateKey = await secureInput("请输入私钥: ");
    
    if (!privateKey || privateKey.trim() === '') {
      console.log("❌ 私钥不能为空");
      process.exit(1);
    }
    
    // 验证私钥格式
    if (privateKey.startsWith('0x')) {
      console.log("⚠️  检测到0x前缀，自动移除");
      privateKey = privateKey.slice(2);
    }
    
    if (privateKey.length !== 64) {
      console.log("❌ 私钥长度不正确，应为64个字符");
      process.exit(1);
    }
  }

  try {
    // 使用私钥创建钱包
    const wallet = new hre.ethers.Wallet(privateKey, hre.ethers.provider);
    deployer = wallet;
    
    console.log("🌐 使用Monad测试网账户:", deployer.address);
    
    // 获取余额
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", hre.ethers.formatEther(balance), "MON");
    
    if (balance === 0n) {
      console.log("⚠️  账户余额为0，请先获取测试代币");
      console.log("💡 可以通过以下方式获取测试代币:");
      console.log("   - 访问Monad测试网水龙头");
      console.log("   - 联系Monad社区获取测试代币");
      console.log("   - 确保账户地址正确:", deployer.address);
      
      const continueAnyway = await new Promise((resolve) => {
        rl.question("是否继续部署? (y/N): ", (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
      
      if (!continueAnyway) {
        console.log("部署已取消");
        process.exit(0);
      }
    }
  } catch (error) {
    console.error("❌ 私钥验证失败:", error.message);
    process.exit(1);
  }
  
  // 部署合约
  console.log("\n📝 部署合约中...");
  try {
    const HelloWorld = await hre.ethers.getContractFactory("HelloWorld", deployer);
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
    
    // 保存部署信息到文件
    const deploymentInfo = {
      network: "monad_testnet",
      chainId: 10143,
      contractAddress: contractAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      blockExplorer: `https://testnet.monadexplorer.com/address/${contractAddress}`
    };
    
    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(deploymentPath, "monad_testnet.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Monad测试网部署完成!");
    console.log("📋 部署信息:");
    console.log("   网络: Monad测试网 (Chain ID: 10143)");
    console.log("   合约地址:", contractAddress);
    console.log("   部署者:", deployer.address);
    console.log("   区块浏览器:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
    
    console.log("\n💡 下一步操作:");
    console.log("   1. 运行: npm run update-address");
    console.log("   2. 在MetaMask中添加Monad测试网");
    console.log("   3. 启动前端: npm run dev");
    console.log("   4. 在前端界面切换到测试网并测试功能");
    
    console.log("\n📝 MetaMask配置信息:");
    console.log("   网络名称: Monad Testnet");
    console.log("   RPC URL: https://testnet-rpc.monad.xyz/");
    console.log("   Chain ID: 10143");
    console.log("   货币符号: MON");
    console.log("   区块浏览器: https://testnet.monadexplorer.com/");
    
    console.log("\n📄 部署信息已保存到: deployments/monad_testnet.json");
    
  } catch (error) {
    console.error("❌ 部署失败:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("💡 请确保账户有足够的MON代币用于部署");
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    rl.close();
    process.exit(1);
  }); 