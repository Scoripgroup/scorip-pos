const db = require('../config/database');

const poService = {
  /**
   * Hitung kalkulasi Landed Cost PO Import
   */
  calculateTotals(items = [], kurs_rmb = 0, biaya_forwarder = 0, ongkir_lokal = 0, base_type = 'kurs', nominal_tf = 0) {
    const total_rmb = items.reduce((sum, item) => {
      const sub = Number(item.qty || 0) * Number(item.harga_rmb || 0);
      item.subtotal_rmb = sub;
      return sum + sub;
    }, 0);

    const kurs = Number(kurs_rmb) || 0;
    const tf = Number(nominal_tf) || 0;
    const total_idr = base_type === 'nominal_tf' && tf > 0 ? tf : Math.round(total_rmb * kurs);
    const landed_cost = total_idr + Number(biaya_forwarder || 0) + Number(ongkir_lokal || 0);

    return {
      total_rmb: Math.round(total_rmb * 100) / 100,
      total_idr,
      landed_cost
    };
  },

  /**
   * Terima PO dan Sinkronisasi Penambahan Stok Produk (Database Transaction)
   */
  async receivePO(poId, user = null) {
    return await db.transaction(async (trx) => {
      const po = await trx('po_import').where({ id: poId }).first();
      if (!po) {
        throw new Error('PO tidak ditemukan.');
      }

      if (po.status === 'Diterima') {
        throw new Error('PO ini sudah pernah diterima sebelumnya.');
      }

      const items = await trx('po_detail').where({ po_id: poId });

      // Tambahkan stok tiap produk di PO
      for (const item of items) {
        await trx('produk')
          .where({ id: item.produk_id })
          .increment('stok', item.qty);
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Update status PO
      await trx('po_import')
        .where({ id: poId })
        .update({
          status: 'Diterima',
          updated_at: db.fn.now()
        });

      // Tambahkan riwayat status
      await trx('po_status_history').insert({
        po_id: poId,
        status: 'Diterima',
        tanggal: nowStr,
        catatan: 'Barang diterima dan stok otomatis masuk ke inventaris sistem.',
        created_by: user?.nama || 'Administrator'
      });

      return { success: true, message: 'Barang PO berhasil diterima dan stok telah bertambah.' };
    });
  }
};

module.exports = poService;
