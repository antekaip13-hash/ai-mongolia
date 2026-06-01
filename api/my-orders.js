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

function canViewDelivery(order, user) {
  const email = normalize(user?.email);
  return [order.accountEmail, order.customer?.email].some((value) => normalize(value) === email);
}

function userDelivery(order, user) {
  if (order.status !== "ready" || order.delivery?.status !== "delivered" || !canViewDelivery(order, user)) {
    return {
      status: order.delivery?.status || "pending",
      items: []
    };
  }

  return {
    status: "delivered",
    deliveredAt: order.delivery.deliveredAt || "",
    items: (order.delivery.items || []).map((item) => ({
      productName: item.productName,
      login: item.login,
      password: item.password,
      note: item.note || "",
      expiresAt: item.expiresAt || ""
    }))
  };
}

function userOrder(order, user) {
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
    delivery: userDelivery(order, user),
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
    orders: orders.filter((order) => belongsToUser(order, user)).map((order) => userOrder(order, user))
  });
}
