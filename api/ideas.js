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
    title: "AI Prompt Store",
    votes: 42,
    tag: "AI Tools"
  },
  {
    title: "QPay Auto Invoice",
    votes: 36,
    tag: "Payment"
  },
  {
    title: "Renewal Reminder Bot",
    votes: 28,
    tag: "Automation"
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
      note: "Demo API accepted the idea. Connect a database to persist community submissions."
    });
  } catch (error) {
    res.status(500).json({ error: "Could not save idea" });
  }
};
