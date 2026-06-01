import { isAdminRequest } from "./_auth.js";
import { defaultProducts } from "./_products.js";
import {
  deleteProduct,
  deleteStockItem,
  getStorageMode,
  listProducts,
  listStockItems,
  saveStockItem,
  upsertProduct
} from "./_store.js";

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

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeProduct(payload) {
  const name = String(payload.name || "").trim();
  const id = slugify(payload.id || name);
  const benefits = Array.isArray(payload.benefits)
    ? payload.benefits
    : String(payload.benefits || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    id,
    name,
    category: String(payload.category || "AI Tools").trim(),
    price: Number(payload.price || 0),
    term: String(payload.term || "").trim(),
    description: String(payload.description || "").trim(),
    benefits,
    rating: String(payload.rating || "4.9").trim(),
    stock: String(payload.stock || "Идэвхжүүлэлт").trim(),
    color: String(payload.color || "linear-gradient(135deg, #14775c, #386f8e)").trim(),
    image: String(payload.image || "").trim()
  };
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

async function handleStock(req, res) {
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

  const url = new URL(req.url || "/api/admin-products", `https://${req.headers.host || "localhost"}`);
  if (url.searchParams.get("resource") === "stock") {
    await handleStock(req, res);
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      storageMode: getStorageMode(),
      products: await listProducts(defaultProducts)
    });
    return;
  }

  if (req.method === "POST" || req.method === "PATCH") {
    const product = normalizeProduct(await readBody(req));

    if (!product.id || !product.name) {
      res.status(400).json({ error: "Бүтээгдэхүүний нэр шаардлагатай" });
      return;
    }

    if (product.price < 0) {
      res.status(400).json({ error: "Үнэ буруу байна" });
      return;
    }

    res.status(200).json({
      ok: true,
      product: await upsertProduct(product, defaultProducts)
    });
    return;
  }

  if (req.method === "DELETE") {
    const payload = await readBody(req);
    const product = await deleteProduct(payload.id, defaultProducts);

    if (!product) {
      res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" });
      return;
    }

    res.status(200).json({
      ok: true,
      product
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
