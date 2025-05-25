// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDT is ERC20Permit, Ownable {
    // Fee recipient address (hardcoded for now)
    address public constant FEE_RECIPIENT = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Hardhat's second account
    uint256 public constant TRANSFER_FEE = 1 * 10**6; // 1 USDT with 6 decimals

    constructor() ERC20("Tether USD", "USDT") ERC20Permit("Tether USD") Ownable(msg.sender) {
        // Mint 1 million USDT to the contract deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Function to transfer tokens with fee
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(amount > TRANSFER_FEE, "Amount must be greater than fee");
        _transfer(msg.sender, FEE_RECIPIENT, TRANSFER_FEE);
        _transfer(msg.sender, to, amount - TRANSFER_FEE);
        return true;
    }

    // Function to transfer tokens without requiring gas from the sender
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(amount > TRANSFER_FEE, "Amount must be greater than fee");
        _transfer(from, FEE_RECIPIENT, TRANSFER_FEE);
        _transfer(from, to, amount - TRANSFER_FEE);
        return true;
    }

    // Function to mint tokens (only owner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 