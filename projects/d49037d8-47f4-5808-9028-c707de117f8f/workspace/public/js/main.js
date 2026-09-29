import { apiGet, apiPost, buildQuery } from './api.js';
import * as Cart from './cart.js';
import { formatPrice, formatNumber, formatDate, toast, escapeHtml, el, skeletonCard, emptyState, loadingState, errorState } from './ui.js';
import { renderAdmin } from './admin.js';

const app = document.getElementById('app');

// ===== Product card =====
function productImage(product, cls = '') {
  const img = product.images && product.images.length ? product.images[0] : null;
  if (img) {
    return el('img', { src: img, alt: product.name, loading: 'lazy' });
  }
  return el('div', { class: `placeholder ${cls}` }, '🏍️');
}

function renderProductCard(product) {
  const card = el('article', { class: 'product-card', dataset: { id: product.id } });

  const media = el('div', { class: 'product-media' });
  media.appendChild(productImage(product));

  // badges
  if (product.stock <= 0) {
    media.appendChild(el('span', { class: 'badge badge-out' }, 'غير متوفر'));
  } else if (product.discount > 0) {
    media.appendChild(el('span', { class: 'badge badge-discount' }, `-${product.discount}%`));
  } else if (product.stock <= 5) {
    media.appendChild(el('span', { class: 'badge badge-low' }, 'كمية محدودة'));
  }

  // hover overlay (desktop)
  const overlay = el('div', { class: 'product-overlay' });
  const addBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'إضافة إلى السلة');
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) { toast('المنتج غير متوفر', 'error'); return; }
    Cart.addToCart(product, 1);
    toast('تمت الإضافة إلى السلة', 'success');
  });
  overlay.appendChild(addBtn);
  media.appendChild(overlay);

  const body = el('div', { class: 'product-body' });
  if (product.category_name) {
    body.appendChild(el('div', { class: 'product-cat' }, product.category_name));
  }
  body.appendChild(el('h3', { class: 'product-name' }, [
    el('a', { href: `#/product/${product.slug}` }, product.name),
  ]));

  const price = el('div', { class: 'product-price' });
  price.appendChild(el('span', { class: 'price-now' }, formatPrice(product.price)));
  if (product.old_price && product.old_price > product.price) {
    price.appendChild(el('span', { class: 'price-old' }, formatPrice(product.old_price)));
  }
  body.appendChild(price);

  const meta = el('div', { class: 'product-meta' });
  meta.appendChild(el('span', { class: product.stock > 0 ? 'stock-in' : 'stock-out' },
    product.stock > 0 ? `متوفر (${product.stock})` : 'نفد المخزون'));
  body.appendChild(meta);

  // details button
  body.appendChild(el('a', { class: 'btn btn-ghost btn-sm mt-8', href: `#/product/${product.slug}`, style: 'text-align:center;' }, 'التفاصيل'));

  // mobile add-to-cart
  const mobileAdd = el('button', {
    class: 'btn btn-primary btn-sm mobile-add',
    type: 'button',
  }, 'إضافة إلى السلة');
  mobileAdd.addEventListener('click', () => {
    if (product.stock <= 0) { toast('المنتج غير متوفر', 'error'); return; }
    Cart.addToCart(product, 1);
    toast('تمت الإضافة إلى السلة', 'success');
  });
  body.appendChild(mobileAdd);

  card.appendChild(media);
  card.appendChild(body);
  return card;
}

function productGrid(products) {
  const grid = el('div', { class: 'product-grid' });
  products.forEach((p) => grid.appendChild(renderProductCard(p)));
  return grid;
}

