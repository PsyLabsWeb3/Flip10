// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {Flip10Sessions} from "../src/Flip10Sessions.sol";

contract Flip10SessionsTest is Test {
    Flip10Sessions c;

    uint256 ownerPk = 1;
    uint256 operatorPk = 2;
    uint256 alicePk = 3;
    uint256 bobPk = 4;
    uint256 treasuryPk = 5;

    address owner;
    address operator;
    address alice;
    address bob;
    address treasury;

    function setUp() public {
        owner = vm.addr(ownerPk);
        operator = vm.addr(operatorPk);
        alice = vm.addr(alicePk);
        bob = vm.addr(bobPk);
        treasury = vm.addr(treasuryPk);

        vm.deal(owner, 10 ether);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        vm.prank(owner);
        c = new Flip10Sessions(owner, treasury, 8000);

        vm.prank(owner);
        c.setOperator(operator, true);
    }

    function test_buyFlips_splitsPrizeAndTreasury() public {
        uint256 sessionId = 1;

        vm.prank(operator);
        c.startSession(sessionId);

        uint256 treasuryBefore = treasury.balance;

        vm.prank(alice);
        c.buyFlips{value: 1 ether}(sessionId);

        // Prize pool should get 0.8 ETH
        (, , , , , uint256 prizePool) = c.sessions(sessionId);
        assertEq(prizePool, 0.8 ether);

        // Treasury should receive 0.2 ETH
        assertEq(treasury.balance - treasuryBefore, 0.2 ether);
    }

    function test_finalize_and_claim() public {
        uint256 sessionId = 2;

        vm.prank(operator);
        c.startSession(sessionId);

        vm.prank(alice);
        c.buyFlips{value: 1 ether}(sessionId);

        bytes32 proofHash = keccak256("proof");
        vm.prank(operator);
        c.finalizeSession(sessionId, bob, proofHash);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        c.claimPrize(sessionId);

        assertEq(bob.balance - bobBefore, 0.8 ether);

        (, , , , , uint256 prizePoolAfter) = c.sessions(sessionId);
        assertEq(prizePoolAfter, 0);
    }
}