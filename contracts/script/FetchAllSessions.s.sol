// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {Flip10Sessions} from "../src/Flip10Sessions.sol";

contract FetchAllSessions is Script {
    address constant CONTRACT_ADDRESS =
        0x7d8d7f8FDCe18840DBA716e0b62bB323517DE30E;

    bytes32 constant SESSION_STARTED_TOPIC =
        keccak256("SessionStarted(uint256,uint64)");

    uint256 constant TOTAL_RANGE = 50_000;
    uint256 constant CHUNK_SIZE = 5_000;

    function run() external view {
        Flip10Sessions flip10 = Flip10Sessions(payable(CONTRACT_ADDRESS));

        console2.log("=== Fetching SessionStarted events ===");

        bytes32[] memory topics = new bytes32[](1);
        topics[0] = SESSION_STARTED_TOPIC;

        uint256 latest = block.number;
        uint256 startBlock = latest > TOTAL_RANGE ? latest - TOTAL_RANGE : 0;

        for (uint256 from = startBlock; from <= latest; from += CHUNK_SIZE) {
            uint256 to = from + CHUNK_SIZE - 1;
            if (to > latest) to = latest;

            VmSafe.EthGetLogs[] memory logs = vm.eth_getLogs(
                from,
                to,
                CONTRACT_ADDRESS,
                topics
            );

            for (uint256 i = 0; i < logs.length; i++) {
                VmSafe.EthGetLogs memory log = logs[i];

                uint256 sessionId = uint256(log.topics[1]);

                Flip10Sessions.Session memory s = _getSession(
                    flip10,
                    sessionId
                );

                console2.log("Session ID:", sessionId);
                console2.log("  Started:", s.started);
                console2.log("  Finalized:", s.finalized);
                console2.log("  Winner:", s.winner);
                console2.log("  Start Time:", uint256(s.startTime));
                console2.log("  End Time:", uint256(s.endTime));
                console2.log("  Prize (ETH):", s.prizePoolWei / 1e18);
                console2.log("-----------------------------");
            }
        }

        console2.log("=== Done ===");
    }

    function _getSession(
        Flip10Sessions flip10,
        uint256 sessionId
    ) internal view returns (Flip10Sessions.Session memory s) {
        (
            s.started,
            s.finalized,
            s.winner,
            s.startTime,
            s.endTime,
            s.prizePoolWei
        ) = flip10.sessions(sessionId);
    }
}
