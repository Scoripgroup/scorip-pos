const db = require('../config/database');

const posService = {
  /**
   * Generate Nomor Transaksi: TRX-YYYYMMDD-XXXX
   */
  async generateNoTransaksi(trx = db) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `TRX-${yyyy}${mm}${dd}-`;

    const lastTrx = await trx('transaksi')
      .where('no_transaksi', 'like', `${datePrefix}%`)
      .orderBy('id', 'desc')
      .first();

    let seq = 1;
    if (lastTrx && lastTrx.no_transaksi) {
      const parts = lastTrx.no_transaksi.split('-');
      if (parts.length >= 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
    }

    return `${datePrefix}${String(seq).padStart(4, '0')}`;
  },

  /**
   * Simpan Transaksi Penjualan POS Kasir (Atomic Transaction)
   */
  async createTransaksi({
    pelanggan_id = null,
    kasir_id = null,
    kasir_nama = 'Kasir',
    items = [],
    subtotal = 0,
    diskon = 0,
    total = 0,
    metode_bayar = 'Cash',
    bayar = 0,
    kembalian = 0,
    catatan = null,
    resi = null
  }) {
    if (!items || items.length === 0) {
      throw new Error('Keranjang belanja kosong!');
    }

    return await db.transaction(async (trx) => {
      // 1. Validasi stok semua produk
      for (const item of items) {
        const prod = await trx('produk').where({ id: item.produk_id }).first();
        if (!prod) {
          throw new Error(`Produk dengan ID ${item.produk_id} tidak ditemukan.`);
        }
        if (prod.status !== 'aktif') {
          throw new Error(`Produk "${prod.nama}" berstatus nonaktif.`);
        }
        if (prod.stok < item.qty) {
          throw new Error(`Stok untuk "${prod.nama}" tidak mencukupi! Sisa stok: ${prod.stok}, diminta: ${item.qty}`);
        }
        item._produk = prod;
      }

      // 2. Generate nomor transaksi
      const no_transaksi = await posService.generateNoTransaksi(trx);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // 3. Insert header Transaksi
      const [transaksiId] = await trx('transaksi').insert({
        no_transaksi,
        tanggal: nowStr,
        pelanggan_id: pelanggan_id || null,
        kasir_id: kasir_id || null,
        kasir_nama,
        subtotal: Number(subtotal),
        diskon: Number(diskon),
        total: Number(total),
        metode_bayar,
        bayar: Number(bayar),
        kembalian: Number(kembalian),
        status: 'selesai',
        resi: resi || null,
        catatan: catatan || null
      });

      // 4. Insert detail transaksi & kurangi stok produk
      for (const item of items) {
        const prod = item._produk;
        const harga = Number(item.harga);
        const qty = Number(item.qty);
        const itemDiskon = Number(item.diskon || 0);
        const itemSubtotal = (harga * qty) - itemDiskon;
        const hargaBeli = prod.harga_beli || 0;
        const labaKotor = itemSubtotal - (hargaBeli * qty);

        await trx('transaksi_detail').insert({
          transaksi_id: transaksiId,
          produk_id: prod.id,
          nama_produk: prod.nama,
          qty,
          harga,
          harga_beli: hargaBeli,
          diskon: itemDiskon,
          subtotal: itemSubtotal,
          laba_kotor: labaKotor
        });

        // Kurangi stok produk secara atomik
        await trx('produk')
          .where({ id: prod.id })
          .decrement('stok', qty);
      }

      // 5. Update total transaksi pelanggan jika ada pelanggan_id
      if (pelanggan_id) {
        // Kolom pelanggan tidak memiliki kolom count transaksi khusus, tapi relasi FK aktif
      }

      return {
        id: transaksiId,
        no_transaksi,
        total,
        kembalian
      };
    });
  },

  /**
   * Batalkan Transaksi dan kembalikan stok
   */
  async cancelTransaksi(transaksiId) {
    return await db.transaction(async (trx) => {
      const transaksi = await trx('transaksi').where({ id: transaksiId }).first();
      if (!transaksi) {
        throw new Error('Transaksi tidak ditemukan.');
      }
      if (transaksi.status === 'batal') {
        throw new Error('Transaksi sudah dibatalkan sebelumnya.');
      }

      const details = await trx('transaksi_detail').where({ transaksi_id: transaksiId });

      // Kembalikan stok untuk tiap produk
      for (const item of details) {
        await trx('produk')
          .where({ id: item.produk_id })
          .increment('stok', item.qty);
      }

      await trx('transaksi')
        .where({ id: transaksiId })
        .update({ status: 'batal' });

      return transaksi;
    });
  }
};

module.exports = posService;
