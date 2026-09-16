const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use('/laporan', requireAuth, requirePermission('laporan'));

router.get('/laporan', laporanController.index);

module.exports = router;
