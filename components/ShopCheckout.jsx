import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../lib/config';
import { fmt, newId, wa } from '../lib/format';
import { rememberErrand, setD } from '../lib/storage';

// Checkout for the shop: delivery details + order summary. Sends the order to the admin (and WhatsApp) for a quotation.
export default function ShopCheckout({ onDone, onCode }) {
  const { list, count, subtotal, clear, cartId } = useCart();
  const [f, setF] = useState({ name: '', phone: '', addr: '', landmark: '', when: '', notes: '' });
  const [age, setAge] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const hasAlcohol = list.some((i) => i.cat === 'alcohols');

  async function submit() {
    const d = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()]));
    const miss = [];
    if (!d.name) miss.push('your full name');
    if (!d.phone) miss.push('phone number');
    if (!d.addr) miss.push('delivery address');
    if (miss.length) return setErr('Please fill in: ' + miss.join(', ') + '.');
    if (!/^\+?[0-9\s-]{7,20}$/.test(d.phone)) return setErr('Enter a valid phone number.');
    if (hasAlcohol && !age) return setErr('Please confirm that you are 18 or older to order alcohol.');
    setBusy(true); setErr('');

    const itemsText = list.map((i) => `${i.qty} x ${i.name} (${i.size}) - ${fmt(i.price * i.qty)}`).join('\n');
    const loc = d.addr + (d.landmark ? ' (Landmark: ' + d.landmark + ')' : '');
    let id = newId(), saved = false;
    if (API_URL) { // also send to the admin dashboard; if it fails the WhatsApp message still works
      try {
        const fd = new FormData();
        fd.append('service_type', 'Shop order');
        fd.append('task_description', `Shop order: ${count} item${count > 1 ? 's' : ''}, items total ${fmt(subtotal)}`);
        fd.append('delivery_location', loc);
        if (d.when) fd.append('date_time', new Date(d.when).toISOString());
        fd.append('items', JSON.stringify(list.map((i) => ({ id: i.id, qty: i.qty }))));
        fd.append('cart_id', cartId);
        fd.append('contact_info', JSON.stringify({ name: d.name, phone: d.phone }));
        const details = { shopping_list: itemsText.slice(0, 2900), budget: String(subtotal), supermarket: 'Errand Boys shop', landmark: d.landmark, instructions: d.notes, age_confirmed: hasAlcohol ? 'Yes' : '' };
        fd.append('details', JSON.stringify(Object.fromEntries(Object.entries(details).filter(([, v]) => v))));
        const r = await fetch(API_URL + '/api/errands', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (r.status === 409 && j.error) { setBusy(false); return setErr(j.error); } // something in the cart ran out of stock
        if (r.ok && j.errand_id) { id = j.errand_id; saved = true; }
      } catch { /* keep the offline ID */ }
    }
    rememberErrand(id);
    setD(id, { ds: itemsText, lc: loc, dt: d.when && d.when.length > 10 ? d.when : '', nm: d.name, ph: d.phone });
    const m = [
      `Hello Errand Boys. New SHOP ORDER request ${id}`, `Name: ${d.name}`, `Phone: ${d.phone}`, 'Items:', itemsText, `Items total: ${fmt(subtotal)}`,
      `Delivery address: ${d.addr}`, `Landmark: ${d.landmark || 'None'}`, `Delivery date/time: ${d.when ? new Date(d.when).toLocaleString('en-NG') : 'Flexible'}`,
      `Special instructions: ${d.notes || 'None'}`, ...(hasAlcohol ? ['Age 18+ confirmed: Yes'] : []), 'Photos: None',
    ].join('\n');
    const long = encodeURIComponent(m).length > 1900;
    const link = wa(long ? m.slice(0, 1000) + '\n…(rest pasted below)' : m);
    clear();
    onDone({ kind: 'form', id, saved, n: 0, m, long, link, photos: [] });
  }

  return (
    <section>
      <div className="wrap two" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.5rem' }}>Checkout</h2>
          <p style={{ color: 'var(--mut)', fontSize: '.9rem' }}>Tell us where to deliver. We confirm availability and the delivery fee, send your final price, and you pay securely. Fields marked * are required.</p>
          <label htmlFor="o_name">Customer's full name *</label>
          <input id="o_name" autoComplete="name" value={f.name} onChange={set('name')} />
          <label htmlFor="o_phone">Phone number *</label>
          <input id="o_phone" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
          <label htmlFor="o_addr">Delivery address *</label>
          <input id="o_addr" autoComplete="street-address" value={f.addr} onChange={set('addr')} />
          <label htmlFor="o_landmark">Landmark</label>
          <input id="o_landmark" placeholder="e.g. Opposite the blue gate, near the church" value={f.landmark} onChange={set('landmark')} />
          <label htmlFor="o_when">Preferred delivery date and time</label>
          <input id="o_when" type="datetime-local" value={f.when} onChange={set('when')} />
          <label htmlFor="o_notes">Special instructions</label>
          <textarea id="o_notes" rows="2" maxLength={1000} placeholder="e.g. Ripe fruits only, call when you arrive" value={f.notes} onChange={set('notes')} />
          {hasAlcohol && (
            <label className="agebox"><input id="o_age" type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> I confirm that I am 18 years or older.</label>
          )}
          <p id="er" style={{ color: '#d33', minHeight: '1.4em' }}>{err}</p>
        </div>
        <div className="card">
          <h3>Your order</h3>
          {list.map((i) => (
            <div className="line" key={i.id}><span>{i.qty} × {i.name} <small style={{ color: 'var(--mut)' }}>({i.size})</small></span><b>{fmt(i.price * i.qty)}</b></div>
          ))}
          <div className="line"><span>Items total</span><b>{fmt(subtotal)}</b></div>
          <p style={{ color: 'var(--mut)', fontSize: '.9rem' }}>Delivery and service fees are added in your quotation.</p>
          <button className="btn sun" disabled={busy} onClick={submit}>{busy ? 'Sending…' : 'REQUEST QUOTATION FEE'}</button>
          <div className="row" style={{ marginTop: '10px', justifyContent: 'space-between' }}>
            <a href="#/cart" style={{ color: 'var(--mut)', fontSize: '.85rem' }}>← Edit cart</a>
            <button className="linkbtn" onClick={onCode}>I have a checkout code</button>
          </div>
        </div>
      </div>
    </section>
  );
}
