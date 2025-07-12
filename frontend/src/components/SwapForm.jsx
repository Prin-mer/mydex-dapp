import { useState } from "react";
import axios from "axios";

export default function SwapForm() {
  const [fromToken, setFromToken] = useState("BNB");
  const [toToken, setToToken] = useState("CAKE");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState(null);

  const getQuote = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        `https://api.pancakeswap.info/api/v2/tokens`
      );
      const fromData = Object.values(response.data.data).find(token => token.symbol === fromToken);
      const toData = Object.values(response.data.data).find(token => token.symbol === toToken);

      if (!fromData || !toData) {
        setQuote("Token not found");
        return;
      }

      const price = (parseFloat(amount) * parseFloat(fromData.price)) / parseFloat(toData.price);
      setQuote(`${amount} ${fromToken} ≈ ${price.toFixed(4)} ${toToken}`);
    } catch (err) {
      console.error(err);
      setQuote("Error fetching quote.");
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">🔁 Swap Tokens</h2>
      <form onSubmit={getQuote} className="flex flex-col gap-4">
        <input type="text" value={fromToken} onChange={(e) => setFromToken(e.target.value.toUpperCase())} placeholder="From Token (e.g., BNB)" className="p-2 rounded" />
        <input type="text" value={toToken} onChange={(e) => setToToken(e.target.value.toUpperCase())} placeholder="To Token (e.g., CAKE)" className="p-2 rounded" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="p-2 rounded" />
        <button type="submit" className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Get Quote</button>
      </form>
      {quote && <p className="mt-4 text-center">{quote}</p>}
    </div>
  );
}