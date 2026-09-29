'use strict';

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function ok(res, data = {}) {
  sendJson(res, 200, data);
}

function created(res, data = {}) {
  sendJson(res, 201, data);
}

function badRequest(res, message = 'طلب غير صالح') {
  sendJson(res, 400, { error: message });
}

function unauthorized(res, message = 'غير مصرح') {
  sendJson(res, 401, { error: message });
}

function forbidden(res, message = 'صلاحيات غير كافية') {
  sendJson(res, 403, { error: message });
}

function notFound(res, message = 'غير موجود') {
  sendJson(res, 404, { error: message });
}

function serverError(res, message = 'خطأ داخلي في الخادم') {
  sendJson(res, 500, { error: message });
}

function requireFields(body, fields) {
  for (const f of fields) {
    const v = body[f];
    if (v === undefined || v === null || String(v).trim() === '') {
      return f;
    }
  }
  return null;
}

function toNumber(v, fallback = null) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(v, fallback = null) {
  const n = toNumber(v, fallback);
  return n === null ? null : Math.trunc(n);
}

module.exports = {
  sendJson,
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  requireFields,
  toNumber,
  toInt,
};
