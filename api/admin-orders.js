import { isAdminRequest } from "./_auth.js";
import { getStorageMode, listOrders, publicOrder, updateOrderStatus } from "./_store.js";

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

function adminOrder(order) {
  return {
    ...order,
    publicStatus: publicOrder(order)
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
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
    const orders = await listOrders(100);
    res.status(200).json({
      ok: true,
      storageMode: getStorageMode(),
      orders: orders.map(adminOrder)
    });
    return;
  }

  if (req.method === "PATCH") {
    const payload = await readBody(req);
    const order = await updateOrderStatus(payload.orderId, payload.status);

    if (!order) {
      res.status(404).json({ error: "Захиалга олдсонгүй" });
      return;
    }

    res.status(200).json({
      ok: true,
      order: adminOrder(order)
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
