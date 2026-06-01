const env = globalThis.process?.env || {};
const redisUrl = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || "";
const redisToken = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || "";
const hasRedis = Boolean(redisUrl && redisToken);

const statusMap = {
  pending_payment: {
    key: "pending_payment",
    label: "Төлбөр хүлээгдэж байна",
    progress: 35
  },
  activation_queue: {
    key: "activation_queue",
    label: "Эрх идэвхжүүлэх дараалалд орсон",
    progress: 68
  },
  ready: {
    key: "ready",
    label: "Эрх бэлэн болсон",
    progress: 100
  },
  cancelled: {
    key: "cancelled",
    label: "Захиалга цуцлагдсан",
    progress: 0
  }
};

const memory = globalThis.__aiMongoliaStore || {
  orders: new Map(),
  orderIds: [],
  ideas: [],
  products: null,
  stock: new Map(),
  stockIds: [],
  users: new Map(),
  userEmails: [],
  sessions: new Map()
};
memory.orders ||= new Map();
memory.orderIds ||= [];
memory.ideas ||= [];
memory.products ||= null;
memory.stock ||= new Map();
memory.stockIds ||= [];
memory.users ||= new Map();
memory.userEmails ||= [];
memory.sessions ||= new Map();
globalThis.__aiMongoliaStore = memory;

async function redisCommand(command) {
  if (!hasRedis) return null;

  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Storage command failed: ${response.status}`);
  }

  return response.json();
}

export function getStorageMode() {
  return hasRedis ? "redis" : "memory";
}

export function getStorageHealth() {
  return {
    storageMode: getStorageMode(),
    hasDatabase: hasRedis,
    hasAdminPin: Boolean(env.ADMIN_PIN),
    hasAuthSecret: Boolean(env.AUTH_SECRET),
    hasKvUrl: Boolean(redisUrl),
    hasKvToken: Boolean(redisToken)
  };
}

export function getStatusMeta(statusKey) {
  return statusMap[statusKey] || statusMap.pending_payment;
}

export function buildTimeline(statusKey) {
  const status = getStatusMeta(statusKey);

  return [
    { label: "Захиалга бүртгэгдсэн", done: status.progress >= 1 },
    { label: "Төлбөр шалгаж байна", done: status.progress >= 35 },
    { label: "Эрх идэвхжүүлэлт эхэлсэн", done: status.progress >= 68 },
    { label: "Эрхийн мэдээлэл илгээгдсэн", done: status.progress >= 100 }
  ];
}

export function publicOrder(order) {
  const status = getStatusMeta(order.status);

  return {
    ok: true,
    orderId: order.orderId,
    status: status.key,
    label: status.label,
    progress: status.progress,
    timeline: buildTimeline(status.key)
  };
}

export async function saveOrder(order) {
  const nextOrder = {
    ...order,
    updatedAt: new Date().toISOString()
  };

  if (hasRedis) {
    await redisCommand(["SET", `order:${nextOrder.orderId}`, JSON.stringify(nextOrder)]);
    await redisCommand(["LPUSH", "orders:index", nextOrder.orderId]);
    return nextOrder;
  }

  memory.orders.set(nextOrder.orderId, nextOrder);
  memory.orderIds = [nextOrder.orderId, ...memory.orderIds.filter((id) => id !== nextOrder.orderId)];
  return nextOrder;
}

export async function getOrder(orderId) {
  if (!orderId) return null;

  if (hasRedis) {
    const data = await redisCommand(["GET", `order:${orderId}`]);
    return data?.result ? JSON.parse(data.result) : null;
  }

  return memory.orders.get(orderId) || null;
}

export async function listOrders(limit = 50) {
  if (hasRedis) {
    const index = await redisCommand(["LRANGE", "orders:index", 0, Math.max(0, limit - 1)]);
    const ids = Array.isArray(index?.result) ? [...new Set(index.result)] : [];
    const orders = await Promise.all(ids.map((id) => getOrder(id)));
    return orders.filter(Boolean);
  }

  return memory.orderIds.slice(0, limit).map((id) => memory.orders.get(id)).filter(Boolean);
}

export async function updateOrderStatus(orderId, statusKey) {
  const order = await getOrder(orderId);
  if (!order) return null;

  const status = getStatusMeta(statusKey);
  return saveOrder({
    ...order,
    status: status.key
  });
}

export async function listStockItems(limit = 200) {
  if (hasRedis) {
    const index = await redisCommand(["LRANGE", "stock:index", 0, Math.max(0, limit - 1)]);
    const ids = Array.isArray(index?.result) ? [...new Set(index.result)] : [];
    const items = await Promise.all(ids.map((id) => getStockItem(id)));
    return items.filter(Boolean);
  }

  return memory.stockIds.slice(0, limit).map((id) => memory.stock.get(id)).filter(Boolean);
}

export async function getStockItem(stockId) {
  const id = String(stockId || "").trim();
  if (!id) return null;

  if (hasRedis) {
    const data = await redisCommand(["GET", `stock:${id}`]);
    return data?.result ? JSON.parse(data.result) : null;
  }

  return memory.stock.get(id) || null;
}

export async function saveStockItem(item) {
  const stockId = String(item.stockId || "").trim() || `STK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const existing = await getStockItem(stockId);
  const nextItem = {
    ...item,
    stockId,
    status: item.status || "available",
    updatedAt: new Date().toISOString(),
    createdAt: item.createdAt || existing?.createdAt || new Date().toISOString()
  };

  if (hasRedis) {
    await redisCommand(["SET", `stock:${stockId}`, JSON.stringify(nextItem)]);
    if (!existing) await redisCommand(["LPUSH", "stock:index", stockId]);
    return nextItem;
  }

  if (!memory.stock.has(stockId)) {
    memory.stockIds = [stockId, ...memory.stockIds];
  }
  memory.stock.set(stockId, nextItem);
  return nextItem;
}

