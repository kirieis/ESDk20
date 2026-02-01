// Github Pharmacy - Real Data Sync + Mock Pricing
// Chế độ: Đọc trực tiếp từ /data/medicines_clean.csv (Tương thích Live Server)

const state = {
  products: [],
  cartCount: 0,

  // filters
  query: "",
  branch: "",
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
    badge.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
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

    const [medId, name, batchId, ingredient, dosage, strength, unit, manufacturer, dateStr, quantityStr, priceStr] = parts;
    const quantity = Number(quantityStr);
    const price = Number(priceStr);

    if (!medId || !name) return;

    // --- Pricing & Sale Logic ---
    // Deterministic sale logic since it is not in CSV yet
    const h = hashString(medId);
    const hasSale = h % 5 === 0; // 20% chance
    const discount = hasSale ? (5 + (hashString(name) % 26)) : 0;

    // Default conversion rates if not in CSV
    const vienPerVi = 10;
    const viPerHop = 3;

    // Base price is per Unit (Viên)
    const basePrice = isNaN(price) ? 0 : price;

    // Calculate final price with discount
    // This is the BASE unit price
    const finalBasePrice = discount ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

    const storeIdx = (h % 5) + 1;
    const store = `CN${storeIdx}`;
    const popularity = (hashString(name + batchId) % 1000) + 1;

    rows.push({
      id: medId,
      name: name.replaceAll("_", " "),
      batchId,
      date: dateStr,
      quantity: isNaN(quantity) ? 0 : quantity,

      // Pricing Details
      price: basePrice, // Original Base Price
      discount,
      finalBasePrice, // Discounted Base Price

      // Conversion
      vienPerVi,
      viPerHop,

      store,
      popularity
    });
  });

  return rows;
}

// -------- CSV Loader --------
async function loadProducts() {
  try {
    const res = await fetch("/data/medicines_clean.csv", { cache: "no-store" });
    if (!res.ok) {
      // Fallback
      const fallbackRes = await fetch("../../../data/medicines_clean.csv", { cache: "no-store" });
      if (!fallbackRes.ok) throw new Error("CSV Not Found");
      const text = await fallbackRes.text();
      return parseCSV(text);
    }
    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.error("Failed to load medicines:", e);
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
      const hay = `${p.name} ${p.id} ${p.batchId} ${p.store}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (state.branch) out = out.filter(p => p.store === state.branch);

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
function calculateDisplayPrice(product, unit) {
  let multiplier = 1;
  if (unit === "Vỉ") multiplier = product.vienPerVi;
  if (unit === "Hộp") multiplier = product.vienPerVi * product.viPerHop;

  const original = product.price * multiplier;
  const final = product.finalBasePrice * multiplier;

  return { original, final };
}

// -------- UI Rendering --------
function productCard(p) {
  const saleTag = p.discount > 0
    ? `<span class="tag tag--sale">SALE -${p.discount}%</span>`
    : `<span class="tag">NEW</span>`;

  // Display base price (Viên) on card
  // If we want to show "Hộp" price by default, we can, but "Viên" is consistent base
  const { final } = calculateDisplayPrice(p, "Viên");

  const priceHtml = p.discount > 0
    ? `<span class="price">${formatVND(final)}<span class="unit">/viên</span> <del>${formatVND(p.price)}</del></span>`
    : `<span class="price">${formatVND(final)}<span class="unit">/viên</span></span>`;

  return `
    <article class="card">
      <div class="card__top">
        <div>
          <h3 class="card__name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="card__meta">
            <div class="line">Mã: <b>${escapeHtml(p.id)}</b> • Lô: <b>${escapeHtml(p.batchId)}</b></div>
            <div class="line">CN: <b>${escapeHtml(p.store)}</b> • HSD: <b>${escapeHtml(p.date)}</b></div>
          </div>
        </div>
        ${saleTag}
      </div>

      <div class="card__mid">
        ${priceHtml}
        <!-- Unit selector removed from card face -->
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
  $("modalMeta").textContent = `Mã: ${p.id} • Lô: ${p.batchId}`;

  // Populate Unit Selector
  const select = $("modalUnit");
  select.innerHTML = `
    <option value="Viên">Viên</option>
    <option value="Vỉ">Vỉ (x${p.vienPerVi})</option>
    <option value="Hộp">Hộp (x${p.vienPerVi * p.viPerHop})</option>
  `;
  select.value = "Viên"; // Reset to default

  // Initial Price Update
  updateModalPrice();

  // Show Modal
  $("optModal").classList.add("active");

  // Setup listener
  select.onchange = updateModalPrice;
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
  const { original, final } = calculateDisplayPrice(p, unit);

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
  addToCart(currentModalProductId, unit);
  closeModal();

  if (isBuyNow) {
    // Redirect to checkout or similar if needed
    window.location.href = "cart.html";
  }
}

function addToCart(id, unit) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;

  const { final } = calculateDisplayPrice(product, unit);

  let cart = getCart();
  const existing = cart.find(item => item.id === id && item.unit === unit);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: final,
      unit: unit,
      qty: 1
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

  ["filterBranch", "filterSort", "filterOnlySale"].forEach(id => {
    $(id).addEventListener("change", () => {
      syncFiltersFromUI();
      state.page = 1;
      renderAllSections();
    });
  });

  $("btnGoAll").addEventListener("click", () => scrollToAll());

  // Auth logic
  const authState = window.authState || { isLoggedIn: false };
  const btnLogin = $("btnLogin");
  if (authState.isLoggedIn) {
    if (authState.role === "ADMIN") {
      const adminLink = document.createElement("a");
      adminLink.href = "admin/users";
      adminLink.className = "btn btn--ghost";
      adminLink.innerHTML = "⚙️ Admin";
      adminLink.style.textDecoration = "none";
      btnLogin.parentNode.insertBefore(adminLink, btnLogin);
    }
    btnLogin.innerHTML = `👤 ${escapeHtml(authState.fullName)} (Đăng xuất)`;
    btnLogin.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "logout";
    });
  } else {
    btnLogin.innerHTML = `👤 Đăng nhập`;
    btnLogin.addEventListener("click", (e) => {
      // Removed e.preventDefault() here so if it's an <a> tag, it can also work naturally
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
  state.branch = $("filterBranch").value || "";
  state.min = $("filterMin").value || "";
  state.max = $("filterMax").value || "";
  state.sort = $("filterSort").value || "pop_desc";
  state.onlySale = $("filterOnlySale").checked;
  $("globalSearch").value = state.query;
}

function resetFiltersUI() {
  $("filterQuery").value = "";
  $("filterBranch").value = "";
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

function fillBranches(products) {
  const branches = [...new Set(products.map(p => p.store))].sort();
  const sel = $("filterBranch");
  sel.innerHTML = '<option value="">Tất cả</option>';
  for (const b of branches) {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    sel.appendChild(opt);
  }
}

// -------- Boot --------
(async function init() {
  try {
    const authRes = await fetch("api/auth-status");
    if (authRes.ok) window.authState = await authRes.json();
  } catch (e) { }

  state.products = await loadProducts();
  fillBranches(state.products);
  bindEvents();
  renderAllSections();
})();