// ===== Home =====
async function renderHome() {
  app.innerHTML = '';
  const hero = el('section', { class: 'hero' }, [
    el('div', { class: 'container' }, [
      el('h1', { html: 'كل ما تحتاجه لموتوسيكلك في <span>مكان واحد</span>' }),
      el('p', {}, 'موتوسيكلات، قطع غيار أصلية، إكسسوارات ومستلزمات — تشكيلة واسعة لأشهر الماركات Honda وYamaha وSYM وBajaj.'),
      el('div', { class: 'hero-actions' }, [
        el('a', { class: 'btn btn-primary', href: '#/products' }, 'تسوق الآن'),
        el('a', { class: 'btn btn-outline', href: '#/browse' }, 'قطع غيار حسب الموتوسيكل'),
      ]),
    ]),
  ]);
  app.appendChild(hero);

  const main = el('div', { class: 'container' });

  // Categories
  const catSection = el('section', { class: 'section' });
  catSection.appendChild(el('div', { class: 'section-head' }, [
    el('h2', { class: 'section-title' }, 'أقسام المتجر'),
    el('a', { class: 'section-link', href: '#/categories' }, 'عرض الكل'),
  ]));
  const catGrid = el('div', { class: 'cat-grid' });
  catGrid.innerHTML = '<div class="loading" style="grid-column:1/-1"><div class="spinner"></div></div>';
  catSection.appendChild(catGrid);
  main.appendChild(catSection);

  // Featured / latest products
  const prodSection = el('section', { class: 'section' });
  prodSection.appendChild(el('div', { class: 'section-head' }, [
    el('h2', { class: 'section-title' }, 'أحدث المنتجات'),
    el('a', { class: 'section-link', href: '#/products' }, 'عرض الكل'),
  ]));
  const prodGrid = el('div', { class: 'product-grid' });
  for (let i = 0; i < 8; i++) prodGrid.appendChild(skeletonCard());
  prodSection.appendChild(prodGrid);
  main.appendChild(prodSection);

  // Offers
  const offerSection = el('section', { class: 'section' });
  offerSection.appendChild(el('div', { class: 'section-head' }, [
    el('h2', { class: 'section-title' }, 'عروض وخصومات'),
    el('a', { class: 'section-link', href: '#/products?discounted=true' }, 'عرض الكل'),
  ]));
  const offerGrid = el('div', { class: 'product-grid' });
  offerGrid.innerHTML = '<div class="loading" style="grid-column:1/-1"><div class="spinner"></div></div>';
  offerSection.appendChild(offerGrid);
  main.appendChild(offerSection);

  app.appendChild(main);

  // load data
  try {
    const [cats, latest, offers] = await Promise.all([
      apiGet('/categories'),
      apiGet('/products?sort=newest&pageSize=8'),
      apiGet('/products?discounted=true&pageSize=8'),
    ]);
    catGrid.innerHTML = '';
    const icons = ['🏍️', '⚙️', '🔧', '🔌', '🛑', '🔩', '🛞', '⛓️', '🛢️', '🔋', '💡', '🪞', '🧰', '🪖', '🧥', '🧰'];
    cats.categories.forEach((c, i) => {
      catGrid.appendChild(el('a', { class: 'cat-chip', href: `#/products?category=${encodeURIComponent(c.slug)}` }, [
        el('span', { class: 'cat-icon' }, icons[i % icons.length]),
        el('span', {}, c.name),
      ]));
    });
    prodGrid.innerHTML = '';
    latest.products.forEach((p) => prodGrid.appendChild(renderProductCard(p)));
    offerGrid.innerHTML = '';
    if (offers.products.length) {
      offers.products.forEach((p) => offerGrid.appendChild(renderProductCard(p)));
    } else {
      offerGrid.appendChild(el('div', { class: 'empty', style: 'grid-column:1/-1' }, 'لا توجد عروض حاليًا'));
    }
  } catch (e) {
    catGrid.innerHTML = '';
    prodGrid.innerHTML = '';
    prodGrid.appendChild(errorState(e.message));
  }
}

// ===== Products list =====
async function renderProducts(params) {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });

  container.appendChild(el('div', { class: 'breadcrumb' }, [
    el('a', { href: '#/' }, 'الرئيسية'),
    el('span', { class: 'sep' }, '›'),
    el('span', {}, 'المنتجات'),
  ]));
  container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:18px' }, 'المنتجات'));

  // Filters
  const filters = el('div', { class: 'filters-bar' });
  const sortSel = el('select', { id: 'filter-sort' });
  [['newest', 'الأحدث'], ['price_asc', 'السعر: من الأقل للأعلى'], ['price_desc', 'السعر: من الأعلى للأقل'], ['bestselling', 'الأكثر مبيعًا']]
    .forEach(([v, label]) => sortSel.appendChild(el('option', { value: v, selected: params.sort === v ? 'selected' : null }, label)));

  const catSel = el('select', { id: 'filter-category' });
  catSel.appendChild(el('option', { value: '' }, 'كل التصنيفات'));
  const manSel = el('select', { id: 'filter-manufacturer' });
  manSel.appendChild(el('option', { value: '' }, 'كل الشركات'));

  const inStock = el('label', { class: 'flex gap-8', style: 'align-items:center;font-size:0.88rem;' }, [
    el('input', { type: 'checkbox', id: 'filter-instock', checked: params.inStock ? 'checked' : null }),
    'متوفر فقط',
  ]);

  filters.appendChild(sortSel);
  filters.appendChild(catSel);
  filters.appendChild(manSel);
  filters.appendChild(inStock);
  container.appendChild(filters);

  const grid = el('div', { class: 'product-grid' });
  for (let i = 0; i < 8; i++) grid.appendChild(skeletonCard());
  container.appendChild(grid);

  const pagination = el('div', { class: 'pagination' });
  container.appendChild(pagination);

  app.appendChild(container);

  // load categories & manufacturers for filters
  try {
    const [cats, mans] = await Promise.all([apiGet('/categories'), apiGet('/manufacturers')]);
    cats.categories.forEach((c) => catSel.appendChild(el('option', { value: c.slug, selected: params.category === c.slug ? 'selected' : null }, c.name)));
    mans.manufacturers.forEach((m) => manSel.appendChild(el('option', { value: m.slug, selected: params.manufacturer === m.slug ? 'selected' : null }, m.name)));
  } catch (e) { /* ignore */ }

  async function load() {
    const query = {
      sort: sortSel.value,
      category: catSel.value,
      manufacturer: manSel.value,
      inStock: document.getElementById('filter-instock').checked ? 'true' : '',
      q: params.q,
      page: params.page || 1,
      pageSize: 12,
    };
    grid.innerHTML = '';
    for (let i = 0; i < 8; i++) grid.appendChild(skeletonCard());
    try {
      const data = await apiGet('/products' + buildQuery(query));
      grid.innerHTML = '';
      if (!data.products.length) {
        grid.appendChild(el('div', { class: 'empty', style: 'grid-column:1/-1' }, [
          el('div', { class: 'empty-icon' }, '🔍'),
          el('p', {}, 'لا توجد منتجات مطابقة'),
        ]));
      } else {
        data.products.forEach((p) => grid.appendChild(renderProductCard(p)));
      }
      renderPagination(pagination, data.page, data.totalPages, (page) => {
        location.hash = '#/products' + buildQuery({ ...query, page });
      });
    } catch (e) {
      grid.innerHTML = '';
      grid.appendChild(errorState(e.message));
    }
  }

  sortSel.addEventListener('change', load);
  catSel.addEventListener('change', load);
  manSel.addEventListener('change', load);
  inStock.addEventListener('change', load);

  await load();
}

