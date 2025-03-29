// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleFunding {
    uint256 public counter;

    constructor() {
        counter = 0;
    }

    function increment() public {
        counter += 1;
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }
} 