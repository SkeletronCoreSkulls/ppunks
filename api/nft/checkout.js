import { getConfig } from "../../../lib/web3.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const CONFIG = getConfig();
  const { buyer } = req.body || {};
  if (!buyer) return res.status(400).json({ error: "Missing buyer address" });

  const paymentId = Math.random().toString(36).slice(2);

  // x402 requires 402 response with payment details
  res.status(402).json({
    x402: {
      paymentId,
      amount: CONFIG.PRICE_USDC,
      asset: "USDC",
      chain: CONFIG.NETWORK,
      payTo: CONFIG.TREASURY,
      description: `Mint 1 NFT via x402 for ${CONFIG.PRICE_USDC} USDC`
    }
  });
}
