'use strict';

const crypto = require('node:crypto');
const config = require('./config');

// ---- Password hashing (scrypt) ----
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const test = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch {
    return false;
  }
}

// ---- JWT (HMAC-SHA256 signed token) ----
function base64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function signToken(payload, ttlSeconds = config.sessionTtlSeconds) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })
  );
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = String(token).split('.');
    if (!header || !body || !signature) return null;
    const expected = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- Cookie helpers ----
const AUTH_COOKIE = 'bionic_admin_token';

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function getAuthUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return null;
  const { db } = require('./db');
  const user = db
    .prepare('SELECT id, username, role FROM users WHERE id = ?')
    .get(payload.sub);
  return user || null;
}

function setAuthCookie(res, token) {
  const cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${config.sessionTtlSeconds}`;
  const existing = res.getHeader('Set-Cookie');
  if (existing) {
    res.setHeader('Set-Cookie', [].concat(existing, cookie));
  } else {
    res.setHeader('Set-Cookie', cookie);
  }
}

function clearAuthCookie(res) {
  const cookie = `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  const existing = res.getHeader('Set-Cookie');
  if (existing) {
    res.setHeader('Set-Cookie', [].concat(existing, cookie));
  } else {
    res.setHeader('Set-Cookie', cookie);
  }
}

// ---- Middleware: require admin ----
function requireAdmin(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    return { error: 'غير مصرح', status: 401 };
  }
  if (user.role !== 'admin') {
    return { error: 'صلاحيات غير كافية', status: 403 };
  }
  return { user };
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getAuthUser,
  setAuthCookie,
  clearAuthCookie,
  requireAdmin,
  AUTH_COOKIE,
};
