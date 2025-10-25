import { getConfig, getNft } from "../../lib/web3.js";
import { verifyPayment } from "../../utils/verifyPayment.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const CONFIG = getConfig();
  const nft = getNft();

  try {
    const { paymentId, txHash } = req.body || {};
    if (!paymentId || !txHash) return res.status(400).json({ error: "Missing paymentId or txHash" });

    const ok = await verifyPayment(txHash, CONFIG);
    if (!ok) return res.status(400).json({ error: "Payment not verified" });

    const tx = await nft.ownerMint(CONFIG.TREASURY, 1);
    await tx.wait();

    res.json({ ok: true, mintTx: tx.hash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

