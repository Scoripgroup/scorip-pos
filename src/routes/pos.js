const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use('/pos', requireAuth, requirePermission('pos'));

router.get('/pos', posController.index);
router.post('/pos/transaksi', posController.simpanTransaksi);
router.get('/pos/riwayat', posController.riwayat);
router.get('/pos/transaksi/:id', posController.detail);
router.get('/pos/transaksi/:id/struk', posController.cetakStruk);
router.post('/pos/transaksi/:id/resi', posController.updateResi);
router.post('/pos/transaksi/:id/status', posController.updateStatus);

module.exports = router;
