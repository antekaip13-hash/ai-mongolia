import { getRequestUser } from "./_auth.js";
import { saveOrder } from "./_store.js";

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

function makeOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AIM-${stamp}-${random}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    const items = Array.isArray(payload.items) ? payload.items : [];
    const customer = payload.customer || {};
    const user = await getRequestUser(req);
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

    if (!items.length) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    if (!customer.name || !customer.phone) {
      res.status(400).json({ error: "Customer name and contact are required" });
      return;
    }

    const orderId = makeOrderId();
    const order = await saveOrder({
      orderId,
      status: "pending_payment",
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: user?.email || customer.email || "",
        note: customer.note || ""
      },
      accountEmail: user?.email || "",
      items,
      total,
      payment: {
        provider: "invoice",
        invoiceId: `INV-${orderId}`,
        qrText: `invoice://order/${orderId}`,
        expiresInMinutes: 15
      },
      createdAt: new Date().toISOString()
    });

    res.status(200).json({
      ok: true,
      orderId: order.orderId,
      status: order.status,
      total: order.total,
      payment: order.payment,
      nextSteps: [
        "Төлбөрийн нэхэмжлэх үүссэн",
        "Төлбөр баталгаажмагц эрх идэвхжүүлэлт эхэлнэ",
        "Эрхийн мэдээлэл таны холбоо барих хаяг руу илгээгдэнэ"
      ]
    });
  } catch (error) {
    res.status(500).json({ error: "Could not create order" });
  }
};
