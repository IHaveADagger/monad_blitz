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
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz/",
      chainId: 10143,
      accounts: ["27193d9d45fad72259bdf7caaf77eecf0166a3fc5fe4b9308c50e4b3757ccf50"],
    },
  },
  etherscan: {
    apiKey: {
      monad: "dummy"
    },
    customChains: [
      {
        network: "monad_testnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadexplorer.com/",
          browserURL: "https://testnet.monadexplorer.com/"
        }
      }
    ]
  }
}; 