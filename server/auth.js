import jwt from 'jsonwebtoken';
import { db } from './db.js';

const envSecret = process.env.JWT_SECRET;
if (!envSecret) {
  console.warn(
    '[campuscode] JWT_SECRET no está definido. Se usa un secreto de desarrollo; configura uno propio antes de desplegar.',
  );
}
export const JWT_SECRET = envSecret || 'campuscode-dev-only-secret-change-me';
const isProduction = process.env.NODE_ENV === 'production';
export const COOKIE_NAME = 'cc_session';
export const SESSION_DAYS = 7;

export function signSession(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
    issuer: 'campuscode',
    audience: 'campuscode-web',
  });
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  });
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    profile: {
      headline: row.headline ?? null,
      bio: row.bio ?? null,
      university: row.university ?? null,
      careerId: row.career_id ?? null,
      careerName: row.career_name ?? null,
      careerSlug: row.career_slug ?? null,
      semester: row.semester ?? null,
      website: row.website ?? null,
      linkedin: row.linkedin ?? null,
      avatarColor: row.avatar_color ?? 'blue',
    },
    company: row.company_id
      ? {
          id: row.company_id,
          name: row.company_name,
          slug: row.company_slug,
          sector: row.company_sector,
          verified: Boolean(row.company_verified),
        }
      : null,
  };
}

const USER_QUERY = `
  SELECT u.*, p.headline, p.bio, p.university, p.career_id, p.semester, p.website, p.linkedin, p.avatar_color,
         c.name AS career_name, c.slug AS career_slug,
         co.id AS company_id, co.name AS company_name, co.slug AS company_slug,
         co.sector AS company_sector, co.verified AS company_verified
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN careers c ON c.id = p.career_id
  LEFT JOIN companies co ON co.owner_id = u.id
  WHERE u.id = ?
`;

export function findUserById(id) {
  return db.prepare(USER_QUERY).get(id);
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
}

// Adjunta req.user si la cookie contiene una sesión válida. No bloquea.
export function attachUser(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'campuscode',
      audience: 'campuscode-web',
    });
    const row = findUserById(payload.sub);
    if (row && row.is_active) req.user = publicUser(row);
  } catch {
    // Token inválido o vencido: se trata como visitante.
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Debes iniciar sesión para continuar.',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Debes iniciar sesión para continuar.', code: 'AUTH_REQUIRED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción.',
        code: 'FORBIDDEN',
      });
    }
    next();
  };
}

export function ownedCompany(userId) {
  return db.prepare('SELECT * FROM companies WHERE owner_id = ?').get(userId);
}

// Limitador simple en memoria para login, registro y asistente.
const buckets = new Map();
export function rateLimit({ windowMs, max, keyPrefix = 'global' }) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.user?.id || req.ip}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.reset < now) {
      buckets.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retry = Math.ceil((bucket.reset - now) / 1000);
      res.set('Retry-After', String(retry));
      return res.status(429).json({
        error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
        code: 'RATE_LIMITED',
      });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.reset < now) buckets.delete(key);
  }
}, 60_000).unref?.();
