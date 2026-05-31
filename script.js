const products = [
  {
    id: "canva-pro",
    name: "Canva Pro",
    category: "Design",
    price: 29900,
    term: "1 сарын эрх",
    description: "Social post, poster, presentation хийхэд тохиромжтой design subscription.",
    benefits: ["Premium template", "Brand kit workflow", "Монгол заавар"],
    rating: "4.9",
    stock: "Activation",
    color: "linear-gradient(135deg, #00b8c4, #7b4ac8)"
  },
  {
    id: "capcut-pro",
    name: "CapCut Pro",
    category: "Video",
    price: 34900,
    term: "1 сарын эрх",
    description: "Reels, TikTok, short video edit хийдэг creator-д зориулсан video tool.",
    benefits: ["Pro effects", "Cloud export", "Creator setup"],
    rating: "4.8",
    stock: "Activation",
    color: "linear-gradient(135deg, #111816, #56c99e)"
  },
  {
    id: "ai-creator-pack",
    name: "AI Creator Pack",
    category: "AI Tools",
    price: 49900,
    term: "Prompt workflow",
    description: "Content idea, caption, ad copy, product text гаргах AI workflow багц.",
    benefits: ["Prompt guide", "Ad copy template", "Content calendar"],
    rating: "5.0",
    stock: "Guide included",
    color: "linear-gradient(135deg, #386f8e, #56c99e)"
  },
  {
    id: "design-video-bundle",
    name: "Design + Video Bundle",
    category: "Bundle",
    price: 59900,
    term: "Best value",
    description: "Design болон video editing хэрэгцээг нэг багцад шийдэх creator bundle.",
    benefits: ["Canva workflow", "CapCut workflow", "Priority support"],
    rating: "4.9",
    stock: "Bundle deal",
    color: "linear-gradient(135deg, #e56f4e, #c98b20)"
  },
  {
    id: "business-starter",
    name: "Business Starter Kit",
    category: "Bundle",
    price: 79900,
    term: "Launch pack",
    description: "Facebook page, poster, caption, product listing эхлүүлэх жижиг бизнесийн багц.",
    benefits: ["Page content", "Poster template", "Sales copy"],
    rating: "4.9",
    stock: "New",
    color: "linear-gradient(135deg, #14775c, #386f8e)"
  },
  {
    id: "ai-ads-pack",
    name: "AI Ads Pack",
    category: "AI Tools",
    price: 39900,
    term: "Ad workflow",
    description: "Зар сурталчилгааны headline, primary text, offer idea гаргах AI багц.",
    benefits: ["Ad prompts", "Offer angles", "Testing checklist"],
    rating: "4.8",
    stock: "Fast setup",
    color: "linear-gradient(135deg, #6b5a8f, #e56f4e)"
  }
];

const formatter = new Intl.NumberFormat("mn-MN");
const grid = document.querySelector("[data-product-grid]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCount = document.querySelector("[data-cart-count]");
const mobileCartTotal = document.querySelector("[data-mobile-cart-total]");
const filterButtons = document.querySelectorAll("[data-filter]");
const searchInput = document.querySelector("[data-search]");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const toast = document.querySelector("[data-toast]");
let activeFilter = "all";
let cart = loadCart();
let activeTheme = loadTheme();
let toastTimer;

function money(value) {
  return `${formatter.format(value)}₮`;
}

function loadCart() {
  try {
    return JSON.parse(window.localStorage?.getItem("ai-mongolia-cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    window.localStorage?.setItem("ai-mongolia-cart", JSON.stringify(cart));
  } catch {
    return;
  }
}

function loadTheme() {
  try {
    const savedTheme = window.localStorage?.getItem("ai-mongolia-theme");
    if (savedTheme === "day" || savedTheme === "night") return savedTheme;
  } catch {
    return "day";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

function saveTheme(theme) {
  try {
    window.localStorage?.setItem("ai-mongolia-theme", theme);
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
          <span class="stock">Digital delivery</span>
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
        <small>${item.term} · ${money(item.price)} x ${item.quantity}</small>
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
  const lines = cart.map((item) => `- ${item.name} (${item.term}): ${item.quantity}ш x ${money(item.price)}`);
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

function copyOrder() {
  if (!cart.length) {
    showToast("Сагс хоосон байна.");
    return;
  }

  const text = buildOrderText();

  if (!navigator.clipboard) {
    window.prompt("Захиалгын текстээ хуулна уу:", text);
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast("Захиалга clipboard-д хуулагдлаа.");
  });
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

document.querySelector("[data-order-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const subject = encodeURIComponent("AI Mongolia digital subscription захиалга");
  const body = encodeURIComponent(buildOrderText(formData));
  window.location.href = `mailto:orders@example.com?subject=${subject}&body=${body}`;
});

setTheme(activeTheme);
renderProducts();
renderCart();
