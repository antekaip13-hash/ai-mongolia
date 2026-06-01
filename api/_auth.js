import crypto from "node:crypto";
import { countUsers, createSession, getSessionUser, getUserByEmail, saveUser } from "./_store.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPassword(password, user) {
  if (!user?.passwordSalt || !user?.passwordHash) return false;
  const { hash } = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"));
}

export function publicUser(user) {
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    canAdmin: user.role === "admin"
  };
}

export async function registerAccount(payload) {
  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  if (!name || !email || password.length < 6) {
    throw new Error("Нэр, email болон 6+ тэмдэгттэй нууц үг шаардлагатай");
  }

  if (await getUserByEmail(email)) {
    throw new Error("Энэ email дээр account бүртгэлтэй байна");
  }

  const { salt, hash } = hashPassword(password);
  const role = await countUsers() === 0 ? "admin" : "user";
  const user = await saveUser({
    name,
    email,
    role,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  });
  const token = crypto.randomBytes(32).toString("hex");
  await createSession(token, email);

  return { token, user: publicUser(user) };
}

export async function loginAccount(payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const user = await getUserByEmail(email);

  if (!user || !verifyPassword(password, user)) {
    throw new Error("Email эсвэл нууц үг буруу байна");
  }

  const token = crypto.randomBytes(32).toString("hex");
  await createSession(token, email);

  return { token, user: publicUser(user) };
}

export function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const value = Array.isArray(header) ? header[0] : header;
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function getRequestUser(req) {
  return getSessionUser(getBearerToken(req));
}

export async function isAdminRequest(req) {
  const pin = globalThis.process?.env?.ADMIN_PIN || "";
  if (pin && req.headers?.["x-admin-pin"] === pin) return true;
  const user = await getRequestUser(req);
  return user?.role === "admin";
}
