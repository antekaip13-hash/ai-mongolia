import { getRequestUser, isAdminRequest, publicUser } from "./_auth.js";
import { getStorageMode, listUsers, updateUserRole } from "./_store.js";

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

function normalizeRole(role) {
  return role === "admin" ? "admin" : "user";
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
    const users = await listUsers(100);
    res.status(200).json({
      ok: true,
      storageMode: getStorageMode(),
      users: users.map(publicUser)
    });
    return;
  }

  if (req.method === "PATCH") {
    const payload = await readBody(req);
    const email = String(payload.email || "").trim().toLowerCase();
    const role = normalizeRole(payload.role);
    const currentUser = await getRequestUser(req);
    const users = await listUsers(100);
    const adminCount = users.filter((user) => user.role === "admin").length;

    if (currentUser?.email === email && role !== "admin" && adminCount <= 1) {
      res.status(400).json({ error: "Сүүлчийн admin account-ыг user болгож болохгүй" });
      return;
    }

    const user = await updateUserRole(email, role);
    if (!user) {
      res.status(404).json({ error: "Account олдсонгүй" });
      return;
    }

    res.status(200).json({
      ok: true,
      user: publicUser(user)
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
