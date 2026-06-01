import { isAdminRequest } from "./_auth.js";
import { getStorageHealth } from "./_store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-pin, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!(await isAdminRequest(req))) {
    res.status(401).json({ error: "Admin эрх шаардлагатай" });
    return;
  }

  const health = getStorageHealth();
  const checks = [
    {
      key: "database",
      ok: health.hasDatabase,
      label: "Database storage",
      detail: health.hasDatabase ? "KV/Redis холбогдсон" : "KV_REST_API_URL болон KV_REST_API_TOKEN хэрэгтэй"
    },
    {
      key: "adminPin",
      ok: health.hasAdminPin,
      label: "Admin PIN",
      detail: health.hasAdminPin ? "PIN идэвхтэй" : "ADMIN_PIN env тохируулаагүй"
    },
    {
      key: "authSecret",
      ok: health.hasAuthSecret,
      label: "Auth secret",
      detail: health.hasAuthSecret ? "Session signing идэвхтэй" : "AUTH_SECRET env тохируулаагүй"
    }
  ];

  res.status(200).json({
    ok: true,
    ...health,
    checks,
    productionReady: checks.every((check) => check.ok)
  });
}
