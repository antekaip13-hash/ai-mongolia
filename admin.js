const adminForm = document.querySelector("[data-admin-form]");
const ordersEl = document.querySelector("[data-admin-orders]");
const countEl = document.querySelector("[data-admin-count]");
const pendingEl = document.querySelector("[data-admin-pending]");
const readyEl = document.querySelector("[data-admin-ready]");
const revenueEl = document.querySelector("[data-admin-revenue]");
const messageEl = document.querySelector("[data-admin-message]");
const warningEl = document.querySelector("[data-admin-warning]");
const orderSearchInput = document.querySelector("[data-order-search]");
const orderStatusFilter = document.querySelector("[data-order-status-filter]");
const productForm = document.querySelector("[data-product-form]");
const productsEl = document.querySelector("[data-admin-products]");
const productMessageEl = document.querySelector("[data-product-message]");
const productResetBtn = document.querySelector("[data-product-reset]");
const productDeleteBtn = document.querySelector("[data-product-delete]");
const stockForm = document.querySelector("[data-stock-form]");
const stockProductSelect = document.querySelector("[data-stock-product]");
const stockResetBtn = document.querySelector("[data-stock-reset]");
const stockDeleteBtn = document.querySelector("[data-stock-delete]");
const stockMessageEl = document.querySelector("[data-stock-message]");
const stockOverviewEl = document.querySelector("[data-stock-overview]");
const stockEl = document.querySelector("[data-admin-stock]");
const usersEl = document.querySelector("[data-admin-users]");
const userMessageEl = document.querySelector("[data-user-message]");
const setupChecksEl = document.querySelector("[data-setup-checks]");
const setupMessageEl = document.querySelector("[data-setup-message]");
const formatter = new Intl.NumberFormat("mn-MN");
let adminOrders = [];
let adminProducts = [];
let adminStock = [];
let adminUsers = [];

function money(value) {
  return `${formatter.format(Number(value || 0))}₮`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeProductColor(value) {
  const color = String(value || "").trim();
  if (color.startsWith("linear-gradient(") || color.startsWith("radial-gradient(")) return color;
  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  return "linear-gradient(135deg, #14775c, #386f8e)";
}

function getPin() {
  return adminForm.elements.pin.value.trim() || window.localStorage.getItem("ai-mongolia-admin-pin") || "";
}

function getAuthToken() {
  try {
    return JSON.parse(window.localStorage.getItem("ai-mongolia-auth") || "null")?.token || "";
  } catch {
    return "";
  }
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
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(data.error || "Admin эрхээр нэвтэрнэ үү эсвэл Admin PIN оруулна уу.");
    }
    if (response.status === 404) {
      throw new Error("Local preview дээр API ажиллахгүй байна. Vercel live deploy эсвэл vercel dev ашиглаж шалгана уу.");
    }
    throw new Error(data.error || "Admin request failed");
  }

  return data;
}

function renderSetup(data) {
  const checks = data.checks || [];
  setupMessageEl.textContent = data.productionReady
    ? "Production тохиргоо бүрэн байна."
    : "Доорх тохиргоонуудыг Vercel Environment Variables дээр гүйцээх хэрэгтэй.";
  setupChecksEl.innerHTML = checks.map((check) => `
    <article class="setup-card ${check.ok ? "is-ok" : "is-missing"}">
      <span>${check.ok ? "Бэлэн" : "Дутуу"}</span>
      <strong>${escapeHtml(check.label)}</strong>
      <p>${escapeHtml(check.detail)}</p>
    </article>
  `).join("");
}

function getStockCount(productId, status = "available") {
  return adminStock.filter((item) => item.productId === productId && item.status === status).length;
}

function getOrderStockCheck(order) {
  if (order.status === "ready" && order.delivery?.items?.length) {
    return {
      ready: true,
      label: "эрх оноогдсон"
    };
  }

  const missing = [];
  const lines = (order.items || []).map((item) => {
    const needed = Number(item.quantity || 0);
    const available = getStockCount(item.id, "available");
    if (available < needed) missing.push(`${item.name}: ${needed - available}`);
    return `${item.name} ${available}/${needed}`;
  });

  return {
    ready: missing.length === 0,
    label: missing.length ? `дутуу (${missing.join(", ")})` : `бэлэн (${lines.join(", ")})`
  };
}

