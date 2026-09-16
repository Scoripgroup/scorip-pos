const db = require('../config/database');
const posService = require('../services/posService');
const { logAction } = require('../middlewares/audit');

const posController = {
  // Halaman Utama Kasir POS
  async index(req, res) {
    try {
      const kategori = await db('kategori').orderBy('nama', 'asc');
      const produk = await db('produk')
        .leftJoin('kategori', 'produk.kategori_id', 'kategori.id')
        .select(
          'produk.*',
          'kategori.nama as kategori_nama'
        )
        .where('produk.status', 'aktif')
        .orderBy('produk.nama', 'asc');

      const pelanggan = await db('pelanggan').orderBy('nama', 'asc');

      if (req.session?.user?.role !== 'Admin') {
        produk.forEach((p) => {
          delete p.harga_beli;
        });
      }

      res.render('pages/pos/index', {
        title: 'POS Kasir — SCORIP POS',
        activePage: 'pos',
        kategori,
        produk,
        pelanggan
      });
    } catch (err) {
      console.error('Error loading POS:', err);
      req.flash('error', 'Gagal memuat katalog POS.');
      res.redirect('/dashboard');
    }
  },

  // Simpan Transaksi Penjualan (AJAX POST)
  async simpanTransaksi(req, res) {
    try {
      const {
        pelanggan_id,
        items,
        subtotal,
        diskon,
        total,
        metode_bayar,
        bayar,
        kembalian,
        catatan,
        resi
      } = req.body;

      const user = req.session?.user;
      const result = await posService.createTransaksi({
        pelanggan_id: pelanggan_id || null,
        kasir_id: user?.id || null,
        kasir_nama: user?.nama || 'Kasir',
        items,
        subtotal,
        diskon,
        total,
        metode_bayar,
        bayar,
        kembalian,
        catatan,
        resi
      });

      await logAction(
        req,
        'TRANSAKSI_POS',
        `Transaksi baru #${result.no_transaksi} total ${result.total} via ${metode_bayar}`
      );

      res.json({
        success: true,
        message: 'Transaksi berhasil disimpan!',
        data: result
      });
    } catch (err) {
      console.error('Error simpan transaksi:', err);
      res.status(400).json({
        success: false,
        message: err.message || 'Gagal menyimpan transaksi.'
      });
    }
  },

  // Riwayat Transaksi
  async riwayat(req, res) {
    try {
      const { search, metode, tanggal } = req.query;

      let query = db('transaksi')
        .leftJoin('pelanggan', 'transaksi.pelanggan_id', 'pelanggan.id')
        .select(
          'transaksi.*',
          'pelanggan.nama as pelanggan_nama'
        )
        .orderBy('transaksi.id', 'desc');

      if (search) {
        query = query.where((qb) => {
          qb.where('transaksi.no_transaksi', 'like', `%${search}%`)
            .orWhere('pelanggan.nama', 'like', `%${search}%`);
        });
      }

      if (metode) {
        query = query.where('transaksi.metode_bayar', metode);
      }

      if (tanggal) {
        query = query.where('transaksi.tanggal', 'like', `${tanggal}%`);
      }

      const transaksi = await query.limit(100);

      // Ambil detail ringkasan item untuk tiap transaksi
      const trxIds = transaksi.map((t) => t.id);
      let details = [];
      if (trxIds.length > 0) {
        details = await db('transaksi_detail').whereIn('transaksi_id', trxIds);
      }

      transaksi.forEach((t) => {
        t.pelanggan = t.pelanggan_nama || 'Pelanggan Umum';
        t.items = details.filter((d) => d.transaksi_id === t.id);
        t.total_item = t.items.reduce((sum, item) => sum + item.qty, 0);
      });

      res.render('pages/pos/riwayat', {
        title: 'Riwayat Transaksi — SCORIP POS',
        activePage: 'pos-riwayat',
        transaksi,
        filters: { search, metode, tanggal }
      });
    } catch (err) {
      console.error('Error loading riwayat transaksi:', err);
      req.flash('error', 'Gagal memuat riwayat transaksi.');
      res.redirect('/pos');
    }
  },

  // Detail Transaksi
  async detail(req, res) {
    try {
      const { id } = req.params;
      const transaksi = await db('transaksi')
        .leftJoin('pelanggan', 'transaksi.pelanggan_id', 'pelanggan.id')
        .select('transaksi.*', 'pelanggan.nama as pelanggan_nama', 'pelanggan.no_hp as pelanggan_hp')
        .where('transaksi.id', id)
        .first();

      if (!transaksi) {
        req.flash('error', 'Transaksi tidak ditemukan.');
        return res.redirect('/pos/riwayat');
      }

      const items = await db('transaksi_detail').where({ transaksi_id: id });

      transaksi.kasir = transaksi.kasir_nama || 'Kasir';
      transaksi.pelanggan = transaksi.pelanggan_nama || 'Pelanggan Umum';

      res.render('pages/pos/detail', {
        title: `Detail Transaksi ${transaksi.no_transaksi} — SCORIP POS`,
        activePage: 'pos-riwayat',
        transaksi,
        detail: items,
        items
      });
    } catch (err) {
      console.error('Error loading detail transaksi:', err);
      req.flash('error', 'Gagal memuat data transaksi.');
      res.redirect('/pos/riwayat');
    }
  },

  // Cetak Struk Transaksi
  async cetakStruk(req, res) {
    try {
      const { id } = req.params;
      const transaksi = await db('transaksi')
        .leftJoin('pelanggan', 'transaksi.pelanggan_id', 'pelanggan.id')
        .select('transaksi.*', 'pelanggan.nama as pelanggan_nama')
        .where('transaksi.id', id)
        .first();

      if (!transaksi) {
        return res.status(404).send('Transaksi tidak ditemukan.');
      }

      const items = await db('transaksi_detail').where({ transaksi_id: id });

      // Ambil pengaturan struk
      const settingsRows = await db('settings').select('key', 'value');
      const settings = {};
      settingsRows.forEach((r) => {
        settings[r.key] = r.value;
      });

      transaksi.kasir = transaksi.kasir_nama || 'Kasir';
      transaksi.pelanggan = transaksi.pelanggan_nama || 'Pelanggan Umum';

      settings.header_struk = settings.struk_header || settings.header_struk || '';
      settings.footer_struk = settings.struk_footer || settings.footer_struk || '';
      settings.nama_aplikasi = settings.nama_toko || settings.nama_aplikasi || 'SCORIP STORE';

      res.render('pages/pos/struk', {
        layout: 'layouts/print',
        title: `Struk #${transaksi.no_transaksi}`,
        transaksi,
        detail: items,
        items,
        settings
      });
    } catch (err) {
      console.error('Error cetak struk:', err);
      res.status(500).send('Gagal membuat struk transaksi.');
    }
  },

  // Input / Update Nomor Resi
  async updateResi(req, res) {
    try {
      const { id } = req.params;
      const { resi } = req.body;

      await db('transaksi').where({ id }).update({ resi });
      await logAction(req, 'UPDATE_RESI', `Update resi transaksi #${id}: ${resi}`);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Nomor resi berhasil diperbarui.' });
      }

      req.flash('success', 'Nomor resi berhasil diperbarui.');
      res.redirect(`/pos/transaksi/${id}`);
    } catch (err) {
      console.error('Error update resi:', err);
      if (req.xhr) return res.status(400).json({ success: false, message: err.message });
      req.flash('error', 'Gagal memperbarui nomor resi.');
      res.redirect('/pos/riwayat');
    }
  },

  // Update Status Transaksi (Selesai / Diproses / Batal)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status === 'batal') {
        await posService.cancelTransaksi(id);
        await logAction(req, 'BATAL_TRANSAKSI', `Transaksi #${id} dibatalkan dan stok dikembalikan.`);
      } else {
        await db('transaksi').where({ id }).update({ status });
        await logAction(req, 'UPDATE_STATUS_TRANSAKSI', `Transaksi #${id} status diubah ke ${status}`);
      }

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Status transaksi berhasil diubah.' });
      }

      req.flash('success', 'Status transaksi berhasil diperbarui.');
      res.redirect(`/pos/transaksi/${id}`);
    } catch (err) {
      console.error('Error update status transaksi:', err);
      if (req.xhr) return res.status(400).json({ success: false, message: err.message });
      req.flash('error', err.message || 'Gagal mengubah status transaksi.');
      res.redirect('/pos/riwayat');
    }
  }
};

module.exports = posController;
