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
  ideas: []
};
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
