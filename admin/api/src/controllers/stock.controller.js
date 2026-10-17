import { randomBytes, randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { ApiError, asyncHandler, dbFail } from '../utils/errors.js';
import { cartSchema, categoryPatchSchema, categorySchema, productPatchSchema, productSchema } from '../utils/validators.js';
import { looksLike } from '../services/storage.js';

const clean = (s) => String(s || '').replace(/[%,()*\\]/g, ' ').trim().slice(0, 60);
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const intParam = (v, d, max) => Math.min(Math.max(parseInt(v, 10) || d, 1), max);

// ============================================================= public: the shop
// GET /api/catalog  -> same shape as catalog.json, so the website can use it directly.
export const catalog = asyncHandler(async (req, res) => {
  const [c, p] = await Promise.all([
    supabase.from('product_categories').select('*').order('sort_order').order('name'),
    supabase.from('products').select('*').order('sort_order').order('name'),
  ]);
  if (c.error) dbFail(c.error);
  if (p.error) dbFail(p.error);
  const cats = c.data.map((x) => ({ id: x.id, name: x.name, e: x.emoji || '🛒', tint: x.tint || '#eef0f6', ...(x.age18 ? { age18: true } : {}), ...(x.img ? { img: x.img } : {}) }));
  const prods = p.data.map((x) => ({
    id: x.id, cat: x.category_id, name: x.name, size: x.size || '', price: Number(x.price),
    ...(x.was_price != null ? { was: Number(x.was_price) } : {}), ...(x.featured ? { featured: true } : {}), ...(x.is_new ? { new: true } : {}),
    ...(x.img ? { img: x.img } : {}),
    ...(!x.in_stock ? { out: true } : x.stock_qty != null && x.stock_qty <= 5 ? { left: x.stock_qty } : {}),
  }));
  res.set('Cache-Control', 'public, max-age=15');
  res.json({ sample: false, photo_folders: false, categories: cats, products: prods });
});

// PUT /api/cart/:cid   body: { items: [{ id, qty }] }   (the customer's browser keeps this up to date)
// Names and prices are looked up here, never trusted from the browser. An empty cart is removed.
export const saveCart = asyncHandler(async (req, res) => {
  const id = req.params.cid;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(400, 'Bad cart id');
  const { items } = cartSchema.parse(req.body);
  if (!items.length) {
    await supabase.from('carts').delete().eq('id', id).eq('status', 'open');
    return res.json({ ok: true });
  }
  const { data: prods, error } = await supabase.from('products').select('id, name, size, price').in('id', items.map((i) => i.id));
  if (error) dbFail(error);
  const byId = Object.fromEntries(prods.map((p) => [p.id, p]));
  const rows = items.filter((i) => byId[i.id]).map((i) => ({ id: i.id, name: byId[i.id].name, size: byId[i.id].size, price: Number(byId[i.id].price), qty: i.qty }));
  if (!rows.length) return res.json({ ok: true });
  const { data: cur } = await supabase.from('carts').select('status').eq('id', id).maybeSingle();
  if (cur?.status === 'ordered') return res.json({ ok: true, ordered: true }); // a finished order is never reopened
  const { error: upErr } = await supabase.from('carts').upsert({
    id, items: rows, item_count: rows.reduce((a, r) => a + r.qty, 0), total: rows.reduce((a, r) => a + r.qty * r.price, 0), status: 'open',
  }, { onConflict: 'id' });
  if (upErr) dbFail(upErr);
  res.json({ ok: true });
});

// ============================================================ admin: stock
// GET /api/admin/stock?q=&category=&status=in|out|low&page=
export const listStock = asyncHandler(async (req, res) => {
  const page = intParam(req.query.page, 1, 10000), per = intParam(req.query.per, 30, 100);
  let query = supabase.from('products').select('*', { count: 'exact' });
  if (req.query.category) query = query.eq('category_id', req.query.category);
  if (req.query.status === 'out') query = query.eq('in_stock', false);
  if (req.query.status === 'in') query = query.eq('in_stock', true);
  if (req.query.status === 'low') query = query.eq('in_stock', true).not('stock_qty', 'is', null).lte('stock_qty', 5);
  const t = clean(req.query.q);
  if (t) query = query.or(`name.ilike.%${t}%,id.ilike.%${t}%`);
  const { data, error, count } = await query.order('category_id').order('sort_order').order('name').range((page - 1) * per, page * per - 1);
  if (error) dbFail(error);
  const { data: all, error: e2 } = await supabase.from('products').select('in_stock, stock_qty').limit(5000);
  if (e2) dbFail(e2);
  const totals = { products: all.length, in_stock: all.filter((p) => p.in_stock).length, out: all.filter((p) => !p.in_stock).length,
    low: all.filter((p) => p.in_stock && p.stock_qty != null && p.stock_qty <= 5).length };
  res.json({ rows: data, total: count ?? data.length, page, per, totals });
});

const dbPatch = (b) => {
  const m = { category_id: b.category_id, name: b.name, size: b.size, price: b.price, was_price: b.was_price, featured: b.featured, is_new: b.is_new, img: b.img, in_stock: b.in_stock, stock_qty: b.stock_qty };
  return Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined));
};

