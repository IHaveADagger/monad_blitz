# 🚀 简化版 Monad 测试环境使用指南

## ✅ 当前状态

项目已经完全配置好并运行中：

- **本地 Monad 节点**: 正在 http://127.0.0.1:8545 运行
- **智能合约**: 已部署到 `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **前端应用**: 正在 http://localhost:3000 运行

## 🔧 MetaMask 配置步骤

### 第一步：添加本地 Monad 网络

在 MetaMask 中添加以下网络：

```
网络名称: Local Monad
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
货币符号: MON
```

### 第二步：导入测试账户

使用以下助记词导入账户：

```
test test test test test test test test test test test junk
```

**主要账户地址**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**余额**: 10000 MON

## 🌐 测试步骤

### 1. 访问前端
打开浏览器访问：http://localhost:3000

### 2. 连接钱包
- 点击"连接钱包"按钮
- 在 MetaMask 中选择导入的测试账户
- 确认连接

### 3. 添加网络
- 点击"添加本地Monad网络"按钮
- 在 MetaMask 弹窗中确认添加网络
- 切换到新添加的 Local Monad 网络

### 4. 测试合约功能
- **查看信息**: 页面显示当前问候语和调用次数
- **调用 sayHello**: 点击按钮增加调用次数
- **设置问候语**: 输入新问候语并提交

## 📱 前端功能

- ✅ 自动连接到本地 Monad 网络
- ✅ 显示网络信息和合约地址
- ✅ 实时显示合约状态
- ✅ 支持所有合约方法调用
- ✅ 交易状态实时反馈

## 🛠️ 开发命令

```bash
# 启动本地节点
npm run start

# 部署合约
npm run deploy

# 启动前端
npm run dev

# 编译合约
npm run compile
```

## 🎯 项目特点

1. **简化配置**: 只有一个本地 Monad 网络，无冗余选项
2. **真实模拟**: 使用 Monad 的网络名称和 MON 代币符号
3. **完整功能**: 支持所有智能合约交互
4. **即开即用**: 一键启动，无需复杂配置

## 🐛 故障排除

### 连接问题
- 确保 MetaMask 已安装并解锁
- 检查是否切换到 Local Monad 网络
- 确认导入了正确的测试账户

### 合约调用失败
- 检查账户是否有足够的 MON 代币
- 确认网络连接正常
- 尝试刷新页面重新连接

### 节点重启
如果需要重启节点：
```bash
pkill -f "hardhat node"
npm run start
```

---

**🎉 现在你可以开始测试你的简化版 Monad DApp 了！**

访问 http://localhost:3000 开始体验完整的 Web3 交互。 