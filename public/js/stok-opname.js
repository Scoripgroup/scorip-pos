/**
 * SCORIP POS — Stok Opname JS
 */
function loadStokSistem(select) {
  const row = select.closest('tr');
  const stokSistemEl = row.querySelector('.stok-sistem');
  const option = select.options[select.selectedIndex];
  const stok = option.dataset.stok || '-';
  stokSistemEl.textContent = stok;
}

function calcSelisih(input) {
  const row = input.closest('tr');
  const stokSistemEl = row.querySelector('.stok-sistem');
  const selisihEl = row.querySelector('.selisih');
  const sistem = parseInt(stokSistemEl.textContent) || 0;
  const fisik = parseInt(input.value) || 0;
  const selisih = fisik - sistem;

  if (selisih < 0) {
    selisihEl.textContent = selisih;
    selisihEl.style.color = 'var(--danger)';
  } else if (selisih > 0) {
    selisihEl.textContent = '+' + selisih;
    selisihEl.style.color = 'var(--success)';
  } else {
    selisihEl.textContent = '0';
    selisihEl.style.color = 'var(--text-muted)';
  }
}

function addOpnameRow() {
  const tbody = document.getElementById('opnameBody');
  const firstRow = tbody.querySelector('tr');
  const newRow = firstRow.cloneNode(true);
  // Reset values
  newRow.querySelector('select').value = '';
  newRow.querySelector('.stok-sistem').textContent = '-';
  newRow.querySelector('.stok-fisik').value = '';
  newRow.querySelector('.selisih').textContent = '-';
  newRow.querySelector('[name="catatan[]"]').value = '';
  tbody.appendChild(newRow);
}

function removeOpnameRow(btn) {
  const tbody = document.getElementById('opnameBody');
  if (tbody.querySelectorAll('tr').length <= 1) return;
  btn.closest('tr').remove();
}
