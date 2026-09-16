const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use('/kategori', requireAuth, requirePermission('kategori'));

router.get('/kategori', kategoriController.index);
router.post('/kategori', kategoriController.create);
router.put('/kategori/:id', kategoriController.update);
router.post('/kategori/:id', kategoriController.update);
router.delete('/kategori/:id', kategoriController.delete);
router.post('/kategori/:id/delete', kategoriController.delete);

module.exports = router;
