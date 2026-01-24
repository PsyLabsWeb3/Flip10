// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";

/**
 * Flip10 escrow + session settlement contract.
 *
 * - Players buy flip packages (ETH) for a given sessionId.
 * - A portion goes to the prize pool, the rest to treasury.
 * - Backend finalizes the session with a winner.
 * - Winner can claim the prize.
 */
contract Flip10Sessions is Ownable, ReentrancyGuard {
    // -----------------------------
    // Types / storage
    // -----------------------------

    struct Session {
        bool started;
        bool finalized;
        address winner;
        uint64 startTime;
        uint64 endTime;
        uint256 prizePoolWei;
    }

    struct FlipPackage {
        uint256 priceWei;
        uint256 flips;
        bool active;
    }

    // sessionId => Session
    mapping(uint256 => Session) public sessions;

    // Authorized backend that can start/finalize sessions.
    mapping(address => bool) public operators;

    // Flip packages available for purchase.
    mapping(uint8 => FlipPackage) public flipPackages;
    uint8 public packageCount;

    // Treasury address for platform revenue.
    address public treasury;

    // Prize share in basis points (8000 = 80%). Remainder goes to treasury.
    uint16 public prizeBps;

    // Optional: require start time window validation (set to 0 to disable).
    uint64 public maxFinalizeDelaySeconds;

    // -----------------------------
    // Events
    // -----------------------------

    event OperatorSet(address indexed operator, bool allowed);
    event TreasurySet(address indexed treasury);
    event PrizeBpsSet(uint16 prizeBps);
    event MaxFinalizeDelaySet(uint64 secondsDelay);
    event SessionStarted(uint256 indexed sessionId, uint64 startTime);
    event FlipPackagePurchased(
        uint256 indexed sessionId,
        address indexed buyer,
        uint256 flips,
        uint256 amountWei
    );
    event SessionFinalized(
        uint256 indexed sessionId,
        address indexed winner,
        uint64 endTime,
        bytes32 proofHash
    );
    event PrizeClaimed(
        uint256 indexed sessionId,
        address indexed winner,
        uint256 amountWei
    );
    event FlipPackageSet(
        uint8 indexed packageId,
        uint256 priceWei,
        uint256 flips,
        bool active
    );
    event FlipPackageDisabled(uint8 indexed packageId);

    // -----------------------------
    // Errors
    // -----------------------------

    error NotOperator();
    error ZeroAddress();
    error InvalidBps();
    error SessionNotStarted();
    error SessionAlreadyStarted();
    error SessionAlreadyFinalized();
    error SessionNotFinalized();
    error InvalidWinner();
    error NothingToClaim();
    error FinalizeTooLate();
    error InvalidPackagePrice();
    error InvalidFlipAmount();
    error PackageInactive();

    // -----------------------------
    // Modifiers
    // -----------------------------

    modifier onlyOperator() {
        if (!operators[msg.sender]) revert NotOperator();
        _;
    }

    // -----------------------------
    // Constructor / admin
    // -----------------------------

    constructor(
        address initialOwner,
        address initialTreasury,
        uint16 initialPrizeBps
    ) Ownable(initialOwner) {
        if (initialTreasury == address(0)) revert ZeroAddress();
        if (initialPrizeBps == 0 || initialPrizeBps > 10_000)
            revert InvalidBps();

        treasury = initialTreasury;
        prizeBps = initialPrizeBps;

        flipPackages[0] = FlipPackage(0.0005 ether, 250, true);
        flipPackages[1] = FlipPackage(0.0009 ether, 500, true);
        flipPackages[2] = FlipPackage(0.0017 ether, 1000, true);
        flipPackages[3] = FlipPackage(0.0032 ether, 2000, true);

        packageCount = 4;

        // Owner is also an operator by default.
        operators[initialOwner] = true;
        emit OperatorSet(initialOwner, true);
        emit TreasurySet(initialTreasury);
        emit PrizeBpsSet(initialPrizeBps);
    }

    function setOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        operators[operator] = allowed;
        emit OperatorSet(operator, allowed);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit TreasurySet(newTreasury);
    }

    function setPrizeBps(uint16 newPrizeBps) external onlyOwner {
        if (newPrizeBps == 0 || newPrizeBps > 10_000) revert InvalidBps();
        prizeBps = newPrizeBps;
        emit PrizeBpsSet(newPrizeBps);
    }

    function setMaxFinalizeDelaySeconds(
        uint64 secondsDelay
    ) external onlyOwner {
        maxFinalizeDelaySeconds = secondsDelay;
        emit MaxFinalizeDelaySet(secondsDelay);
    }

    function setFlipPackage(
        uint8 packageId,
        uint256 priceWei,
        uint256 flips,
        bool active
    ) external onlyOwner {
        if (priceWei == 0) revert InvalidPackagePrice();
        if (flips == 0) revert InvalidFlipAmount();

        flipPackages[packageId] = FlipPackage({
            priceWei: priceWei,
            flips: flips,
            active: active
        });

        if (packageId >= packageCount) {
            packageCount = packageId + 1;
        }

        emit FlipPackageSet(packageId, priceWei, flips, active);
    }

    function disableFlipPackage(uint8 packageId) external onlyOwner {
        flipPackages[packageId].active = false;
        emit FlipPackageDisabled(packageId);
    }

    // -----------------------------
    // Session lifecycle
    // -----------------------------

    function startSession(uint256 sessionId) external onlyOperator {
        Session storage s = sessions[sessionId];
        if (s.started) revert SessionAlreadyStarted();

        s.started = true;
        s.startTime = uint64(block.timestamp);

        emit SessionStarted(sessionId, s.startTime);
    }

    /**
     * Players buy flip packages by paying ETH.
     * Session must be started and not finalized.
     */
    function buyFlips(
        uint256 sessionId,
        uint8 packageId
    ) external payable nonReentrant {
        Session storage s = sessions[sessionId];
        if (!s.started) revert SessionNotStarted();
        if (s.finalized) revert SessionAlreadyFinalized();

        FlipPackage memory pkg = flipPackages[packageId];

        if (!pkg.active) revert PackageInactive();
        if (msg.value != pkg.priceWei) revert InvalidPackagePrice();

        uint256 toPrize = (msg.value * prizeBps) / 10_000;
        uint256 toTreasury = msg.value - toPrize;

        s.prizePoolWei += toPrize;

        (bool ok, ) = treasury.call{value: toTreasury}("");
        require(ok, "TREASURY_TRANSFER_FAILED");

        emit FlipPackagePurchased(sessionId, msg.sender, pkg.flips, msg.value);
    }

    /**
     * Finalize the session with a winner.
     * proofHash is a commitment to the off-chain session log/proof.
     */
    function finalizeSession(
        uint256 sessionId,
        address winner,
        bytes32 proofHash
    ) external onlyOperator {
        Session storage s = sessions[sessionId];
        if (!s.started) revert SessionNotStarted();
        if (s.finalized) revert SessionAlreadyFinalized();
        if (winner == address(0)) revert InvalidWinner();

        // Finalize window
        if (maxFinalizeDelaySeconds != 0) {
            if (
                block.timestamp >
                uint256(s.startTime) + uint256(maxFinalizeDelaySeconds)
            ) revert FinalizeTooLate();
        }

        s.finalized = true;
        s.winner = winner;
        s.endTime = uint64(block.timestamp);

        emit SessionFinalized(sessionId, winner, s.endTime, proofHash);
    }

    /**
     * Claim the prize.
     */
    function claimPrize(uint256 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];

        if (!s.finalized) revert SessionNotFinalized();
        if (msg.sender != s.winner) revert InvalidWinner();

        uint256 amount = s.prizePoolWei;
        if (amount == 0) revert NothingToClaim();

        // Effects
        s.prizePoolWei = 0;

        // ETH transfer
        Address.sendValue(payable(msg.sender), amount);

        emit PrizeClaimed(sessionId, msg.sender, amount);
    }

    // Receive ETH
    receive() external payable {}
}