function renderPagination(container, page, totalPages, onPage) {
  container.innerHTML = '';
  if (totalPages <= 1) return;
  const prev = el('button', { disabled: page <= 1 ? 'disabled' : null }, '‹');
  prev.addEventListener('click', () => onPage(page - 1));
  container.appendChild(prev);
  for (let i = 1; i <= totalPages; i++) {
    const b = el('button', { class: i === page ? 'active' : null }, String(i));
    b.addEventListener('click', () => onPage(i));
    container.appendChild(b);
  }
  const next = el('button', { disabled: page >= totalPages ? 'disabled' : null }, '›');
  next.addEventListener('click', () => onPage(page + 1));
  container.appendChild(next);
}

// ===== Product detail =====
async function renderProductDetail(slug) {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });
  container.appendChild(loadingState());
  app.appendChild(container);

  try {
    const data = await apiGet(`/products/${encodeURIComponent(slug)}`);
    const p = data.product;
    container.innerHTML = '';

    container.appendChild(el('div', { class: 'breadcrumb' }, [
      el('a', { href: '#/' }, 'الرئيسية'),
      el('span', { class: 'sep' }, '›'),
      el('a', { href: '#/products' }, 'المنتجات'),
      el('span', { class: 'sep' }, '›'),
      el('span', {}, p.name),
    ]));

    const pdp = el('div', { class: 'pdp' });

    // Gallery
    const gallery = el('div', { class: 'pdp-gallery' });
    const images = p.images && p.images.length ? p.images : [];
    const mainImg = images.length
      ? el('img', { class: 'main-img', src: images[0], alt: p.name })
      : el('div', { class: 'main-img placeholder', style: 'aspect-ratio:1/1;display:grid;place-items:center;font-size:5rem;' }, '🏍️');
    gallery.appendChild(mainImg);
    if (images.length > 1) {
      const thumbs = el('div', { class: 'pdp-thumbs' });
      images.forEach((src, i) => {
        const t = el('img', { src, alt: `${p.name} ${i + 1}`, class: i === 0 ? 'active' : '' });
        t.addEventListener('click', () => {
          mainImg.src = src;
          thumbs.querySelectorAll('img').forEach((x) => x.classList.remove('active'));
          t.classList.add('active');
        });
        thumbs.appendChild(t);
      });
      gallery.appendChild(thumbs);
    }
    pdp.appendChild(gallery);

    // Info
    const info = el('div', { class: 'pdp-info' });
    info.appendChild(el('h1', {}, p.name));
    if (p.category_name) info.appendChild(el('div', { class: 'product-cat mt-8' }, p.category_name));

    const price = el('div', { class: 'pdp-price' });
    price.appendChild(el('span', { class: 'price-now' }, formatPrice(p.price)));
    if (p.old_price && p.old_price > p.price) {
      price.appendChild(el('span', { class: 'price-old' }, formatPrice(p.old_price)));
      price.appendChild(el('span', { class: 'badge badge-discount', style: 'position:static;' }, `خصم ${p.discount}%`));
    }
    info.appendChild(price);

    // specs
    const specs = el('table', { class: 'spec-table' });
    const rows = [
      ['الشركة', p.manufacturer_name || '—'],
      ['الموديل', p.model_name || '—'],
      ['سنة الموديل', p.year || '—'],
      ['التوافق', p.compatibility || '—'],
      ['SKU', p.sku || '—'],
      ['حالة المخزون', p.stock > 0 ? `متوفر (${p.stock})` : 'نفد المخزون'],
    ];
    rows.forEach(([k, v]) => {
      const tr = el('tr');
      tr.appendChild(el('td', {}, k));
      tr.appendChild(el('td', {}, v));
      specs.appendChild(tr);
    });
    info.appendChild(specs);

    if (p.description) {
      info.appendChild(el('h3', { style: 'font-weight:800;margin-bottom:6px' }, 'الوصف'));
      info.appendChild(el('p', { class: 'pdp-desc' }, p.description));
    }

    // quantity + add to cart
    const actions = el('div', { class: 'pdp-actions' });
    const qty = el('div', { class: 'qty-control' });
    const minus = el('button', { type: 'button' }, '−');
    const qtyInput = el('input', { type: 'number', value: '1', min: '1', max: String(Math.max(1, p.stock)) });
    const plus = el('button', { type: 'button' }, '+');
    minus.addEventListener('click', () => qtyInput.value = Math.max(1, Number(qtyInput.value) - 1));
    plus.addEventListener('click', () => qtyInput.value = Math.min(Math.max(1, p.stock), Number(qtyInput.value) + 1));
    qty.appendChild(minus); qty.appendChild(qtyInput); qty.appendChild(plus);

    const addBtn = el('button', { class: 'btn btn-primary', type: 'button', disabled: p.stock <= 0 ? 'disabled' : null },
      p.stock > 0 ? 'إضافة إلى السلة' : 'غير متوفر');
    addBtn.addEventListener('click', () => {
      Cart.addToCart(p, Number(qtyInput.value) || 1);
      toast('تمت الإضافة إلى السلة', 'success');
    });

    actions.appendChild(qty);
    actions.appendChild(addBtn);
    info.appendChild(actions);

    pdp.appendChild(info);
    container.appendChild(pdp);

    // Related
    if (data.related && data.related.length) {
      const rel = el('section', { class: 'section' });
      rel.appendChild(el('h2', { class: 'section-title', style: 'margin-bottom:18px' }, 'منتجات مرتبطة'));
      rel.appendChild(productGrid(data.related));
      container.appendChild(rel);
    }

    // SEO structured data
    injectStructuredData(p);
  } catch (e) {
    container.innerHTML = '';
    container.appendChild(errorState(e.message));
  }
}

