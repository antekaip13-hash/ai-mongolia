import { buildTimeline, getOrder, getStatusMeta, publicOrder } from "./_store.js";

const statuses = ["pending_payment", "activation_queue", "ready"];

function pickStatus(orderId) {
  const text = String(orderId || "");
  const sum = text.split("").reduce((value, char) => value + char.charCodeAt(0), 0);
  return getStatusMeta(statuses[sum % statuses.length]);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const orderId = req.query.orderId || req.query.id;

  if (!orderId) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }

  const savedOrder = await getOrder(orderId);

  if (savedOrder) {
    res.status(200).json(publicOrder(savedOrder));
    return;
  }

  const status = pickStatus(orderId);

  res.status(200).json({
    ok: true,
    orderId,
    status: status.key,
    label: status.label,
    progress: status.progress,
    timeline: buildTimeline(status.key)
  });
};
