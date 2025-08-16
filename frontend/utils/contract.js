// 自动生成的合约配置
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "newGreeting",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "changedBy",
        "type": "address"
      }
    ],
    "name": "GreetingChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "caller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "HelloCalled",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "callCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCallCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGreeting",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sayHello",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_newGreeting",
        "type": "string"
      }
    ],
    "name": "setGreeting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// 网络配置
export const NETWORKS = {
  monad_local: {
    chainId: '0x7a69', // 31337 in hex (Hardhat默认，显示为本地Monad)
    chainName: 'Local Monad',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: [],
  },
  monad_testnet: {
    chainId: '0x279f', // 10143 in hex
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz/'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
  }
};

// 合约地址配置 - 部署后需要更新测试网地址
export const CONTRACT_ADDRESSES = {
  monad_local: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  monad_testnet: '0x4642f338bf8412f8DEaaB4b7Fd13A76478625748'
};

export async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider;
    } catch (error) {
      console.error('连接钱包失败:', error);
      throw error;
    }
  } else {
    throw new Error('请安装MetaMask钱包');
  }
}

export async function addNetwork(networkType) {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [NETWORKS[networkType]],
      });
    } catch (error) {
      console.error('添加网络失败:', error);
      throw error;
    }
  }
}

export async function getContract(provider, networkType = 'monad_local') {
  const signer = await provider.getSigner();
  const contractAddress = CONTRACT_ADDRESSES[networkType];
  return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
}
