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

const createCorsOptions = (env = process.env) => {
  const allowedOrigins = getAllowedOrigins(env);

  return {
    origin(origin, callback) {
      // Apps móveis, curl e comunicação servidor-servidor não enviam Origin.
      if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
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

module.exports = { createCorsOptions, getAllowedOrigins };
