import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { motion } from "framer-motion";

const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";

export default function SwapForm() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const handleSwap = async () => {
    if (!walletClient || !address) {
      setStatus("Wallet not connected");
      return;
    }

    try {
      const amountIn = parseEther(amount); // BNB
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min
      const routerAbi = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
      ];

      const hash = await walletClient.writeContract({
        address: PANCAKESWAP_ROUTER,
        abi: routerAbi,
        functionName: "swapExactETHForTokens",
        args: [
          0, // amountOutMin (use quote for slippage in prod)
          ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", CAKE_TOKEN],
          address,
          deadline
        ],
        value: amountIn,
      });

      setStatus(`Tx sent: ${hash}`);
    } catch (err) {
      console.error(err);
      setStatus("Swap failed: " + err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md">
      <label className="block mb-2">Enter BNB Amount:</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 rounded bg-gray-900 text-white mb-4"
        placeholder="e.g. 0.1"
      />
      <button onClick={handleSwap} className="bg-green-500 hover:bg-green-600 text-white w-full py-2 rounded">
        Swap BNB → CAKE
      </button>
      {status && <p className="mt-3 text-sm text-yellow-400">{status}</p>}
    </motion.div>
  );
}
