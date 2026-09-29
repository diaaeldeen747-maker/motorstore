'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Resolve project root (parent of /server)
const ROOT = path.resolve(__dirname, '..');

// ---- Minimal .env loader (no external deps) ----
function loadEnv(filePath) {
  const env = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    // no .env file — fall back to defaults
  }
  return env;
}

const fileEnv = loadEnv(path.join(ROOT, '.env'));

const config = {
  root: ROOT,
  port: parseInt(process.env.PORT || fileEnv.PORT || '3000', 10),
  host: process.env.HOST || fileEnv.HOST || '127.0.0.1',

  // Database
  dbFile: path.join(ROOT, 'data', 'store.db'),

  // Auth / security
  jwtSecret:
    process.env.JWT_SECRET ||
    fileEnv.JWT_SECRET ||
    crypto.randomBytes(32).toString('hex'),
  sessionTtlSeconds: 60 * 60 * 24 * 7, // 7 days
  adminUsername: process.env.ADMIN_USERNAME || fileEnv.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || fileEnv.ADMIN_PASSWORD || 'admin123',

  // Payment
  walletNumber: process.env.WALLET_NUMBER || fileEnv.WALLET_NUMBER || '01055325632',

  // Uploads
  uploadDir: path.join(ROOT, 'public', 'uploads'),
  maxUploadBytes: 8 * 1024 * 1024, // 8 MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],

  // Pagination
  pageSize: 12,
};

module.exports = config;
