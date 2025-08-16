import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 30;
const BULLET_SIZE = 8;
const JUMP_HEIGHT = 60; // 两个方块高度
const GAME_DURATION = 20; // 20秒

export default function Game() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({});
  
  // 游戏状态
  const [gameState, setGameState] = useState('playing'); // playing, finished
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // 玩家状态
  const [player, setPlayer] = useState({
    x: 100,
    y: GAME_HEIGHT - PLAYER_SIZE - 50,
    velocityY: 0,
    isJumping: false,
    direction: 1 // 1为右，-1为左
  });
  
  // AI敌人状态
  const [enemy, setEnemy] = useState({
    x: GAME_WIDTH - 150,
    y: GAME_HEIGHT - PLAYER_SIZE - 50,
    velocityY: 0,
    isJumping: false,
    direction: -1,
    lastShoot: Date.now(),
    lastDirectionChange: Date.now(),
    isChangingDirection: false
  });
  
  // 子弹状态
  const [bullets, setBullets] = useState([]);
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // 游戏倒计时
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('finished');
      setShowResult(true);
    }
  }, [timeLeft, gameState]);
  
  // 更新玩家位置
  const updatePlayer = useCallback(() => {
    setPlayer(prev => {
      let newPlayer = { ...prev };
      
      // 左右移动
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        newPlayer.x = Math.max(0, newPlayer.x - 5);
        newPlayer.direction = -1;
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        newPlayer.x = Math.min(GAME_WIDTH - PLAYER_SIZE, newPlayer.x + 5);
        newPlayer.direction = 1;
      }
      
      // 跳跃
      if ((keysRef.current['w'] || keysRef.current['arrowup']) && !newPlayer.isJumping) {
        newPlayer.velocityY = -15;
        newPlayer.isJumping = true;
      }
      
      // 重力和跳跃物理
      newPlayer.velocityY += 0.8; // 重力
      newPlayer.y += newPlayer.velocityY;
      
      // 地面碰撞
      const groundY = GAME_HEIGHT - PLAYER_SIZE - 50;
      if (newPlayer.y >= groundY) {
        newPlayer.y = groundY;
        newPlayer.velocityY = 0;
        newPlayer.isJumping = false;
      }
      
      return newPlayer;
    });
  }, []);
  
  // 更新AI敌人
  const updateEnemy = useCallback(() => {
    setEnemy(prev => {
      let newEnemy = { ...prev };
      const now = Date.now();
      
      // 计算玩家相对位置
      const playerCenterX = player.x + PLAYER_SIZE / 2;
      const enemyCenterX = newEnemy.x + PLAYER_SIZE / 2;
      const distanceToPlayer = Math.abs(playerCenterX - enemyCenterX);
      
      // 确定应该面向的方向（面向玩家）
      const shouldFaceDirection = playerCenterX < enemyCenterX ? -1 : 1;
      
      // 处理方向改变（延迟1秒）
      if (newEnemy.direction !== shouldFaceDirection && !newEnemy.isChangingDirection) {
        if (now - newEnemy.lastDirectionChange > 1000) {
          newEnemy.direction = shouldFaceDirection;
          newEnemy.lastDirectionChange = now;
          newEnemy.isChangingDirection = true;
        }
      } else if (newEnemy.isChangingDirection && now - newEnemy.lastDirectionChange > 100) {
        newEnemy.isChangingDirection = false;
      }
      
      // AI移动逻辑：一直朝玩家前进
      if (!newEnemy.isChangingDirection) {
        const moveSpeed = 2;
        if (distanceToPlayer > PLAYER_SIZE) { // 保持一定距离，避免重叠
          if (playerCenterX < enemyCenterX) {
            newEnemy.x = Math.max(0, newEnemy.x - moveSpeed);
          } else {
            newEnemy.x = Math.min(GAME_WIDTH - PLAYER_SIZE, newEnemy.x + moveSpeed);
          }
        }
        
        // 随机跳跃（20%概率）
        if (Math.random() < 0.02 && !newEnemy.isJumping) {
          newEnemy.velocityY = -15;
          newEnemy.isJumping = true;
        }
      }
      
      // AI射击逻辑：每0.5秒射击一次
      if (now - newEnemy.lastShoot > 500) {
        setBullets(prevBullets => [...prevBullets, {
          x: newEnemy.x + PLAYER_SIZE / 2,
          y: newEnemy.y + PLAYER_SIZE / 2,
          velocityX: newEnemy.direction * 8,
          velocityY: 0,
          owner: 'enemy',
          id: Date.now() + Math.random()
        }]);
        newEnemy.lastShoot = now;
      }
      
      // 重力和跳跃物理
      newEnemy.velocityY += 0.8;
      newEnemy.y += newEnemy.velocityY;
      
      // 地面碰撞
      const groundY = GAME_HEIGHT - PLAYER_SIZE - 50;
      if (newEnemy.y >= groundY) {
        newEnemy.y = groundY;
        newEnemy.velocityY = 0;
        newEnemy.isJumping = false;
      }
      
      return newEnemy;
    });
  }, [player]);
  
  // 处理射击
  useEffect(() => {
    const handleShoot = (e) => {
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        setBullets(prev => [...prev, {
          x: player.x + PLAYER_SIZE / 2,
          y: player.y + PLAYER_SIZE / 2,
          velocityX: player.direction * 8,
          velocityY: 0,
          owner: 'player',
          id: Date.now() + Math.random()
        }]);
      }
    };
    
    window.addEventListener('keydown', handleShoot);
    return () => window.removeEventListener('keydown', handleShoot);
  }, [player, gameState]);
  
  // 更新子弹
  const updateBullets = useCallback(() => {
    setBullets(prev => {
      return prev.map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.velocityX,
        y: bullet.y + bullet.velocityY
      })).filter(bullet => 
        bullet.x > -BULLET_SIZE && 
        bullet.x < GAME_WIDTH + BULLET_SIZE &&
        bullet.y > -BULLET_SIZE && 
        bullet.y < GAME_HEIGHT + BULLET_SIZE
      );
    });
  }, []);
  
  // 碰撞检测
  const checkCollisions = useCallback(() => {
    bullets.forEach(bullet => {
      // 玩家被击中
      if (bullet.owner === 'enemy' &&
          bullet.x < player.x + PLAYER_SIZE &&
          bullet.x + BULLET_SIZE > player.x &&
          bullet.y < player.y + PLAYER_SIZE &&
          bullet.y + BULLET_SIZE > player.y) {
        setScore(prev => prev - 2); // 被击中减0.02分 (以分为单位)
        setBullets(prev => prev.filter(b => b.id !== bullet.id));
      }
      
      // 敌人被击中
      if (bullet.owner === 'player' &&
          bullet.x < enemy.x + PLAYER_SIZE &&
          bullet.x + BULLET_SIZE > enemy.x &&
          bullet.y < enemy.y + PLAYER_SIZE &&
          bullet.y + BULLET_SIZE > enemy.y) {
        setScore(prev => prev + 1); // 击中得0.01分 (以分为单位)
        setBullets(prev => prev.filter(b => b.id !== bullet.id));
      }
    });
  }, [bullets, player, enemy]);
  
  // 游戏主循环
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        updatePlayer();
        updateEnemy();
        updateBullets();
        checkCollisions();
      }, 1000 / 60); // 60 FPS
      
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameState, updatePlayer, updateEnemy, updateBullets, checkCollisions]);
  
  // 渲染游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // 绘制地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
    
    // 绘制玩家 (蓝色)
    ctx.fillStyle = '#0066CC';
    ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    
    // 绘制敌人 (红色)
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(enemy.x, enemy.y, PLAYER_SIZE, PLAYER_SIZE);
    
    // 绘制子弹
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 'player' ? '#0066CC' : '#CC0000';
      ctx.fillRect(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE);
    });
    
    // 绘制UI
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`时间: ${timeLeft}s`, 20, 30);
    ctx.fillText(`分数: ${(score / 100).toFixed(2)}`, 20, 60);
    
  }, [player, enemy, bullets, timeLeft, score]);
  
  // 返回主页
  const handleBackHome = () => {
    router.push('/');
  };
  
  // 进入结算页面
  const handleSettle = () => {
    router.push({
      pathname: '/settle',
      query: { score: score }
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>人机对战</h1>
      
      <div style={{ 
        border: '2px solid #333', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{ display: 'block' }}
        />
      </div>
      
      <div style={{ 
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '16px'
      }}>
        <p><strong>操作说明:</strong></p>
        <p>WASD 或 方向键移动，空格键射击</p>
        <p>击中敌人 +0.01分，被击中 -0.02分</p>
      </div>
      
      {showResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>游戏结束!</h2>
            <p style={{ fontSize: '24px', marginBottom: '20px' }}>
              最终分数: <strong style={{ color: score >= 0 ? '#28a745' : '#dc3545' }}>
                {(score / 100).toFixed(2)}
              </strong>
            </p>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              {score >= 0 ? '恭喜获得奖励!' : '很遗憾，需要扣除代币'}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
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
                onClick={handleSettle}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                结算代币
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 