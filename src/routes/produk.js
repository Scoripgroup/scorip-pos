const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { requireAuth, requirePermission } = require('../middlewares/auth');
const { uploadProduk } = require('../middlewares/upload');

router.use('/produk', requireAuth, requirePermission('produk'));

router.get('/produk', produkController.index);
router.get('/produk/barcode', produkController.cetakBarcode);
router.get('/produk/tambah', produkController.formTambah);
router.post('/produk', uploadProduk.single('foto'), produkController.create);
router.get('/produk/:id/edit', produkController.formEdit);
router.put('/produk/:id', uploadProduk.single('foto'), produkController.update);
router.post('/produk/:id', uploadProduk.single('foto'), produkController.update);
router.patch('/produk/:id/stok-inline', produkController.updateStokInline);
router.delete('/produk/:id', produkController.delete);
router.post('/produk/:id/delete', produkController.delete);

module.exports = router;