function injectStructuredData(p) {
  let script = document.getElementById('product-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-jsonld';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || '',
    sku: p.sku || undefined,
    image: p.images && p.images.length ? p.images : undefined,
    brand: p.manufacturer_name ? { '@type': 'Brand', name: p.manufacturer_name } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EGP',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  });
}

// ===== Categories =====
async function renderCategories() {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });
  container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:24px' }, 'تصنيفات المنتجات'));
  const grid = el('div', { class: 'cat-grid' });
  grid.appendChild(el('div', { class: 'loading', style: 'grid-column:1/-1' }, [el('div', { class: 'spinner' })]));
  container.appendChild(grid);
  app.appendChild(container);

  try {
    const data = await apiGet('/categories');
    grid.innerHTML = '';
    const icons = ['🏍️', '⚙️', '🔧', '🔌', '🛑', '🔩', '🛞', '⛓️', '🛢️', '🔋', '💡', '🪞', '🧰', '🪖', '🧥', '🧰'];
    data.categories.forEach((c, i) => {
      grid.appendChild(el('a', { class: 'cat-chip', href: `#/products?category=${encodeURIComponent(c.slug)}` }, [
        el('span', { class: 'cat-icon' }, icons[i % icons.length]),
        el('span', {}, c.name),
      ]));
    });
  } catch (e) {
    grid.innerHTML = '';
    grid.appendChild(errorState(e.message));
  }
}

