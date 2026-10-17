'use client';
import { useCallback, useEffect, useState } from 'react';
import Modal from '../Modal';
import { money } from '../../lib/format';

export default function Services({ request }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => request('/admin/services').then((r) => { setRows(r); setError(''); }).catch((e) => setError(e.message)), [request]);
  useEffect(() => { load(); }, [load]);

  async function toggle(s) {
    try { await request(`/admin/services/${s.id}`, { method: 'PUT', body: { is_active: !s.is_active } }); load(); } catch (e) { setError(e.message); }
  }
  if (!rows) return error ? <p className="error banner" role="alert">{error}</p> : <p className="empty">Loading…</p>;
  return (
    <>
      {error && <p className="error banner" role="alert">{error}</p>}
      <p className="muted" style={{ marginBottom: 10 }}>Switch a service off and the website stops accepting new requests for it. Existing orders are not affected.</p>
      <div className="svc-grid">
        {rows.map((s) => (
          <article key={s.id} className={`panel svc${s.is_active ? '' : ' off'}`}>
            <div className="svc-head"><span className="svc-icon" aria-hidden="true">{s.icon}</span><h3>{s.name}</h3>
              <span className={`badge ${s.is_active ? 'badge-paid' : 'badge-closed'}`}>{s.is_active ? 'On' : 'Off'}</span></div>
            <p className="muted">{s.description}</p>
            <p><b>{s.orders}</b> order{s.orders === 1 ? '' : 's'} · {money(s.revenue_ngn)} earned{s.base_fee != null ? <> · from <b>{money(s.base_fee, s.currency)}</b></> : null}</p>
            <div className="actions">
              <button className="btn" onClick={() => setEdit(s)}>Edit</button>
              <button className={`btn ${s.is_active ? '' : 'primary'}`} onClick={() => toggle(s)}>{s.is_active ? 'Switch off' : 'Switch on'}</button>
            </div>
          </article>
        ))}
      </div>
      {edit && <EditService s={edit} request={request} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </>
  );
}

function EditService({ s, request, onClose, onDone }) {
  const [f, setF] = useState({ description: s.description || '', icon: s.icon || '', base_fee: s.base_fee ?? '', currency: s.currency, sort_order: s.sort_order });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    try { await request(`/admin/services/${s.id}`, { method: 'PUT', body: { ...f, base_fee: f.base_fee === '' ? null : f.base_fee } }); onDone(); } catch (err) { setError(err.message); }
  }
  return (
    <Modal title={`Edit ${s.name}`} onClose={onClose}>
      <form onSubmit={save}>
        <label htmlFor="sd">Description</label><textarea id="sd" rows="3" maxLength="600" value={f.description} onChange={set('description')} />
        <div className="row">
          <div className="grow"><label htmlFor="si">Icon</label><input id="si" maxLength="8" value={f.icon} onChange={set('icon')} /></div>
          <div className="grow"><label htmlFor="so">Order on list</label><input id="so" type="number" min="0" value={f.sort_order} onChange={set('sort_order')} /></div>
        </div>
        <div className="row">
          <div className="grow"><label htmlFor="sf">"From" price (optional)</label><input id="sf" type="number" min="0" step="0.01" value={f.base_fee} onChange={set('base_fee')} /></div>
          <div className="grow"><label htmlFor="sc">Currency</label><select id="sc" value={f.currency} onChange={set('currency')}><option>NGN</option><option>USD</option></select></div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary">Save</button></div>
      </form>
    </Modal>
  );
}
