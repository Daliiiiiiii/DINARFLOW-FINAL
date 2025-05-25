// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Test USDT", "USDT") Ownable(msg.sender) {
        // Initial supply will be 0
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 