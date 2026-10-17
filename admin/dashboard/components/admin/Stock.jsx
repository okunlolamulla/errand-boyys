'use client';
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { money } from '../../lib/format';
import { Pager, Stat, useDebounced, useList } from './ui';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
const imgSrc = (u) => (!u ? null : /^https?:/.test(u) ? u : SITE ? SITE + u : null);

function Pic({ u, size = 44 }) {
  const src = imgSrc(u);
  return src ? <img className="spic" style={{ width: size, height: size }} src={src} alt="" loading="lazy" /> : <span className="spic ph" style={{ width: size, height: size }} aria-hidden="true">🛒</span>;
}

// Stock management: add, edit and remove what the customer shop sells.
export default function Stock({ request }) {
  const [f, setF] = useState({ q: '', category: '', status: '' });
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(null); // { type: 'edit' | 'remove' | 'cats', product }
  const [msg, setMsg] = useState('');
  const q = useDebounced(f.q);
  const { rows, total, loading, error, extra, reload } = useList(request, '/admin/stock', { ...f, q, page, per: 30 });
  const loadCats = () => request('/admin/categories').then(setCats).catch(() => {});
  useEffect(() => { loadCats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const catName = (id) => cats.find((c) => c.id === id)?.name || id;
  const set = (k) => (e) => { setF((o) => ({ ...o, [k]: e.target.value })); setPage(1); };
  const t = extra?.totals;

  async function toggle(p) {
    try { await request(`/admin/products/${p.id}`, { method: 'PUT', body: { in_stock: !p.in_stock } }); reload(); }
    catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <div className="stats">
        <Stat label="Products" value={t ? t.products : '…'} sub="in the customer shop" />
        <Stat label="In stock" value={t ? t.in_stock : '…'} tone="green" />
        <Stat label="Out of stock" value={t ? t.out : '…'} tone={t?.out ? 'red' : ''} sub="shown as sold out" />
        <Stat label="Running low" value={t ? t.low : '…'} tone={t?.low ? 'amber' : ''} sub="5 or fewer left" />
      </div>
      <section className="panel">
        <div className="filters">
          <input aria-label="Search products" placeholder="Search products" value={f.q} onChange={set('q')} />
          <select aria-label="Category" value={f.category} onChange={set('category')}><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select aria-label="Stock status" value={f.status} onChange={set('status')}><option value="">All stock</option><option value="in">In stock</option><option value="low">Running low</option><option value="out">Out of stock</option></select>
          <button className="btn" onClick={() => setModal({ type: 'cats' })}>Categories</button>
          <button className="btn primary" onClick={() => setModal({ type: 'edit', product: null })}>+ Add product</button>
        </div>
        {(error || msg) && <p className="error" role="alert">{error || msg}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><div className="prod"><Pic u={p.img} /><div><strong>{p.name}</strong><div className="muted">{p.size}{p.featured ? ' · Featured' : ''}{p.is_new ? ' · New' : ''}</div></div></div></td>
                  <td>{catName(p.category_id)}</td>
                  <td>{money(p.price)}{p.was_price != null ? <div className="muted"><s>{money(p.was_price)}</s></div> : null}</td>
                  <td>{p.stock_qty == null ? <span className="muted">Not counted</span> : <b className={p.stock_qty <= 5 ? 'warn' : ''}>{p.stock_qty}</b>}</td>
                  <td><span className={`badge ${p.in_stock ? 'badge-paid' : 'badge-closed'}`}>{p.in_stock ? 'In stock' : 'Out of stock'}</span></td>
                  <td><div className="actions">
                    <button className="btn" onClick={() => setModal({ type: 'edit', product: p })}>Edit</button>
                    <button className="btn" onClick={() => toggle(p)}>{p.in_stock ? 'Mark out' : 'Back in stock'}</button>
                    <button className="btn danger" onClick={() => setModal({ type: 'remove', product: p })}>Remove</button>
                  </div></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan="6" className="empty">No products match.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={page} per={30} total={total} onPage={setPage} />
      </section>
      {modal?.type === 'edit' && <ProductModal product={modal.product} cats={cats} request={request} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal?.type === 'remove' && <RemoveModal product={modal.product} request={request} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal?.type === 'cats' && <CategoriesModal cats={cats} request={request} reloadCats={loadCats} onClose={() => { setModal(null); reload(); }} />}
    </>
  );
}

function ProductModal({ product: p, cats, request, onClose, onDone }) {
  const [f, setF] = useState({
    category_id: p?.category_id || cats[0]?.id || '', name: p?.name || '', size: p?.size || '', price: p?.price ?? '', was_price: p?.was_price ?? '',
    track: p ? p.stock_qty != null : true, stock_qty: p?.stock_qty ?? 20, in_stock: p ? p.in_stock : true,
    featured: !!p?.featured, is_new: !!p?.is_new, img: p?.img || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await request('/admin/products/image', { method: 'POST', body: fd });
      setF((o) => ({ ...o, img: r.url }));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    const body = { category_id: f.category_id, name: f.name, size: f.size, price: f.price, was_price: f.was_price === '' ? null : f.was_price,
      stock_qty: f.track ? f.stock_qty : null, in_stock: f.in_stock, featured: f.featured, is_new: f.is_new, img: f.img };
    try {
      if (p) await request(`/admin/products/${p.id}`, { method: 'PUT', body });
      else await request('/admin/products', { method: 'POST', body });
      onDone();
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title={p ? `Edit ${p.name}` : 'Add a product'} onClose={onClose} wide>
      <form onSubmit={save}>
        <div className="row">
          <div className="grow"><label htmlFor="pn">Name</label><input id="pn" value={f.name} onChange={set('name')} required minLength="2" maxLength="120" /></div>
          <div className="grow"><label htmlFor="ps">Size / pack</label><input id="ps" value={f.size} onChange={set('size')} placeholder="e.g. 5kg, 75cl, pack of 6" /></div>
        </div>
        <label htmlFor="pc">Category</label>
        <select id="pc" value={f.category_id} onChange={set('category_id')} required>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <div className="row">
          <div className="grow"><label htmlFor="pp">Price (₦)</label><input id="pp" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} required /></div>
          <div className="grow"><label htmlFor="pw">Old price (₦, shows as Sale)</label><input id="pw" type="number" min="0" step="0.01" value={f.was_price} onChange={set('was_price')} /></div>
        </div>
        <fieldset>
          <legend>Stock</legend>
          <label className="check"><input type="checkbox" checked={f.track} onChange={set('track')} /> Count how many are left (sells out by itself at zero)</label>
          {f.track && <><label htmlFor="pq">Quantity in stock</label><input id="pq" type="number" min="0" step="1" value={f.stock_qty} onChange={set('stock_qty')} required /></>}
          <label className="check"><input type="checkbox" checked={f.in_stock} onChange={set('in_stock')} /> Available to buy</label>
        </fieldset>
        <div className="row"><label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Featured</label><label className="check"><input type="checkbox" checked={f.is_new} onChange={set('is_new')} /> New arrival</label></div>
        <label htmlFor="pi">Picture</label>
        <div className="picrow"><Pic u={f.img} size={64} /><input id="pi" type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} /></div>
        <p className="muted">JPG, PNG or WebP up to 5 MB. A square picture on a white background looks best.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : p ? 'Save changes' : 'Add to shop'}</button></div>
      </form>
    </Modal>
  );
}

function RemoveModal({ product: p, request, onClose, onDone }) {
  const [error, setError] = useState('');
  async function go() { try { await request(`/admin/products/${p.id}`, { method: 'DELETE' }); onDone(); } catch (e) { setError(e.message); } }
  return (
    <Modal title="Remove product" onClose={onClose}>
      <p>Remove <b>{p.name}</b> {p.size} from the shop? Customers will no longer see it. Past orders keep their item lines. To keep it listed as sold out, use <b>Mark out</b> instead.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-foot"><button className="btn" onClick={onClose}>Keep it</button><button className="btn danger" onClick={go}>Remove from shop</button></div>
    </Modal>
  );
}

function CategoriesModal({ cats, request, reloadCats, onClose }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [error, setError] = useState('');
  async function add(e) {
    e.preventDefault(); setError('');
    try { await request('/admin/categories', { method: 'POST', body: { name, emoji: emoji || undefined } }); setName(''); setEmoji(''); reloadCats(); } catch (err) { setError(err.message); }
  }
  async function patch(c, body) { try { await request(`/admin/categories/${c.id}`, { method: 'PUT', body }); reloadCats(); } catch (err) { setError(err.message); } }
  async function del(c) { setError(''); try { await request(`/admin/categories/${c.id}`, { method: 'DELETE' }); reloadCats(); } catch (err) { setError(err.message); } }
  return (
    <Modal title="Categories" onClose={onClose} wide>
      <div className="table-wrap"><table style={{ minWidth: 480 }}><tbody>
        {cats.map((c) => (
          <tr key={c.id}>
            <td style={{ width: 60 }}><input aria-label={`Emoji for ${c.name}`} defaultValue={c.emoji} maxLength="8" style={{ width: 56, margin: 0 }} onBlur={(e) => e.target.value !== (c.emoji || '') && patch(c, { emoji: e.target.value })} /></td>
            <td><input aria-label={`Name of ${c.name}`} defaultValue={c.name} maxLength="60" style={{ margin: 0 }} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && patch(c, { name: e.target.value })} /></td>
            <td className="muted">{c.products} product{c.products === 1 ? '' : 's'}</td>
            <td><label className="check" style={{ margin: 0 }}><input type="checkbox" defaultChecked={c.age18} onChange={(e) => patch(c, { age18: e.target.checked })} /> 18+</label></td>
            <td><button className="btn danger" onClick={() => del(c)}>Delete</button></td>
          </tr>
        ))}
      </tbody></table></div>
      <form onSubmit={add} className="row" style={{ alignItems: 'end', marginTop: 12 }}>
        <div style={{ width: 70 }}><label htmlFor="ce">Emoji</label><input id="ce" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength="8" /></div>
        <div className="grow"><label htmlFor="cn">New category</label><input id="cn" value={name} onChange={(e) => setName(e.target.value)} required minLength="2" maxLength="60" /></div>
        <button className="btn primary" style={{ marginBottom: 2 }}>Add</button>
      </form>
      <p className="muted">Edit a name or emoji, then click away to save. A category can only be deleted when it has no products.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-foot"><button className="btn" onClick={onClose}>Done</button></div>
    </Modal>
  );
}
