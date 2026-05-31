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

const starterIdeas = [
  {
    title: "AI prompt багц",
    votes: 42,
    tag: "AI хэрэгсэл"
  },
  {
    title: "QPay автомат нэхэмжлэх",
    votes: 36,
    tag: "Төлбөр"
  },
  {
    title: "Сунгалтын сануулга",
    votes: 28,
    tag: "Автоматжуулалт"
  }
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ ok: true, ideas: starterIdeas });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    const title = String(payload.title || "").trim();
    const tag = String(payload.tag || "Community").trim();

    if (title.length < 3) {
      res.status(400).json({ error: "Idea title is too short" });
      return;
    }

    res.status(200).json({
      ok: true,
      idea: {
        title,
        tag,
        votes: 1,
        receivedAt: new Date().toISOString()
      },
      note: "Таны санал хүлээн авлаа."
    });
  } catch (error) {
    res.status(500).json({ error: "Could not save idea" });
  }
};
