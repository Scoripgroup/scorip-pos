const express = require('express');
const router = express.Router();
const katalogController = require('../controllers/katalogController');

// Halaman publik - Tanpa requireAuth
router.get('/katalog', katalogController.index);

module.exports = router;