export async function deleteStockItem(stockId) {
  const item = await getStockItem(stockId);
  if (!item) return null;

  if (hasRedis) {
    await redisCommand(["DEL", `stock:${item.stockId}`]);
    return item;
  }

  memory.stock.delete(item.stockId);
  memory.stockIds = memory.stockIds.filter((id) => id !== item.stockId);
  return item;
}

export async function confirmPaymentAndAssignStock(orderId) {
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status === "cancelled") return order;
  if (order.delivery?.status === "delivered") {
    return saveOrder({
      ...order,
      status: "ready",
      payment: {
        ...(order.payment || {}),
        confirmedAt: order.payment?.confirmedAt || new Date().toISOString()
      }
    });
  }

  const required = [];
  (order.items || []).forEach((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    for (let index = 0; index < quantity; index += 1) {
      required.push(item);
    }
  });

  const stockItems = await listStockItems(500);
  const chosen = [];
  const used = new Set();

  for (const item of required) {
    const stock = stockItems.find((candidate) => (
      candidate.status === "available"
      && candidate.productId === item.id
      && !used.has(candidate.stockId)
    ));

    if (!stock) {
      return saveOrder({
        ...order,
        status: "activation_queue",
        payment: {
          ...(order.payment || {}),
          confirmedAt: order.payment?.confirmedAt || new Date().toISOString()
        },
        delivery: {
          status: "waiting_stock",
          message: "Stock хүрэлцээгүй тул эрх гараар оноох шаардлагатай.",
          items: order.delivery?.items || []
        }
      });
    }

    used.add(stock.stockId);
    chosen.push({ stock, orderItem: item });
  }

  const assignedAt = new Date().toISOString();
  await Promise.all(chosen.map(({ stock }) => saveStockItem({
    ...stock,
    status: "delivered",
    orderId: order.orderId,
    assignedAt
  })));

  return saveOrder({
    ...order,
    status: "ready",
    payment: {
      ...(order.payment || {}),
      confirmedAt: order.payment?.confirmedAt || assignedAt
    },
    delivery: {
      status: "delivered",
      deliveredAt: assignedAt,
      items: chosen.map(({ stock, orderItem }) => ({
        stockId: stock.stockId,
        productId: stock.productId,
        productName: stock.productName || orderItem.name,
        login: stock.login,
        password: stock.password,
        note: stock.note || "",
        expiresAt: stock.expiresAt || "",
        assignedAt
      }))
    }
  });
}

export async function listIdeas(starterIdeas) {
  if (hasRedis) {
    const data = await redisCommand(["LRANGE", "ideas:index", 0, 99]);
    const savedIdeas = Array.isArray(data?.result) ? data.result.map((item) => JSON.parse(item)) : [];
    return savedIdeas.length ? savedIdeas : starterIdeas;
  }

  return memory.ideas.length ? memory.ideas : starterIdeas;
}

