const db = require('../config/database');

/**
 * Catat aktivitas ke tabel audit_log
 * @param {object} req Express request object
 * @param {string} action Nama tindakan (mis. 'LOGIN', 'CREATE_TRANSAKSI', 'UPDATE_PRODUK')
 * @param {string} details Deskripsi detail aktivitas
 */
async function logAction(req, action, details = '') {
  try {
    const username = req?.session?.user?.username || 'system';
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    await db('audit_log').insert({
      username,
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      ip_address: ip
    });
  } catch (err) {
    console.error('⚠️ Gagal mencatat audit log:', err.message);
  }
}

module.exports = {
  logAction
};
