const products = [
  {
    id: "canva-pro",
    name: "Canva Pro",
    category: "Design",
    price: 29900,
    term: "1 сарын эрх",
    description: "Сошиал пост, постер, presentation хийхэд тохиромжтой design subscription.",
    benefits: ["Premium загварууд", "Brand kit тохиргоо", "Монгол заавар"],
    rating: "4.9",
    stock: "Идэвхжүүлэлт",
    color: "linear-gradient(135deg, #00b8c4, #7b4ac8)"
  },
  {
    id: "capcut-pro",
    name: "CapCut Pro",
    category: "Video",
    price: 34900,
    term: "1 сарын эрх",
    description: "Reels, TikTok болон богино видео edit хийдэг creator-д зориулсан video tool.",
    benefits: ["Pro effect-үүд", "Cloud export", "Creator тохиргоо"],
    rating: "4.8",
    stock: "Идэвхжүүлэлт",
    color: "linear-gradient(135deg, #111816, #56c99e)"
  },
  {
    id: "ai-creator-pack",
    name: "AI Creator Pack",
    category: "AI Tools",
    price: 49900,
    term: "AI prompt урсгал",
    description: "Контент санаа, caption, зарын текст, product copy гаргах AI workflow багц.",
    benefits: ["Prompt заавар", "Зарын текстийн загвар", "Контент календарь"],
    rating: "5.0",
    stock: "Заавартай",
    color: "linear-gradient(135deg, #386f8e, #56c99e)"
  },
  {
    id: "design-video-bundle",
    name: "Design + Video Bundle",
    category: "Bundle",
    price: 59900,
    term: "Хэмнэлттэй багц",
    description: "Design болон video editing хэрэгцээг нэг багцад шийдэх creator bundle.",
    benefits: ["Canva ашиглах урсгал", "CapCut ашиглах урсгал", "Түргэн дэмжлэг"],
    rating: "4.9",
    stock: "Багц санал",
    color: "linear-gradient(135deg, #e56f4e, #c98b20)"
  },
  {
    id: "business-starter",
    name: "Business Starter Kit",
    category: "Bundle",
    price: 79900,
    term: "Эхлэлийн багц",
    description: "Facebook page, постер, caption, product listing эхлүүлэх жижиг бизнесийн багц.",
    benefits: ["Page контент", "Постерийн загвар", "Борлуулалтын текст"],
    rating: "4.9",
    stock: "New",
    color: "linear-gradient(135deg, #14775c, #386f8e)"
  },
  {
    id: "ai-ads-pack",
    name: "AI Ads Pack",
    category: "AI Tools",
    price: 39900,
    term: "Зарын workflow",
    description: "Зар сурталчилгааны headline, primary text, offer санаа гаргах AI багц.",
    benefits: ["Зарын prompt", "Саналын өнцөг", "Туршилтын checklist"],
    rating: "4.8",
    stock: "Хурдан тохиргоо",
    color: "linear-gradient(135deg, #6b5a8f, #e56f4e)"
  }
];

