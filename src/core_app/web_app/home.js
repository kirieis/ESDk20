// Github Pharmacy - Real Data Sync + Mock Pricing
// Chế độ: Đọc trực tiếp từ /data/medicines_clean.csv (Tương thích Live Server)

const state = {
  products: [],
  cartCount: 0,

  // filters
  query: "",
  min: "",
  max: "",
  sort: "pop_desc",
  onlySale: false,

  // paging
  page: 1,
  pageSize: 12,
};

const $ = (id) => document.getElementById(id);

function formatVND(n) {
  return n.toLocaleString("vi-VN") + "đ";
}

// Global Helpers
const getCart = () => JSON.parse(localStorage.getItem("cart") || "[]");
const saveCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
  const badge = $("cartBadge");
  if (badge) {
    badge.textContent = String(cart.length);
  }
};

function showToast(msg) {
  let t = $("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = `🛒 <span>${msg}</span> đã được thêm vào giỏ!`;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function clampNumber(val) {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// -------- CSV Parser + Mock Pricing --------
function parseCSV(text) {
  const lines = text.split("\n");
  const rows = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("medicine_id")) return;

    // Handle CSV with commas inside quotes if needed, but for now simple split
    const parts = trimmed.split(",");

    // Expecting at least 11 columns based on new CSV structure
    // medicine_id,name,batch,ingredient,dosage_form,strength,unit,manufacturer,expiry,quantity,price
    if (parts.length < 11) return;

    const [medId, name, batchId, ingredient, dosageForm, strength, unit, manufacturer, dateStr, quantityStr, priceStr] = parts;
    const quantity = Number(quantityStr);
    const price = Number(priceStr);

    if (!medId || !name) return;

    // --- Pricing & Sale Logic ---
    // --- Pricing & Sale Logic (Mocking based on Expiry) ---
    // User requested: Sale ONLY if close to expiry (e.g. within 6 months)
    // Discount range: 5-20%

    let hasSale = false;
    let daysUntilExpiry = 3650; // Default far future

    try {
      // Attempt to parse dateStr
      // Supported formats: YYYY-MM-DD or DD/MM/YYYY
      let d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const dp = dateStr.split('/'); // Check for DD/MM/YYYY
        if (dp.length === 3) d = new Date(`${dp[2]}-${dp[1]}-${dp[0]}`);
      }

      if (!isNaN(d.getTime())) {
        const now = new Date();
        const diff = d - now;
        daysUntilExpiry = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
    } catch (e) { }

    // Logic: If expiring in <= 180 days (6 months) AND not expired yet
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 180) {
      hasSale = true;
    }

    // Determine discount if sale
    // Range: 5% to 20% -> 5 + [0..15]
    const discount = hasSale ? (5 + (hashString(name) % 16)) : 0;

    // Default conversion rates if not in CSV
    const vienPerVi = 10;
    const viPerHop = 3;

    // Base price is per Unit (Viên) or per Chai for Syrup
    const basePrice = isNaN(price) ? 0 : price;

    // Calculate final price with discount
    // This is the BASE unit price
    const finalBasePrice = discount ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

    const popularity = (hashString(name + batchId) % 1000) + 1;

    // Determine if liquid product (Syrup, Suspension)
    const isLiquid = ['Syrup', 'Suspension'].includes(dosageForm);

    rows.push({
      id: medId,
      name: name.replaceAll("_", " "),
      batchId,
      date: dateStr,
      quantity: isNaN(quantity) ? 0 : quantity,
      dosageForm: dosageForm || 'Tablet',
      isLiquid,

      // Pricing Details
      price: basePrice, // Original Base Price
      discount,
      finalBasePrice, // Discounted Base Price

      // Conversion (only for solid forms)
      vienPerVi,
      viPerHop,

      popularity
    });
  });

  return rows;
}

