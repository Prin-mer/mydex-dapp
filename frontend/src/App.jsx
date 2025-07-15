import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Web3Provider } from "./lib/web3";
import SwapForm from "./components/SwapForm";

function AppContent() {
  const { isConnected } = useAccount();
  const [dark, setDark] = useState(true);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">💱 MyDEX</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDark(!dark)}
              className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700"
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <ConnectButton />
          </div>
        </header>

        {isConnected ? (
          <SwapForm />
        ) : (
          <p className="text-center text-lg mt-12">
            🔐 Connect your wallet to swap tokens.
          </p>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
