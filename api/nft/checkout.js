import { getConfig } from "../../lib/web3.js";

export default async function handler(req, res) {
  // CORS (por si x402 verifica desde otro origen)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const CONFIG = getConfig();

  // Si viene body, lo tomamos; si no, seguimos igual.
  let buyer;
  try {
    if (req.method === "POST" && req.body) {
      buyer = req.body.buyer;
    }
  } catch (_) {}

  // SIEMPRE devolver 402 para que x402scan lo reconozca como resource válido
  return res.status(402).json({
    x402: {
      paymentId: Math.random().toString(36).slice(2),
      amount: CONFIG.PRICE_USDC,          // "12.00"
      asset: "USDC",
      chain: CONFIG.NETWORK,              // "base"
      payTo: CONFIG.TREASURY,             // tu treasury
      description: `Mint 1 NFT via x402 for ${CONFIG.PRICE_USDC} USDC`,
      // opcional, solo si vino
      ...(buyer ? { buyer } : {})
    }
  });
}
