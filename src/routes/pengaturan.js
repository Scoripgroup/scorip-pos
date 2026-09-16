const express = require('express');
const router = express.Router();
const pengaturanController = require('../controllers/pengaturanController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { uploadLogo } = require('../middlewares/upload');

// Khusus Admin
router.use('/pengaturan', requireAuth, requireRole('Admin'));

router.get('/pengaturan', pengaturanController.index);
router.post('/pengaturan/umum', uploadLogo.single('logo'), pengaturanController.updateUmum);
router.post('/pengaturan/struk', pengaturanController.updateStruk);
router.post('/pengaturan/whatsapp', pengaturanController.updateWhatsApp);

// Pengaturan Pengguna & Akses Sistem
router.post('/pengaturan/users', pengaturanController.createUser);
router.post('/pengaturan/users/:id', pengaturanController.updateUser);
router.post('/pengaturan/users/:id/reset-password', pengaturanController.resetPasswordUser);
router.post('/pengaturan/ganti-password', pengaturanController.gantiPasswordMandiri);
router.post('/pengaturan/users/:id/delete', pengaturanController.deleteUser);
router.post('/pengaturan/hak-akses', pengaturanController.updateHakAkses);

module.exports = router;