function renderOrder(order) {
  const items = (order.items || []).map((item) => `${item.name} x ${item.quantity}`).join(", ");
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("mn-MN") : "-";
  const status = order.publicStatus || {};
  const stockCheck = getOrderStockCheck(order);
  const canConfirm = order.status === "ready" || stockCheck.ready;

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
        <span>Account: <strong>${order.accountEmail || order.customer?.email || "-"}</strong></span>
        <span>Бараа: <strong>${items || "-"}</strong></span>
        <span>Promo: <strong>${order.promo?.code ? `${order.promo.code} (-${money(order.discount || 0)})` : "-"}</strong></span>
        <span>Stock: <strong class="${stockCheck.ready ? "stock-ok-text" : "stock-warn-text"}">${stockCheck.label}</strong></span>
      </div>
      <div class="admin-order-actions">
        <select data-status-select="${order.orderId}" aria-label="${order.orderId} төлөв солих">
          <option value="pending_payment" ${order.status === "pending_payment" ? "selected" : ""}>Төлбөр хүлээгдэж байна</option>
          <option value="activation_queue" ${order.status === "activation_queue" ? "selected" : ""}>Эрх идэвхжүүлэх дараалал</option>
          <option value="ready" ${order.status === "ready" ? "selected" : ""}>Эрх бэлэн болсон</option>
          <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Цуцлагдсан</option>
        </select>
        <button class="primary-action" type="button" data-confirm-payment="${order.orderId}" ${canConfirm ? "" : "disabled"}>${stockCheck.ready ? "Confirm Payment" : "Stock дутуу"}</button>
        <button class="secondary-action" type="button" data-update-status="${order.orderId}">Төлөв хадгалах</button>
      </div>
      ${order.delivery?.items?.length ? `
        <div class="admin-delivery-summary">
          <strong>Оноосон эрх</strong>
          <span>${order.delivery.items.map((item) => `${escapeHtml(item.productName)}: ${escapeHtml(item.login)}`).join(" · ")}</span>
        </div>
      ` : ""}
    </article>
  `;
}

function renderOrders(data) {
  adminOrders = data.orders || [];
  renderOrderMetrics(adminOrders);
  warningEl.hidden = data.storageMode === "redis";
  renderOrderList();
}

function renderOrderMetrics(orders) {
  countEl.textContent = orders.length;
  pendingEl.textContent = orders.filter((order) => order.status === "pending_payment").length;
  readyEl.textContent = orders.filter((order) => order.status === "ready").length;
  revenueEl.textContent = money(orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0));
}

function orderHaystack(order) {
  return [
    order.orderId,
    order.status,
    order.publicStatus?.label,
    order.customer?.name,
    order.customer?.phone,
    order.customer?.email,
    order.accountEmail,
    ...(order.items || []).map((item) => `${item.name} ${item.term}`)
  ].join(" ").toLowerCase();
}

function getVisibleOrders() {
  const search = orderSearchInput?.value.trim().toLowerCase() || "";
  const status = orderStatusFilter?.value || "all";

  return adminOrders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const matchesSearch = !search || orderHaystack(order).includes(search);
    return matchesStatus && matchesSearch;
  });
}

function renderOrderList() {
  const orders = getVisibleOrders();
  messageEl.textContent = adminOrders.length
    ? `${orders.length} / ${adminOrders.length} захиалга харагдаж байна.`
    : "Одоогоор захиалга бүртгэгдээгүй байна.";
  ordersEl.innerHTML = orders.length
    ? orders.map(renderOrder).join("")
    : '<p class="cart-note">Энэ шүүлтүүрт тохирох захиалга алга.</p>';
}

function renderProduct(product) {
  return `
    <article class="admin-product-card">
      <div class="admin-product-preview" style="--thumb-bg: ${safeProductColor(product.color)}">
        ${product.image
          ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
          : `<span>${escapeHtml(product.category)}</span>`}
      </div>
      <div class="admin-product-info">
        <span class="status-pill">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <strong>${money(product.price)} · ${escapeHtml(product.term)}</strong>
      </div>
      <button class="secondary-action" type="button" data-edit-product="${escapeHtml(product.id)}">Засах</button>
    </article>
  `;
}

function renderProducts(data) {
  adminProducts = data.products || [];
  renderStockProductOptions();
  renderStockOverview();
  if (adminOrders.length) renderOrderList();
  productMessageEl.textContent = adminProducts.length
    ? "Бүтээгдэхүүний жагсаалт шинэчлэгдлээ."
    : "Одоогоор бүтээгдэхүүн алга.";
  productsEl.innerHTML = adminProducts.length
    ? adminProducts.map(renderProduct).join("")
    : '<p class="cart-note">Бүтээгдэхүүн нэмэх form ашиглана уу.</p>';
}

function renderStockProductOptions() {
  if (!stockProductSelect) return;
  stockProductSelect.innerHTML = adminProducts.length
    ? adminProducts.map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}</option>`).join("")
    : '<option value="">Эхлээд бүтээгдэхүүн нэмнэ</option>';
}

