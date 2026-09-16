const db = require('../config/database');

const auditLogController = {
  async index(req, res) {
    try {
      const { search, aksi, user, tanggal } = req.query;

      let query = db('audit_log').orderBy('id', 'desc');

      if (search) {
        query = query.where((qb) => {
          qb.where('details', 'like', `%${search}%`)
            .orWhere('action', 'like', `%${search}%`)
            .orWhere('username', 'like', `%${search}%`);
        });
      }

      if (aksi) {
        query = query.where('action', aksi);
      }

      if (user) {
        query = query.where('username', user);
      }

      if (tanggal) {
        query = query.where('created_at', 'like', `${tanggal}%`);
      }

      const rows = await query.limit(150);

      // Map rows agar cocok dengan variabel template EJS
      const logs = rows.map((r) => ({
        id: r.id,
        timestamp: r.created_at,
        username: r.username || 'system',
        aksi: r.action,
        detail: r.details || '-'
      }));

      res.render('pages/audit-log/index', {
        title: 'Audit Log — SCORIP POS',
        activePage: 'audit-log',
        logs,
        filters: { search, aksi, user, tanggal }
      });
    } catch (err) {
      console.error('Error load audit log:', err);
      req.flash('error', 'Gagal memuat catatan audit.');
      res.redirect('/dashboard');
    }
  }
};

module.exports = auditLogController;
