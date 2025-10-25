// /api/nft/checkout.js
import { getConfig } from "../../lib/web3.js";

function baseUrl(req) {
  const envUrl = process.env.BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "https").toString();
  const host = (req.headers.host || "").toString();
  return `${proto}://${host}`;
}

function buildResponse(req, CONFIG, buyer) {
  const resourceUrl = `${baseUrl(req)}/api/nft/notify`;
  return {
    x402Version: 1,
    payer: buyer || undefined,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: CONFIG.PRICE_USDC,       // "12.00"
        resource: resourceUrl,                      // dónde x402 hará POST tras el pago
        description: `Mint 1 NFT via x402 for ${CONFIG.PRICE_USDC} USDC`,
        mimeType: "application/json",
        payTo: CONFIG.TREASURY,
        maxTimeoutSeconds: 300,                      // ≤ 300 para ser conservadores
        asset: "USDC",
        outputSchema: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            bodyFields: {
              paymentId: { type: "string", required: true, description: "Payment ID from /checkout" },
              txHash:    { type: "string", required: true, description: "USDC tx hash on Base to treasury" }
            },
            headerFields: {
              "Content-Type": { type: "string", enum: ["application/json"] }
            }
          },
          output: {
            ok: { type: "boolean" },
            mintTx: { type: "string", description: "NFT mint transaction hash" },
            error: { type: "string" }
          }
        },
        extra: {
          collection: "x402punks",
          contract: CONFIG.NFT_CONTRACT
        }
      }
    ]
  };
}

export default async function handler(req, res) {
  // CORS y caching off
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const CONFIG = getConfig();

  // buyer es opcional (X402Scan puede no mandarlo)
  let buyer;
  try {
    if (req.method === "POST" && req.body && typeof req.body === "object") {
      buyer = req.body.buyer;
    }
  } catch { /* ignore */ }

  // MUY IMPORTANTE: responder SIEMPRE 402 en GET/HEAD/POST
  const payload = buildResponse(req, CONFIG, buyer);
  return res.status(402).json(payload);
}
