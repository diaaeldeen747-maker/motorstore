'use strict';

const { db, slugify } = require('../db');
const config = require('../config');
const { ok, notFound, toInt, toNumber } = require('../helpers');

function productToJson(row) {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    old_price: row.old_price,
    discount: row.discount,
    stock: row.stock,
    category_id: row.category_id,
    manufacturer_id: row.manufacturer_id,
    model_id: row.model_id,
    year: row.year,
    compatibility: row.compatibility,
    status: row.status,
    images: safeParse(row.images),
    sold_count: row.sold_count,
    category_name: row.category_name || null,
    manufacturer_name: row.manufacturer_name || null,
    model_name: row.model_name || null,
    created_at: row.created_at,
  };
}

function safeParse(s) {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name, m.name AS manufacturer_name, mm.name AS model_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN manufacturers m ON m.id = p.manufacturer_id
  LEFT JOIN motorcycle_models mm ON mm.id = p.model_id
`;

function buildProductQuery(params) {
  const where = ['p.status = ?'];
  const args = ['active'];

  if (params.category) {
    where.push('(c.id = ? OR c.slug = ?)');
    args.push(params.category, params.category);
  }
  if (params.manufacturer) {
    where.push('(m.id = ? OR m.slug = ?)');
    args.push(params.manufacturer, params.manufacturer);
  }
  if (params.model) {
    where.push('(mm.id = ? OR mm.name = ?)');
    args.push(params.model, params.model);
  }
  if (params.q) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
    const like = `%${params.q}%`;
    args.push(like, like, like);
  }
  if (params.minPrice !== null && params.minPrice !== undefined) {
    where.push('p.price >= ?');
    args.push(params.minPrice);
  }
  if (params.maxPrice !== null && params.maxPrice !== undefined) {
    where.push('p.price <= ?');
    args.push(params.maxPrice);
  }
  if (params.inStock === 'true' || params.inStock === '1') {
    where.push('p.stock > 0');
  }
  if (params.discounted === 'true' || params.discounted === '1') {
    where.push('p.discount > 0');
  }

  return { where, args };
}

function getSort(params) {
  switch (params.sort) {
    case 'price_asc':
      return 'p.price ASC';
    case 'price_desc':
      return 'p.price DESC';
    case 'bestselling':
      return 'p.sold_count DESC';
    case 'newest':
    default:
      return 'p.id DESC';
  }
}

function listProducts(params) {
  const { where, args } = buildProductQuery(params);
  const sort = getSort(params);
  const page = Math.max(1, toInt(params.page, 1));
  const pageSize = Math.min(100, Math.max(1, toInt(params.pageSize, config.pageSize)));
  const offset = (page - 1) * pageSize;

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countRow = db
    .prepare(`SELECT COUNT(*) AS c FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN manufacturers m ON m.id = p.manufacturer_id
      LEFT JOIN motorcycle_models mm ON mm.id = p.model_id
      ${whereSql}`)
    .get(...args);
  const total = countRow.c;

  const rows = db
    .prepare(`${PRODUCT_SELECT} ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`)
    .all(...args, pageSize, offset);

  return {
    products: rows.map(productToJson),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

function getProduct(idOrSlug) {
  const row = db
    .prepare(`${PRODUCT_SELECT} WHERE p.id = ? OR p.slug = ? LIMIT 1`)
    .get(idOrSlug, idOrSlug);
  return row ? productToJson(row) : null;
}

function getRelated(product) {
  if (!product) return [];
  const rows = db
    .prepare(`${PRODUCT_SELECT}
      WHERE p.status = 'active' AND p.id != ?
        AND (p.category_id = ? OR p.manufacturer_id = ? OR p.model_id = ?)
      ORDER BY p.sold_count DESC LIMIT 4`)
    .all(product.id, product.category_id, product.manufacturer_id, product.model_id);
  return rows.map(productToJson);
}

function listCategories() {
  return db
    .prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
    .all()
    .map((c) => ({ ...c, parent_id: c.parent_id || null }));
}

function listManufacturers() {
  return db.prepare('SELECT * FROM manufacturers ORDER BY name ASC').all();
}

function listModels(manufacturerId) {
  if (manufacturerId) {
    return db
      .prepare('SELECT * FROM motorcycle_models WHERE manufacturer_id = ? ORDER BY name ASC')
      .all(manufacturerId);
  }
  return db.prepare('SELECT * FROM motorcycle_models ORDER BY name ASC').all();
}

function getManufacturer(idOrSlug) {
  return db
    .prepare('SELECT * FROM manufacturers WHERE id = ? OR slug = ? LIMIT 1')
    .get(idOrSlug, idOrSlug);
}

module.exports = {
  listProducts,
  getProduct,
  getRelated,
  listCategories,
  listManufacturers,
  listModels,
  getManufacturer,
  productToJson,
  safeParse,
};
