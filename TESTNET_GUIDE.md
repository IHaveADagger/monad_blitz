# Monad测试网部署和使用指南

## 🌐 Monad测试网信息

- **网络名称**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz/
- **Chain ID**: 10143
- **货币符号**: MON
- **区块浏览器**: https://testnet.monadexplorer.com/

## 📋 部署步骤

### 1. 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入您的私钥：
```
PRIVATE_KEY=your_private_key_here
```

⚠️ **注意**: 
- 私钥不要包含 `0x` 前缀
- 请勿将真实私钥提交到版本控制系统
- 确保账户有足够的测试代币

### 2. 获取测试代币

在部署前，请确保您的账户有足够的MON测试代币：
- 访问Monad测试网水龙头
- 或联系Monad社区获取测试代币

### 3. 部署合约到测试网

```bash
# 编译合约
npm run compile

# 部署到Monad测试网
npm run deploy:testnet
```

### 4. 更新前端配置

部署成功后，运行以下命令更新前端合约地址：

```bash
npm run update-address
```

### 5. 启动前端服务

```bash
npm run dev
```

## 🔧 MetaMask配置

### 添加Monad测试网到MetaMask

1. 打开MetaMask
2. 点击网络下拉菜单
3. 选择"添加网络"
4. 填入以下信息：
   - **网络名称**: Monad Testnet
   - **RPC URL**: https://testnet-rpc.monad.xyz/
   - **Chain ID**: 10143
   - **货币符号**: MON
   - **区块浏览器URL**: https://testnet.monadexplorer.com/

### 导入账户

如果需要导入用于部署的账户：
1. 在MetaMask中选择"导入账户"
2. 输入私钥（包含0x前缀）
3. 确认导入

## 🎯 使用指南

### 前端功能

1. **网络切换**: 
   - 使用页面上的"本地网络"和"测试网络"按钮
   - 或在MetaMask中手动切换

2. **连接钱包**: 
   - 点击"连接钱包"按钮
   - 确保MetaMask连接到正确的网络

3. **合约交互**: 
   - 调用 `sayHello` 函数
   - 设置新的问候语
   - 查看调用次数和合约状态

### 网络状态检测

前端会自动检测：
- 当前MetaMask连接的网络
- 是否与选择的网络匹配
- 合约是否已部署到当前网络

## 📁 文件结构

```
monad_test/
├── scripts/
│   ├── deploy.js              # 本地网络部署脚本
│   ├── deploy-testnet.js      # 测试网部署脚本
│   └── update-contract-address.js  # 地址更新脚本
├── deployments/
│   └── monad_testnet.json     # 测试网部署信息
├── frontend/
│   ├── utils/contract.js      # 合约配置
│   └── pages/index.js         # 主页面
├── .env.example               # 环境变量示例
└── hardhat.config.js          # Hardhat配置
```

## 🚀 完整流程示例

```bash
# 1. 配置环境
cp .env.example .env
# 编辑 .env 文件填入私钥

# 2. 编译合约
npm run compile

# 3. 部署到测试网
npm run deploy:testnet

# 4. 更新前端地址
npm run update-address

# 5. 启动前端
npm run dev
```

## 🔍 故障排除

### 常见问题

1. **部署失败 - 余额不足**
   - 确保账户有足够的MON测试代币
   - 检查私钥是否正确

2. **前端无法连接合约**
   - 确保运行了 `npm run update-address`
   - 检查MetaMask是否连接到正确网络
   - 确认合约地址是否正确

3. **网络切换失败**
   - 确保MetaMask中已添加对应网络
   - 尝试手动在MetaMask中切换网络

### 调试命令

```bash
# 查看部署信息
cat deployments/monad_testnet.json

# 重新编译
npm run clean && npm run compile

# 查看网络配置
npx hardhat console --network monad_testnet
```

## 📞 支持

如果遇到问题，请检查：
1. 网络配置是否正确
2. 私钥和账户余额
3. 合约地址是否已更新
4. MetaMask网络设置

---

🎉 **恭喜！** 您现在可以在Monad测试网上部署和测试智能合约了！ 