function stockStatusLabel(status) {
  if (status === "delivered") return "Delivered";
  if (status === "reserved") return "Reserved";
  return "Available";
}

function renderStockItem(item) {
  return `
    <article class="admin-stock-card">
      <div>
        <span class="status-pill">${stockStatusLabel(item.status)}</span>
        <h3>${escapeHtml(item.productName || item.productId)}</h3>
        <p>${escapeHtml(item.login)} · ${item.expiresAt ? `Дуусах: ${escapeHtml(item.expiresAt)}` : "Дуусах хугацаа оруулаагүй"}</p>
        ${item.orderId ? `<p>Order: <strong>${escapeHtml(item.orderId)}</strong></p>` : ""}
        ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
      </div>
      <div class="stock-secret">
        <span>Password</span>
        <strong>${escapeHtml(item.password)}</strong>
      </div>
      <button class="secondary-action" type="button" data-edit-stock="${escapeHtml(item.stockId)}">Засах</button>
    </article>
  `;
}

function renderStockOverview() {
  if (!stockOverviewEl) return;

  if (!adminProducts.length) {
    stockOverviewEl.innerHTML = '<p class="cart-note">Эхлээд бүтээгдэхүүний жагсаалт уншина.</p>';
    return;
  }

  stockOverviewEl.innerHTML = adminProducts.map((product) => {
    const available = getStockCount(product.id, "available");
    const reserved = getStockCount(product.id, "reserved");
    const delivered = getStockCount(product.id, "delivered");

    return `
      <article class="stock-overview-card ${available ? "is-ready" : "is-empty"}">
        <span>${available ? "Ready" : "Empty"}</span>
        <strong>${escapeHtml(product.name)}</strong>
        <small>${available} available · ${reserved} reserved · ${delivered} delivered</small>
      </article>
    `;
  }).join("");
}

function renderStock(data) {
  adminStock = data.stock || [];
  const available = adminStock.filter((item) => item.status === "available").length;
  stockMessageEl.textContent = adminStock.length
    ? `${adminStock.length} stock байна · ${available} available`
    : "Одоогоор stock credential алга.";
  stockEl.innerHTML = adminStock.length
    ? adminStock.map(renderStockItem).join("")
    : '<p class="cart-note">Product сонгоод login/password stock нэмнэ үү.</p>';
  renderStockOverview();
  if (adminOrders.length) renderOrderList();
}

function renderUser(user) {
  return `
    <article class="admin-user-card">
      <div>
        <span class="status-pill">${user.canAdmin ? "Admin" : "User"}</span>
        <h3>${escapeHtml(user.name || "-")}</h3>
        <p>${escapeHtml(user.email || "-")}</p>
      </div>
      <div class="admin-user-actions">
        <select data-user-role="${escapeHtml(user.email)}" aria-label="${escapeHtml(user.email)} role солих">
          <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
        <button class="secondary-action" type="button" data-update-user="${escapeHtml(user.email)}">Эрх хадгалах</button>
      </div>
    </article>
  `;
}

