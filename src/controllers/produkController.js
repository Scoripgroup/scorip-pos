const db = require('../config/database');
const { logAction } = require('../middlewares/audit');

const produkController = {
  // List Produk
  async index(req, res) {
    try {
      const { search, kategori, status } = req.query;

      let query = db('produk')
        .leftJoin('kategori', 'produk.kategori_id', 'kategori.id')
        .select(
          'produk.*',
          'kategori.nama as kategori'
        )
        .orderBy('produk.id', 'desc');

      if (search) {
        query = query.where((qb) => {
          qb.where('produk.nama', 'like', `%${search}%`)
            .orWhere('produk.sku', 'like', `%${search}%`);
        });
      }

      if (kategori) {
        query = query.where('kategori.nama', kategori);
      }

      if (status) {
        query = query.where('produk.status', status);
      }

      const produk = await query;
      const kategoriList = await db('kategori').orderBy('nama', 'asc');
      const isAdmin = Boolean(req.session?.user?.role === 'Admin');

      // Hitung ringkasan inventaris untuk kartu statistik sebelum disanitasi
      const totalNilaiStok = isAdmin
        ? produk.reduce((acc, p) => acc + ((p.stok || 0) * (p.harga_beli || 0)), 0)
        : null;

      // Sanitasi harga_beli untuk user selain Admin
      if (!isAdmin) {
        produk.forEach((p) => {
          delete p.harga_beli;
        });
      }

      // Ambil alert stok minimum (stok <= stok_minimum)
      const stokAlertItems = produk.filter((p) => p.status === 'aktif' && p.stok <= p.stok_minimum);
      const stokRendahCount = produk.filter((p) => p.status === 'aktif' && p.stok > 0 && p.stok <= p.stok_minimum).length;
      const stokHabisCount = produk.filter((p) => (p.stok || 0) <= 0).length;

      res.render('pages/produk/index', {
        title: 'Manajemen Produk — SCORIP POS',
        activePage: 'produk',
        produk,
        kategori: kategoriList,
        stokAlertItems,
        stats: {
          total: produk.length,
          nilaiStok: totalNilaiStok,
          stokRendah: stokRendahCount,
          stokHabis: stokHabisCount
        },
        filters: { search, kategori, status }
      });
    } catch (err) {
      console.error('Error loading produk:', err);
      req.flash('error', 'Gagal memuat data produk.');
      res.redirect('/dashboard');
    }
  },

  // Form Tambah Produk
  async formTambah(req, res) {
    try {
      const kategori = await db('kategori').orderBy('nama', 'asc');
      res.render('pages/produk/form', {
        title: 'Tambah Produk — SCORIP POS',
        activePage: 'produk',
        isEdit: false,
        produk: {},
        kategori
      });
    } catch (err) {
      console.error('Error form tambah produk:', err);
      req.flash('error', 'Gagal memuat formulir.');
      res.redirect('/produk');
    }
  },

  // Simpan Produk Baru (POST)
  async create(req, res) {
    try {
      let {
        sku,
        nama,
        kategori_id,
        satuan,
        harga_beli,
        harga_jual,
        stok,
        stok_minimum,
        status
      } = req.body;

      // Auto-generate SKU jika tidak diisi
      if (!sku || sku.trim() === '') {
        const count = await db('produk').count('id as count').first();
        const nextId = (count ? count.count : 0) + 1;
        sku = `PRD-${String(nextId).padStart(4, '0')}`;
      } else {
        sku = sku.trim().toUpperCase();
        const exists = await db('produk').where({ sku }).first();
        if (exists) {
          req.flash('error', `SKU "${sku}" sudah digunakan oleh produk lain.`);
          return res.redirect('/produk/tambah');
        }
      }

      let foto = null;
      if (req.file) {
        foto = '/uploads/produk/' + req.file.filename;
      }

      const [newId] = await db('produk').insert({
        sku,
        nama: nama.trim(),
        kategori_id: kategori_id ? parseInt(kategori_id) : null,
        foto,
        satuan: satuan ? satuan.trim() : 'pcs',
        harga_beli: parseInt(harga_beli) || 0,
        harga_jual: parseInt(harga_jual) || 0,
        stok: parseInt(stok) || 0,
        stok_minimum: parseInt(stok_minimum) || 5,
        status: status || 'aktif'
      });

      await logAction(req, 'CREATE_PRODUK', `Menambah produk baru: ${nama} (${sku})`);
      req.flash('success', `Produk "${nama}" berhasil ditambahkan!`);
      res.redirect('/produk');
    } catch (err) {
      console.error('Error create produk:', err);
      req.flash('error', 'Gagal menambahkan produk baru: ' + err.message);
      res.redirect('/produk/tambah');
    }
  },

  // Form Edit Produk
  async formEdit(req, res) {
    try {
      const { id } = req.params;
      const produk = await db('produk').where({ id }).first();

      if (!produk) {
        req.flash('error', 'Produk tidak ditemukan.');
        return res.redirect('/produk');
      }

      const kategori = await db('kategori').orderBy('nama', 'asc');
      const isAdmin = Boolean(req.session?.user?.role === 'Admin');
      if (!isAdmin) {
        delete produk.harga_beli;
      }

      res.render('pages/produk/form', {
        title: `Edit Produk ${produk.nama} — SCORIP POS`,
        activePage: 'produk',
        isEdit: true,
        produk,
        kategori
      });
    } catch (err) {
      console.error('Error form edit produk:', err);
      req.flash('error', 'Gagal memuat form edit produk.');
      res.redirect('/produk');
    }
  },

  // Update Produk (PUT / POST)
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        sku,
        nama,
        kategori_id,
        satuan,
        harga_beli,
        harga_jual,
        stok,
        stok_minimum,
        status
      } = req.body;

      const existing = await db('produk').where({ id }).first();
      if (!existing) {
        req.flash('error', 'Produk tidak ditemukan.');
        return res.redirect('/produk');
      }

      const isAdmin = Boolean(req.session?.user?.role === 'Admin');
      const updateData = {
        nama: nama.trim(),
        kategori_id: kategori_id ? parseInt(kategori_id) : null,
        satuan: satuan ? satuan.trim() : 'pcs',
        harga_jual: parseInt(harga_jual) || 0,
        stok: parseInt(stok) || 0,
        stok_minimum: parseInt(stok_minimum) || 5,
        status: status || 'aktif',
        updated_at: db.fn.now()
      };

      // Hanya Admin yang dapat mengubah harga_beli
      if (isAdmin && harga_beli !== undefined) {
        updateData.harga_beli = parseInt(harga_beli) || 0;
      }

      if (sku && sku.trim().toUpperCase() !== existing.sku) {
        const skuCheck = await db('produk').where({ sku: sku.trim().toUpperCase() }).whereNot({ id }).first();
        if (skuCheck) {
          req.flash('error', `SKU "${sku}" sudah digunakan.`);
          return res.redirect(`/produk/${id}/edit`);
        }
        updateData.sku = sku.trim().toUpperCase();
      }

      if (req.file) {
        updateData.foto = '/uploads/produk/' + req.file.filename;
      }

      await db('produk').where({ id }).update(updateData);
      await logAction(req, 'UPDATE_PRODUK', `Memperbarui data produk #${id}: ${nama}`);

      req.flash('success', `Produk "${nama}" berhasil diperbarui.`);
      res.redirect('/produk');
    } catch (err) {
      console.error('Error update produk:', err);
      req.flash('error', 'Gagal memperbarui produk: ' + err.message);
      res.redirect(`/produk/${req.params.id}/edit`);
    }
  },

  // Hapus Produk
  async delete(req, res) {
    try {
      const { id } = req.params;
      const produk = await db('produk').where({ id }).first();

      if (!produk) {
        req.flash('error', 'Produk tidak ditemukan.');
        return res.redirect('/produk');
      }

      // Cek apakah produk sudah dipakai di transaksi atau PO
      const trxCount = await db('transaksi_detail').where({ produk_id: id }).count('id as count').first();
      const poCount = await db('po_detail').where({ produk_id: id }).count('id as count').first();

      if ((trxCount && trxCount.count > 0) || (poCount && poCount.count > 0)) {
        // Soft-delete / nonaktifkan saja untuk menjaga integritas data relasional
        await db('produk').where({ id }).update({ status: 'nonaktif', updated_at: db.fn.now() });
        await logAction(req, 'NONAKTIFKAN_PRODUK', `Produk #${id} (${produk.nama}) dinonaktifkan karena memiliki riwayat transaksi/PO`);
        req.flash('success', `Produk "${produk.nama}" memiliki riwayat transaksi sehingga statusnya diubah menjadi Nonaktif.`);
      } else {
        await db('produk').where({ id }).del();
        await logAction(req, 'DELETE_PRODUK', `Menghapus produk #${id} (${produk.nama})`);
        req.flash('success', `Produk "${produk.nama}" berhasil dihapus.`);
      }

      res.redirect('/produk');
    } catch (err) {
      console.error('Error delete produk:', err);
      req.flash('error', 'Gagal menghapus produk.');
      res.redirect('/produk');
    }
  },

  // Halaman Cetak Barcode Produk
  async cetakBarcode(req, res) {
    try {
      const produk = await db('produk').where('status', 'aktif').orderBy('nama', 'asc');
      res.render('pages/produk/barcode', {
        layout: 'layouts/print',
        title: 'Cetak Barcode Produk — SCORIP POS',
        produk
      });
    } catch (err) {
      console.error('Error cetak barcode:', err);
      res.status(500).send('Gagal memuat halaman barcode.');
    }
  },

  // AJAX Inline Update Stok (PATCH /api/produk/:id/stok-inline)
  async updateStokInline(req, res) {
    try {
      const { id } = req.params;
      const { stok } = req.body;

      const newStok = parseInt(stok);
      if (isNaN(newStok) || newStok < 0) {
        return res.status(400).json({ success: false, message: 'Nilai stok tidak valid.' });
      }

      await db('produk').where({ id }).update({
        stok: newStok,
        updated_at: db.fn.now()
      });

      await logAction(req, 'UPDATE_STOK_INLINE', `Update cepat stok produk #${id} menjadi ${newStok}`);

      res.json({
        success: true,
        message: 'Stok berhasil diperbarui.',
        stok: newStok
      });
    } catch (err) {
      console.error('Error inline stok update:', err);
      res.status(500).json({ success: false, message: 'Gagal memperbarui stok.' });
    }
  }
};

module.exports = produkController;