// ===== Browse by motorcycle =====
async function renderBrowse(manufacturerSlug, modelName) {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });

  if (!manufacturerSlug) {
    container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:8px' }, 'اختر نوع الموتوسيكل'));
    container.appendChild(el('p', { class: 'text-muted mb-24' }, 'اختر الشركة المصنّعة لعرض قطع الغيار المناسبة لموتوسيكلك.'));
    const grid = el('div', { class: 'man-grid' });
    grid.appendChild(el('div', { class: 'loading', style: 'grid-column:1/-1' }, [el('div', { class: 'spinner' })]));
    container.appendChild(grid);
    app.appendChild(container);
    try {
      const data = await apiGet('/manufacturers');
      grid.innerHTML = '';
      data.manufacturers.forEach((m) => {
        grid.appendChild(el('a', { class: 'man-card', href: `#/browse/${m.slug}` }, m.name));
      });
    } catch (e) {
      grid.innerHTML = '';
      grid.appendChild(errorState(e.message));
    }
    return;
  }

  // manufacturer selected
  if (!modelName) {
    container.appendChild(el('div', { class: 'breadcrumb' }, [
      el('a', { href: '#/' }, 'الرئيسية'),
      el('span', { class: 'sep' }, '›'),
      el('a', { href: '#/browse' }, 'الشركات'),
      el('span', { class: 'sep' }, '›'),
      el('span', {}, manufacturerSlug),
    ]));
    container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:8px' }, `موديلات ${manufacturerSlug}`));
    container.appendChild(el('p', { class: 'text-muted mb-24' }, 'اختر الموديل لعرض قطع الغيار المتوافقة.'));
    const grid = el('div', { class: 'model-grid' });
    grid.appendChild(el('div', { class: 'loading', style: 'grid-column:1/-1' }, [el('div', { class: 'spinner' })]));
    container.appendChild(grid);
    app.appendChild(container);
    try {
      const data = await apiGet('/manufacturers');
      const man = data.manufacturers.find((m) => m.slug === manufacturerSlug || m.id === Number(manufacturerSlug));
      if (!man) { grid.innerHTML = ''; grid.appendChild(errorState('الشركة غير موجودة')); return; }
      const models = await apiGet(`/manufacturers/${man.id}/models`);
      grid.innerHTML = '';
      if (!models.models.length) {
        grid.appendChild(el('div', { class: 'empty', style: 'grid-column:1/-1' }, 'لا توجد موديلات لهذه الشركة'));
      } else {
        models.models.forEach((m) => {
          grid.appendChild(el('a', { class: 'model-card', href: `#/browse/${man.slug}/${encodeURIComponent(m.name)}` }, m.name));
        });
      }
    } catch (e) {
      grid.innerHTML = '';
      grid.appendChild(errorState(e.message));
    }
    return;
  }

  // model selected → show parts
  container.appendChild(el('div', { class: 'breadcrumb' }, [
    el('a', { href: '#/' }, 'الرئيسية'),
    el('span', { class: 'sep' }, '›'),
    el('a', { href: '#/browse' }, 'الشركات'),
    el('span', { class: 'sep' }, '›'),
    el('a', { href: `#/browse/${manufacturerSlug}` }, manufacturerSlug),
    el('span', { class: 'sep' }, '›'),
    el('span', {}, modelName),
  ]));
  container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:24px' }, `قطع غيار ${manufacturerSlug} ${modelName}`));
  const grid = el('div', { class: 'product-grid' });
  for (let i = 0; i < 8; i++) grid.appendChild(skeletonCard());
  container.appendChild(grid);
  app.appendChild(container);

  try {
    const data = await apiGet('/products' + buildQuery({ manufacturer: manufacturerSlug, model: modelName, pageSize: 100 }));
    grid.innerHTML = '';
    if (!data.products.length) {
      grid.appendChild(el('div', { class: 'empty', style: 'grid-column:1/-1' }, [
        el('div', { class: 'empty-icon' }, '🔧'),
        el('p', {}, 'لا توجد قطع غيار لهذا الموديل حاليًا'),
      ]));
    } else {
      data.products.forEach((p) => grid.appendChild(renderProductCard(p)));
    }
  } catch (e) {
    grid.innerHTML = '';
    grid.appendChild(errorState(e.message));
  }
}

// ===== Cart =====
function renderCart() {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });
  container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:24px' }, 'سلة التسوق'));

  const cart = Cart.getCart();
  if (!cart.length) {
    container.appendChild(emptyState('السلة فارغة — تصفح المنتجات وأضف ما يعجبك', '🛒'));
    container.appendChild(el('div', { class: 'text-center mt-16' }, [
      el('a', { class: 'btn btn-primary', href: '#/products' }, 'تصفح المنتجات'),
    ]));
    app.appendChild(container);
    return;
  }

  const layout = el('div', { class: 'cart-layout' });
  const items = el('div', { style: 'display:flex;flex-direction:column;gap:14px;' });

  cart.forEach((item) => {
    const row = el('div', { class: 'cart-item' });
    row.appendChild(item.image
      ? el('img', { src: item.image, alt: item.name })
      : el('div', { class: 'placeholder', style: 'width:90px;height:90px;border-radius:10px;display:grid;place-items:center;font-size:2rem;background:#f1f5f9;' }, '🏍️'));

    const info = el('div', {});
    info.appendChild(el('div', { class: 'ci-name' }, item.name));
    info.appendChild(el('div', { class: 'ci-price' }, formatPrice(item.price)));
    info.appendChild(el('div', { class: 'text-muted', style: 'font-size:0.85rem' }, `الإجمالي: ${formatPrice(item.price * item.quantity)}`));

    const qty = el('div', { class: 'qty-control mt-8' });
    const minus = el('button', { type: 'button' }, '−');
    const qtyInput = el('input', { type: 'number', value: String(item.quantity), min: '1' });
    const plus = el('button', { type: 'button' }, '+');
    const applyQty = (v) => {
      const n = Math.max(1, Math.min(Number(v) || 1, item.stock || 999));
      Cart.updateQuantity(item.product_id, n);
      renderCart();
    };
    minus.addEventListener('click', () => applyQty(Number(qtyInput.value) - 1));
    plus.addEventListener('click', () => applyQty(Number(qtyInput.value) + 1));
    qtyInput.addEventListener('change', () => applyQty(qtyInput.value));
    qty.appendChild(minus); qty.appendChild(qtyInput); qty.appendChild(plus);
    info.appendChild(qty);

    row.appendChild(info);

    const actions = el('div', { class: 'ci-actions' });
    actions.appendChild(el('div', { class: 'ci-price' }, formatPrice(item.price * item.quantity)));
    const remove = el('button', { class: 'remove-btn', type: 'button' }, 'حذف');
    remove.addEventListener('click', () => {
      Cart.removeFromCart(item.product_id);
      toast('تم حذف المنتج', 'info');
      renderCart();
    });
    actions.appendChild(remove);
    row.appendChild(actions);

    items.appendChild(row);
  });

  const summary = el('div', { class: 'summary-card' });
  summary.appendChild(el('h3', { style: 'font-weight:800;margin-bottom:14px' }, 'ملخص الطلب'));
  const subtotal = Cart.cartSubtotal();
  summary.appendChild(summaryRow('المجموع الفرعي', formatPrice(subtotal)));
  summary.appendChild(summaryRow('الخصم', '—'));
  summary.appendChild(summaryRow('الشحن', 'يُحسب عند إتمام الطلب'));
  summary.appendChild(el('div', { class: 'summary-row total' }, [
    el('span', {}, 'الإجمالي'),
    el('span', { class: 'val' }, formatPrice(subtotal)),
  ]));
  summary.appendChild(el('a', { class: 'btn btn-primary mt-16', href: '#/checkout', style: 'width:100%' }, 'إتمام الطلب'));
  summary.appendChild(el('a', { class: 'btn btn-ghost mt-8', href: '#/products', style: 'width:100%' }, 'متابعة التسوق'));

  layout.appendChild(items);
  layout.appendChild(summary);
  container.appendChild(layout);
  app.appendChild(container);
}

