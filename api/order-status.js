const statuses = [
  {
    key: "pending_payment",
    label: "Төлбөр хүлээгдэж байна",
    progress: 35
  },
  {
    key: "activation_queue",
    label: "Activation дараалалд орсон",
    progress: 68
  },
  {
    key: "ready",
    label: "Эрх бэлэн болсон",
    progress: 100
  }
];

function pickStatus(orderId) {
  const text = String(orderId || "");
  const sum = text.split("").reduce((value, char) => value + char.charCodeAt(0), 0);
  return statuses[sum % statuses.length];
}

export default function handler(req, res) {
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

  const status = pickStatus(orderId);

  res.status(200).json({
    ok: true,
    orderId,
    status: status.key,
    label: status.label,
    progress: status.progress,
    timeline: [
      { label: "Захиалга бүртгэгдсэн", done: true },
      { label: "Төлбөр шалгаж байна", done: status.progress >= 35 },
      { label: "Activation эхэлсэн", done: status.progress >= 68 },
      { label: "Delivery илгээгдсэн", done: status.progress >= 100 }
    ]
  });
};