// POST /api/admin/products  -> add a product to the shop
export const createProduct = asyncHandler(async (req, res) => {
  const b = productSchema.parse(req.body);
  const row = dbPatch(b);
  if (row.stock_qty === 0) row.in_stock = false;
  row.id = `${b.category_id}-${randomBytes(3).toString('hex')}`;
  const { data, error } = await supabase.from('products').insert(row).select().single();
  if (error) {
    if (error.code === '23503') throw new ApiError(400, 'That category does not exist');
    dbFail(error);
  }
  res.status(201).json(data);
});

// PUT /api/admin/products/:id  -> edit price, name, picture, stock, in/out of stock
export const updateProduct = asyncHandler(async (req, res) => {
  const patch = dbPatch(productPatchSchema.parse(req.body));
  if (!Object.keys(patch).length) throw new ApiError(400, 'Nothing to change');
  if (patch.stock_qty === 0) patch.in_stock = false;
  if (typeof patch.stock_qty === 'number' && patch.stock_qty > 0 && patch.in_stock === undefined) patch.in_stock = true; // restocking
  const { data, error } = await supabase.from('products').update(patch).eq('id', req.params.id).select().maybeSingle();
  if (error) dbFail(error);
  if (!data) throw new ApiError(404, 'Product not found');
  res.json(data);
});

// DELETE /api/admin/products/:id  -> remove it from the shop (old orders keep their item lines)
export const deleteProduct = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('products').delete().eq('id', req.params.id).select('id').maybeSingle();
  if (error) dbFail(error);
  if (!data) throw new ApiError(404, 'Product not found');
  res.json({ ok: true });
});

// POST /api/admin/products/image  (multipart, field "image") -> { url }
export const uploadProductPicture = asyncHandler(async (req, res) => {
  const f = req.file;
  if (!f) throw new ApiError(400, 'Choose a picture first');
  if (!looksLike(f.buffer, f.mimetype)) throw new ApiError(400, 'That file is not a valid picture');
  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[f.mimetype];
  const path = `products/${randomUUID()}${ext}`;
  const { error } = await supabase.storage.from('shop').upload(path, f.buffer, { contentType: f.mimetype, upsert: false });
  if (error) dbFail(error);
  res.json({ url: supabase.storage.from('shop').getPublicUrl(path).data.publicUrl });
});

// ------------------------------------------------------------- categories
export const listCategories = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('product_categories').select('*').order('sort_order').order('name');
  if (error) dbFail(error);
  const { data: counts } = await supabase.from('products').select('category_id').limit(5000);
  const n = {};
  (counts || []).forEach((p) => { n[p.category_id] = (n[p.category_id] || 0) + 1; });
  res.json(data.map((c) => ({ ...c, products: n[c.id] || 0 })));
});

export const createCategory = asyncHandler(async (req, res) => {
  const b = categorySchema.parse(req.body);
  const id = slugify(b.name);
  if (!id) throw new ApiError(400, 'Give the category a name with letters or numbers');
  const { data, error } = await supabase.from('product_categories').insert({ id, name: b.name, emoji: b.emoji, tint: b.tint, age18: b.age18, img: b.img, sort_order: b.sort_order ?? 99 }).select().single();
  if (error) {
    if (error.code === '23505') throw new ApiError(409, 'A category with that name already exists');
    dbFail(error);
  }
  res.status(201).json(data);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const b = categoryPatchSchema.parse(req.body);
  const patch = Object.fromEntries(Object.entries({ name: b.name, emoji: b.emoji, tint: b.tint, age18: b.age18, img: b.img, sort_order: b.sort_order }).filter(([, v]) => v !== undefined));
  if (!Object.keys(patch).length) throw new ApiError(400, 'Nothing to change');
  const { data, error } = await supabase.from('product_categories').update(patch).eq('id', req.params.id).select().maybeSingle();
  if (error) dbFail(error);
  if (!data) throw new ApiError(404, 'Category not found');
  res.json(data);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', req.params.id);
  if (count) throw new ApiError(409, `Remove or move its ${count} product${count > 1 ? 's' : ''} first`);
  const { data, error } = await supabase.from('product_categories').delete().eq('id', req.params.id).select('id').maybeSingle();
  if (error) dbFail(error);
  if (!data) throw new ApiError(404, 'Category not found');
  res.json({ ok: true });
});

// ============================================================ admin: carts
// GET /api/admin/carts?status=open|ordered&page=   (open carts: what customers have in their baskets right now)
export const listCarts = asyncHandler(async (req, res) => {
  const page = intParam(req.query.page, 1, 10000), per = intParam(req.query.per, 20, 100);
  const status = req.query.status === 'ordered' ? 'ordered' : 'open';
  const { data, error, count } = await supabase.from('carts').select('*, errand:errand_requests(contact_info)', { count: 'exact' })
    .eq('status', status).order('updated_at', { ascending: false }).range((page - 1) * per, page * per - 1);
  if (error) dbFail(error);
  const { data: open } = await supabase.from('carts').select('item_count, total').eq('status', 'open').limit(5000);
  const totals = { open: (open || []).length, items: (open || []).reduce((a, c) => a + c.item_count, 0), value: (open || []).reduce((a, c) => a + Number(c.total), 0) };
  res.json({ rows: data, total: count ?? data.length, page, per, totals });
});

export const deleteCart = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('carts').delete().eq('id', req.params.id);
  if (error) dbFail(error);
  res.json({ ok: true });
});

// GET /api/admin/errands/:id/items  -> the items inside a shop order
export const orderItems = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('order_items').select('product_id, name, size, unit_price, qty').eq('errand_id', req.params.id).order('id');
  if (error) dbFail(error);
  res.json(data);
});
