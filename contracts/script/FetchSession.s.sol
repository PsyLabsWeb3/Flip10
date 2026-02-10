// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Flip10Sessions} from "../src/Flip10Sessions.sol";

contract FetchSession is Script {
    // Hardcoded contract address on Base
    address constant CONTRACT_ADDRESS =
        0x7d8d7f8FDCe18840DBA716e0b62bB323517DE30E;

    // Hardcoded session ID to fetch
    uint256 constant SESSION_ID = 1769564061254;

    function run() external view {
        Flip10Sessions flip10 = Flip10Sessions(payable(CONTRACT_ADDRESS));

        // Fetch session data
        (
            bool started,
            bool finalized,
            address winner,
            uint64 startTime,
            uint64 endTime,
            uint256 prizePoolWei
        ) = flip10.sessions(SESSION_ID);

        console2.log("=== Session Data ===");
        console2.log("Session ID:", SESSION_ID);
        console2.log("-------------------");
        console2.log("Started:", started);
        console2.log("Finalized:", finalized);
        console2.log("Winner:", winner);
        console2.log("Start Time (Unix):", uint256(startTime));
        console2.log("End Time (Unix):", uint256(endTime));
        console2.log("Prize Pool (Wei):", prizePoolWei);
        console2.log("Prize Pool (ETH):", prizePoolWei / 1e18);
        console2.log("===================");
    }
}
