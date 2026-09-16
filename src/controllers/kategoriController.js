const db = require('../config/database');
const { logAction } = require('../middlewares/audit');

const kategoriController = {
  async index(req, res) {
    try {
      const kategori = await db('kategori')
        .leftJoin('produk', 'kategori.id', 'produk.kategori_id')
        .select(
          'kategori.id',
          'kategori.nama',
          db.raw('COUNT(produk.id) as jumlah_produk')
        )
        .groupBy('kategori.id', 'kategori.nama')
        .orderBy('kategori.nama', 'asc');

      res.render('pages/kategori/index', {
        title: 'Manajemen Kategori — SCORIP POS',
        activePage: 'kategori',
        kategori
      });
    } catch (err) {
      console.error('Error loading kategori:', err);
      req.flash('error', 'Gagal memuat data kategori.');
      res.redirect('/dashboard');
    }
  },

  async create(req, res) {
    try {
      const { nama } = req.body;
      if (!nama || nama.trim() === '') {
        req.flash('error', 'Nama kategori tidak boleh kosong.');
        return res.redirect('/kategori');
      }

      await db('kategori').insert({ nama: nama.trim() });
      await logAction(req, 'CREATE_KATEGORI', `Menambahkan kategori: ${nama.trim()}`);

      req.flash('success', `Kategori "${nama.trim()}" berhasil ditambahkan.`);
      res.redirect('/kategori');
    } catch (err) {
      console.error('Error create kategori:', err);
      req.flash('error', 'Gagal menambahkan kategori.');
      res.redirect('/kategori');
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nama } = req.body;

      if (!nama || nama.trim() === '') {
        req.flash('error', 'Nama kategori tidak boleh kosong.');
        return res.redirect('/kategori');
      }

      await db('kategori').where({ id }).update({
        nama: nama.trim(),
        updated_at: db.fn.now()
      });

      await logAction(req, 'UPDATE_KATEGORI', `Mengubah kategori #${id} menjadi ${nama.trim()}`);
      req.flash('success', 'Kategori berhasil diperbarui.');
      res.redirect('/kategori');
    } catch (err) {
      console.error('Error update kategori:', err);
      req.flash('error', 'Gagal memperbarui kategori.');
      res.redirect('/kategori');
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const kat = await db('kategori').where({ id }).first();

      if (!kat) {
        req.flash('error', 'Kategori tidak ditemukan.');
        return res.redirect('/kategori');
      }

      // Lepas relasi produk (SET NULL) atau cek apakah ada produk
      await db('produk').where({ kategori_id: id }).update({ kategori_id: null });
      await db('kategori').where({ id }).del();
      await logAction(req, 'DELETE_KATEGORI', `Menghapus kategori #${id} (${kat.nama})`);

      req.flash('success', `Kategori "${kat.nama}" berhasil dihapus.`);
      res.redirect('/kategori');
    } catch (err) {
      console.error('Error delete kategori:', err);
      req.flash('error', 'Gagal menghapus kategori.');
      res.redirect('/kategori');
    }
  }
};

module.exports = kategoriController;
