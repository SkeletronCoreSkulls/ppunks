// /api/nft/checkout.js
import { getConfig } from "../../lib/web3.js";

function baseUrl(req) {
  // si seteas BASE_URL en Vercel, la usamos; si no, construimos desde headers
  const envUrl = process.env.BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "https").toString();
  const host = (req.headers.host || "").toString();
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const CONFIG = getConfig();
  const buyer = (req.body && req.body.buyer) ? String(req.body.buyer) : undefined;
  const paymentId = Math.random().toString(36).slice(2);
  const resourceUrl = `${baseUrl(req)}/api/nft/notify`; // endpoint que x402 llamará tras el pago

  // IMPORTANTE: status 402
  return res.status(402).json({
    x402Version: 1,
    payer: buyer, // opcional
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: CONFIG.PRICE_USDC,   // "12.00"
        resource: resourceUrl,                  // URL absoluta del notify
        description: `Mint 1 NFT via x402 for ${CONFIG.PRICE_USDC} USDC`,
        mimeType: "application/json",
        payTo: CONFIG.TREASURY,                 // treasury USDC
        maxTimeoutSeconds: 900,                 // 15 min
        asset: "USDC",

        // Describe cómo x402 llamará a tu /notify
        outputSchema: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            bodyFields: {
              paymentId: { type: "string", required: true, description: "Payment identifier returned by /checkout" },
              txHash:    { type: "string", required: true, description: "USDC transfer tx hash on Base to the treasury" }
            },
            headerFields: {
              "Content-Type": { type: "string", enum: ["application/json"] }
            }
          },
          // Qué puede devolver tu /notify
          output: {
            ok: { type: "boolean" },
            mintTx: { type: "string", description: "NFT mint transaction hash" },
            error: { type: "string" }
          }
        },

        // Extra opcional que X402 puede ignorar, pero útil para tu UI
        extra: {
          collection: "x402punks",
          contract: CONFIG.NFT_CONTRACT
        }
      }
    ]
  });
}
