'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const config = require('./config');

// Ensure upload dir exists
fs.mkdirSync(config.uploadDir, { recursive: true });

/**
 * Minimal, correct multipart/form-data parser.
 * Returns { fields: {name: value}, files: [{fieldname, filename, contentType, data(Buffer)}] }
 */
function parseMultipart(buffer, boundary) {
  const fields = {};
  const files = [];
  const delim = Buffer.from(`--${boundary}`);
  const parts = bufferSplit(buffer, delim);

  for (const part of parts) {
    // skip leading/trailing empty parts and the closing '--'
    if (part.length === 0) continue;
    if (part.length >= 2 && part[0] === 0x2d && part[1] === 0x2d) continue; // '--'
    // find header/body separator \r\n\r\n
    const sep = findSequence(part, Buffer.from('\r\n\r\n'));
    if (sep === -1) continue;
    const headerBlock = part.slice(0, sep).toString('utf8');
    let body = part.slice(sep + 4);
    // strip trailing \r\n
    if (body.length >= 2 && body[body.length - 1] === 0x0a && body[body.length - 2] === 0x0d) {
      body = body.slice(0, -2);
    }

    const headers = parseHeaders(headerBlock);
    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]*)"/);
    const filenameMatch = disposition.match(/filename="([^"]*)"/);

    if (filenameMatch) {
      files.push({
        fieldname: nameMatch ? nameMatch[1] : 'file',
        filename: filenameMatch[1],
        contentType: (headers['content-type'] || 'application/octet-stream').split(';')[0].trim(),
        data: body,
      });
    } else if (nameMatch) {
      fields[nameMatch[1]] = body.toString('utf8');
    }
  }

  return { fields, files };
}

function bufferSplit(buffer, delim) {
  const parts = [];
  let start = 0;
  let idx = buffer.indexOf(delim);
  while (idx !== -1) {
    parts.push(buffer.slice(start, idx));
    start = idx + delim.length;
    idx = buffer.indexOf(delim, start);
  }
  parts.push(buffer.slice(start));
  return parts;
}

function findSequence(buffer, seq) {
  return buffer.indexOf(seq);
}

function parseHeaders(block) {
  const headers = {};
  for (const line of block.split('\r\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }
  return headers;
}

// ---- Image validation & saving ----
function validateImage(file) {
  const ext = path.extname(file.filename || '').toLowerCase();
  if (!config.allowedImageExtensions.includes(ext)) {
    return { ok: false, error: 'نوع الملف غير مسموح به. المسموح: JPG, PNG, WEBP, GIF' };
  }
  if (!config.allowedImageTypes.includes(file.contentType)) {
    return { ok: false, error: 'نوع الملف غير مسموح به' };
  }
  if (file.data.length > config.maxUploadBytes) {
    return { ok: false, error: 'حجم الملف كبير جدًا (الحد الأقصى 8 ميجابايت)' };
  }
  // Sniff magic bytes to reject disguised dangerous files
  if (!isRealImage(file.data)) {
    return { ok: false, error: 'الملف ليس صورة صالحة' };
  }
  return { ok: true };
}

function isRealImage(buf) {
  if (buf.length < 12) return false;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return true;
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WEBP (RIFF....WEBP)
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;
  return false;
}

function saveImage(file, prefix) {
  const ext = path.extname(file.filename || '').toLowerCase() || '.jpg';
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const dest = path.join(config.uploadDir, name);
  fs.writeFileSync(dest, file.data);
  return { filename: name, path: `/uploads/${name}` };
}

module.exports = { parseMultipart, validateImage, saveImage, isRealImage };
