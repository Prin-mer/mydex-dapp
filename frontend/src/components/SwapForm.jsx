import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { tokenList } from "../lib/tokens";
import { motion } from "framer-motion";

const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
];

export default function SwapForm() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [amountIn, setAmountIn] = useState("");
  const [tokenOut, setTokenOut] = useState(tokenList[1]); // default to CAKE
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    try {
      if (!walletClient || !amountIn) return;
      const router = {
        address: PANCAKESWAP_ROUTER,
        abi: routerAbi
      };

      const result = await walletClient.readContract({
        ...router,
        functionName: "getAmountsOut",
        args: [
          parseEther(amountIn),
          [tokenList[0].address, tokenOut.address]
        ]
      });

      const amountOut = result[1];
      setQuote(formatEther(amountOut));
    } catch (err) {
      setQuote(null);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [amountIn, tokenOut]);

  const handleSwap = async () => {
    if (!walletClient || !address) return;

    setLoading(true);
    setStatus("");
    setTxHash(null);

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;

      const tx = await walletClient.writeContract({
        address: PANCAKESWAP_ROUTER,
        abi: routerAbi,
        functionName: "swapExactETHForTokens",
        args: [
          0, // minimum output, slippage logic can go here
          [tokenList[0].address, tokenOut.address],
          address,
          deadline
        ],
        value: parseEther(amountIn)
      });

      setStatus("Swap submitted successfully.");
      setTxHash(tx);
    } catch (err) {
      setStatus("Swap failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg">
      <label className="block mb-1">Swap From:</label>
      <input
        type="number"
        className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
        placeholder="Enter BNB amount"
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value)}
      />

      <label className="block mb-1">Swap To:</label>
      <select
        value={tokenOut.symbol}
        onChange={(e) =>
          setTokenOut(tokenList.find(t => t.symbol === e.target.value))
        }
        className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
      >
        {tokenList.slice(1).map((token) => (
          <option key={token.symbol} value={token.symbol}>
            {token.symbol}
          </option>
        ))}
      </select>

      {quote && (
        <p className="text-green-400 mb-2">
          You’ll receive ≈ <b>{quote}</b> {tokenOut.symbol}
        </p>
      )}

      <button
        onClick={handleSwap}
        disabled={loading || !amountIn}
        className="bg-green-500 hover:bg-green-600 w-full py-2 rounded text-white"
      >
        {loading ? "Swapping..." : "Swap Now"}
      </button>

      {status && <p className="mt-3 text-yellow-400 text-sm">{status}</p>}

      {txHash && (
        <a
          className="text-blue-400 text-sm mt-2 inline-block"
          href={`https://bscscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction on BSCScan
        </a>
      )}
    </motion.div>
  );
}



 
