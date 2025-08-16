require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    // 本地Monad网络 - 用于开发测试
    monad_local: {
      url: "http://127.0.0.1:8545",
      chainId: 31337, // 使用Hardhat默认链ID，在前端显示为Monad
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10
      }
    },
    // Monad测试网 - 生产环境
    monad: {
      url: "https://testnet1.monad.xyz",
      chainId: 41454,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here" ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      monad: "dummy"
    },
    customChains: [
      {
        network: "monad",
        chainId: 41454,
        urls: {
          apiURL: "https://testnet1.monad.xyz",
          browserURL: "https://testnet1.monad.xyz"
        }
      }
    ]
  }
}; 