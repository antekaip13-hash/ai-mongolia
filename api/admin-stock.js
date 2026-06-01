import { isAdminRequest } from "./_auth.js";
import { deleteStockItem, getStorageMode, listStockItems, saveStockItem } from "./_store.js";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizeStock(payload) {
  return {
    stockId: String(payload.stockId || "").trim(),
    productId: String(payload.productId || "").trim(),
    productName: String(payload.productName || "").trim(),
    login: String(payload.login || "").trim(),
    password: String(payload.password || "").trim(),
    note: String(payload.note || "").trim(),
    expiresAt: String(payload.expiresAt || "").trim(),
    status: ["available", "reserved", "delivered"].includes(payload.status) ? payload.status : "available",
    orderId: String(payload.orderId || "").trim()
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-pin, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!(await isAdminRequest(req))) {
    res.status(401).json({ error: "Admin эрх шаардлагатай" });
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      storageMode: getStorageMode(),
      stock: await listStockItems(300)
    });
    return;
  }

  if (req.method === "POST" || req.method === "PATCH") {
    const stock = normalizeStock(await readBody(req));

    if (!stock.productId || !stock.login || !stock.password) {
      res.status(400).json({ error: "Product, login, password шаардлагатай" });
      return;
    }

    res.status(200).json({
      ok: true,
      stock: await saveStockItem(stock)
    });
    return;
  }

  if (req.method === "DELETE") {
    const payload = await readBody(req);
    const stock = await deleteStockItem(payload.stockId);

    if (!stock) {
      res.status(404).json({ error: "Stock олдсонгүй" });
      return;
    }

    res.status(200).json({ ok: true, stock });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