const formatter = new Intl.NumberFormat("mn-MN");
const grid = document.querySelector("[data-product-grid]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCount = document.querySelector("[data-cart-count]");
const copyResult = document.querySelector("[data-copy-result]");
const mobileCartTotal = document.querySelector("[data-mobile-cart-total]");
const filterButtons = document.querySelectorAll("[data-filter]");
const searchInput = document.querySelector("[data-search]");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const toast = document.querySelector("[data-toast]");
const recommendationResult = document.querySelector("[data-recommendation-result]");
const statusResult = document.querySelector("[data-status-result]");
const orderResult = document.querySelector("[data-order-result]");
const ideaBoard = document.querySelector("[data-idea-board]");
const CART_STORAGE_KEY = "ai-mongolia-cart-v2";
const IDEAS_STORAGE_KEY = "ai-mongolia-ideas-v2";
const THEME_STORAGE_KEY = "ai-mongolia-theme";
let activeFilter = "all";
let cart = loadCart();
let activeTheme = loadTheme();
let toastTimer;
let ideas = loadIdeas();

function money(value) {
  return `${formatter.format(value)}₮`;
}

function loadCart() {
  try {
    return JSON.parse(window.localStorage?.getItem(CART_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    window.localStorage?.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    return;
  }
}

function loadIdeas() {
  try {
    return JSON.parse(window.localStorage?.getItem(IDEAS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveIdeas() {
  try {
    window.localStorage?.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
  } catch {
    return;
  }
}

function loadTheme() {
  try {
    const savedTheme = window.localStorage?.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "day" || savedTheme === "night") return savedTheme;
  } catch {
    return "day";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

function saveTheme(theme) {
  try {
    window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}

function setTheme(theme) {
  activeTheme = theme;
  document.body.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.themeOption === theme);
  });
  saveTheme(theme);
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

function makeFallbackOrder(payload) {
  const stamp = Date.now().toString(36).toUpperCase();
  const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    ok: true,
    orderId: `AIM-${stamp}`,
    status: "pending_payment",
    total,
    payment: {
      provider: "invoice",
      invoiceId: `INV-${stamp}`,
      qrText: `invoice://AIM-${stamp}`,
      expiresInMinutes: 15
    }
  };
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const haystack = `${product.name} ${product.category} ${product.description} ${product.benefits.join(" ")}`.toLowerCase();
    const matchesFilter = activeFilter === "all" || product.category === activeFilter;
    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (!visibleProducts.length) {
    grid.innerHTML = '<p class="cart-note">Таны хайлтад тохирох subscription олдсонгүй.</p>';
    return;
  }

  grid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-thumb" style="--thumb-bg: ${product.color}">
        <span>${product.category}</span>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span class="category">${product.term}</span>
          <span class="price">${money(product.price)}</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <ul class="product-benefits">
          ${product.benefits.map((benefit) => `<li>${benefit}</li>`).join("")}
        </ul>
        <div class="rating" aria-label="${product.rating} үнэлгээ">
          <span>★ ${product.rating}</span>
          <span>${product.stock}</span>
        </div>
        <div class="product-foot">
          <span class="stock">Цахимаар хүргэнэ</span>
          <button class="add-button" type="button" data-add="${product.id}">Нэмэх</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = totalQuantity;
  cartTotal.textContent = money(totalPrice);
  mobileCartTotal.textContent = totalQuantity ? `${totalQuantity} эрх · ${money(totalPrice)}` : "0₮";

  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-note">Сагс хоосон байна.</p>';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-row">
      <div>
        <strong>${item.name}</strong>
        <small>${item.term || item.category} · ${money(item.price)} x ${item.quantity}</small>
      </div>
      <div class="qty" aria-label="${item.name} тоо ширхэг">
        <button type="button" data-decrease="${item.id}" aria-label="${item.name} хасах">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-increase="${item.id}" aria-label="${item.name} нэмэх">+</button>
      </div>
    </div>
  `).join("");
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} сагсанд нэмэгдлээ.`);
}

function changeQuantity(productId, amount) {
  cart = cart
    .map((item) => item.id === productId ? { ...item, quantity: item.quantity + amount } : item)
    .filter((item) => item.quantity > 0);

  saveCart();
  renderCart();
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function buildOrderText(formData) {
  const lines = cart.map((item) => `- ${item.name} (${item.term || item.category}): ${item.quantity}ш x ${money(item.price)}`);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const customer = formData ? [
    `Нэр: ${formData.get("name")}`,
    `Холбоо барих: ${formData.get("phone")}`,
    `Тайлбар: ${formData.get("note") || "-"}`
  ].join("\n") : "";

  return [
    "Сайн байна уу, AI Mongolia-с дараах digital subscription захиалъя:",
    customer,
    "Захиалга:",
    lines.join("\n") || "- Сагс хоосон",
    `Нийт: ${money(total)}`
  ].filter(Boolean).join("\n");
}

function showCopyText(text, copied = false) {
  copyResult.innerHTML = `
    <div class="copy-box">
      <strong>${copied ? "Захиалга clipboard-д хуулагдлаа." : "Доорх захиалгын текстийг хуулж илгээнэ үү."}</strong>
      <textarea readonly rows="7">${text}</textarea>
      <small>Ctrl + A дараад Ctrl + C дарж хуулж болно.</small>
    </div>
  `;

  const textarea = copyResult.querySelector("textarea");
  textarea.focus();
  textarea.select();
}

function copyOrder() {
  if (!cart.length) {
    showToast("Сагс хоосон байна.");
    return;
  }

  const text = buildOrderText();

  if (!navigator.clipboard) {
    showCopyText(text);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showCopyText(text, true);
      showToast("Захиалга clipboard-д хуулагдлаа.");
    })
    .catch(() => {
      showCopyText(text);
      showToast("Clipboard зөвшөөрөл хаалттай байна. Текстийг гараар хуулна уу.");
    });
}

function recommendBundle(goal, budget) {
  if (goal === "business") return products.find((product) => product.id === "business-starter");
  if (goal === "video") return budget === "starter"
    ? products.find((product) => product.id === "capcut-pro")
    : products.find((product) => product.id === "design-video-bundle");
  if (goal === "ads") return products.find((product) => product.id === "ai-ads-pack");
  if (budget === "pro") return products.find((product) => product.id === "design-video-bundle");
  return products.find((product) => product.id === "canva-pro");
}

function renderRecommendation(product) {
  recommendationResult.innerHTML = `
    <strong>${product.name}</strong>
    <span>${product.description}</span>
    <button class="add-button" type="button" data-recommend-add="${product.id}">Санал болгосныг сагслах</button>
  `;
}

function renderStatus(data) {
  const timeline = (data.timeline || []).map((item) => `
    <li class="${item.done ? "is-done" : ""}">${item.label}</li>
  `).join("");

  statusResult.innerHTML = `
    <span class="status-pill">${data.label || data.status}</span>
    <div class="progress-track"><span style="width: ${Number(data.progress || 35)}%"></span></div>
    <p><strong>${data.orderId}</strong> захиалгын төлөв шинэчлэгдлээ.</p>
    <ul class="status-timeline">${timeline}</ul>
  `;
}

async function checkOrderStatus(orderId) {
  try {
    const response = await fetch(`/api/order-status?orderId=${encodeURIComponent(orderId)}`);
    if (!response.ok) throw new Error("Status unavailable");
    return response.json();
  } catch {
    return {
      ok: true,
      orderId,
      label: "Төлбөр хүлээгдэж байна",
      progress: 35,
      timeline: [
        { label: "Захиалга бүртгэгдсэн", done: true },
        { label: "Төлбөр шалгаж байна", done: true },
        { label: "Эрх идэвхжүүлэлт эхлээгүй", done: false },
        { label: "Эрхийн мэдээлэл хүлээгдэж байна", done: false }
      ]
    };
  }
}

async function createOrder(formData) {
  const payload = {
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      note: formData.get("note")
    },
    items: cart.map((item) => ({
      id: item.id,
      name: item.name,
      term: item.term || item.category,
      price: item.price,
      quantity: item.quantity
    }))
  };

  try {
    return await postJson("/api/create-order", payload);
  } catch {
    return makeFallbackOrder(payload);
  }
}

function renderOrderResult(data) {
  orderResult.innerHTML = `
    <div class="order-success">
      <span class="status-pill">Захиалга бүртгэгдлээ</span>
      <strong>${data.orderId}</strong>
      <p>Төлбөрийн нэхэмжлэх: ${data.payment?.invoiceId || "үүсэж байна"} · Нийт ${money(data.total || 0)}</p>
      <button class="secondary-action" type="button" data-track-created="${data.orderId}">Төлөв шалгах</button>
    </div>
  `;
}

function renderIdeas() {
  const sorted = [...ideas].sort((a, b) => b.votes - a.votes);
  ideaBoard.innerHTML = sorted.map((idea) => `
    <article class="idea-card">
      <span>${idea.tag}</span>
      <strong>${idea.title}</strong>
      <button type="button" data-vote="${idea.title}">▲ ${idea.votes}</button>
    </article>
  `).join("");
}

async function loadStarterIdeas() {
  try {
    const response = await fetch("/api/ideas");
    if (!response.ok) throw new Error("Ideas unavailable");
    const data = await response.json();
    const remoteIdeas = data.ideas || [];
    const merged = [...remoteIdeas, ...ideas];
    const unique = new Map(merged.map((idea) => [idea.title, idea]));
    ideas = [...unique.values()];
  } catch {
    if (!ideas.length) {
      ideas = [
        { title: "AI prompt багц", votes: 42, tag: "AI хэрэгсэл" },
        { title: "QPay автомат нэхэмжлэх", votes: 36, tag: "Төлбөр" },
        { title: "Сунгалтын сануулга", votes: 28, tag: "Автоматжуулалт" }
      ];
    }
  }
  saveIdeas();
  renderIdeas();
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});

cartItems.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-increase]");
  const decrease = event.target.closest("[data-decrease]");
  if (increase) changeQuantity(increase.dataset.increase, 1);
  if (decrease) changeQuantity(decrease.dataset.decrease, -1);
});

