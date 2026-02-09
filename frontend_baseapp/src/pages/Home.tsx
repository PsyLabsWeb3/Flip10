import React, { useEffect } from "react";
import { useAccount } from "wagmi";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useGameStore } from "../store/useGameStore";
import { CoinScene } from "../components/CoinScene";
import { Leaderboard } from "../components/Leaderboard";
import { BuyFlipsModal } from "../components/BuyFlipsModal";
import { Tooltip } from "../components/Tooltip";
import { playButtonPress, playButtonRelease, playFlip } from "../utils/sfx";

export const Home: React.FC = () => {
  const { address, isConnected: isWalletConnected } = useAccount();
  // const { connect: connectWallet, connectors } = useConnect();
  const {
    connect,
    isConnected,
    session,
    flip,
    isFlipping,
    player,
    isAuthenticated,
    authRejected,
    retryAuth,
    showBuyModal,
    setShowBuyModal,
  } = useGameStore();

  // const [showLeaderboard, setShowLeaderboard] = React.useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  // Determine if session is active
  const isSessionActive = session?.active ?? false;
  const hasLastSession = !isSessionActive && session?.lastSession;

  const statBoxStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    border: "var(--border-brutal)",
    boxShadow: "var(--shadow-brutal)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        gap: "0.5rem",
        padding: "0.5rem",
      }}
    >
      {/* Stats Row - Horizontal on mobile */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        {/* Live/Waiting Status + Session ID */}
        <div
          style={{
            ...statBoxStyle,
            background: "var(--color-white)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flex: "1 1 auto",
            minWidth: "140px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {isConnected ? (
              isSessionActive ? (
                <div className="status-indicator online" />
              ) : (
                <div className="status-indicator offline" />
              )
            ) : (
              <div className="status-indicator offline" />
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: "0.8rem" }}>
              {!isConnected
                ? "CONNECTING"
                : isSessionActive
                  ? "LIVE"
                  : "WAITING"}
            </span>
            {session && (isSessionActive || hasLastSession) && (
              <span
                style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.6 }}
              >
                #{hasLastSession ? session.lastSession?.sessionId : session.id}
              </span>
            )}
          </div>
        </div>

        {/* Heads % - Only show when active */}
        {session && isSessionActive && (
          <Tooltip content="📈 Heads probability scales with time + global flips">
            <div
              style={{
                ...statBoxStyle,
                background: "var(--color-accent)",
                cursor: "help",
              }}
            >
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Heads %
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                {((session.headsProbability ?? 0) * 100).toFixed(1)}%
              </div>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Player Stats - Only show when session is active */}
      {isSessionActive && player ? (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-secondary)",
            border: "var(--border-brutal)",
            boxShadow: "var(--shadow-brutal)",
            display: "flex",
            justifyContent: "space-around",
            color: "var(--color-white)",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700 }}>
              YOUR STREAK
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {player.streak}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700 }}>
              FLIPS LEFT
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {player.remainingFlips}
            </div>
          </div>
        </div>
      ) : isSessionActive ? (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-secondary)",
            border: "var(--border-brutal)",
            boxShadow: "var(--shadow-brutal)",
            display: "flex",
            justifyContent: "center",
            color: "var(--color-white)",
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontStyle: "italic", opacity: 0.7, fontSize: "0.8rem" }}
          >
            Connect wallet to play
          </span>
        </div>
      ) : null}

      {/* Main Content - Coin and Leaderboard */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Coin Scene */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <CoinScene />
        </div>
        {/* Leaderboard */}
        <Leaderboard />
      </div>

      {/* Buttons Row - Only show when session is active */}
      {isSessionActive && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {!isWalletConnected ? (
            <Wallet>
              <ConnectWallet
                text="CONNECT WALLET"
                className="bg-[#ff6b35] text-[#fffef0] font-bold border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_#1a1a1a] rounded-none px-6 py-2.5 h-auto min-h-0 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
              />
            </Wallet>
          ) : (
            <button
              onMouseDown={playButtonPress}
              onMouseUp={() => {
                if (!isAuthenticated || isFlipping) {
                  playButtonRelease();
                }
              }}
              onClick={() => {
                if (!isAuthenticated) {
                  console.log("Manual Sign In triggered");
                  // If we are already rejected, retry.
                  // If not, we can trigger requestAuth manually if it didn't auto-start
                  if (authRejected) {
                    retryAuth();
                  } else {
                    if (address) {
                      useGameStore.getState().requestAuth(address);
                    } else {
                      console.error("No address available for manual auth");
                    }
                  }
                } else {
                  playFlip();
                  flip();
                }
              }}
              disabled={isFlipping || !isConnected}
              style={{
                fontSize: "1rem",
                padding: "0.6rem 1.5rem",
                background:
                  isFlipping || !isConnected ? "#ccc" : "var(--color-primary)",
                flex: "1 1 auto",
                maxWidth: "200px",
              }}
            >
              {isFlipping
                ? "FLIPPING..."
                : !isConnected
                  ? "CONNECTING..."
                  : !isAuthenticated
                    ? "SIGN IN"
                    : "FLIP 🪙"}
            </button>
          )}
          <button
            onMouseDown={playButtonPress}
            onMouseUp={playButtonRelease}
            onClick={() => setShowBuyModal(true)}
            className="secondary"
            style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}
          >
            Buy Flips
          </button>
        </div>
      )}

      {showBuyModal && <BuyFlipsModal onClose={() => setShowBuyModal(false)} />}
      {/* {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )} */}
    </div>
  );
};
