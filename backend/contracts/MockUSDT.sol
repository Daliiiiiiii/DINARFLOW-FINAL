// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDT is ERC20, Ownable {
    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {}

    // Mint function that only the owner can call
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Override decimals to match USDT's 6 decimals
    function decimals() public pure override returns (uint8) {
        return 6;
    }
} 