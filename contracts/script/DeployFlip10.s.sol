// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Flip10Sessions} from "../src/Flip10Sessions.sol";

contract DeployFlip10 is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address treasury = vm.envAddress("TREASURY");

        // 80% to prize pool
        uint16 prizeBps = 8000;

        vm.startBroadcast(deployerKey);

        Flip10Sessions flip10 = new Flip10Sessions(
            deployer,
            treasury,
            prizeBps
        );

        vm.stopBroadcast();

        console2.log("Flip10Sessions deployed at:", address(flip10));
    }
}