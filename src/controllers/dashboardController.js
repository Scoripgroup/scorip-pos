const db = require('../config/database');

const dashboardController = {
  async index(req, res) {
    try {
      const todayStr = new Date().toISOString().substring(0, 10);
      const thisMonthStr = todayStr.substring(0, 7);

      // 1. Stat cards
      const totalProdukRes = await db('produk').where('status', 'aktif').count('id as count').first();
      const totalProduk = totalProdukRes ? totalProdukRes.count : 0;

      const trxTodayRes = await db('transaksi')
        .where('tanggal', 'like', `${todayStr}%`)
        .whereNot('status', 'batal')
        .count('id as count')
        .first();
      const transaksiHariIni = trxTodayRes ? trxTodayRes.count : 0;

      const pendapatanBulanRes = await db('transaksi')
        .where('tanggal', 'like', `${thisMonthStr}%`)
        .whereNot('status', 'batal')
        .sum('total as sum')
        .first();
      const pendapatanBulan = pendapatanBulanRes && pendapatanBulanRes.sum ? Number(pendapatanBulanRes.sum) : 0;

      const stokAlertRes = await db('produk')
        .where('status', 'aktif')
        .whereRaw('stok <= stok_minimum')
        .count('id as count')
        .first();
      const stokAlert = stokAlertRes ? stokAlertRes.count : 0;

      // 2. Transaksi Terakhir (5 baris)
      const trxTerakhir = await db('transaksi')
        .leftJoin('pelanggan', 'transaksi.pelanggan_id', 'pelanggan.id')
        .select(
          'transaksi.*',
          'pelanggan.nama as pelanggan_nama'
        )
        .orderBy('transaksi.id', 'desc')
        .limit(5);

      const transaksiList = trxTerakhir.map((t) => ({
        id: t.id,
        no_transaksi: t.no_transaksi,
        pelanggan: t.pelanggan_nama || 'Pelanggan Umum',
        total: t.total,
        status: t.status
      }));

      // 3. Penjualan 7 Hari Terakhir
      const dayLabels = [];
      const dayData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().substring(0, 10);
        const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        dayLabels.push(label);

        const daySum = await db('transaksi')
          .where('tanggal', 'like', `${dStr}%`)
          .whereNot('status', 'batal')
          .sum('total as sum')
          .first();

        dayData.push(daySum && daySum.sum ? Number(daySum.sum) : 0);
      }

      // 4. Penjualan per Kategori
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

      const katLabels = katSales.length > 0 ? katSales.map((k) => k.kat_nama) : ['Umum'];
      const katValues = katSales.length > 0 ? katSales.map((k) => Number(k.total)) : [1];

      // 5. Produk Terlaris
      const topProducts = await db('transaksi_detail')
        .select(
          'nama_produk',
          db.raw('SUM(qty) as total_qty')
        )
        .groupBy('nama_produk')
        .orderBy('total_qty', 'desc')
        .limit(5);

      const topLabels = topProducts.length > 0 ? topProducts.map((p) => p.nama_produk) : ['Belum ada penjualan'];
      const topValues = topProducts.length > 0 ? topProducts.map((p) => Number(p.total_qty)) : [0];

      const dashboardData = {
        total_produk: totalProduk,
        transaksi_hari_ini: transaksiHariIni,
        pendapatan_bulan: pendapatanBulan,
        stok_alert: stokAlert,
        transaksi_terakhir: transaksiList,
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

      res.render('pages/dashboard/index', {
        title: 'Dashboard — SCORIP POS',
        activePage: 'dashboard',
        user: req.session?.user || { nama: 'Admin' },
        data: dashboardData
      });
    } catch (err) {
      console.error('Error dashboard:', err);
      req.flash('error', 'Gagal memuat statistik dashboard.');
      res.render('pages/dashboard/index', {
        title: 'Dashboard — SCORIP POS',
        activePage: 'dashboard',
        user: req.session?.user || { nama: 'Admin' },
        data: {
          total_produk: 0,
          transaksi_hari_ini: 0,
          pendapatan_bulan: 0,
          stok_alert: 0,
          transaksi_terakhir: [],
          penjualan_7hari: { labels: [], data: [] },
          penjualan_kategori: { labels: [], data: [] },
          produk_terlaris: { labels: [], data: [] }
        }
      });
    }
  }
};

module.exports = dashboardController;
