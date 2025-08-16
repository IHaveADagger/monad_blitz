import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

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

// 合约地址配置 - 部署后需要更新测试网地址
const CONTRACT_ADDRESSES = {
  monad_local: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  monad_testnet: '0x4642f338bf8412f8DEaaB4b7Fd13A76478625748'
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
  },
  monad_testnet: {
    chainId: '0x279f', // 10143 in hex
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz/'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com/']
  }
};

export default function Home() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('monad_local');
  const [detectedNetwork, setDetectedNetwork] = useState('');
  const [greeting, setGreeting] = useState('');
  const [callCount, setCallCount] = useState(0);
  const [newGreeting, setNewGreeting] = useState('');
  const [status, setStatus] = useState('');
  const [userDisconnected, setUserDisconnected] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const [userApprovedBatch, setUserApprovedBatch] = useState(false);

  // 检查MetaMask连接状态
  useEffect(() => {
    checkConnection();
    detectNetwork();
    
    // 监听网络变化
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', (chainId) => {
        detectNetwork();
        if (isConnected) {
          loadContractData();
        }
      });
      
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // MetaMask中没有账户，清除状态但不设置userDisconnected标志
          setAccount('');
          setIsConnected(false);
          setGreeting('');
          setCallCount(0);
          setStatus('MetaMask中没有可用账户');
        } else {
          // 有账户时，清除断开连接标志并更新状态
          setUserDisconnected(false);
          setAccount(accounts[0]);
          setIsConnected(true);
          if (isConnected) {
            loadContractData();
          }
        }
      });
    }
    
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [isConnected]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined' && !userDisconnected) {
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

  // 检测当前网络
  const detectNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === chainId);
        if (networkKey) {
          setDetectedNetwork(networkKey);
          setCurrentNetwork(networkKey);
        } else {
          setDetectedNetwork('unknown');
        }
      } catch (error) {
        console.error('检测网络失败:', error);
        setDetectedNetwork('unknown');
      }
    }
  };

  // 切换网络
  const switchNetwork = async (networkType) => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('请安装MetaMask!');
      return;
    }

    try {
      setStatus(`正在切换到${NETWORKS[networkType].chainName}...`);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORKS[networkType].chainId }],
      });
      setCurrentNetwork(networkType);
      setStatus(`已切换到${NETWORKS[networkType].chainName}`);
      
      if (isConnected) {
        await loadContractData();
      }
    } catch (error) {
      if (error.code === 4902) {
        // 网络不存在，尝试添加
        await addNetwork(networkType);
      } else {
        console.error('切换网络失败:', error);
        setStatus(`切换网络失败: ${error.message}`);
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
      
      // 清除用户断开连接标志
      setUserDisconnected(false);
      
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
  const handleDisconnect = async () => {
    try {
      // 设置用户主动断开连接标志
      setUserDisconnected(true);
      
      // 清除前端状态
      setAccount('');
      setIsConnected(false);
      setGreeting('');
      setCallCount(0);
      setStatus('钱包已断开连接');
      
      console.log('前端连接已断开');
      
    } catch (error) {
      console.error('断开连接时出错:', error);
      setStatus('断开连接时出错');
    }
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
      const contractAddress = CONTRACT_ADDRESSES[currentNetwork];
      
      if (!contractAddress) {
        setStatus(`${NETWORKS[currentNetwork].chainName}上尚未部署合约`);
        setGreeting('');
        setCallCount(0);
        return;
      }

      const { ethers } = await import('ethers');
      
      // 检查当前网络是否匹配
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const expectedChainId = NETWORKS[currentNetwork].chainId;
      
      if (currentChainId !== expectedChainId) {
        setStatus(`网络不匹配，请切换到${NETWORKS[currentNetwork].chainName}`);
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 验证合约是否存在
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        setStatus(`合约在${NETWORKS[currentNetwork].chainName}上不存在`);
        setGreeting('');
        setCallCount(0);
        return;
      }
      
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

      // 分别调用方法，便于调试
      console.log('调用 getGreeting...');
      const greetingResult = await contract.getGreeting();
      console.log('getGreeting 结果:', greetingResult);
      
      console.log('调用 getCallCount...');
      const countResult = await contract.getCallCount();
      console.log('getCallCount 结果:', countResult);

      setGreeting(greetingResult);
      setCallCount(Number(countResult));
      setStatus('合约数据加载成功');
    } catch (error) {
      console.error('加载合约数据失败:', error);
      setStatus(`加载合约数据失败: ${error.message}`);
      
      // 提供更详细的错误信息
      if (error.message.includes('could not decode result data')) {
        setStatus(`合约调用失败: 可能是ABI不匹配或合约版本问题`);
      }
    }
  };

  // 批处理交易管理
  const addToPendingTransactions = (transaction) => {
    setPendingTransactions(prev => [...prev, transaction]);
  };

  const executePendingTransactions = async () => {
    if (pendingTransactions.length === 0) return;

    try {
      setStatus(`正在执行 ${pendingTransactions.length} 个待处理交易...`);
      const contract = await getContract();
      
      for (let i = 0; i < pendingTransactions.length; i++) {
        const transaction = pendingTransactions[i];
        setStatus(`执行交易 ${i + 1}/${pendingTransactions.length}: ${transaction.description}`);
        
        let tx;
        if (transaction.type === 'sayHello') {
          tx = await contract.sayHello();
        } else if (transaction.type === 'setGreeting') {
          tx = await contract.setGreeting(transaction.data);
        }
        
        await tx.wait();
        setStatus(`交易 ${i + 1} 完成`);
      }
      
      setPendingTransactions([]);
      setStatus('所有交易执行完成!');
      await loadContractData();
      
    } catch (error) {
      console.error('批处理交易失败:', error);
      setStatus(`批处理交易失败: ${error.message}`);
    }
  };

  const clearPendingTransactions = () => {
    setPendingTransactions([]);
    setStatus('已清除待处理交易');
  };

  // 调用sayHello
  const handleSayHello = async () => {
    if (batchMode && !userApprovedBatch) {
      // 批处理模式：添加到待处理队列
      addToPendingTransactions({
        type: 'sayHello',
        description: '调用 sayHello',
        timestamp: Date.now()
      });
      setStatus(`已添加 sayHello 到批处理队列 (${pendingTransactions.length + 1} 个待处理)`);
      return;
    }

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

    if (batchMode && !userApprovedBatch) {
      // 批处理模式：添加到待处理队列
      addToPendingTransactions({
        type: 'setGreeting',
        data: newGreeting,
        description: `设置问候语为: ${newGreeting}`,
        timestamp: Date.now()
      });
      setStatus(`已添加设置问候语到批处理队列 (${pendingTransactions.length + 1} 个待处理)`);
      setNewGreeting('');
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

  // 跳转到游戏页面
  const handleStartGame = () => {
    router.push('/game');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        HelloWorld DApp
      </h1>

      {/* 网络选择和信息 */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>网络选择</h3>
        
        {/* 网络选择按钮 */}
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={() => switchNetwork('monad_local')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentNetwork === 'monad_local' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
              fontSize: '14px'
            }}
          >
            本地网络
          </button>
          <button 
            onClick={() => switchNetwork('monad_testnet')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentNetwork === 'monad_testnet' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            测试网络
          </button>
        </div>

        {/* 当前网络信息 */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.7)', 
          padding: '10px', 
          borderRadius: '4px' 
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            当前选择: <strong>{NETWORKS[currentNetwork].chainName}</strong>
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>
            RPC: {NETWORKS[currentNetwork].rpcUrls[0]} | Chain ID: {parseInt(NETWORKS[currentNetwork].chainId, 16)}
          </p>
          {detectedNetwork && detectedNetwork !== 'unknown' && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: detectedNetwork === currentNetwork ? '#28a745' : '#dc3545' }}>
              MetaMask检测到: {detectedNetwork !== 'unknown' ? NETWORKS[detectedNetwork].chainName : '未知网络'}
              {detectedNetwork !== currentNetwork && ' (请切换网络)'}
            </p>
          )}
        </div>
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
                marginRight: '10px',
                fontSize: '14px'
              }}
            >
              添加本地网络
            </button>
            <button 
              onClick={() => addNetwork('monad_testnet')}
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
              添加测试网络
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
            <strong>合约地址:</strong> {CONTRACT_ADDRESSES[currentNetwork] || '未部署'}
            {CONTRACT_ADDRESSES[currentNetwork] && NETWORKS[currentNetwork].blockExplorerUrls && NETWORKS[currentNetwork].blockExplorerUrls.length > 0 && (
              <a 
                href={`${NETWORKS[currentNetwork].blockExplorerUrls[0]}/address/${CONTRACT_ADDRESSES[currentNetwork]}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: '10px', color: '#007bff', textDecoration: 'none' }}
              >
                [查看区块浏览器]
              </a>
            )}
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
            💡 {currentNetwork === 'monad_local' ? '本地测试完全免费，无需真实ETH' : '测试网使用测试代币，请确保有足够余额'}
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
          
          {/* 批处理模式控制 */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={(e) => {
                    setBatchMode(e.target.checked);
                    if (!e.target.checked) {
                      clearPendingTransactions();
                      setUserApprovedBatch(false);
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  批处理模式 (减少MetaMask弹窗)
                </span>
              </label>
            </div>
            
            {batchMode && (
              <div>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                  💡 启用后，操作将被添加到队列中，可以一次性执行所有交易
                </p>
                
                {pendingTransactions.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: '500' }}>
                      待处理交易 ({pendingTransactions.length} 个):
                    </p>
                    <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '10px' }}>
                      {pendingTransactions.map((tx, index) => (
                        <div key={index} style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          padding: '2px 0',
                          borderBottom: index < pendingTransactions.length - 1 ? '1px solid #eee' : 'none'
                        }}>
                          {index + 1}. {tx.description}
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={executePendingTransactions}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        执行所有交易 ({pendingTransactions.length})
                      </button>
                      <button
                        onClick={clearPendingTransactions}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        清空队列
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={handleSayHello}
              style={{
                padding: '12px 24px',
                backgroundColor: batchMode ? '#17a2b8' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px'
              }}
            >
              {batchMode ? '➕ 添加 sayHello' : '调用 sayHello'}
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
                fontSize: '16px',
                marginRight: '10px'
              }}
            >
              刷新数据
            </button>
            <button 
              onClick={handleStartGame}
              disabled={!isConnected}
              style={{
                padding: '12px 24px',
                backgroundColor: isConnected ? '#ff6b35' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🎮 开打
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
                  backgroundColor: batchMode ? '#17a2b8' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {batchMode ? '➕ 添加到队列' : '设置问候语'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 