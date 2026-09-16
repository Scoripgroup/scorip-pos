const db = require('../config/database');
const { logAction } = require('../middlewares/audit');

const stokOpnameController = {
  // List Riwayat Stok Opname
  async index(req, res) {
    try {
      const opnameRows = await db('stok_opname')
        .join('produk', 'stok_opname.produk_id', 'produk.id')
        .leftJoin('users', 'stok_opname.user_id', 'users.id')
        .select(
          'stok_opname.*',
          'produk.sku',
          'produk.nama as produk',
          'stok_opname.keterangan as catatan',
          db.raw("COALESCE(users.nama, stok_opname.user_nama, 'Admin') as user")
        )
        .orderBy('stok_opname.id', 'desc');

      res.render('pages/stok-opname/index', {
        title: 'Stok Opname — SCORIP POS',
        activePage: 'stok-opname',
        opname: opnameRows
      });
    } catch (err) {
      console.error('Error loading stok opname:', err);
      req.flash('error', 'Gagal memuat data stok opname.');
      res.redirect('/dashboard');
    }
  },

  // Form Input Stok Opname
  async formBaru(req, res) {
    try {
      const produk = await db('produk').where('status', 'aktif').orderBy('nama', 'asc');

      res.render('pages/stok-opname/form', {
        title: 'Input Stok Opname — SCORIP POS',
        activePage: 'stok-opname',
        produk
      });
    } catch (err) {
      console.error('Error form stok opname:', err);
      req.flash('error', 'Gagal memuat form stok opname.');
      res.redirect('/stok-opname');
    }
  },

  // Simpan Hasil Opname (Atomic Transaction)
  async create(req, res) {
    try {
      const { produk_id, stok_fisik, catatan } = req.body;

      const prodIds = Array.isArray(produk_id) ? produk_id : (produk_id ? [produk_id] : []);
      const fisikList = Array.isArray(stok_fisik) ? stok_fisik : [stok_fisik];
      const catatanList = Array.isArray(catatan) ? catatan : [catatan];

      if (prodIds.length === 0) {
        req.flash('error', 'Minimal satu baris produk harus diisi.');
        return res.redirect('/stok-opname/baru');
      }

      const user = req.session?.user;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      await db.transaction(async (trx) => {
        for (let i = 0; i < prodIds.length; i++) {
          const pid = parseInt(prodIds[i]);
          const fisik = parseInt(fisikList[i]) || 0;
          const note = catatanList[i] || '';

          if (!pid) continue;

          const prod = await trx('produk').where({ id: pid }).first();
          if (!prod) continue;

          const stokSistem = prod.stok;
          const selisih = fisik - stokSistem;

          // Insert riwayat stok opname
          await trx('stok_opname').insert({
            tanggal: nowStr,
            produk_id: pid,
            stok_sistem: stokSistem,
            stok_fisik: fisik,
            selisih,
            keterangan: note,
            user_id: user?.id || null,
            user_nama: user?.nama || 'Admin'
          });

          // Sesuaikan stok produk secara otomatis
          await trx('produk').where({ id: pid }).update({
            stok: fisik,
            updated_at: db.fn.now()
          });
        }
      });

      await logAction(req, 'STOK_OPNAME', `Melakukan stok opname untuk ${prodIds.length} produk`);
      req.flash('success', 'Hasil stok opname berhasil disimpan dan stok produk telah diperbarui.');
      res.redirect('/stok-opname');
    } catch (err) {
      console.error('Error simpan stok opname:', err);
      req.flash('error', 'Gagal menyimpan stok opname: ' + err.message);
      res.redirect('/stok-opname/baru');
    }
  },

  // Hapus Catatan Opname
  async delete(req, res) {
    try {
      const { id } = req.params;
      await db('stok_opname').where({ id }).del();
      await logAction(req, 'DELETE_STOK_OPNAME', `Hapus riwayat opname #${id}`);

      req.flash('success', 'Riwayat opname berhasil dihapus.');
      res.redirect('/stok-opname');
    } catch (err) {
      console.error('Error delete stok opname:', err);
      req.flash('error', 'Gagal menghapus riwayat opname.');
      res.redirect('/stok-opname');
    }
  }
};

module.exports = stokOpnameController;
