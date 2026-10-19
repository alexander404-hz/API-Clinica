const AppError = require("../utils/AppError");
const rateLimit = require("express-rate-limit");
const { RATE_LIMITED } = require("../constants/errorCodes");

// Los contadores viven en memoria: con varias instancias hay que usar Redis.

// Pasa el 429 por el error handler central
const rateLimitHandler = (message) => (req, res, next, options) => {
  next(new AppError(message, options.statusCode, RATE_LIMITED));
};

// ---------------------------------------------------------------------------
// AUTH (públicas)
// ---------------------------------------------------------------------------

// Register por IP: frena creación masiva de cuentas.
exports.registerIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Too many registration attempts. Please try again later.",
  ),
});

// Register por email: evita email bombing.
exports.registerEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.validated.body.email,
  handler: rateLimitHandler(
    "Too many registration attempts for this email. Please try again later.",
  ),
});

// Login por IP: frena fuerza bruta desde un origen. Solo cuentan los fallos.
exports.loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many login attempts. Please try again later."),
});

// Login por cuenta: techo contra ataques distribuidos.
// Email y username comparten contador vía req.accountKey.
exports.loginAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.accountKey,
  handler: (req, res, next, options) => {
    // Aviso al dueño solo en el primer bloqueo de la ventana
    if (req.account && req.rateLimit.used === req.rateLimit.limit + 1) {
      console.log(
        `[email:simulated] To: ${req.account.email} | We detected several failed login attempts on your account. If it wasn't you, consider resetting your password.`,
      );
    }

    next(
      new AppError(
        "Too many login attempts for this account. Please try again later.",
        options.statusCode,
        RATE_LIMITED,
      ),
    );
  },
});

// Cambio de contraseña: frena adivinar la contraseña actual con un token robado.
exports.changePasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user.id}`,
  handler: rateLimitHandler("Too many attempts. Please try again later."),
});

// ---------------------------------------------------------------------------
// RUTAS PROTEGIDAS (después de authenticate, salvo authFailLimiter)
// ---------------------------------------------------------------------------

// Por IP, antes de authenticate: frena tokens inválidos o ausentes.
// Solo cuentan las respuestas 4xx/5xx.
exports.authFailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 30, // ~2 / min
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler("Too many requests. Please try again later."),
});

// Tope general por persona (cuenta éxitos y errores).
exports.userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 450, // ~30 / min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user.id}`,
  handler: rateLimitHandler("Too many requests. Please try again later."),
});

// Extra para listados: frena la extracción masiva. Contador compartido
// entre todas las listas.
exports.listLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 60, // ~4 / min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `list:${req.user.id}`,
  handler: rateLimitHandler("Too many requests. Please try again later."),
});

// POST /patients (recepción): limita la creación de pacientes y los correos que dispara.
exports.patientCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user.id}`,
  handler: rateLimitHandler(
    "Too many patient registrations. Please try again later.",
  ),
});
