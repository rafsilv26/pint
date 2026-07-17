const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '');

const getAllowedOrigins = (env = process.env) => {
  const configured = [env.CORS_ORIGINS, env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map(normalizeOrigin)
    .filter(Boolean);

  if (env.NODE_ENV !== 'production') {
    configured.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }

  return new Set(configured);
};

const getAllowedPatterns = (env = process.env) => {
  const configured = String(env.CORS_ORIGIN_PATTERNS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => new RegExp(value));

  return [/^https:\/\/[a-z0-9-]+\.vercel\.app$/i, ...configured];
};

const createCorsOptions = (env = process.env) => {
  const allowedOrigins = getAllowedOrigins(env);
  const allowedPatterns = getAllowedPatterns(env);

  return {
    origin(origin, callback) {
      const normalized = normalizeOrigin(origin);
      if (!origin || allowedOrigins.has(normalized) || allowedPatterns.some((pattern) => pattern.test(normalized))) {
        return callback(null, true);
      }

      const error = new Error('Origem não autorizada.');
      error.statusCode = 403;
      error.code = 'CORS_ORIGIN_DENIED';
      return callback(error);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    optionsSuccessStatus: 204
  };
};

module.exports = { createCorsOptions, getAllowedOrigins, getAllowedPatterns };
