const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { products: [], category: 'All', query: '', cart: loadCart(), user: null, authMode: 'login', activeModal: null };
const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function loadCart() { try { const v = JSON.parse(localStorage.getItem('atelier-cart') || '[]'); return Array.isArray(v) ? v.filter(i => Number.isInteger(i.productId) && Number.isInteger(i.quantity) && i.quantity > 0) : []; } catch { return []; } }
function saveCart() { localStorage.setItem('atelier-cart', JSON.stringify(state.cart)); renderCart(); }
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2800); }
async function loadProducts() {
  try { state.products = await api('/api/products'); renderCategories(); renderProducts(); renderCart(); }
  catch (e) { $('#productGrid').innerHTML = `<p class="empty-results">${escapeHTML(e.message)} Please refresh to try again.</p>`; }
}
function renderCategories() {
  const categories = ['All', ...new Set(state.products.map(p => p.category))];
  $('#categoryFilters').innerHTML = categories.map(c => `<button class="filter ${state.category === c ? 'active' : ''}" data-category="${escapeHTML(c)}">${c === 'All' ? 'All pieces' : escapeHTML(c)}</button>`).join('');
}
function renderProducts() {
  const products = state.products.filter(p => (state.category === 'All' || p.category === state.category) && `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(state.query.toLowerCase()));
  $('#productCount').textContent = `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`;
  if (!products.length) { $('#productGrid').innerHTML = '<p class="empty-results">Nothing found just yet. Try another search.</p>'; return; }
  $('#productGrid').innerHTML = products.map(p => `<article class="product-card"><div class="product-image-wrap">${p.badge ? `<span class="product-badge">${escapeHTML(p.badge)}</span>` : ''}<img class="product-image" src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/700x850/f0eee8/77795f?text=Atelier'"/><button class="quick-add" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>${p.stock < 1 ? 'Sold out' : 'Add to bag  +'}</button></div><div class="product-info"><div><h3 class="product-name">${escapeHTML(p.name)}</h3><p class="product-category">${escapeHTML(p.category)}</p>${p.stock < 5 && p.stock > 0 ? `<p class="stock-note">Only ${p.stock} left</p>` : ''}</div><span class="product-price">${money(p.price)}</span></div></article>`).join('');
}
function cartDetails() { return state.cart.map(i => ({ ...i, product: state.products.find(p => p.id === i.productId) })).filter(i => i.product); }
function renderCart() {
  const rows = cartDetails(); const count = rows.reduce((sum, i) => sum + i.quantity, 0); const total = rows.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  $('#cartCount').textContent = count; $('#bagHeadingCount').textContent = `(${count})`; $('#cartSubtotal').textContent = money(total); $('#checkoutTotal').textContent = money(total);
  $('#cartEmpty').classList.toggle('visible', rows.length === 0); $('#cartSummary').hidden = rows.length === 0; $('#cartItems').innerHTML = rows.map(i => `<div class="cart-row"><img src="${escapeHTML(i.product.image_url)}" alt="${escapeHTML(i.product.name)}"/><div><h3>${escapeHTML(i.product.name)}</h3><p>${money(i.product.price)}</p><div class="qty-control"><button data-qty="${i.productId}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${i.quantity}</span><button data-qty="${i.productId}" data-delta="1" aria-label="Increase quantity" ${i.quantity >= Math.min(10, i.product.stock) ? 'disabled' : ''}>+</button></div><button class="remove-item" data-remove="${i.productId}">Remove</button></div><strong class="product-price">${money(i.product.price * i.quantity)}</strong></div>`).join('');
}
function addToCart(id) {
  const product = state.products.find(p => p.id === Number(id)); if (!product || product.stock < 1) return toast('This piece is currently unavailable.');
  const item = state.cart.find(i => i.productId === product.id);
  if (item) { if (item.quantity >= Math.min(10, product.stock)) return toast('You have reached the available quantity.'); item.quantity++; }
  else state.cart.push({ productId: product.id, quantity: 1 });
  saveCart(); toast(`${product.name} added to your bag.`);
}
function openPanel() { $('#overlay').hidden = false; requestAnimationFrame(() => $('#overlay').classList.add('visible')); $('#cartPanel').classList.add('open'); $('#cartPanel').setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
function closeAll() { $('#overlay').classList.remove('visible'); $('#cartPanel').classList.remove('open'); $('#cartPanel').setAttribute('aria-hidden', 'true'); $$('.modal').forEach(m => { m.classList.remove('open'); m.hidden = true; }); state.activeModal = null; document.body.style.overflow = ''; setTimeout(() => { if (!$('#cartPanel').classList.contains('open') && !state.activeModal) $('#overlay').hidden = true; }, 220); }
function openModal(id) { $('#overlay').hidden = false; requestAnimationFrame(() => $('#overlay').classList.add('visible')); $('#cartPanel').classList.remove('open'); $$('.modal').forEach(m => { m.classList.remove('open'); m.hidden = true; }); const modal = $(`#${id}`); modal.hidden = false; requestAnimationFrame(() => modal.classList.add('open')); state.activeModal = id; document.body.style.overflow = 'hidden'; }
function setAuthMode(mode) { state.authMode = mode; $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.authMode === mode)); $('#nameField').hidden = mode !== 'register'; $('#nameField input').required = mode === 'register'; $('#accountTitle').textContent = mode === 'login' ? 'Good to see you.' : 'Make yourself at home.'; $('#accountSubtitle').textContent = mode === 'login' ? 'Sign in to see your orders and keep the good things close.' : 'Create an account for a smoother checkout and order history.'; $('#authSubmit').textContent = mode === 'login' ? 'Sign in ↗' : 'Create account ↗'; $('#authForm').hidden = false; $('#signedInView').hidden = true; $('#authMessage').textContent = ''; }
async function refreshUser() { try { state.user = (await api('/api/auth/me')).user; } catch { state.user = null; } }
async function showAccount() {
  await refreshUser();
  if (state.user) {
    $('#authForm').hidden = true; $('#signedInView').hidden = false; $('#accountTitle').textContent = 'You’re in.'; $('#accountSubtitle').textContent = 'A good place to keep track of the good things.'; $('#signedInGreeting').textContent = `Hello, ${state.user.name}. You are signed in as ${state.user.email}.`;
    if (state.user.role === 'admin') { $('#viewOrdersBtn').textContent = 'Open admin studio'; }
    else $('#viewOrdersBtn').textContent = 'View my orders';
  } else { setAuthMode('login'); }
  openModal('accountModal');
}
async function showOrders() {
  if (!state.user) return showAccount();
  if (state.user.role === 'admin') {
    try { const orders = await api('/api/admin/orders'); $('#adminOrders').innerHTML = orders.length ? orders.map(o => `<div class="order-card"><div class="order-card-head"><strong>Order #${o.id} · ${escapeHTML(o.account_name)}</strong><span class="status-pill">${escapeHTML(o.status)}</span></div><p>${escapeHTML(o.email)} · ${money(o.total)} · ${new Date(o.created_at + 'Z').toLocaleDateString()}</p><label class="status-select">Update status <select data-order-status="${o.id}">${['placed','processing','shipped','delivered','cancelled'].map(s => `<option ${o.status === s ? 'selected' : ''} value="${s}">${s}</option>`).join('')}</select></label></div>`).join('') : '<p class="modal-subtitle">No orders yet.</p>'; $('#productForm').reset(); $('#adminMessage').textContent = ''; openModal('adminModal'); }
    catch (e) { toast(e.message); }
    return;
  }
  try { const orders = await api('/api/orders'); $('#ordersList').innerHTML = orders.length ? orders.map(o => `<div class="order-card"><div class="order-card-head"><strong>Order #${o.id}</strong><span class="status-pill">${escapeHTML(o.status)}</span></div><p>${new Date(o.created_at + 'Z').toLocaleDateString()} · ${money(o.total)} · Cash on delivery</p><p>${o.items.map(i => `${escapeHTML(i.name)} × ${i.quantity}`).join('<br>')}</p></div>`).join('') : '<p class="modal-subtitle">No orders yet. Your next good find will appear here.</p>'; openModal('ordersModal'); }
  catch (e) { toast(e.message); }
}
$('#categoryFilters').addEventListener('click', e => { const button = e.target.closest('[data-category]'); if (!button) return; state.category = button.dataset.category; renderCategories(); renderProducts(); });
$('#productGrid').addEventListener('click', e => { const button = e.target.closest('[data-add]'); if (button) addToCart(Number(button.dataset.add)); });
$('#searchInput').addEventListener('input', e => { state.query = e.target.value; renderProducts(); });
$('#cartBtn').addEventListener('click', openPanel); $('#accountBtn').addEventListener('click', showAccount); $('#overlay').addEventListener('click', closeAll); $$('[data-close]').forEach(b => b.addEventListener('click', closeAll));
$('#cartItems').addEventListener('click', e => {
  const remove = e.target.closest('[data-remove]'); const qty = e.target.closest('[data-qty]');
  if (remove) state.cart = state.cart.filter(i => i.productId !== Number(remove.dataset.remove));
  if (qty) { const item = state.cart.find(i => i.productId === Number(qty.dataset.qty)); const product = state.products.find(p => p.id === Number(qty.dataset.qty)); if (item) { item.quantity += Number(qty.dataset.delta); if (item.quantity < 1) state.cart = state.cart.filter(i => i !== item); else if (item.quantity > Math.min(10, product.stock)) { item.quantity = Math.min(10, product.stock); toast('Quantity adjusted to available stock.'); } } }
  saveCart();
});
$('#continueShopping').addEventListener('click', closeAll); $('#keepShopping').addEventListener('click', closeAll);
$('#checkoutBtn').addEventListener('click', async () => { await refreshUser(); if (!state.cart.length) return; closeAll(); if (!state.user) { setAuthMode('login'); openModal('accountModal'); toast('Sign in or create an account to check out.'); return; } $('#checkoutForm').reset(); $('#checkoutMessage').textContent = ''; $('#checkoutForm').elements.email.value = state.user.email; $('#checkoutForm').elements.customerName.value = state.user.name; renderCart(); openModal('checkoutModal'); });
$$('[data-auth-mode]').forEach(b => b.addEventListener('click', () => setAuthMode(b.dataset.authMode)));
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault(); const form = new FormData(e.currentTarget); const payload = Object.fromEntries(form.entries()); const mode = state.authMode; $('#authSubmit').disabled = true; $('#authMessage').textContent = 'One moment…';
  try { const result = await api(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(payload) }); state.user = result.user; $('#authMessage').textContent = ''; $('#authMessage').classList.remove('success'); toast(`Welcome${state.user.name ? `, ${state.user.name}` : ''}.`); await showAccount(); }
  catch (err) { $('#authMessage').textContent = err.message; } finally { $('#authSubmit').disabled = false; }
});
$('#logoutBtn').addEventListener('click', async () => { try { await api('/api/auth/logout', { method: 'POST' }); state.user = null; closeAll(); toast('You have signed out.'); } catch (e) { toast(e.message); } });
$('#viewOrdersBtn').addEventListener('click', showOrders);
$('#checkoutForm').addEventListener('submit', async e => {
  e.preventDefault(); if (!state.cart.length) return; const form = new FormData(e.currentTarget); const payload = Object.fromEntries(form.entries()); payload.paymentMethod = 'cash_on_delivery'; payload.items = state.cart.map(i => ({ productId: i.productId, quantity: i.quantity })); const button = e.currentTarget.querySelector('[type="submit"]'); button.disabled = true; $('#checkoutMessage').textContent = 'Placing your order…';
  try { const { order } = await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) }); state.cart = []; saveCart(); closeAll(); await loadProducts(); toast(`Order #${order.id} placed. Thank you!`); }
  catch (err) { $('#checkoutMessage').textContent = err.message; } finally { button.disabled = false; }
});
$('#newsletterForm').addEventListener('submit', e => { e.preventDefault(); const email = $('#newsletterEmail').value; $('#newsletterMessage').textContent = `Thanks — newsletter signup for ${email} is a demo. Connect an email service to collect subscriptions.`; $('#newsletterForm').reset(); });
$('#productForm').addEventListener('submit', async e => { e.preventDefault(); const form = new FormData(e.currentTarget); const payload = Object.fromEntries(form.entries()); payload.price = Number(payload.price); payload.stock = Number(payload.stock); try { await api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) }); $('#adminMessage').textContent = 'Product added successfully.'; $('#adminMessage').classList.add('success'); e.currentTarget.reset(); await loadProducts(); } catch (err) { $('#adminMessage').textContent = err.message; $('#adminMessage').classList.remove('success'); } });
$('#adminOrders').addEventListener('change', async e => { const select = e.target.closest('[data-order-status]'); if (!select) return; try { await api(`/api/admin/orders/${select.dataset.orderStatus}/status`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); toast('Order status updated.'); } catch (err) { toast(err.message); } });
$('#menuBtn').addEventListener('click', () => { const nav = $('.desktop-nav'); const open = nav.style.display === 'flex'; nav.style.cssText = open ? '' : 'display:flex;position:absolute;top:66px;left:0;right:0;background:var(--paper);padding:22px 7%;flex-direction:column;border-bottom:1px solid var(--line);z-index:15'; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); }); $('#year').textContent = new Date().getFullYear();
(async () => { await loadProducts(); await refreshUser(); })();