function renderUsers(data) {
  adminUsers = data.users || [];
  userMessageEl.textContent = adminUsers.length
    ? "Account permission жагсаалт шинэчлэгдлээ."
    : "Одоогоор account бүртгэгдээгүй байна.";
  usersEl.innerHTML = adminUsers.length
    ? adminUsers.map(renderUser).join("")
    : '<p class="cart-note">Дэлгүүрээс account үүсгэхэд энд харагдана.</p>';
}

async function loadProducts() {
  productMessageEl.textContent = "Бүтээгдэхүүний мэдээлэл уншиж байна...";
  const data = await adminFetch("/api/admin-products");
  renderProducts(data);
}

async function loadStock() {
  stockMessageEl.textContent = "Stock credential уншиж байна...";
  const data = await adminFetch("/api/admin-products?resource=stock");
  renderStock(data);
}

async function loadSetup() {
  setupMessageEl.textContent = "Production тохиргоо шалгаж байна...";
  const data = await adminFetch("/api/admin-health");
  renderSetup(data);
}

async function loadUsers() {
  userMessageEl.textContent = "Account permission уншиж байна...";
  const data = await adminFetch("/api/admin-users");
  renderUsers(data);
}

function fillProductForm(product) {
  productForm.elements.id.value = product.id || "";
  productForm.elements.name.value = product.name || "";
  productForm.elements.category.value = product.category || "AI Tools";
  productForm.elements.price.value = product.price || 0;
  productForm.elements.term.value = product.term || "";
  productForm.elements.rating.value = product.rating || "4.9";
  productForm.elements.stock.value = product.stock || "Идэвхжүүлэлт";
  productForm.elements.image.value = product.image || "";
  productForm.elements.color.value = product.color || "linear-gradient(135deg, #14775c, #386f8e)";
  productForm.elements.description.value = product.description || "";
  productForm.elements.benefits.value = (product.benefits || []).join("\n");
  productDeleteBtn.classList.remove("is-hidden");
  productMessageEl.textContent = `${product.name} бүтээгдэхүүнийг засаж байна.`;
}

function clearProductForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  productForm.elements.color.value = "linear-gradient(135deg, #14775c, #386f8e)";
  productForm.elements.rating.value = "4.9";
  productForm.elements.stock.value = "Идэвхжүүлэлт";
  productDeleteBtn.classList.add("is-hidden");
  productMessageEl.textContent = "Шинэ бүтээгдэхүүний мэдээлэл оруулна уу.";
}

function fillStockForm(item) {
  stockForm.elements.stockId.value = item.stockId || "";
  stockForm.elements.productId.value = item.productId || "";
  stockForm.elements.login.value = item.login || "";
  stockForm.elements.password.value = item.password || "";
  stockForm.elements.expiresAt.value = item.expiresAt || "";
  stockForm.elements.status.value = item.status || "available";
  stockForm.elements.note.value = item.note || "";
  stockDeleteBtn.classList.remove("is-hidden");
  stockMessageEl.textContent = `${item.productName || item.productId} stock засаж байна.`;
}

function clearStockForm() {
  stockForm.reset();
  stockForm.elements.stockId.value = "";
  stockForm.elements.status.value = "available";
  stockDeleteBtn.classList.add("is-hidden");
  stockMessageEl.textContent = "Шинэ login/password stock оруулна уу.";
}

async function saveStock() {
  const formData = new FormData(stockForm);
  const product = adminProducts.find((item) => item.id === formData.get("productId"));
  const stock = {
    stockId: formData.get("stockId"),
    productId: formData.get("productId"),
    productName: product?.name || formData.get("productId"),
    login: formData.get("login"),
    password: formData.get("password"),
    expiresAt: formData.get("expiresAt"),
    status: formData.get("status"),
    note: formData.get("note")
  };

  await adminFetch("/api/admin-products?resource=stock", {
    method: stock.stockId ? "PATCH" : "POST",
    body: JSON.stringify(stock)
  });

  clearStockForm();
  await loadStock();
}

async function deleteSelectedStock() {
  const stockId = stockForm.elements.stockId.value;
  if (!stockId) return;
  if (!window.confirm("Энэ stock credential-ийг устгах уу?")) return;

  await adminFetch("/api/admin-products?resource=stock", {
    method: "DELETE",
    body: JSON.stringify({ stockId })
  });

  clearStockForm();
  await loadStock();
}

