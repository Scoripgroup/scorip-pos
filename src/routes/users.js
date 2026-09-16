const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use('/users', requireAuth, requireRole('Admin'));

router.get('/users', usersController.index);
router.post('/users', usersController.create);
router.put('/users/:id', usersController.update);
router.post('/users/:id', usersController.update);
router.post('/users/:id/reset-password', usersController.resetPassword);
router.delete('/users/:id', usersController.delete);
router.post('/users/:id/delete', usersController.delete);

module.exports = router;
