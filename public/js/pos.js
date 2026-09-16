/**
 * SCORIP POS — POS Kasir Client-Side Logic
 */

// Cart state
let cart = [];
let selectedPaymentMethod = 'Cash';

// ============================================================
// CART MANAGEMENT
// ============================================================
function addToCart(el) {
  const id = parseInt(el.dataset.id);
  const nama = el.dataset.nama;
  const harga = parseInt(el.dataset.harga);
  const stok = parseInt(el.dataset.stok);

  if (stok <= 0) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    if (existing.qty >= stok) {
      showToast('Stok tidak mencukupi!', 'warning');
      return;
    }
    existing.qty++;
  } else {
    cart.push({ id, nama, harga, stok, qty: 1, diskon: 0 });
  }

  renderCart();
  showAddAnimation(el);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  if (item.qty > item.stok) {
    item.qty = item.stok;
    showToast('Maks stok: ' + item.stok, 'warning');
  }

  renderCart();
}

function setQty(id, val) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const qty = parseInt(val) || 0;
  if (qty <= 0) {
    removeFromCart(id);
    return;
  }
  item.qty = Math.min(qty, item.stok);
  renderCart();
}

function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  renderCart();
  showToast('Keranjang dikosongkan', 'info');
}

function holdCart() {
  showToast('Transaksi ditahan (fitur akan tersedia setelah backend)', 'info');
}

// ============================================================
// RENDER CART
// ============================================================
function renderCart() {
  const container = document.getElementById('cartItems');
  const emptyMsg = document.getElementById('cartEmpty');
  const countEl = document.getElementById('cartCount');
  const subtotalEl = document.getElementById('cartSubtotal');
  const discountDisplay = document.getElementById('cartDiscountDisplay');
  const totalEl = document.getElementById('cartTotal');
  const payBtn = document.getElementById('posPayBtn');
  const payBtnTotal = document.getElementById('payBtnTotal');

  if (cart.length === 0) {
    container.innerHTML = '<div class="pos-cart-empty" id="cartEmpty"><i class="bi bi-cart-x"></i><span>Keranjang masih kosong</span><span style="font-size:0.72rem;color:var(--text-light);">Klik produk untuk menambahkan</span></div>';
    countEl.textContent = '0';
    subtotalEl.textContent = 'Rp 0';
    discountDisplay.textContent = '- Rp 0';
    totalEl.textContent = 'Rp 0';
    payBtnTotal.textContent = 'Rp 0';
    payBtn.disabled = true;
    return;
  }

  let html = '';
  cart.forEach(function(item) {
    const sub = item.qty * item.harga;
    html += '<div class="pos-cart-item">' +
      '<div class="pos-cart-item-info">' +
        '<div class="pos-cart-item-name">' + item.nama + '</div>' +
        '<div class="pos-cart-item-price">Rp ' + item.harga.toLocaleString('id-ID') + '</div>' +
      '</div>' +
      '<div class="pos-cart-item-qty">' +
        '<button onclick="updateQty(' + item.id + ', -1)"><i class="bi bi-dash"></i></button>' +
        '<input type="number" value="' + item.qty + '" min="1" max="' + item.stok + '" onchange="setQty(' + item.id + ', this.value)">' +
        '<button onclick="updateQty(' + item.id + ', 1)"><i class="bi bi-plus"></i></button>' +
      '</div>' +
      '<div class="pos-cart-item-subtotal">Rp ' + sub.toLocaleString('id-ID') + '</div>' +
      '<span class="pos-cart-item-remove" onclick="removeFromCart(' + item.id + ')" title="Hapus"><i class="bi bi-x"></i></span>' +
    '</div>';
  });
  container.innerHTML = html;

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.harga), 0);
  const discount = parseInt(document.getElementById('cartDiscount').value) || 0;
  const total = Math.max(0, subtotal - discount);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  countEl.textContent = totalItems;
  subtotalEl.textContent = 'Rp ' + subtotal.toLocaleString('id-ID');
  discountDisplay.textContent = '- Rp ' + discount.toLocaleString('id-ID');
  totalEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
  payBtnTotal.textContent = 'Rp ' + total.toLocaleString('id-ID');
  payBtn.disabled = false;
}

// ============================================================
// ADD ANIMATION
// ============================================================
function showAddAnimation(el) {
  el.style.transform = 'scale(0.95)';
  el.style.boxShadow = '0 0 0 2px var(--primary)';
  setTimeout(() => {
    el.style.transform = '';
    el.style.boxShadow = '';
  }, 200);
}

// ============================================================
// SEARCH & FILTER
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('posSearch');
  const productGrid = document.getElementById('posProductGrid');
  const categoryBtns = document.querySelectorAll('.pos-category-btn');
  let activeCategory = 'all';

  if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
      filterProducts();
    }, 200));
  }

  categoryBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      categoryBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.dataset.category;
      filterProducts();
    });
  });

  function filterProducts() {
    const search = searchInput.value.toLowerCase().trim();
    const cards = productGrid.querySelectorAll('.pos-product-card');

    cards.forEach(function(card) {
      const nama = card.dataset.nama.toLowerCase();
      const sku = card.dataset.sku.toLowerCase();
      const kat = card.dataset.kategori;

      const matchSearch = !search || nama.includes(search) || sku.includes(search);
      const matchCategory = activeCategory === 'all' || kat === activeCategory;

      card.style.display = (matchSearch && matchCategory) ? '' : 'none';
    });
  }

  // Discount input listener
  const discountInput = document.getElementById('cartDiscount');
  if (discountInput) {
    discountInput.addEventListener('input', renderCart);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // F2 = focus search
    if (e.key === 'F2') {
      e.preventDefault();
      searchInput.focus();
    }
    // F5 = open payment
    if (e.key === 'F5' && cart.length > 0) {
      e.preventDefault();
      openPaymentModal();
    }
    // Escape = clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      filterProducts();
      searchInput.blur();
    }
  });
});