async function saveProduct() {
  const formData = new FormData(productForm);
  const product = {
    id: formData.get("id"),
    name: formData.get("name"),
    category: formData.get("category"),
    price: Number(formData.get("price") || 0),
    term: formData.get("term"),
    rating: formData.get("rating"),
    stock: formData.get("stock"),
    image: formData.get("image"),
    color: formData.get("color"),
    description: formData.get("description"),
    benefits: String(formData.get("benefits") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  await adminFetch("/api/admin-products", {
    method: product.id ? "PATCH" : "POST",
    body: JSON.stringify(product)
  });

  clearProductForm();
  await loadProducts();
}

async function deleteSelectedProduct() {
  const id = productForm.elements.id.value;
  const name = productForm.elements.name.value || id;
  if (!id) return;
  if (!window.confirm(`${name} бүтээгдэхүүнийг устгах уу?`)) return;

  await adminFetch("/api/admin-products", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });

  clearProductForm();
  await loadProducts();
  productMessageEl.textContent = `${name} устгагдлаа.`;
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

async function confirmPayment(orderId) {
  await adminFetch("/api/admin-orders", {
    method: "PATCH",
    body: JSON.stringify({
      orderId,
      action: "confirm_payment"
    })
  });
  await Promise.all([loadOrders(), loadStock()]);
}

async function updateUser(email) {
  const select = document.querySelector(`[data-user-role="${CSS.escape(email)}"]`);
  await adminFetch("/api/admin-users", {
    method: "PATCH",
    body: JSON.stringify({
      email,
      role: select.value
    })
  });
  await loadUsers();
}

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  Promise.all([loadSetup(), loadOrders(), loadProducts(), loadStock(), loadUsers()]).catch((error) => {
    setupMessageEl.textContent = error.message;
    messageEl.textContent = error.message;
    productMessageEl.textContent = error.message;
    stockMessageEl.textContent = error.message;
    userMessageEl.textContent = error.message;
  });
});

ordersEl.addEventListener("click", (event) => {
  const confirmButton = event.target.closest("[data-confirm-payment]");
  if (confirmButton) {
    confirmPayment(confirmButton.dataset.confirmPayment).catch((error) => {
      messageEl.textContent = error.message;
    });
    return;
  }

  const button = event.target.closest("[data-update-status]");
  if (!button) return;
  updateStatus(button.dataset.updateStatus).catch((error) => {
    messageEl.textContent = error.message;
  });
});

orderSearchInput?.addEventListener("input", renderOrderList);
orderStatusFilter?.addEventListener("change", renderOrderList);

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveProduct().catch((error) => {
    productMessageEl.textContent = error.message;
  });
});

productResetBtn.addEventListener("click", clearProductForm);
productDeleteBtn.addEventListener("click", () => {
  deleteSelectedProduct().catch((error) => {
    productMessageEl.textContent = error.message;
  });
});

stockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveStock().catch((error) => {
    stockMessageEl.textContent = error.message;
  });
});

stockResetBtn.addEventListener("click", clearStockForm);
stockDeleteBtn.addEventListener("click", () => {
  deleteSelectedStock().catch((error) => {
    stockMessageEl.textContent = error.message;
  });
});

stockEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-stock]");
  if (!button) return;
  const item = adminStock.find((stock) => stock.stockId === button.dataset.editStock);
  if (item) fillStockForm(item);
});

productsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-product]");
  if (!button) return;
  const product = adminProducts.find((item) => item.id === button.dataset.editProduct);
  if (product) fillProductForm(product);
});

usersEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-update-user]");
  if (!button) return;
  updateUser(button.dataset.updateUser).catch((error) => {
    userMessageEl.textContent = error.message;
  });
});

Promise.all([loadSetup(), loadOrders(), loadProducts(), loadStock(), loadUsers()]).catch((error) => {
  setupMessageEl.textContent = error.message;
  messageEl.textContent = error.message;
  productMessageEl.textContent = error.message;
  stockMessageEl.textContent = error.message;
  userMessageEl.textContent = error.message;
});
