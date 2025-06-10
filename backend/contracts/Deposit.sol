// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Deposit is Ownable {
    IERC20 public usdt;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    
    constructor(address _usdtAddress) Ownable(msg.sender) {
        usdt = IERC20(_usdtAddress);
    }
    
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        emit Deposited(msg.sender, amount);
    }
    
    // Only owner can withdraw tokens (for testing purposes)
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdt.transfer(to, amount),
            "Transfer failed"
        );
        emit Withdrawn(to, amount);
    }
} 