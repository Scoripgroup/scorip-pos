/**
 * SCORIP POS — Katalog Publik JS
 */
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('katalogSearch');
  const grid = document.getElementById('katalogGrid');
  const categoryBtns = document.querySelectorAll('.pos-category-btn');
  let activeCategory = 'all';

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterKatalog();
    });
  }

  // Category filter
  categoryBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      categoryBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.dataset.category;
      filterKatalog();
    });
  });

  function filterKatalog() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = grid.querySelectorAll('.katalog-product-card');

    cards.forEach(function(card) {
      const nama = card.dataset.nama || '';
      const kat = card.dataset.kategori || '';

      const matchSearch = !search || nama.includes(search);
      const matchCategory = activeCategory === 'all' || kat === activeCategory;

      card.style.display = (matchSearch && matchCategory) ? '' : 'none';
    });
  }
});

// WhatsApp order
function orderViaWA(nama, harga) {
  const phone = document.querySelector('[data-phone]')?.dataset.phone || '';
  const pesan = encodeURIComponent(
    'Halo, saya tertarik dengan produk:\n\n' +
    '*' + nama + '*\n' +
    'Harga: Rp ' + parseInt(harga).toLocaleString('id-ID') + '\n\n' +
    'Apakah masih tersedia?'
  );
  window.open('https://wa.me/' + phone + '?text=' + pesan, '_blank');
}
