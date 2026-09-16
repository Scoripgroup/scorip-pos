const db = require('../config/database');

const katalogController = {
  async index(req, res) {
    try {
      const kategori = await db('kategori').orderBy('nama', 'asc');
      const produk = await db('produk')
        .leftJoin('kategori', 'produk.kategori_id', 'kategori.id')
        .select(
          'produk.*',
          'kategori.nama as kategori'
        )
        .where('produk.status', 'aktif')
        .orderBy('produk.nama', 'asc');

      res.render('pages/katalog/index', {
        layout: 'layouts/public',
        title: 'Katalog Produk — SCORIP POS',
        kategori,
        produk
      });
    } catch (err) {
      console.error('Error load katalog:', err);
      res.status(500).send('Gagal memuat katalog produk.');
    }
  }
};

module.exports = katalogController;
