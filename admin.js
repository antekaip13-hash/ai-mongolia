const adminForm = document.querySelector("[data-admin-form]");
const ordersEl = document.querySelector("[data-admin-orders]");
const countEl = document.querySelector("[data-admin-count]");
const storageModeEl = document.querySelector("[data-storage-mode]");
const updatedEl = document.querySelector("[data-admin-updated]");
const messageEl = document.querySelector("[data-admin-message]");
const warningEl = document.querySelector("[data-admin-warning]");
const productForm = document.querySelector("[data-product-form]");
const productsEl = document.querySelector("[data-admin-products]");
const productMessageEl = document.querySelector("[data-product-message]");
const productResetBtn = document.querySelector("[data-product-reset]");
const formatter = new Intl.NumberFormat("mn-MN");
let adminProducts = [];

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
  productMessageEl.textContent = adminProducts.length
    ? "Бүтээгдэхүүний жагсаалт шинэчлэгдлээ."
    : "Одоогоор бүтээгдэхүүн алга.";
  productsEl.innerHTML = adminProducts.length
    ? adminProducts.map(renderProduct).join("")
    : '<p class="cart-note">Бүтээгдэхүүн нэмэх form ашиглана уу.</p>';
}

async function loadProducts() {
  productMessageEl.textContent = "Бүтээгдэхүүний мэдээлэл уншиж байна...";
  const data = await adminFetch("/api/admin-products");
  renderProducts(data);
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
  productMessageEl.textContent = `${product.name} бүтээгдэхүүнийг засаж байна.`;
}

function clearProductForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  productForm.elements.color.value = "linear-gradient(135deg, #14775c, #386f8e)";
  productForm.elements.rating.value = "4.9";
  productForm.elements.stock.value = "Идэвхжүүлэлт";
  productMessageEl.textContent = "Шинэ бүтээгдэхүүний мэдээлэл оруулна уу.";
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
  Promise.all([loadOrders(), loadProducts()]).catch((error) => {
    messageEl.textContent = error.message;
    productMessageEl.textContent = error.message;
  });
});

ordersEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-update-status]");
  if (!button) return;
  updateStatus(button.dataset.updateStatus).catch((error) => {
    messageEl.textContent = error.message;
  });
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveProduct().catch((error) => {
    productMessageEl.textContent = error.message;
  });
});

productResetBtn.addEventListener("click", clearProductForm);

productsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-product]");
  if (!button) return;
  const product = adminProducts.find((item) => item.id === button.dataset.editProduct);
  if (product) fillProductForm(product);
});

Promise.all([loadOrders(), loadProducts()]).catch((error) => {
  messageEl.textContent = error.message;
  productMessageEl.textContent = error.message;
});
