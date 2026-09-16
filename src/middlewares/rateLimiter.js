const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Relaksasi di mode dev
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Terlalu banyak percobaan login gagal. Akun dikunci sementara selama 15 menit demi keamanan.');
    res.redirect('/login');
  }
});

module.exports = {
  loginLimiter
};