// -------- CSV Loader --------
// -------- CSV Loader --------
async function loadProducts() {
  try {
    // Determine the base URL dynamically or use relative path
    // For Tomcat deployment, 'data/medicines_clean.csv' relative to 'home.html' works if structure is preserved.
    const res = await fetch("data/medicines_clean.csv", { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`CSV Not Found: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.error("Failed to load products:", e);
    // Return empty array to prevent app crash
    return [];
  }
}

// -------- Filtering / Sorting / Paging --------
function applyFilters(products) {
  const q = state.query.trim().toLowerCase();
  const min = clampNumber(state.min);
  const max = clampNumber(state.max);

  let out = products;

  if (q) {
    out = out.filter(p => {
      const hay = `${p.name} ${p.id} ${p.dosageForm}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Filter based on BASE UNIT PRICE
  if (min !== null) out = out.filter(p => p.finalBasePrice >= min);
  if (max !== null) out = out.filter(p => p.finalBasePrice <= max);

  if (state.onlySale) out = out.filter(p => p.discount > 0);

  out = sortProducts(out, state.sort);
  return out;
}

function sortProducts(arr, sortKey) {
  const a = [...arr];
  switch (sortKey) {
    case "price_asc":
      a.sort((x, y) => x.finalBasePrice - y.finalBasePrice);
      break;
    case "price_desc":
      a.sort((x, y) => y.finalBasePrice - x.finalBasePrice);
      break;
    case "date_desc":
      a.sort((x, y) => String(y.date).localeCompare(String(x.date)));
      break;
    case "name_asc":
      a.sort((x, y) => String(x.name).localeCompare(String(y.name), "vi"));
      break;
    case "pop_desc":
    default:
      a.sort((x, y) => y.popularity - x.popularity);
      break;
  }
  return a;
}

function paginate(arr) {
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, totalPages);

  const start = (state.page - 1) * state.pageSize;
  const end = start + state.pageSize;
  return {
    items: arr.slice(start, end),
    total,
    totalPages,
  };
}

// -------- Pricing Logic --------
function calculateDisplayPrice(product, unit, qty = 1) {
  if (product.isLiquid) {
    // Liquid products: price per Chai (bottle)
    const original = product.price * qty;
    const final = product.finalBasePrice * qty;
    return { original, final };
  }

  // Solid products: Viên/Vỉ/Hộp
  let multiplier = 1;
  if (unit === "Vỉ") multiplier = product.vienPerVi;
  if (unit === "Hộp") multiplier = product.vienPerVi * product.viPerHop;

  const original = product.price * multiplier * qty;
  const final = product.finalBasePrice * multiplier * qty;

  return { original, final };
}

// -------- UI Rendering --------
function productCard(p) {
  const saleTag = p.discount > 0
    ? `<span class="tag tag--sale">SALE -${p.discount}%</span>`
    : `<span class="tag">NEW</span>`;

  // Display base price on card
  const unitLabel = p.isLiquid ? 'chai' : 'viên';
  const { final } = calculateDisplayPrice(p, p.isLiquid ? "Chai" : "Viên");

  const priceHtml = p.discount > 0
    ? `<span class="price">${formatVND(final)}<span class="unit">/${unitLabel}</span> <del>${formatVND(p.price)}</del></span>`
    : `<span class="price">${formatVND(final)}<span class="unit">/${unitLabel}</span></span>`;

  return `
    <article class="card">
      <div class="card__top">
        <div>
          <h3 class="card__name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="card__meta">
            <div class="line">Mã: <b>${escapeHtml(p.id)}</b></div>
            <div class="line">Loại: <b>${escapeHtml(p.dosageForm)}</b> • HSD: <b>${escapeHtml(p.date)}</b></div>
          </div>
        </div>
        ${saleTag}
      </div>

      <div class="card__mid">
        ${priceHtml}
      </div>

      <div class="card__actions">
        <button class="btn btn--buy" onclick="openModal('${p.id}', true)">MUA NGAY</button>
        <button class="btn btn--add" onclick="openModal('${p.id}', false)">+ Giỏ</button>
      </div>
    </article>
  `;
}

// -------- Modal Logic --------
let currentModalProductId = null;
let isBuyNow = false;

window.openModal = (id, buyNow) => {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  currentModalProductId = id;
  isBuyNow = buyNow;

  $("modalName").textContent = p.name;
  $("modalMeta").textContent = `Mã: ${p.id} • Loại: ${p.dosageForm}`;

  // Populate Unit Selector based on product type
  const select = $("modalUnit");
  if (p.isLiquid) {
    select.innerHTML = `<option value="Chai">Chai</option>`;
    select.value = "Chai";
  } else {
    select.innerHTML = `
      <option value="Viên">Viên</option>
      <option value="Vỉ">Vỉ (x${p.vienPerVi})</option>
      <option value="Hộp">Hộp (x${p.vienPerVi * p.viPerHop})</option>
    `;
    select.value = "Viên";
  }

  // Reset quantity
  $("modalQty").value = 1;

  // Initial Price Update
  updateModalPrice();

  // Show Modal
  $("optModal").classList.add("active");

  // Setup listeners
  select.onchange = updateModalPrice;
  $("modalQty").oninput = updateModalPrice;
  $("modalConfirmBtn").onclick = handleModalConfirm;
};

window.closeModal = () => {
  $("optModal").classList.remove("active");
  currentModalProductId = null;
};

function updateModalPrice() {
  if (!currentModalProductId) return;
  const p = state.products.find(x => x.id === currentModalProductId);
  const unit = $("modalUnit").value;
  const qty = parseInt($("modalQty").value) || 1;
  const { original, final } = calculateDisplayPrice(p, unit, qty);

  const priceEl = $("modalPrice");
  if (p.discount > 0) {
    priceEl.innerHTML = `${formatVND(final)} <del style="font-size: 16px; color: #999; font-weight: 400;">${formatVND(original)}</del>`;
  } else {
    priceEl.textContent = formatVND(final);
  }
}

function handleModalConfirm() {
  if (!currentModalProductId) return;
  const unit = $("modalUnit").value;
  const qty = parseInt($("modalQty").value) || 1;
  addToCart(currentModalProductId, unit, qty);
  closeModal();

  if (isBuyNow) {
    // Redirect to checkout or similar if needed
    window.location.href = "cart.html";
  }
}

function addToCart(id, unit, qty) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;

  const { final } = calculateDisplayPrice(product, unit, 1); // price per unit

  let cart = getCart();
  const existing = cart.find(item => item.id === id && item.unit === unit);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: final,
      unit: unit,
      qty: qty,
      isLiquid: product.isLiquid,
      vienPerVi: product.vienPerVi,
      viPerHop: product.viPerHop
    });
  }

  saveCart(cart);
  showToast(product.name);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSale(filtered) {
  const uniqueSale = filtered.filter(p => p.discount > 0).slice(0, 8);
  $("saleGrid").innerHTML = uniqueSale.map(productCard).join("");
  $("saleEmpty").classList.toggle("hidden", uniqueSale.length > 0);
}

