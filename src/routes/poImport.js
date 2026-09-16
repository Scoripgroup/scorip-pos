const express = require('express');
const router = express.Router();
const poImportController = require('../controllers/poImportController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use('/po-import', requireAuth, requirePermission('po_import'));

router.get('/po-import', poImportController.index);
router.get('/po-import/baru', poImportController.formTambah);
router.post('/po-import', poImportController.create);
router.get('/po-import/:id', poImportController.detail);
router.get('/po-import/:id/edit', poImportController.formEdit);
router.put('/po-import/:id', poImportController.update);
router.post('/po-import/:id', poImportController.update); // Fallback tanpa method-override
router.post('/po-import/:id/status', poImportController.updateStatus);
router.delete('/po-import/:id', poImportController.delete);
router.post('/po-import/:id/delete', poImportController.delete);

module.exports = router;
