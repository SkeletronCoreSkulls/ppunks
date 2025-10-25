import { ethers } from "ethers";

export async function verifyPayment(txHash, CONFIG) {
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const tx = await provider.getTransactionReceipt(txHash);
  if (!tx || !tx.logs) return false;

  const USDC_IFACE = new ethers.Interface([
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]);

  for (const log of tx.logs) {
    try {
      const parsed = USDC_IFACE.parseLog(log);
      if (
        parsed.name === "Transfer" &&
        parsed.args.to.toLowerCase() === CONFIG.TREASURY.toLowerCase()
      ) {
        const amount = Number(ethers.formatUnits(parsed.args.value, 6));
        if (amount >= Number(CONFIG.PRICE_USDC)) return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}
