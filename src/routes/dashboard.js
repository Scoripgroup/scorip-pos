const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/auth');

router.use('/dashboard', requireAuth);
router.get('/dashboard', dashboardController.index);

module.exports = router;
