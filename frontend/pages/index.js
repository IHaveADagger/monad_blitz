import { useState, useEffect } from 'react';

// 完整的合约ABI - 从编译后的artifacts中获取
const CONTRACT_ABI = [
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

// 合约地址配置
const CONTRACT_ADDRESSES = {
  monad_local: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

// 网络配置
const NETWORKS = {
  monad_local: {
    chainId: '0x7a69', // 31337 in hex (Hardhat默认，显示为本地Monad)
    chainName: 'Local Monad',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18
    },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: null
  }
};

export default function Home() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('monad_local');
  const [greeting, setGreeting] = useState('');
  const [callCount, setCallCount] = useState(0);
  const [newGreeting, setNewGreeting] = useState('');
  const [status, setStatus] = useState('');

  // 检查MetaMask连接状态
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await loadContractData();
        }
      } catch (error) {
        console.error('检查连接失败:', error);
      }
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('请安装MetaMask!');
      return;
    }

    try {
      setStatus('正在连接钱包...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setAccount(accounts[0]);
      setIsConnected(true);
      setStatus('钱包连接成功!');
      
      await loadContractData();
    } catch (error) {
      console.error('连接钱包失败:', error);
      setStatus(`钱包连接失败: ${error.message}`);
    }
  };

  // 断开钱包连接
  const handleDisconnect = () => {
    setAccount('');
    setIsConnected(false);
    setGreeting('');
    setCallCount(0);
    setStatus('钱包已断开连接');
  };

  // 添加网络
  const addNetwork = async (networkType) => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('请安装MetaMask!');
      return;
    }

    try {
      const networkConfig = NETWORKS[networkType];
      setStatus(`正在添加${networkConfig.chainName}网络...`);
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });
      setStatus(`${networkConfig.chainName}网络添加成功! 请在MetaMask中切换网络`);
    } catch (error) {
      console.error('添加网络失败:', error);
      setStatus(`添加网络失败: ${error.message}`);
    }
  };



  // 获取合约实例
  const getContract = async () => {
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = CONTRACT_ADDRESSES[currentNetwork];
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  };

  // 加载合约数据
  const loadContractData = async () => {
    try {
      setStatus('正在加载合约数据...');
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractAddress = CONTRACT_ADDRESSES[currentNetwork];
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

      const [greetingResult, countResult] = await Promise.all([
        contract.getGreeting(),
        contract.getCallCount()
      ]);

      setGreeting(greetingResult);
      setCallCount(Number(countResult));
      setStatus('合约数据加载成功');
    } catch (error) {
      console.error('加载合约数据失败:', error);
      setStatus(`加载合约数据失败: ${error.message}`);
    }
  };

  // 调用sayHello
  const handleSayHello = async () => {
    try {
      setStatus('正在调用sayHello...');
      const contract = await getContract();
      
      const tx = await contract.sayHello();
      setStatus('交易已发送，等待确认...');
      
      await tx.wait();
      setStatus('sayHello调用成功!');
      
      // 重新加载数据
      await loadContractData();
    } catch (error) {
      console.error('调用sayHello失败:', error);
      setStatus(`调用sayHello失败: ${error.message}`);
    }
  };

  // 设置新的问候语
  const handleSetGreeting = async () => {
    if (!newGreeting.trim()) {
      setStatus('请输入新的问候语');
      return;
    }

    try {
      setStatus('正在设置新问候语...');
      const contract = await getContract();
      
      const tx = await contract.setGreeting(newGreeting);
      setStatus('交易已发送，等待确认...');
      
      await tx.wait();
      setStatus('问候语设置成功!');
      setNewGreeting('');
      
      // 重新加载数据
      await loadContractData();
    } catch (error) {
      console.error('设置问候语失败:', error);
      setStatus(`设置问候语失败: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        HelloWorld DApp
      </h1>

            {/* 网络信息 */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>网络信息</h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
          当前网络: <strong>{NETWORKS[currentNetwork].chainName}</strong>
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>
          RPC: {NETWORKS[currentNetwork].rpcUrls[0]} | Chain ID: {parseInt(NETWORKS[currentNetwork].chainId, 16)}
        </p>
      </div>

      {/* 连接状态 */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>连接状态</h3>
        {isConnected ? (
          <div>
            <p style={{ margin: '5px 0', color: '#28a745' }}>
              ✅ 已连接: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
            <button 
              onClick={handleDisconnect}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              断开连接
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: '5px 0', color: '#dc3545' }}>❌ 未连接</p>
            <button 
              onClick={connectWallet}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
                fontSize: '14px'
              }}
            >
              连接钱包
            </button>
            <button 
              onClick={() => addNetwork('monad_local')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              添加本地Monad网络
            </button>
          </div>
        )}
      </div>

      {/* 状态显示 */}
      {status && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: status.includes('失败') || status.includes('错误') ? '#f8d7da' : '#d4edda',
          color: status.includes('失败') || status.includes('错误') ? '#721c24' : '#155724',
          borderRadius: '4px', 
          marginBottom: '20px',
          border: `1px solid ${status.includes('失败') || status.includes('错误') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          状态: {status}
        </div>
      )}

      {/* 合约信息 */}
      {isConnected && (
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>合约信息</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>当前问候语:</strong> {greeting || '加载中...'}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>调用次数:</strong> {callCount}
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
            <strong>合约地址:</strong> {CONTRACT_ADDRESSES[currentNetwork]}
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
            💡 本地测试完全免费，无需真实ETH
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      {isConnected && (
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #ddd' 
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#555' }}>合约操作</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={handleSayHello}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px'
              }}
            >
              调用 sayHello
            </button>
            <button 
              onClick={loadContractData}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              刷新数据
            </button>
          </div>

          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>设置新问候语</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={newGreeting}
                onChange={(e) => setNewGreeting(e.target.value)}
                placeholder="输入新的问候语..."
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <button 
                onClick={handleSetGreeting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                设置问候语
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 