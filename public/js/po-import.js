/**
 * SCORIP POS — PO Import JS
 */
function addPORow() {
  const tbody = document.getElementById('poItemsBody');
  const firstRow = tbody.querySelector('tr');
  const newRow = firstRow.cloneNode(true);
  newRow.querySelector('select').value = '';
  newRow.querySelector('[name="item_qty[]"]').value = 1;
  newRow.querySelector('[name="item_harga_rmb[]"]').value = 0;
  newRow.querySelector('[name="item_koli[]"]').value = 1;
  newRow.querySelector('.item-total-rmb').textContent = '¥ 0';
  tbody.appendChild(newRow);
}

function removePORow(btn) {
  const tbody = document.getElementById('poItemsBody');
  if (tbody.querySelectorAll('tr').length <= 1) return;
  btn.closest('tr').remove();
  calcPO();
}

function calcPO() {
  const rows = document.querySelectorAll('#poItemsBody tr');
  let totalRmb = 0;

  rows.forEach(function(row) {
    const qty = parseInt(row.querySelector('[name="item_qty[]"]').value) || 0;
    const harga = parseFloat(row.querySelector('[name="item_harga_rmb[]"]').value) || 0;
    const rowTotal = qty * harga;
    row.querySelector('.item-total-rmb').textContent = '¥ ' + rowTotal.toLocaleString('id-ID');
    totalRmb += rowTotal;
  });

  const kurs = parseInt(document.getElementById('kursRmb').value) || 0;
  const biayaForwarder = parseInt(document.getElementById('biayaForwarder').value) || 0;
  const ongkirLokal = parseInt(document.getElementById('ongkirLokal').value) || 0;
  const baseType = document.getElementById('baseType').value;

  const totalIdr = baseType === 'kurs' ? totalRmb * kurs : (parseInt(document.querySelector('[name="nominal_tf"]')?.value) || totalRmb * kurs);
  const totalBiaya = biayaForwarder + ongkirLokal;
  const landedCost = totalIdr + totalBiaya;

  document.getElementById('totalRmb').textContent = '¥ ' + totalRmb.toLocaleString('id-ID');
  document.getElementById('totalIdr').textContent = 'Rp ' + totalIdr.toLocaleString('id-ID');
  document.getElementById('totalBiaya').textContent = 'Rp ' + totalBiaya.toLocaleString('id-ID');
  document.getElementById('totalLanded').textContent = 'Rp ' + landedCost.toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', function() {
  calcPO();
});