function summaryRow(label, value) {
  return el('div', { class: 'summary-row' }, [
    el('span', {}, label),
    el('span', { class: 'val' }, value),
  ]);
}

// ===== Checkout =====
let settings = null;
async function getSettings() {
  if (!settings) settings = await apiGet('/settings');
  return settings;
}

async function renderCheckout() {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });
  container.appendChild(el('h1', { class: 'section-title', style: 'margin-bottom:24px' }, 'إتمام الطلب'));

  const cart = Cart.getCart();
  if (!cart.length) {
    container.appendChild(emptyState('السلة فارغة', '🛒'));
    app.appendChild(container);
    return;
  }

  let s;
  try { s = await getSettings(); } catch (e) { s = { wallet_number: '01055325632', shipping_fee: 60 }; }

  const layout = el('div', { class: 'checkout-layout' });

  // Form
  const formPanel = el('div', { class: 'panel' });
  formPanel.appendChild(el('h2', {}, 'بيانات المشتري'));
  const form = el('form', { id: 'checkout-form' });
  const grid = el('div', { class: 'form-grid' });

  const fields = [
    { name: 'customer_name', label: 'الاسم الكامل *', type: 'text', full: false },
    { name: 'phone', label: 'رقم الهاتف *', type: 'tel', full: false },
    { name: 'whatsapp', label: 'رقم واتساب (اختياري)', type: 'tel', full: false },
    { name: 'governorate', label: 'المحافظة *', type: 'text', full: false },
    { name: 'city', label: 'المدينة *', type: 'text', full: false },
    { name: 'address', label: 'العنوان بالتفصيل *', type: 'text', full: true },
    { name: 'notes', label: 'ملاحظات الطلب', type: 'textarea', full: true },
  ];
  fields.forEach((f) => {
    const field = el('div', { class: `form-field ${f.full ? 'full' : ''}` });
    field.appendChild(el('label', { for: f.name }, f.label));
    const input = f.type === 'textarea'
      ? el('textarea', { id: f.name, name: f.name, required: f.label.includes('*') ? 'required' : null })
      : el('input', { id: f.name, name: f.name, type: f.type, required: f.label.includes('*') ? 'required' : null });
    field.appendChild(input);
    grid.appendChild(field);
  });

  form.appendChild(grid);

  // Payment
  form.appendChild(el('h2', { style: 'margin:24px 0 14px' }, 'طريقة الدفع'));
  const payOptions = el('div', { class: 'payment-options' });
  const instapayOpt = paymentOption('instapay', 'InstaPay', 'حوّل المبلغ عبر تطبيق InstaPay ثم ارفع إثبات الدفع.');
  const walletOpt = paymentOption('wallet', 'المحفظة الإلكترونية', `حوّل إلى رقم المحفظة: ${s.wallet_number}`);
  payOptions.appendChild(instapayOpt);
  payOptions.appendChild(walletOpt);
  form.appendChild(payOptions);

  // transaction id
  const txField = el('div', { class: 'form-field full mt-16' });
  txField.appendChild(el('label', { for: 'transaction_id' }, 'رقم العملية / Transaction ID (اختياري)'));
  txField.appendChild(el('input', { id: 'transaction_id', name: 'transaction_id', type: 'text' }));
  form.appendChild(txField);

  const submit = el('button', { class: 'btn btn-primary mt-24', type: 'submit', style: 'width:100%' }, 'تأكيد الطلب');
  form.appendChild(submit);
  formPanel.appendChild(form);

  // Summary
  const summary = el('div', { class: 'summary-card' });
  summary.appendChild(el('h3', { style: 'font-weight:800;margin-bottom:14px' }, 'ملخص الطلب'));
  const subtotal = Cart.cartSubtotal();
  cart.forEach((item) => {
    summary.appendChild(summaryRow(`${item.name} × ${item.quantity}`, formatPrice(item.price * item.quantity)));
  });
  summary.appendChild(el('div', { style: 'border-top:1px solid var(--border);margin:8px 0' }));
  summary.appendChild(summaryRow('المجموع الفرعي', formatPrice(subtotal)));
  summary.appendChild(summaryRow('تكلفة الشحن', formatPrice(s.shipping_fee)));
  summary.appendChild(el('div', { class: 'summary-row total' }, [
    el('span', {}, 'الإجمالي'),
    el('span', { class: 'val' }, formatPrice(subtotal + s.shipping_fee)),
  ]));
  summary.appendChild(el('p', { class: 'text-muted mt-16', style: 'font-size:0.82rem' },
    'بعد تأكيد الطلب سيتم توجيهك لرفع إثبات الدفع. سيتم مراجعة الدفع وتأكيد الطلب.'));

  layout.appendChild(formPanel);
  layout.appendChild(summary);
  container.appendChild(layout);
  app.appendChild(container);

  // payment option selection
  let selectedMethod = 'instapay';
  function selectPayment(method) {
    selectedMethod = method;
    [instapayOpt, walletOpt].forEach((o) => o.classList.toggle('selected', o.dataset.method === method));
    if (method === 'wallet') {
      let wn = summary.querySelector('.wallet-number');
      if (!wn) {
        wn = el('div', { class: 'wallet-number' }, s.wallet_number);
        summary.insertBefore(wn, summary.querySelector('.text-muted'));
      }
    } else {
      const wn = summary.querySelector('.wallet-number');
      if (wn) wn.remove();
    }
  }
  instapayOpt.addEventListener('click', () => selectPayment('instapay'));
  walletOpt.addEventListener('click', () => selectPayment('wallet'));
  selectPayment('instapay');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {
      customer_name: fd.get('customer_name'),
      phone: fd.get('phone'),
      whatsapp: fd.get('whatsapp'),
      governorate: fd.get('governorate'),
      city: fd.get('city'),
      address: fd.get('address'),
      notes: fd.get('notes'),
      payment_method: selectedMethod,
      transaction_id: fd.get('transaction_id'),
      items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    };
    submit.disabled = true;
    submit.textContent = 'جارٍ إرسال الطلب...';
    try {
      const data = await apiPost('/orders', body);
      Cart.clearCart();
      location.hash = `#/order/${data.order.access_token}`;
    } catch (err) {
      toast(err.message, 'error');
      submit.disabled = false;
      submit.textContent = 'تأكيد الطلب';
    }
  });
}