document.querySelectorAll("[data-open-cart]").forEach((button) => {
  button.addEventListener("click", openCart);
});

document.querySelector("[data-close-cart]").addEventListener("click", closeCart);
document.querySelector("[data-copy-order]").addEventListener("click", copyOrder);

cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    activeFilter = button.dataset.filter;
    renderProducts();
  });
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.themeOption));
});

searchInput.addEventListener("input", renderProducts);

document.querySelector("[data-recommender-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  renderRecommendation(recommendBundle(formData.get("goal"), formData.get("budget")));
});

recommendationResult.addEventListener("click", (event) => {
  const button = event.target.closest("[data-recommend-add]");
  if (button) addToCart(button.dataset.recommendAdd);
});

document.querySelector("[data-status-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const orderId = formData.get("orderId");
  renderStatus(await checkOrderStatus(orderId));
});

orderResult.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-track-created]");
  if (!button) return;
  renderStatus(await checkOrderStatus(button.dataset.trackCreated));
  document.querySelector("#engine").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("[data-idea-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const idea = {
    title: formData.get("title").trim(),
    tag: formData.get("tag"),
    votes: 1
  };

  try {
    const data = await postJson("/api/ideas", idea);
    ideas = [data.idea, ...ideas];
  } catch {
    ideas = [idea, ...ideas];
  }

  saveIdeas();
  renderIdeas();
  form.reset();
  showToast("Таны санал амжилттай нэмэгдлээ.");
});

ideaBoard.addEventListener("click", (event) => {
  const button = event.target.closest("[data-vote]");
  if (!button) return;
  ideas = ideas.map((idea) => idea.title === button.dataset.vote ? { ...idea, votes: idea.votes + 1 } : idea);
  saveIdeas();
  renderIdeas();
});

document.querySelector("[data-order-form]").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!cart.length) {
    showToast("Эхлээд сагсанд бүтээгдэхүүн нэмээрэй.");
    return;
  }

  const formData = new FormData(event.currentTarget);
  orderResult.innerHTML = '<p class="cart-note">Захиалгын дугаар үүсгэж байна...</p>';
  const data = await createOrder(formData);
  renderOrderResult(data);
  renderStatus(await checkOrderStatus(data.orderId));
  showToast("Захиалга амжилттай бүртгэгдлээ.");
});

setTheme(activeTheme);
renderProducts();
renderCart();
loadStarterIdeas();
