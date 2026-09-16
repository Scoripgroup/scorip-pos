const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use('/audit-log', requireAuth, requirePermission('audit_log'));

router.get('/audit-log', auditLogController.index);

module.exports = router;
