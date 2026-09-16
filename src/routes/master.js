const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use(requireAuth);

// Pelanggan
router.get('/pelanggan', requirePermission('pelanggan'), masterController.listPelanggan);
router.post('/pelanggan', requirePermission('pelanggan'), masterController.createPelanggan);
router.put('/pelanggan/:id', requirePermission('pelanggan'), masterController.updatePelanggan);
router.post('/pelanggan/:id', requirePermission('pelanggan'), masterController.updatePelanggan);
router.delete('/pelanggan/:id', requirePermission('pelanggan'), masterController.deletePelanggan);
router.post('/pelanggan/:id/delete', requirePermission('pelanggan'), masterController.deletePelanggan);

// Supplier
router.get('/supplier', requirePermission('supplier'), masterController.listSupplier);
router.post('/supplier', requirePermission('supplier'), masterController.createSupplier);
router.put('/supplier/:id', requirePermission('supplier'), masterController.updateSupplier);
router.post('/supplier/:id', requirePermission('supplier'), masterController.updateSupplier);
router.delete('/supplier/:id', requirePermission('supplier'), masterController.deleteSupplier);
router.post('/supplier/:id/delete', requirePermission('supplier'), masterController.deleteSupplier);

// Forwarder
router.get('/forwarder', requirePermission('forwarder'), masterController.listForwarder);
router.post('/forwarder', requirePermission('forwarder'), masterController.createForwarder);
router.put('/forwarder/:id', requirePermission('forwarder'), masterController.updateForwarder);
router.post('/forwarder/:id', requirePermission('forwarder'), masterController.updateForwarder);
router.delete('/forwarder/:id', requirePermission('forwarder'), masterController.deleteForwarder);
router.post('/forwarder/:id/delete', requirePermission('forwarder'), masterController.deleteForwarder);

module.exports = router;