// ============================================================
// PAYMENT MODAL
// ============================================================
function openPaymentModal() {
  if (cart.length === 0) return;

  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.harga), 0);
  const discount = parseInt(document.getElementById('cartDiscount').value) || 0;
  const total = Math.max(0, subtotal - discount);

  document.getElementById('paymentTotalDisplay').textContent = 'Rp ' + total.toLocaleString('id-ID');
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentChange').style.display = 'none';

  // Quick amount buttons
  generateQuickAmounts(total);

  const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
  modal.show();

  // Auto-select Cash
  selectPaymentMethod(document.querySelector('[data-method="Cash"]'));
}

function selectPaymentMethod(btn) {
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedPaymentMethod = btn.dataset.method;

  const cashGroup = document.getElementById('cashInputGroup');
  const quickBtns = document.getElementById('quickAmountBtns');

  if (selectedPaymentMethod === 'Cash') {
    cashGroup.style.display = '';
    quickBtns.style.display = '';
  } else {
    cashGroup.style.display = 'none';
    quickBtns.style.display = 'none';
    document.getElementById('paymentChange').style.display = 'none';
  }
}

function calculateChange() {
  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.harga), 0);
  const discount = parseInt(document.getElementById('cartDiscount').value) || 0;
  const total = Math.max(0, subtotal - discount);
  const paid = parseInt(document.getElementById('paymentAmount').value) || 0;
  const change = paid - total;

  const changeEl = document.getElementById('paymentChange');
  const changeValEl = document.getElementById('paymentChangeValue');

  if (paid > 0 && change >= 0) {
    changeEl.style.display = '';
    changeValEl.textContent = 'Rp ' + change.toLocaleString('id-ID');
  } else {
    changeEl.style.display = 'none';
  }
}

function generateQuickAmounts(total) {
  const container = document.getElementById('quickAmountBtns');
  if (!container) return;

  const amounts = [];
  const rounded = Math.ceil(total / 10000) * 10000;
  if (rounded > total) amounts.push(rounded);
  amounts.push(rounded + 10000, rounded + 20000, rounded + 50000);

  // Always include exact amount
  container.innerHTML = '<button class="btn btn-outline-primary btn-sm" onclick="setPaymentAmount(' + total + ')">Uang Pas</button>';
  amounts.forEach(function(amt) {
    container.innerHTML += '<button class="btn btn-outline-primary btn-sm" onclick="setPaymentAmount(' + amt + ')">Rp ' + amt.toLocaleString('id-ID') + '</button>';
  });
}

function setPaymentAmount(amount) {
  document.getElementById('paymentAmount').value = amount;
  calculateChange();
}

async function confirmPayment() {
  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.harga), 0);
  const discount = parseInt(document.getElementById('cartDiscount').value) || 0;
  const total = Math.max(0, subtotal - discount);
  const paid = selectedPaymentMethod === 'Cash' ? (parseInt(document.getElementById('paymentAmount').value) || 0) : total;
  const change = Math.max(0, paid - total);

  if (selectedPaymentMethod === 'Cash' && paid < total) {
    showToast('Nominal bayar kurang!', 'error');
    return;
  }

  const customerSelect = document.getElementById('cartCustomer');
  const pelanggan_id = customerSelect ? (parseInt(customerSelect.value) || null) : null;

  const payload = {
    pelanggan_id,
    items: cart.map(i => ({
      produk_id: i.id,
      qty: i.qty,
      harga: i.harga,
      diskon: 0
    })),
    subtotal,
    diskon: discount,
    total,
    metode_bayar: selectedPaymentMethod,
    bayar: paid,
    kembalian: change
  };

  try {
    const res = await fetch('/pos/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Gagal memproses transaksi.', 'error');
      return;
    }

    // Close modal
    const modalEl = document.getElementById('paymentModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    showToast('Transaksi ' + result.data.no_transaksi + ' berhasil disimpan!', 'success');

    // Buka jendela struk
    const strukUrl = '/pos/transaksi/' + result.data.id + '/struk';
    window.open(strukUrl, '_blank', 'width=400,height=600');

    // Reset keranjang
    cart = [];
    renderCart();
    if (document.getElementById('cartDiscount')) document.getElementById('cartDiscount').value = 0;

    // Kurangi visual stok di kartu produk secara instan
    payload.items.forEach(it => {
      const card = document.querySelector('.pos-product-card[data-id="' + it.produk_id + '"]');
      if (card) {
        let s = parseInt(card.dataset.stok) || 0;
        s = Math.max(0, s - it.qty);
        card.dataset.stok = s;
        const stockBadge = card.querySelector('.pos-stock-badge');
        if (stockBadge) stockBadge.textContent = 'Stok: ' + s;
      }
    });
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('Gagal menghubungi server transaksi.', 'error');
  }
}

