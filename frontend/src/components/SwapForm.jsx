import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { tokenList } from "../lib/tokens";
import { erc20Abi } from "../lib/erc20Abi";
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
  const [tokenIn, setTokenIn] = useState(tokenList[0]);
  const [tokenOut, setTokenOut] = useState(tokenList[1]);
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);

  const fetchQuote = async () => {
    if (!walletClient || !amountIn) return;
    try {
      const result = await walletClient.readContract({
        address: PANCAKESWAP_ROUTER,
        abi: routerAbi,
        functionName: "getAmountsOut",
        args: [parseEther(amountIn), [tokenIn.address, tokenOut.address]],
      });
      setQuote(formatEther(result[1]));
    } catch (err) {
      setQuote(null);
    }
  };

  const checkApproval = async () => {
    if (!walletClient || tokenIn.isNative) return;
    try {
      const allowance = await walletClient.readContract({
        address: tokenIn.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, PANCAKESWAP_ROUTER],
      });
      const amount = parseEther(amountIn || "0");
      setApprovalNeeded(BigInt(allowance) < amount);
    } catch (err) {
      setApprovalNeeded(false);
    }
  };

  useEffect(() => {
    fetchQuote();
    checkApproval();
  }, [amountIn, tokenIn, tokenOut]);

  const handleApprove = async () => {
    setLoading(true);
    setStatus("Approving...");
    try {
      const tx = await walletClient.writeContract({
        address: tokenIn.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [PANCAKESWAP_ROUTER, parseEther("100000")],
      });
      setStatus("Token approved.");
      setTxHash(tx);
      setApprovalNeeded(false);
    } catch (err) {
      setStatus("Approval failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!walletClient || !address) return;

    setLoading(true);
    setStatus("Processing swap...");
    setTxHash(null);

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;
      let tx;

      if (tokenIn.isNative) {
        tx = await walletClient.writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: routerAbi,
          functionName: "swapExactETHForTokens",
          args: [0, [tokenIn.address, tokenOut.address], address, deadline],
          value: parseEther(amountIn),
        });
      } else {
        tx = await walletClient.writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: routerAbi,
          functionName: "swapExactTokensForETH",
          args: [
            parseEther(amountIn),
            0,
            [tokenIn.address, tokenOut.address],
            address,
            deadline,
          ],
        });
      }

      setStatus("Swap complete!");
      setTxHash(tx);
    } catch (err) {
      setStatus("Swap failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 p-6 rounded-xl w-full max-w-md mx-auto shadow-lg"
    >
      <h2 className="text-white text-lg mb-4 font-semibold text-center">
        PancakeSwap Token Swap
      </h2>

      <div className="mb-3">
        <label className="text-sm text-gray-300">From:</label>
        <div className="flex items-center gap-2 my-1">
          <img src={tokenIn.logo} alt={tokenIn.symbol} className="w-6 h-6" />
          <span className="text-white font-medium">{tokenIn.symbol}</span>
        </div>
        <input
          type="number"
          className="w-full p-2 rounded bg-gray-800 text-white"
          placeholder="Amount"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />
      </div>

      <div className="mb-3 text-center">
        <button
          onClick={() => {
            const prev = tokenIn;
            setTokenIn(tokenOut);
            setTokenOut(prev);
            setQuote(null);
            setStatus("");
            setTxHash(null);
          }}
          className="text-sm bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600"
        >
          🔁 Swap Tokens
        </button>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-300">To:</label>
        <select
          value={tokenOut.symbol}
          onChange={(e) =>
            setTokenOut(tokenList.find((t) => t.symbol === e.target.value))
          }
          className="w-full p-2 rounded bg-gray-800 text-white"
        >
          {tokenList
            .filter((t) => t.symbol !== tokenIn.symbol)
            .map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
        </select>
      </div>

      {quote && (
        <p className="text-green-400 mb-3 text-sm text-center">
          ≈ {quote} {tokenOut.symbol}
        </p>
      )}

      {approvalNeeded && !tokenIn.isNative && (
        <button
          onClick={handleApprove}
          className="w-full py-2 mb-3 bg-yellow-500 hover:bg-yellow-600 rounded text-white"
        >
          {loading ? "Approving..." : `Approve ${tokenIn.symbol}`}
        </button>
      )}

      <button
        onClick={handleSwap}
        disabled={loading || !amountIn}
        className="bg-green-600 hover:bg-green-700 w-full py-2 rounded text-white"
      >
        {loading ? "Swapping..." : "Swap Now"}
      </button>

      {status && (
        <p className="mt-3 text-yellow-300 text-center text-sm">{status}</p>
      )}

      {txHash && (
        <a
          href={`https://bscscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 mt-2 block text-center text-sm"
        >
          View on BscScan
        </a>
      )}
    </motion.div>
  );
}
