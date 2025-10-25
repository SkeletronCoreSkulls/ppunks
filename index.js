import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import { CONFIG } from "./config.js";
import { verifyPayment } from "./utils/verifyPayment.js";
import nftABI from "./abi/X402punks.json" assert { type: "json" };

console.log("🔑 Loaded key:", CONFIG.PRIVATE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);
console.log("💼 Wallet address:", await wallet.getAddress());
const nft = new ethers.Contract(CONFIG.NFT_CONTRACT, nftABI, wallet);

app.post("/api/nft/checkout", async (req, res) => {
  const { buyer } = req.body;
  if (!buyer) return res.status(400).json({ error: "Missing buyer address" });

  const paymentId = Math.random().toString(36).substring(2);
  return res.status(402).json({
    x402: {
      paymentId,
      amount: CONFIG.PRICE_USDC,
      asset: "USDC",
      chain: CONFIG.NETWORK,
      payTo: CONFIG.TREASURY,
      description: `Mint 1 Punk NFT via x402 for ${CONFIG.PRICE_USDC} USDC`
    }
  });
});

app.post("/api/nft/notify", async (req, res) => {
  const { paymentId, txHash } = req.body;
  if (!paymentId || !txHash)
    return res.status(400).json({ error: "Missing paymentId or txHash" });

  try {
    const verified = await verifyPayment(txHash, CONFIG);
    if (!verified) return res.status(400).json({ error: "Payment not verified" });

    const tx = await nft.ownerMint(CONFIG.TREASURY, 1);
    await tx.wait();
    return res.json({ ok: true, mintTx: tx.hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ x402 backend running on port 3000"));
