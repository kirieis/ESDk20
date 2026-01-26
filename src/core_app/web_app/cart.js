const $ = (id) => document.getElementById(id);

function formatVND(n) {
    return n.toLocaleString("vi-VN") + "đ";
}

function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const cart = getCart();
    const list = $("cartList");

    if (cart.length === 0) {
        list.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p class="muted">Giỏ hàng của bạn đang trống</p>
        <a href="home.html" class="btn btn--primary" style="margin-top: 20px;">Quay lại mua sắm</a>
      </div>
    `;
        $("subtotal").textContent = "0đ";
        $("totalPrice").textContent = "0đ";
        return;
    }

    let subtotal = 0;
    list.innerHTML = cart.map((item, index) => {
        // Assuming price is for 1 "Viên"
        // We could add multipliers here later if needed
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        return `
      <div class="cart-item">
        <div class="cart-item__info">
          <h3>${item.name}</h3>
          <p>Mã: ${item.id} • Đơn vị: <b>${item.unit}</b></p>
        </div>
        <div class="cart-item__qty">
          <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
        </div>
        <div style="font-weight: 700; color: var(--primary); min-width: 100px; text-align: right;">
          ${formatVND(itemTotal)}
        </div>
        <button class="btn" style="color: var(--danger); padding: 8px;" onclick="removeItem(${index})">🗑</button>
      </div>
    `;
    }).join("");

    $("subtotal").textContent = formatVND(subtotal);
    $("totalPrice").textContent = formatVND(subtotal);
}

window.updateQty = (index, delta) => {
    const cart = getCart();
    cart[index].qty = Math.max(1, cart[index].qty + delta);
    saveCart(cart);
};

window.removeItem = (index) => {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
};

// Boot
renderCart();