function renderBest(filtered) {
  const uniqueBest = [...filtered].sort((a, b) => b.popularity - a.popularity).slice(0, 8);
  $("bestGrid").innerHTML = uniqueBest.map(productCard).join("");
  $("bestEmpty").classList.toggle("hidden", uniqueBest.length > 0);
}

function renderAll(filtered) {
  const { items, total, totalPages } = paginate(filtered);

  $("resultCount").textContent = `${total.toLocaleString("vi-VN")} kết quả`;
  $("pageNow").textContent = String(state.page);
  $("pageTotal").textContent = String(totalPages);

  $("allGrid").innerHTML = items.map(productCard).join("");
  $("allEmpty").classList.toggle("hidden", total > 0);

  $("prevPage").disabled = state.page <= 1;
  $("nextPage").disabled = state.page >= totalPages;
}

function renderAllSections() {
  const seen = new Set();
  const uniqueProducts = state.products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const filtered = applyFilters(uniqueProducts);
  renderSale(filtered);
  renderBest(filtered);
  renderAll(filtered);
}

// -------- Events --------
function bindEvents() {
  const btnGoSale = $("btnGoSale");
  if (btnGoSale) {
    btnGoSale.addEventListener("click", () => {
      const section = $("saleSection");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Set initial badge
  saveCart(getCart());

  document.body.addEventListener("click", (e) => {
    const buyId = e.target?.getAttribute?.("data-buy");
    const addId = e.target?.getAttribute?.("data-add");

    if (buyId || addId) {
      const id = buyId || addId;
      const product = state.products.find((p) => p.id === id);
      const unit = document.querySelector(`.unit-input[data-id="${id}"]`)?.value || "Viên";

      let multiplier = 1;
      if (unit === "Vỉ") multiplier = product.vienPerVi;
      if (unit === "Hộp") multiplier = product.vienPerVi * product.viPerHop;

      const unitPrice = product.finalBasePrice * multiplier;

      let cart = getCart();
      const existing = cart.find(item => item.id === id && item.unit === unit);

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: unitPrice,
          unit: unit,
          qty: 1
        });
      }

      saveCart(cart);
      showToast(product.name);

      if (buyId) {
        window.location.href = "cart.html";
      }
      return;
    }
  });

  $("btnCart").addEventListener("click", () => {
    window.location.href = "cart.html";
  });

  $("btnSearch").addEventListener("click", () => {
    state.query = $("globalSearch").value;
    state.page = 1;
    renderAllSections();
    scrollToAll();
  });

  $("globalSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("btnSearch").click();
  });

  $("btnApply").addEventListener("click", () => {
    syncFiltersFromUI();
    state.page = 1;
    renderAllSections();
  });

  $("btnReset").addEventListener("click", () => {
    resetFiltersUI();
    syncFiltersFromUI();
    state.page = 1;
    renderAllSections();
  });

  $("prevPage").addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderAllSections();
    scrollToAll();
  });

  $("nextPage").addEventListener("click", () => {
    state.page += 1;
    renderAllSections();
    scrollToAll();
  });

  const debounced = debounce(() => {
    syncFiltersFromUI();
    state.page = 1;
    renderAllSections();
  }, 250);

  ["filterQuery", "filterMin", "filterMax"].forEach(id => {
    $(id).addEventListener("input", debounced);
  });

  ["filterSort", "filterOnlySale"].forEach(id => {
    $(id).addEventListener("change", () => {
      syncFiltersFromUI();
      state.page = 1;
      renderAllSections();
    });
  });

  $("btnGoAll").addEventListener("click", () => scrollToAll());

  // Auth logic - Redirect to Profile Page
  const authState = window.authState || { isLoggedIn: false };
  const userMenuContainer = $("userMenuContainer");
  const btnLogin = $("btnLogin");

  if (authState.isLoggedIn) {
    let adminBtn = "";
    if (authState.role === "ADMIN") {
      adminBtn = `<a href="/admin/users" class="btn btn--primary" style="text-decoration: none; margin-right: 10px;">🛡️ Admin</a>`;
    }
    // Show username as link to profile page
    userMenuContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        ${adminBtn}
        <a href="profile.html" class="btn btn--ghost" style="text-decoration: none;">
          👤 ${escapeHtml(authState.fullName)}
        </a>
      </div>
    `;
  } else {
    btnLogin.innerHTML = `👤 Đăng nhập`;
    btnLogin.addEventListener("click", (e) => {
      window.location.href = "login.html";
    });
  }

  $("btnCart").addEventListener("click", () => {
    // alert(`Giỏ hàng: ${state.cartCount} sản phẩm.`); // Removed ugly alert
    window.location.href = "cart.html";
  });
}

function syncFiltersFromUI() {
  state.query = $("filterQuery").value || "";
  state.min = $("filterMin").value || "";
  state.max = $("filterMax").value || "";
  state.sort = $("filterSort").value || "pop_desc";
  state.onlySale = $("filterOnlySale").checked;
  $("globalSearch").value = state.query;
}

function resetFiltersUI() {
  $("filterQuery").value = "";
  $("filterMin").value = "";
  $("filterMax").value = "";
  $("filterSort").value = "pop_desc";
  $("filterOnlySale").checked = false;
  $("globalSearch").value = "";
}

function scrollToAll() {
  document.getElementById("allSection").scrollIntoView({ behavior: "smooth" });
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// -------- Boot --------
(async function init() {
  try {
    const authRes = await fetch("api/auth-status");
    if (authRes.ok) window.authState = await authRes.json();
  } catch (e) { }

  state.products = await loadProducts();
  bindEvents();
  renderAllSections();
})();
