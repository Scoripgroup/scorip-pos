/**
 * SCORIP POS — Produk Page Interactivity
 * Includes live search, category/status filters, stock pills, 
 * inline quick-stock updates with AJAX, and quick view detail modal.
 */

let currentStockFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchProduk');
  const filterKategori = document.getElementById('filterKategori');
  const filterStatus = document.getElementById('filterStatus');
  const table = document.getElementById('produkTable');
  const visibleCountEl = document.getElementById('visibleCount');

  // Filter Table Handler
  window.filterTable = function() {
    if (!table) return;
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const kat = filterKategori ? filterKategori.value : '';
    const status = filterStatus ? filterStatus.value : '';
    const rows = table.querySelectorAll('tbody tr.product-row');
    const noResultsRow = document.getElementById('noResultsRow');
    let count = 0;

    rows.forEach(function(row) {
      const text = row.textContent.toLowerCase();
      const rowKat = row.dataset.kategori || '';
      const rowStatus = row.dataset.status || '';
      const rowStockState = row.dataset.stockState || 'normal';

      const matchSearch = !search || text.includes(search);
      const matchKat = !kat || rowKat === kat;
      const matchStatus = !status || rowStatus === status;
      const matchStockPill = (currentStockFilter === 'all') || 
                             (currentStockFilter === 'menipis' && rowStockState === 'menipis') ||
                             (currentStockFilter === 'habis' && rowStockState === 'habis');

      const isVisible = matchSearch && matchKat && matchStatus && matchStockPill;
      row.style.display = isVisible ? '' : 'none';
      if (isVisible) count++;
    });

    if (noResultsRow) {
      noResultsRow.style.display = (count === 0 && rows.length > 0) ? '' : 'none';
    }

    if (visibleCountEl) {
      visibleCountEl.textContent = count;
    }
  };

  // Filter Stock Status Pills (All, Menipis, Habis)
  window.filterStockStatus = function(type) {
    currentStockFilter = type;
    const pillAll = document.getElementById('pillAll');
    const pillLow = document.getElementById('pillLow');
    const pillOut = document.getElementById('pillOut');

    if (pillAll) pillAll.classList.toggle('active', type === 'all');
    if (pillLow) pillLow.classList.toggle('active', type === 'menipis');
    if (pillOut) pillOut.classList.toggle('active', type === 'habis');

    filterTable();
  };

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', typeof debounce === 'function' ? debounce(filterTable, 150) : filterTable);
  }
  if (filterKategori) filterKategori.addEventListener('change', filterTable);
  if (filterStatus) filterStatus.addEventListener('change', filterTable);

  // Initialize tooltips for colorful action buttons (view, edit, barcode)
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const actionBtns = document.querySelectorAll('.btn-action-view, .btn-action-edit, .btn-action-barcode');
    actionBtns.forEach(function(btn) {
      new bootstrap.Tooltip(btn, { boundary: 'window' });
    });
  }
});

// ============================================================
// QUICK STOCK MODAL (AJAX Inline Update)
// ============================================================
let activeProductStockData = null;

window.openQuickStockModal = function(id, name, currentStock, minStock, unit) {
  activeProductStockData = { id, name, minStock, unit };
  
  const idInput = document.getElementById('qsProductId');
  const titleSpan = document.getElementById('qsProductTitle');
  const stockInput = document.getElementById('qsStockInput');
  const unitSpan = document.getElementById('qsUnitText');

  if (idInput) idInput.value = id;
  if (titleSpan) titleSpan.textContent = name + ' (Batas Min: ' + minStock + ' ' + unit + ')';
  if (stockInput) stockInput.value = currentStock;
  if (unitSpan) unitSpan.textContent = unit;

  const modalEl = document.getElementById('quickStockModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    setTimeout(() => {
      if (stockInput) {
        stockInput.focus();
        stockInput.select();
      }
    }, 200);
  }
};

window.adjustQuickStock = function(amount) {
  const stockInput = document.getElementById('qsStockInput');
  if (!stockInput) return;
  let val = parseInt(stockInput.value) || 0;
  val = Math.max(0, val + amount);
  stockInput.value = val;
};

