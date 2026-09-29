// Cart — persisted in localStorage
const CART_KEY = 'motorstore_cart';

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.product_id === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 999);
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      old_price: product.old_price,
      image: product.images && product.images.length ? product.images[0] : null,
      stock: product.stock,
      quantity,
    });
  }
  saveCart(cart);
  updateCartCount();
  return cart;
}

export function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((i) => i.product_id === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return getCart();
    }
    item.quantity = Math.min(quantity, 999);
    saveCart(cart);
  }
  updateCartCount();
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.product_id !== productId);
  saveCart(cart);
  updateCartCount();
  return cart;
}

export function clearCart() {
  saveCart([]);
  updateCartCount();
}

export function cartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

export function cartSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

export function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = String(cartCount());
}
