// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GameBattle {
    address public owner;
    mapping(address => uint256) public playerBalances;
    mapping(address => uint256) public totalGamesPlayed;
    mapping(address => uint256) public totalWins;
    
    event GameFinished(address player, int256 score, uint256 reward, uint256 timestamp);
    event BalanceUpdated(address player, uint256 newBalance);
    event Deposit(address player, uint256 amount);
    event Withdrawal(address player, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // 存款功能
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        playerBalances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
        emit BalanceUpdated(msg.sender, playerBalances[msg.sender]);
    }
    
    // 提款功能
    function withdraw(uint256 amount) public {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(playerBalances[msg.sender] >= amount, "Insufficient balance");
        
        playerBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, amount);
        emit BalanceUpdated(msg.sender, playerBalances[msg.sender]);
    }
    
    // 游戏结算功能
    function settleGame(int256 score) public {
        require(score >= -200 && score <= 200, "Score out of valid range"); // 假设最大分数范围
        
        totalGamesPlayed[msg.sender]++;
        
        uint256 baseReward = 0.001 ether; // 基础奖励单位
        int256 reward = score * int256(baseReward) / 100; // score是以分为单位，转换为以太币
        
        if (reward > 0) {
            // 正分奖励
            uint256 rewardAmount = uint256(reward);
            playerBalances[msg.sender] += rewardAmount;
            totalWins[msg.sender]++;
        } else if (reward < 0) {
            // 负分扣除
            uint256 penaltyAmount = uint256(-reward);
            if (playerBalances[msg.sender] >= penaltyAmount) {
                playerBalances[msg.sender] -= penaltyAmount;
            } else {
                // 如果余额不足，扣除所有余额
                playerBalances[msg.sender] = 0;
            }
        }
        
        emit GameFinished(msg.sender, score, playerBalances[msg.sender], block.timestamp);
        emit BalanceUpdated(msg.sender, playerBalances[msg.sender]);
    }
    
    // 查询玩家余额
    function getBalance(address player) public view returns (uint256) {
        return playerBalances[player];
    }
    
    // 查询玩家统计
    function getPlayerStats(address player) public view returns (uint256 balance, uint256 gamesPlayed, uint256 wins) {
        return (playerBalances[player], totalGamesPlayed[player], totalWins[player]);
    }
    
    // 获取合约总余额（仅owner可调用）
    function getContractBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }
    
    // 紧急提取功能（仅owner可调用）
    function emergencyWithdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
} 