window.submitQuickStock = async function() {
  const idInput = document.getElementById('qsProductId');
  const stockInput = document.getElementById('qsStockInput');
  const btn = document.getElementById('btnSaveQuickStock');
  if (!idInput || !stockInput || !activeProductStockData) return;

  const id = idInput.value;
  const newStok = parseInt(stockInput.value);

  if (isNaN(newStok) || newStok < 0) {
    if (typeof showToast === 'function') showToast('Nilai stok harus angka positif.', 'warning');
    return;
  }

  const origBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...';
  }

  try {
    const res = await fetch('/api/produk/' + id + '/stok-inline', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stok: newStok })
    });

    const data = await res.json();

    if (data.success) {
      // Update UI row directly
      const row = document.getElementById('row-produk-' + id);
      const badge = document.getElementById('stock-badge-' + id);
      const minStock = activeProductStockData.minStock || 0;

      let newState = 'normal';
      if (newStok <= 0) newState = 'habis';
      else if (newStok <= minStock) newState = 'menipis';

      if (row) {
        row.dataset.stockState = newState;
      }

      if (badge) {
        if (newStok <= 0) {
          badge.className = 'badge-status nonaktif';
          badge.textContent = 'Habis';
        } else if (newStok <= minStock) {
          badge.className = 'badge-status diproses';
          badge.textContent = newStok;
          badge.title = 'Di bawah batas minimum (' + minStock + ')';
        } else {
          badge.className = '';
          badge.style.fontWeight = '600';
          badge.style.fontSize = '0.85rem';
          badge.textContent = newStok;
        }
      }

      // Close modal
      const modalEl = document.getElementById('quickStockModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }

      if (typeof showToast === 'function') {
        showToast('Stok produk ' + activeProductStockData.name + ' berhasil diupdate ke ' + newStok + '!', 'success');
      }

      if (typeof window.filterTable === 'function') {
        window.filterTable();
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Gagal mengubah stok.', 'error');
      }
    }
  } catch (err) {
    console.error('Quick stock error:', err);
    if (typeof showToast === 'function') {
      showToast('Koneksi gagal saat memperbarui stok.', 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnHtml;
    }
  }
};

// ============================================================
// DETAIL MODAL (Quick View)
// ============================================================
window.openDetailModal = function(prod) {
  if (!prod) return;

  const fotoImg = document.getElementById('detailFoto');
  const placeholder = document.getElementById('detailFotoPlaceholder');
  if (fotoImg && placeholder) {
    if (prod.foto) {
      fotoImg.src = prod.foto;
      fotoImg.style.display = 'block';
      placeholder.style.display = 'none';
    } else {
      fotoImg.src = '';
      fotoImg.style.display = 'none';
      placeholder.style.display = 'block';
    }
  }

  const namaEl = document.getElementById('detailNama');
  const skuEl = document.getElementById('detailSku');
  const katEl = document.getElementById('detailKategori');
  const satEl = document.getElementById('detailSatuan');
  const statusEl = document.getElementById('detailStatus');
  const beliEl = document.getElementById('detailHargaBeli');
  const jualEl = document.getElementById('detailHargaJual');
  const marginEl = document.getElementById('detailMargin');
  const stokEl = document.getElementById('detailStok');
  const barcodeLink = document.getElementById('detailBarcodeLink');
  const editLink = document.getElementById('detailEditLink');

  const beli = prod.harga_beli || 0;
  const jual = prod.harga_jual || 0;
  const marginNominal = jual - beli;
  const marginPct = (beli > 0) ? ((marginNominal / beli) * 100).toFixed(1) : 0;

  if (namaEl) namaEl.textContent = prod.nama || '-';
  if (skuEl) skuEl.textContent = 'SKU: ' + (prod.sku || '-');
  if (katEl) katEl.textContent = prod.kategori || '-';
  if (satEl) satEl.textContent = prod.satuan || 'pcs';
  if (statusEl) {
    statusEl.className = 'badge-status ' + (prod.status || 'aktif');
    statusEl.textContent = (prod.status || 'aktif').toUpperCase();
  }

  if (beliEl) beliEl.textContent = 'Rp ' + beli.toLocaleString('id-ID');
  if (jualEl) jualEl.textContent = 'Rp ' + jual.toLocaleString('id-ID');
  if (marginEl) {
    marginEl.textContent = 'Rp ' + marginNominal.toLocaleString('id-ID') + ' (' + marginPct + '%)';
    marginEl.style.color = marginNominal >= 0 ? 'var(--success)' : 'var(--danger)';
  }

  if (stokEl) {
    stokEl.textContent = (prod.stok || 0) + ' ' + (prod.satuan || 'pcs') + ' (Min: ' + (prod.stok_minimum || 0) + ')';
    if ((prod.stok || 0) <= 0) {
      stokEl.style.color = 'var(--danger)';
    } else if ((prod.stok || 0) <= (prod.stok_minimum || 0)) {
      stokEl.style.color = 'var(--warning)';
    } else {
      stokEl.style.color = 'var(--text-primary)';
    }
  }

  if (barcodeLink) barcodeLink.href = '/produk/barcode?id=' + prod.id;
  if (editLink) editLink.href = '/produk/' + prod.id + '/edit';

  const modalEl = document.getElementById('detailModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
};