function paymentOption(method, title, desc) {
  const opt = el('label', { class: 'payment-option', dataset: { method } });
  opt.appendChild(el('input', { type: 'radio', name: 'payment_method', value: method }));
  const box = el('div', {});
  box.appendChild(el('div', { class: 'po-title' }, title));
  box.appendChild(el('div', { class: 'po-desc' }, desc));
  opt.appendChild(box);
  return opt;
}

// ===== Order success / payment proof =====
async function renderOrderSuccess(orderId) {
  app.innerHTML = '';
  const container = el('div', { class: 'container section' });
  container.appendChild(loadingState());
  app.appendChild(container);

  try {
    const data = await apiGet(`/orders/access/${orderId}`);
    const order = data.order;
    container.innerHTML = '';

    container.appendChild(el('div', { class: 'panel text-center', style: 'max-width:640px;margin:0 auto;' }, [
      el('div', { style: 'font-size:3.5rem' }, '✅'),
      el('h1', { style: 'font-size:1.6rem;font-weight:800;margin:12px 0' }, 'تم استلام طلبك بنجاح'),
      el('p', { class: 'text-muted' }, 'تم استلام طلبك، وسيتم مراجعة الدفع وتأكيد الطلب.'),
      el('div', { class: 'mt-24', style: 'background:var(--surface-2);border-radius:10px;padding:16px;' }, [
        el('div', { class: 'summary-row' }, [el('span', {}, 'رقم الطلب'), el('strong', { style: 'direction:ltr' }, order.order_number)]),
        el('div', { class: 'summary-row' }, [el('span', {}, 'الإجمالي'), el('strong', {}, formatPrice(order.total))]),
        el('div', { class: 'summary-row' }, [el('span', {}, 'طريقة الدفع'), el('strong', {}, order.payment_method === 'wallet' ? 'المحفظة الإلكترونية' : 'InstaPay')]),
      ]),
    ]));

    // Payment proof upload
    const proofPanel = el('div', { class: 'panel mt-24', style: 'max-width:640px;margin:0 auto;' });
    proofPanel.appendChild(el('h2', {}, 'رفع إثبات الدفع'));
    proofPanel.appendChild(el('p', { class: 'text-muted mb-16' },
      'بعد تحويل المبلغ، ارفع Screenshot لإثبات الدفع مع رقم العملية إن وجد.'));

    const proofForm = el('form', { id: 'proof-form' });
    const fileField = el('div', { class: 'form-field full' });
    fileField.appendChild(el('label', { for: 'screenshot' }, 'صورة إثبات الدفع (Screenshot) *'));
    fileField.appendChild(el('input', { id: 'screenshot', name: 'screenshot', type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif', required: 'required' }));
    proofForm.appendChild(fileField);

    const txField = el('div', { class: 'form-field full mt-16' });
    txField.appendChild(el('label', { for: 'proof_tx' }, 'رقم العملية / Transaction ID (اختياري)'));
    txField.appendChild(el('input', { id: 'proof_tx', name: 'transaction_id', type: 'text' }));
    proofForm.appendChild(txField);

    const uploadBtn = el('button', { class: 'btn btn-primary mt-16', type: 'submit' }, 'رفع إثبات الدفع');
    proofForm.appendChild(uploadBtn);
    proofPanel.appendChild(proofForm);

    // existing screenshots
    if (order.screenshots && order.screenshots.length) {
      const imgs = el('div', { class: 'flex gap-12 mt-16', style: 'flex-wrap:wrap' });
      order.screenshots.forEach((sc) => {
        const img = el('img', { src: sc.path, alt: 'إثبات الدفع', style: 'width:120px;height:120px;object-fit:cover;border-radius:10px;cursor:pointer;border:1px solid var(--border)' });
        img.addEventListener('click', () => openLightbox(sc.path));
        imgs.appendChild(img);
      });
      proofPanel.appendChild(imgs);
    }

    container.appendChild(proofPanel);

    proofForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(proofForm);
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'جارٍ الرفع...';
      try {
        await apiPost(`/orders/${orderId}/payment-proof`, fd);
        toast('تم رفع إثبات الدفع — سيتم مراجعته', 'success');
        renderOrderSuccess(orderId);
      } catch (err) {
        toast(err.message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'رفع إثبات الدفع';
      }
    });
  } catch (e) {
    container.innerHTML = '';
    container.appendChild(errorState(e.message));
  }
}

function openLightbox(src) {
  const backdrop = el('div', { class: 'modal-backdrop' });
  backdrop.appendChild(el('img', { src, alt: 'إثبات الدفع' }));
  const close = el('button', { class: 'close', type: 'button' }, '×');
  close.addEventListener('click', () => backdrop.remove());
  backdrop.appendChild(close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
}

// ===== Router =====
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const query = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => { query[k] = v; });
  }
  return { segments, query };
}