export async function addIdea(idea) {
  const nextIdea = {
    ...idea,
    receivedAt: new Date().toISOString()
  };

  if (hasRedis) {
    await redisCommand(["LPUSH", "ideas:index", JSON.stringify(nextIdea)]);
    return nextIdea;
  }

  memory.ideas = [nextIdea, ...memory.ideas];
  return nextIdea;
}

export async function listProducts(defaultProducts) {
  if (hasRedis) {
    const data = await redisCommand(["GET", "products:catalog"]);
    return data?.result ? JSON.parse(data.result) : defaultProducts;
  }

  return memory.products || defaultProducts;
}

export async function saveProducts(products) {
  const normalized = products.map((product) => ({
    ...product,
    price: Number(product.price || 0),
    benefits: Array.isArray(product.benefits) ? product.benefits : [],
    updatedAt: new Date().toISOString()
  }));

  if (hasRedis) {
    await redisCommand(["SET", "products:catalog", JSON.stringify(normalized)]);
    return normalized;
  }

  memory.products = normalized;
  return normalized;
}

export async function upsertProduct(product, defaultProducts) {
  const products = await listProducts(defaultProducts);
  const exists = products.some((item) => item.id === product.id);
  const nextProducts = exists
    ? products.map((item) => item.id === product.id ? { ...item, ...product } : item)
    : [{ ...product, createdAt: new Date().toISOString() }, ...products];

  await saveProducts(nextProducts);
  return nextProducts.find((item) => item.id === product.id);
}

export async function deleteProduct(productId, defaultProducts) {
  const id = String(productId || "").trim();
  if (!id) return null;

  const products = await listProducts(defaultProducts);
  const product = products.find((item) => item.id === id);
  if (!product) return null;

  await saveProducts(products.filter((item) => item.id !== id));
  return product;
}

export async function countUsers() {
  if (hasRedis) {
    const data = await redisCommand(["LLEN", "users:index"]);
    return Number(data?.result || 0);
  }

  return memory.userEmails.length;
}

export async function listUsers(limit = 100) {
  if (hasRedis) {
    const data = await redisCommand(["LRANGE", "users:index", 0, Math.max(0, limit - 1)]);
    const emails = Array.isArray(data?.result) ? [...new Set(data.result)] : [];
    const users = await Promise.all(emails.map((email) => getUserByEmail(email)));
    return users.filter(Boolean);
  }

  return memory.userEmails.slice(0, limit).map((email) => memory.users.get(email)).filter(Boolean);
}

export async function getUserByEmail(email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return null;

  if (hasRedis) {
    const data = await redisCommand(["GET", `user:${key}`]);
    return data?.result ? JSON.parse(data.result) : null;
  }

  return memory.users.get(key) || null;
}

export async function saveUser(user) {
  const email = String(user.email || "").trim().toLowerCase();
  const nextUser = {
    ...user,
    email,
    updatedAt: new Date().toISOString()
  };

  if (hasRedis) {
    const exists = await getUserByEmail(email);
    await redisCommand(["SET", `user:${email}`, JSON.stringify(nextUser)]);
    if (!exists) await redisCommand(["LPUSH", "users:index", email]);
    return nextUser;
  }

  if (!memory.users.has(email)) memory.userEmails = [email, ...memory.userEmails];
  memory.users.set(email, nextUser);
  return nextUser;
}

export async function updateUserRole(email, role) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  return saveUser({
    ...user,
    role
  });
}

export async function createSession(token, email) {
  const session = {
    token,
    email: String(email || "").trim().toLowerCase(),
    createdAt: new Date().toISOString()
  };

  if (hasRedis) {
    await redisCommand(["SET", `session:${token}`, JSON.stringify(session)]);
    return session;
  }

  memory.sessions.set(token, session);
  return session;
}

export async function getSessionUser(token) {
  if (!token) return null;

  if (hasRedis) {
    const data = await redisCommand(["GET", `session:${token}`]);
    if (!data?.result) return null;
    const session = JSON.parse(data.result);
    return getUserByEmail(session.email);
  }

  const session = memory.sessions.get(token);
  return session ? getUserByEmail(session.email) : null;
}
