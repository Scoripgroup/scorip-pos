const express = require('express');
const router = express.Router();
const db = require('../config/database');
const produkController = require('../controllers/produkController');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);

// Inline stock update
router.patch('/produk/:id/stok-inline', produkController.updateStokInline);

// Barcode scanner lookup (SKU scan)
router.get('/produk/barcode/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const prod = await db('produk')
      .where({ sku })
      .andWhere('status', 'aktif')
      .first();

    if (!prod) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    if (req.session?.user?.role !== 'Admin') {
      delete prod.harga_beli;
    }

    res.json({ success: true, data: prod });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mencari produk.' });
  }
});

// Pelanggan list lookup
router.get('/pelanggan/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const customers = await db('pelanggan')
      .where('nama', 'like', `%${q}%`)
      .orWhere('no_hp', 'like', `%${q}%`)
      .limit(10);
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mencari pelanggan.' });
  }
});

module.exports = router;