async function router() {
  const { segments, query } = parseHash();
  const route = segments[0] || '';

  // update active nav
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === (route || 'home'));
  });
  document.getElementById('mobile-menu').classList.remove('open');

  // clear product jsonld
  const old = document.getElementById('product-jsonld');
  if (old) old.remove();

  try {
    if (route === '' || route === 'home') return await renderHome();
    if (route === 'products') return await renderProducts(query);
    if (route === 'product') return await renderProductDetail(segments[1]);
    if (route === 'categories') return await renderCategories();
    if (route === 'browse') return await renderBrowse(segments[1], segments[2] ? decodeURIComponent(segments[2]) : null);
    if (route === 'cart') return renderCart();
    if (route === 'checkout') return await renderCheckout();
    if (route === 'order') return await renderOrderSuccess(segments[1]);
    if (route === 'admin') return await renderAdmin(segments[1]);
    return renderNotFound();
  } catch (e) {
    console.error(e);
    app.innerHTML = '';
    app.appendChild(errorState('حدث خطأ غير متوقع'));
  }
}

function renderNotFound() {
  app.innerHTML = '';
  app.appendChild(el('div', { class: 'container section' }, [
    emptyState('الصفحة غير موجودة', '🔍'),
    el('div', { class: 'text-center mt-16' }, [el('a', { class: 'btn btn-primary', href: '#/' }, 'العودة للرئيسية')]),
  ]));
}

// ===== Init =====
function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  Cart.updateCartCount();

  // search form
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    location.hash = '#/products' + (q ? `?q=${encodeURIComponent(q)}` : '');
  });

  // mobile menu
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('open');
  });

  window.addEventListener('hashchange', router);
  router();
}

init();
