import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { attachUser } from './auth.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import challengeRoutes from './routes/challenges.js';
import companyRoutes from './routes/company.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import campusRoutes from './routes/campus.js';
import recruitmentRoutes from './routes/recruitment.js';

export function createApp({ seedPromise } = {}) {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const root = process.cwd();
  // En Render, RENDER_EXTERNAL_URL contiene la URL pública del servicio.
  // Se usa como respaldo para no tener que fijar APP_ORIGIN a mano.
  const defaultOrigin = process.env.RENDER_EXTERNAL_URL?.trim() || 'http://localhost:5173';
  const allowedOrigins = new Set(
    (process.env.APP_ORIGIN || defaultOrigin)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '120kb' }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      );
    }
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  // Defensa CSRF de origen: las peticiones mutantes deben venir del mismo
  // origen permitido. La cookie de sesión además es SameSite=Lax y httpOnly.
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin) return next();
    const sameHost = `${req.protocol}://${req.get('host')}`;
    if (allowedOrigins.has(origin) || sameHost === origin) return next();
    return res.status(403).json({
      error: 'Origen no autorizado para esta operación.',
      code: 'ORIGIN_NOT_ALLOWED',
    });
  });

  app.use(attachUser);

  // El sembrado de datos demo puede tardar unos segundos en Render.
  // El servidor arranca primero y /api/health responde de inmediato; las
  // rutas de API esperan a que los datos estén listos.
  if (seedPromise) {
    app.use(async (req, res, next) => {
      if (req.path.startsWith('/api/') && req.path !== '/api/health') {
        try {
          await seedPromise;
        } catch (error) {
          return res.status(500).json({
            error: 'Error al cargar los datos de demostración.',
            code: 'SEED_ERROR',
          });
        }
      }
      next();
    });
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'campuscode-api', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api', challengeRoutes);
  app.use('/api', campusRoutes);
  app.use('/api', recruitmentRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', aiRoutes);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.', code: 'NOT_FOUND' });
  });

  const dist = path.join(root, 'dist');
  if (fs.existsSync(dist)) {
    app.use(
      express.static(dist, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (/\.(js|css|woff2?|svg|png|jpg|jpeg|webp)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.', code: 'NOT_FOUND' });
  });

  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido.', code: 'INVALID_JSON' });
    }
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[campuscode]', error);
    }
    const payload = {
      error: status >= 500 && !error.status ? 'Ocurrió un error interno. Intenta de nuevo.' : error.message,
      code: error.code || 'INTERNAL_ERROR',
    };
    if (error.details) payload.details = error.details;
    res.status(status).json(payload);
  });

  return app;
}
