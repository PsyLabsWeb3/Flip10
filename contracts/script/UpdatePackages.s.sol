// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Flip10Sessions} from "../src/Flip10Sessions.sol";

contract UpdatePackages is Script {
    address payable constant FLIP10_ADDRESS =
        payable(0x7d8d7f8FDCe18840DBA716e0b62bB323517DE30E);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        Flip10Sessions flip10 = Flip10Sessions(FLIP10_ADDRESS);

        flip10.setFlipPackage(3, 0.0032 ether, 2000, true);

        vm.stopBroadcast();

        console2.log("Packages updated");
    }
}
