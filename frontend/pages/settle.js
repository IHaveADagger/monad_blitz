import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 游戏合约ABI (简化版，只包含需要的函数)
const GAME_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "int256", "name": "score", "type": "int256"}],
    "name": "settleGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerStats",
    "outputs": [
      {"internalType": "uint256", "name": "balance", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesPlayed", "type": "uint256"},
      {"internalType": "uint256", "name": "wins", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// 合约地址 - 需要在部署后更新
const GAME_CONTRACT_ADDRESSES = {
  monad_local: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // 将在部署后更新
  monad_testnet: '0x5DFF4A2C04A3330f2Db6DD2eA04a9312A2De35Da' // 将在部署后更新
};

// 网络配置
const NETWORKS = {
  monad_local: {
    chainId: '0x7a69',
    chainName: 'Local Monad'
  },
  monad_testnet: {
    chainId: '0x279f',
    chainName: 'Monad Testnet'
  }
};

export default function Settle() {
  const router = useRouter();
  const { score } = router.query;
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('monad_local');
  const [status, setStatus] = useState('');
  const [isSettling, setIsSettling] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [depositAmount, setDepositAmount] = useState('0.01');

  const finalScore = score ? parseInt(score) : 0;
  const scoreInEth = finalScore / 100; // 转换为以太币单位

  // 检查连接状态
  useEffect(() => {
    checkConnection();
    detectNetwork();
  }, []);

  // 加载玩家统计
  useEffect(() => {
    if (isConnected && account) {
      loadPlayerStats();
    }
  }, [isConnected, account, currentNetwork]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('检查连接失败:', error);
      }
    }
  };

  const detectNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === chainId);
        if (networkKey) {
          setCurrentNetwork(networkKey);
        }
      } catch (error) {
        console.error('检测网络失败:', error);
      }
    }
  };

  const getGameContract = async () => {
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = GAME_CONTRACT_ADDRESSES[currentNetwork];
    
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('游戏合约尚未部署到当前网络');
    }
    
    return new ethers.Contract(contractAddress, GAME_CONTRACT_ABI, signer);
  };

  const loadPlayerStats = async () => {
    try {
      const contract = await getGameContract();
      const stats = await contract.getPlayerStats(account);
      setPlayerStats({
        balance: stats[0],
        gamesPlayed: stats[1],
        wins: stats[2]
      });
    } catch (error) {
      console.error('加载玩家统计失败:', error);
      setStatus(`加载统计失败: ${error.message}`);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setStatus('请输入有效的存款金额');
      return;
    }

    try {
      setStatus('正在存款...');
      const { ethers } = await import('ethers');
      const contract = await getGameContract();
      
      const tx = await contract.deposit({
        value: ethers.parseEther(depositAmount)
      });
      
      setStatus('交易已发送，等待确认...');
      await tx.wait();
      setStatus('存款成功!');
      
      // 重新加载统计
      await loadPlayerStats();
    } catch (error) {
      console.error('存款失败:', error);
      setStatus(`存款失败: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    if (!playerStats || playerStats.balance === 0n) {
      setStatus('余额不足，无法提取');
      return;
    }

    try {
      setStatus('正在提取...');
      const contract = await getGameContract();
      
      const tx = await contract.withdraw(playerStats.balance);
      setStatus('交易已发送，等待确认...');
      await tx.wait();
      setStatus('提取成功!');
      
      // 重新加载统计
      await loadPlayerStats();
    } catch (error) {
      console.error('提取失败:', error);
      setStatus(`提取失败: ${error.message}`);
    }
  };

  const handleSettleGame = async () => {
    if (!isConnected) {
      setStatus('请先连接钱包');
      return;
    }

    try {
      setIsSettling(true);
      setStatus('正在结算游戏...');
      
      const contract = await getGameContract();
      const tx = await contract.settleGame(finalScore);
      
      setStatus('交易已发送，等待确认...');
      await tx.wait();
      
      setStatus('游戏结算完成!');
      
      // 重新加载统计
      await loadPlayerStats();
      
    } catch (error) {
      console.error('结算失败:', error);
      setStatus(`结算失败: ${error.message}`);
    } finally {
      setIsSettling(false);
    }
  };

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
      
    } catch (error) {
      console.error('连接钱包失败:', error);
      setStatus(`钱包连接失败: ${error.message}`);
    }
  };

  const handleBackHome = () => {
    router.push('/');
  };

  const handlePlayAgain = () => {
    router.push('/game');
  };

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        游戏结算
      </h1>

      {/* 游戏结果显示 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        textAlign: 'center',
        border: '2px solid #dee2e6'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>游戏结果</h2>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          color: finalScore >= 0 ? '#28a745' : '#dc3545',
          marginBottom: '15px'
        }}>
          {scoreInEth.toFixed(2)} MON
        </div>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
          {finalScore >= 0 ? '🎉 恭喜获得奖励!' : '😔 很遗憾，需要扣除代币'}
        </p>
        <p style={{ fontSize: '14px', color: '#888' }}>
          原始分数: {finalScore} 分
        </p>
      </div>

      {/* 连接状态 */}
      {!isConnected ? (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '15px', color: '#856404' }}>
            需要连接钱包才能进行代币结算
          </p>
          <button 
            onClick={connectWallet}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            连接钱包
          </button>
        </div>
      ) : (
        <div>
          {/* 玩家统计 */}
          {playerStats && (
            <div style={{ 
              backgroundColor: '#e9ecef', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>玩家统计</h3>
                             <p style={{ margin: '5px 0' }}>
                 <strong>当前余额:</strong> {(Number(playerStats.balance) / 1e18).toFixed(4)} MON
               </p>
              <p style={{ margin: '5px 0' }}>
                <strong>游戏次数:</strong> {playerStats.gamesPlayed.toString()}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>获胜次数:</strong> {playerStats.wins.toString()}
              </p>
            </div>
          )}

          {/* 存款功能 */}
          <div style={{ 
            backgroundColor: '#d4edda', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>存款到游戏合约</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                                 placeholder="存款金额 (MON)"
                step="0.001"
                min="0"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <button 
                onClick={handleDeposit}
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
                存款
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#155724', margin: '0' }}>
              💡 需要先存款才能进行游戏结算
            </p>
          </div>

          {/* 结算按钮 */}
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #ddd',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>代币结算</h3>
            <button 
              onClick={handleSettleGame}
              disabled={isSettling}
              style={{
                padding: '15px 30px',
                backgroundColor: isSettling ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSettling ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                width: '100%',
                marginBottom: '15px'
              }}
            >
              {isSettling ? '结算中...' : '确认结算'}
            </button>
            
            {playerStats && playerStats.balance > 0n && (
              <button 
                onClick={handleWithdraw}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '100%'
                }}
              >
                提取所有余额
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* 操作按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginTop: '30px'
      }}>
        <button
          onClick={handleBackHome}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          返回主页
        </button>
        <button
          onClick={handlePlayAgain}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          🎮 再来一局
        </button>
      </div>
    </div>
  );
} 