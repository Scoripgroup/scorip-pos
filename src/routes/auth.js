const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.login);
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;
