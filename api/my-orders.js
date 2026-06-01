import { getRequestUser } from "./_auth.js";
import { listOrders, publicOrder } from "./_store.js";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function belongsToUser(order, user) {
  const email = normalize(user?.email);
  if (!email) return false;

  return [
    order.accountEmail,
    order.customer?.email,
    order.customer?.phone
  ].some((value) => normalize(value) === email);
}

function userOrder(order) {
  return {
    orderId: order.orderId,
    status: order.status,
    publicStatus: publicOrder(order),
    total: order.total,
    items: order.items || [],
    payment: {
      provider: order.payment?.provider || "invoice",
      invoiceId: order.payment?.invoiceId || ""
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Account required" });
    return;
  }

  const orders = await listOrders(100);
  res.status(200).json({
    ok: true,
    orders: orders.filter((order) => belongsToUser(order, user)).map(userOrder)
  });
}
