const products = [
  {
    id: "canva-pro",
    name: "Canva Pro",
    category: "Design",
    price: 29900,
    description: "Social post, poster, presentation хийхэд зориулсан design subscription.",
    rating: "4.9",
    stock: "Activation",
    color: "linear-gradient(135deg, #00c4cc, #7d2ae8)"
  },
  {
    id: "capcut-pro",
    name: "CapCut Pro",
    category: "Video",
    price: 34900,
    description: "Short video, reels, TikTok edit хийх creator-д зориулсан video tool.",
    rating: "4.8",
    stock: "Activation",
    color: "linear-gradient(135deg, #101614, #54c99e)"
  },
  {
    id: "ai-creator-pack",
    name: "AI Creator Pack",
    category: "AI Tools",
    price: 49900,
    description: "Prompt, content idea, caption, ad copy гаргах AI workflow багц.",
    rating: "5.0",
    stock: "Guide included",
    color: "linear-gradient(135deg, #3e6f8e, #54c99e)"
  },
  {
    id: "design-video-bundle",
    name: "Design + Video Bundle",
    category: "Bundle",
    price: 59900,
    description: "Canva style design болон video editing хэрэгцээг нэг багцад.",
    rating: "4.9",
    stock: "Best value",
    color: "linear-gradient(135deg, #ff8a68, #f4c45d)"
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
let activeFilter = "all";
let cart = loadCart();
let activeTheme = loadTheme();

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

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesFilter = activeFilter === "all" || product.category === activeFilter;
    const matchesSearch = !searchTerm || `${product.name} ${product.category}`.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (!visibleProducts.length) {
    grid.innerHTML = "<p class=\"cart-note\">Таны хайлтад тохирох subscription олдсонгүй.</p>";
    return;
  }

  grid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-thumb" style="--thumb-bg: ${product.color}">
        <span>${product.category}</span>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span class="category">${product.category}</span>
          <span class="price">${money(product.price)}</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
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
    cartItems.innerHTML = "<p class=\"cart-note\">Сагс хоосон байна.</p>";
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-row">
      <div>
        <strong>${item.name}</strong>
        <small>${money(item.price)} x ${item.quantity}</small>
      </div>
      <div class="qty" aria-label="${item.name} тоо ширхэг">
        <button type="button" data-decrease="${item.id}">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-increase="${item.id}">+</button>
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
  openCart();
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

function copyOrder() {
  if (!cart.length) {
    alert("Сагс хоосон байна.");
    return;
  }

  const lines = cart.map((item) => `- ${item.name}: ${item.quantity}ш x ${money(item.price)}`);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const text = `Сайн байна уу, AI Mongolia-с дараах digital subscription захиалъя:\n${lines.join("\n")}\nНийт: ${money(total)}`;

  if (!navigator.clipboard) {
    window.prompt("Захиалгын текстээ хуулна уу:", text);
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    alert("Захиалга clipboard-д хуулагдлаа.");
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
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderLines = cart.map((item) => `${item.name} - ${item.quantity}ш`).join("\n");
  const subject = encodeURIComponent("AI Mongolia digital subscription захиалга");
  const body = encodeURIComponent(
    `Нэр: ${formData.get("name")}\nХолбоо барих: ${formData.get("phone")}\nТайлбар: ${formData.get("address")}\n\nЗахиалга:\n${orderLines || "Сагс хоосон"}\n\nНийт: ${money(total)}`
  );
  window.location.href = `mailto:orders@example.com?subject=${subject}&body=${body}`;
});

setTheme(activeTheme);
renderProducts();
renderCart();
