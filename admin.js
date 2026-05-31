const adminForm = document.querySelector("[data-admin-form]");
const ordersEl = document.querySelector("[data-admin-orders]");
const countEl = document.querySelector("[data-admin-count]");
const storageModeEl = document.querySelector("[data-storage-mode]");
const updatedEl = document.querySelector("[data-admin-updated]");
const messageEl = document.querySelector("[data-admin-message]");
const warningEl = document.querySelector("[data-admin-warning]");
const formatter = new Intl.NumberFormat("mn-MN");

function money(value) {
  return `${formatter.format(Number(value || 0))}₮`;
}

function getPin() {
  return adminForm.elements.pin.value.trim() || window.localStorage.getItem("ai-mongolia-admin-pin") || "";
}

function savePin(pin) {
  if (pin) window.localStorage.setItem("ai-mongolia-admin-pin", pin);
}

async function adminFetch(url, options = {}) {
  const pin = getPin();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(pin ? { "x-admin-pin": pin } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Admin request failed");
  }

  return data;
}

function renderOrder(order) {
  const items = (order.items || []).map((item) => `${item.name} x ${item.quantity}`).join(", ");
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("mn-MN") : "-";
  const status = order.publicStatus || {};

  return `
    <article class="admin-order-card">
      <div class="admin-order-top">
        <div>
          <span class="status-pill">${status.label || order.status}</span>
          <h3>${order.orderId}</h3>
          <p>${createdAt}</p>
        </div>
        <strong>${money(order.total)}</strong>
      </div>
      <div class="admin-order-details">
        <span>Хэрэглэгч: <strong>${order.customer?.name || "-"}</strong></span>
        <span>Холбоо: <strong>${order.customer?.phone || "-"}</strong></span>
        <span>Бараа: <strong>${items || "-"}</strong></span>
      </div>
      <div class="admin-order-actions">
        <select data-status-select="${order.orderId}" aria-label="${order.orderId} төлөв солих">
          <option value="pending_payment" ${order.status === "pending_payment" ? "selected" : ""}>Төлбөр хүлээгдэж байна</option>
          <option value="activation_queue" ${order.status === "activation_queue" ? "selected" : ""}>Эрх идэвхжүүлэх дараалал</option>
          <option value="ready" ${order.status === "ready" ? "selected" : ""}>Эрх бэлэн болсон</option>
          <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Цуцлагдсан</option>
        </select>
        <button class="secondary-action" type="button" data-update-status="${order.orderId}">Төлөв хадгалах</button>
      </div>
    </article>
  `;
}

function renderOrders(data) {
  const orders = data.orders || [];
  countEl.textContent = orders.length;
  storageModeEl.textContent = data.storageMode === "redis" ? "Database холбогдсон" : "Түр хадгалалт";
  warningEl.hidden = data.storageMode === "redis";
  updatedEl.textContent = new Date().toLocaleTimeString("mn-MN");
  messageEl.textContent = orders.length
    ? "Захиалгын жагсаалт шинэчлэгдлээ."
    : "Одоогоор захиалга бүртгэгдээгүй байна.";
  ordersEl.innerHTML = orders.length
    ? orders.map(renderOrder).join("")
    : '<p class="cart-note">Шинэ захиалга орж ирэхэд энд харагдана.</p>';
}

async function loadOrders() {
  const pin = adminForm.elements.pin.value.trim();
  savePin(pin);
  messageEl.textContent = "Захиалгын мэдээлэл уншиж байна...";
  const data = await adminFetch("/api/admin-orders");
  renderOrders(data);
}

async function updateStatus(orderId) {
  const select = document.querySelector(`[data-status-select="${orderId}"]`);
  await adminFetch("/api/admin-orders", {
    method: "PATCH",
    body: JSON.stringify({
      orderId,
      status: select.value
    })
  });
  await loadOrders();
}

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadOrders().catch((error) => {
    messageEl.textContent = error.message;
  });
});

ordersEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-update-status]");
  if (!button) return;
  updateStatus(button.dataset.updateStatus).catch((error) => {
    messageEl.textContent = error.message;
  });
});

loadOrders().catch((error) => {
  messageEl.textContent = error.message;
});
