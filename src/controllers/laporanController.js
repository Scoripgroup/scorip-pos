const db = require('../config/database');

const laporanController = {
  async index(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let query = db('transaksi')
        .leftJoin('pelanggan', 'transaksi.pelanggan_id', 'pelanggan.id')
        .select(
          'transaksi.*',
          'pelanggan.nama as pelanggan_nama'
        )
        .whereNot('transaksi.status', 'batal')
        .orderBy('transaksi.id', 'desc');

      if (start_date) {
        query = query.where('transaksi.tanggal', '>=', `${start_date} 00:00:00`);
      }
      if (end_date) {
        query = query.where('transaksi.tanggal', '<=', `${end_date} 23:59:59`);
      }

      const rows = await query.limit(100);

      const transaksi = rows.map((r) => ({
        id: r.id,
        no_transaksi: r.no_transaksi,
        tanggal: r.tanggal,
        pelanggan: r.pelanggan_nama || 'Pelanggan Umum',
        total: r.total,
        metode_bayar: r.metode_bayar,
        status: r.status
      }));

      // Agregasi angka
      const totalPenjualan = rows.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const totalDiskon = rows.reduce((sum, r) => sum + Number(r.diskon || 0), 0);
      const totalTransaksi = rows.length;
      const rataTransaksi = totalTransaksi > 0 ? Math.round(totalPenjualan / totalTransaksi) : 0;

      // 7 Hari Terakhir
      const dayLabels = [];
      const dayData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().substring(0, 10);
        dayLabels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

        const dSum = rows
          .filter((r) => r.tanggal.startsWith(dStr))
          .reduce((sum, r) => sum + Number(r.total || 0), 0);

        dayData.push(dSum);
      }

      // Kategori
      const katSales = await db('transaksi_detail')
        .join('produk', 'transaksi_detail.produk_id', 'produk.id')
        .leftJoin('kategori', 'produk.kategori_id', 'kategori.id')
        .select(
          db.raw("COALESCE(kategori.nama, 'Lainnya') as kat_nama"),
          db.raw('SUM(transaksi_detail.subtotal) as total')
        )
        .groupBy('kategori.nama')
        .orderBy('total', 'desc')
        .limit(5);

      const katLabels = katSales.length > 0 ? katSales.map((k) => k.kat_nama) : ['Elektronik', 'Fashion', 'Aksesoris'];
      const katValues = katSales.length > 0 ? katSales.map((k) => Number(k.total)) : [100000, 50000, 30000];

      // Produk Terlaris
      const topProducts = await db('transaksi_detail')
        .select(
          'nama_produk',
          db.raw('SUM(qty) as total_qty')
        )
        .groupBy('nama_produk')
        .orderBy('total_qty', 'desc')
        .limit(5);

      const topLabels = topProducts.length > 0 ? topProducts.map((p) => p.nama_produk) : ['Produk 1'];
      const topValues = topProducts.length > 0 ? topProducts.map((p) => Number(p.total_qty)) : [10];

      const reportData = {
        total_penjualan: totalPenjualan,
        total_diskon: totalDiskon,
        total_transaksi: totalTransaksi,
        rata_transaksi: rataTransaksi,
        penjualan_7hari: {
          labels: dayLabels,
          data: dayData
        },
        penjualan_kategori: {
          labels: katLabels,
          data: katValues
        },
        produk_terlaris: {
          labels: topLabels,
          data: topValues
        }
      };

      res.render('pages/laporan/index', {
        title: 'Laporan — SCORIP POS',
        activePage: 'laporan',
        transaksi,
        data: reportData,
        filters: { start_date, end_date }
      });
    } catch (err) {
      console.error('Error laporan:', err);
      req.flash('error', 'Gagal memuat laporan.');
      res.redirect('/dashboard');
    }
  }
};

module.exports = laporanController;
