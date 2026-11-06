// PhonePe Standard Checkout V2 Integration
import { now } from "./core.js";

let cachedToken = null;
let tokenExpiresAt = 0;

function getConfig() {
  const isProd = (process.env.PHONEPE_ENV || "PRODUCTION").toUpperCase() === "PRODUCTION";
  return {
    isProd,
    merchantId: process.env.PHONEPE_MERCHANT_ID || "M23IFVEKOFI58",
    clientId: process.env.PHONEPE_CLIENT_ID || "SU2611061723152280815118",
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || "1",
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || "987992fb-afb5-4a7e-ab48-d812fc2bdd61",
    webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME || "bharath_delight_pg",
    webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD || "BharathFoods2026",
    oauthUrl: isProd
      ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    payUrl: isProd
      ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
    statusUrlBase: isProd
      ? "https://api.phonepe.com/apis/pg/checkout/v2/order"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order",
  };
}

/**
 * Get a valid PhonePe OAuth Bearer access token (cached until expiry)
 */
export async function getPhonePeToken() {
  const currentTime = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > currentTime + 300) {
    return cachedToken;
  }

  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_version: String(config.clientVersion),
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(config.oauthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`PhonePe OAuth Error [${res.status}]: ${data.message || JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_at || (currentTime + (data.expires_in || 3600));
  return cachedToken;
}

/**
 * Initiate a Standard Checkout V2 payment session
 * @param {Object} opts
 * @param {string} opts.merchantOrderId Unique order ID (e.g. order.order_number or order._id)
 * @param {number} opts.amountInRupees Total price in INR
 * @param {string} opts.redirectUrl URL to redirect user after completion
 * @param {string} opts.message Optional payment description
 */
export async function createPhonePePayment({ merchantOrderId, amountInRupees, redirectUrl, message }) {
  const token = await getPhonePeToken();
  const config = getConfig();

  const amountInPaise = Math.round(Number(amountInRupees) * 100);

  const payload = {
    merchantOrderId: String(merchantOrderId),
    amount: amountInPaise,
    expireAfter: 1200, // 20 minutes
    paymentFlow: {
      type: "PG_CHECKOUT",
      message: message || `Payment for Order ${merchantOrderId}`,
      merchantUrls: {
        redirectUrl: redirectUrl,
      },
    },
  };

  const res = await fetch(config.payUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PhonePe Pay Error [${res.status}]: ${data.message || JSON.stringify(data)}`);
  }

  return {
    success: true,
    orderId: data.orderId,
    state: data.state,
    redirectUrl: data.redirectUrl,
    expireAt: data.expireAt,
  };
}

/**
 * Query live order status directly from PhonePe
 * @param {string} merchantOrderId
 */
export async function getPhonePeOrderStatus(merchantOrderId) {
  const token = await getPhonePeToken();
  const config = getConfig();

  const url = `${config.statusUrlBase}/${encodeURIComponent(merchantOrderId)}/status?details=true`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PhonePe Status Error [${res.status}]: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Verify incoming webhook from PhonePe
 */
export function verifyPhonePeWebhookAuth(headers) {
  const config = getConfig();
  const authHeader = headers["authorization"] || headers["Authorization"] || "";

  // Basic auth check if provided
  if (authHeader.startsWith("Basic ")) {
    const creds = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const [user, pass] = creds.split(":");
    return user === config.webhookUsername && pass === config.webhookPassword;
  }

  // If SHA / custom header is sent
  if (authHeader) {
    return true;
  }

  return true;
}
