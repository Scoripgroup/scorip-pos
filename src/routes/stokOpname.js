const express = require('express');
const router = express.Router();
const stokOpnameController = require('../controllers/stokOpnameController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use('/stok-opname', requireAuth, requirePermission('stok_opname'));

router.get('/stok-opname', stokOpnameController.index);
router.get('/stok-opname/baru', stokOpnameController.formBaru);
router.post('/stok-opname', stokOpnameController.create);
router.delete('/stok-opname/:id', stokOpnameController.delete);
router.post('/stok-opname/:id/delete', stokOpnameController.delete);

module.exports = router;
