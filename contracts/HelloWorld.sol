// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HelloWorld {
    string private greeting;
    address public owner;
    uint256 public callCount;
    
    event GreetingChanged(string newGreeting, address changedBy);
    event HelloCalled(address caller, uint256 count);
    
    constructor() {
        greeting = "Hello, Monad World!";
        owner = msg.sender;
        callCount = 0;
    }
    
    function sayHello() public returns (string memory) {
        callCount++;
        emit HelloCalled(msg.sender, callCount);
        return greeting;
    }
    
    function setGreeting(string memory _newGreeting) public {
        require(bytes(_newGreeting).length > 0, "Greeting cannot be empty");
        greeting = _newGreeting;
        emit GreetingChanged(_newGreeting, msg.sender);
    }
    
    function getGreeting() public view returns (string memory) {
        return greeting;
    }
    
    function getCallCount() public view returns (uint256) {
        return callCount;
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
} 