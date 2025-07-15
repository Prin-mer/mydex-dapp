import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { tokenList } from "../lib/tokens";
import { motion } from "framer-motion";

const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

export default function SwapForm() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [amountIn, setAmountIn] = useState("");
  const [tokenIn, setTokenIn] = useState(tokenList[0]); // BNB
  const [tokenOut, setTokenOut] = useState(tokenList[1]); // CAKE
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    try {
      if (!walletClient || !amountIn) return;

      const result = await walletClient.readContract({
        address: PANCAKESWAP_ROUTER,
        abi: routerAbi,
        functionName: "getAmountsOut",
        args: [
          parseEther(amountIn),
          [tokenIn.address, tokenOut.address]
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
  }, [amountIn, tokenIn, tokenOut]);

  const handleSwap = async () => {
    if (!walletClient || !address) return;

    setLoading(true);
    setStatus("");
    setTxHash(null);

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;
      let hash;

      if (tokenIn.isNative) {
        // BNB → token (e.g., CAKE)
        hash = await walletClient.writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: routerAbi,
          functionName: "swapExactETHForTokens",
          args: [
            0, // minimum amount out
            [tokenIn.address, tokenOut.address],
            address,
            deadline
          ],
          value: parseEther(amountIn)
        });
      } else {
        // Token → BNB (optional extension — add approval before this)
        hash = await walletClient.writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: routerAbi,
          functionName: "swapExactTokensForETH",
          args: [
            parseEther(amountIn),
            0,
            [tokenIn.address, tokenOut.address],
            address,
            deadline
          ]
        });
      }

      setStatus("Swap sent successfully.");
      setTxHash(hash);
    } catch (err) {
      setStatus("Swap failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg"
    >
      <h2 className="text-white text-lg mb-3 font-semibold">Token Swap</h2>

      <label className="text-sm text-gray-300">Swap From:</label>
      <div className="flex items-center gap-2 mb-2">
        <img src={tokenIn.logo} alt={tokenIn.symbol} className="w-6 h-6" />
        <span className="text-white font-medium">{tokenIn.symbol}</span>
      </div>

      <input
        type="number"
        className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
        placeholder="Amount"
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value)}
      />

      <button
        onClick={() => {
          const prev = tokenIn;
          setTokenIn(tokenOut);
          setTokenOut(prev);
          setQuote(null);
        }}
        className="text-sm bg-gray-700 text-white px-3 py-1 rounded mb-3 hover:bg-gray-600"
      >
        🔁 Swap Tokens
      </button>

      <label className="text-sm text-gray-300">Swap To:</label>
      <div className="flex items-center gap-2 mb-2">
        <img src={tokenOut.logo} alt={tokenOut.symbol} className="w-6 h-6" />
        <span className="text-white font-medium">{tokenOut.symbol}</span>
      </div>

      <select
        value={tokenOut.symbol}
        onChange={(e) =>
          setTokenOut(tokenList.find((t) => t.symbol === e.target.value))
        }
        className="w-full p-2 rounded bg-gray-800 text-white mb-4"
      >
        {tokenList
          .filter((t) => t.symbol !== tokenIn.symbol)
          .map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol}
            </option>
          ))}
      </select>

      {quote && (
        <p className="text-green-400 mb-3">
          ≈ {quote} {tokenOut.symbol}
        </p>
      )}

      <button
        onClick={handleSwap}
        disabled={loading || !amountIn}
        className="bg-green-500 hover:bg-green-600 w-full py-2 rounded text-white"
      >
        {loading ? "Swapping..." : "Swap Now"}
      </button>

      {status && <p className="mt-3 text-yellow-300 text-sm">{status}</p>}

      {txHash && (
        <a
          href={`https://bscscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 mt-2 inline-block text-sm"
        >
          View on BscScan
        </a>
      )}
    </motion.div>
  );
}
