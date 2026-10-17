'use client';
import { Fragment, useCallback, useEffect, useState } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { formatDate, money } from '../lib/format';

const DETAIL_LABELS = {
  brands: 'Brands / alternatives', budget: 'Budget', supermarket: 'Supermarket / market',
  landmark: 'Landmark', instructions: 'Special instructions',
  move_type: 'Type of move', pickup_floor: 'Pickup floor', destination_floor: 'Destination floor',
  packing_help: 'Packing help', special_handling: 'Special handling',
};

// Full record, proof files, history, and the review / close controls.
export default function ErrandDetailModal({ id, request, onClose, onChanged }) {
  const [e, setE] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [items, setItems] = useState([]); // the cart lines of a shop order

  const load = useCallback(async () => {
    try { setE(await request(`/admin/errands/${id}`)); }
    catch (err) { setError(err.message); }
  }, [id, request]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { request(`/admin/errands/${id}/items`).then(setItems).catch(() => {}); }, [id, request]);

  async function resolve(paymentId) {
    try {
      await request(`/admin/payments/${paymentId}/resolve`, { method: 'PUT', body: {} });
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function act(path, body) {
    setBusy(true);
    setError('');
    try {
      await request(`/admin/errands/${id}/${path}`, { method: 'PUT', body });
      setConfirming(false);
      setNote('');
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!e) {
    return <Modal title={id} onClose={onClose}>{error ? <p className="error">{error}</p> : <p className="empty">Loading…</p>}</Modal>;
  }

  const needsReason = e.status !== 'Completed';
  return (
    <Modal title={e.errand_id} onClose={onClose} wide>
      <p><StatusBadge status={e.status} /></p>
      <dl className="details">
        <dt>Service</dt><dd>{e.service_type}</dd>
        <dt>Customer</dt><dd>{e.contact_info?.name} · {e.contact_info?.phone}{e.contact_info?.email ? ` · ${e.contact_info.email}` : ''}</dd>
        <dt>{e.service_type === 'Grocery shopping' ? 'Shopping list' : 'Task'}</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{e.task_description}</dd>
        {Object.entries(e.details || {}).filter(([k]) => k !== 'shopping_list').map(([k, v]) => (
          <Fragment key={k}><dt>{DETAIL_LABELS[k] || k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{k === 'budget' && !Number.isNaN(Number(v)) ? money(v, 'NGN') : v}</dd></Fragment>
        ))}
        {e.request_photo_links?.length > 0 && (
          <><dt>Customer photos</dt><dd>{e.request_photo_links.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer">Photo {i + 1} </a>)}</dd></>
        )}
        {e.pickup_location && (<><dt>Pickup</dt><dd>{e.pickup_location}</dd></>)}
        {e.delivery_location && (<><dt>Delivery</dt><dd>{e.delivery_location}</dd></>)}
        <dt>Preferred time</dt><dd>{formatDate(e.date_time) || 'Flexible'}</dd>
        <dt>Quote</dt><dd>{money(e.quote_amount, e.quote_currency)}</dd>
        {e.proof_notes && (<><dt>Proof notes</dt><dd>{e.proof_notes}</dd></>)}
        {e.proof_links.length > 0 && (
          <><dt>Proof files</dt><dd>{e.proof_links.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer">File {i + 1} </a>)}</dd></>
        )}
      </dl>

      {items.length > 0 && (
        <>
          <h3>Items ordered</h3>
          <table className="mini"><tbody>
            {items.map((i, n) => <tr key={n}><td>{i.qty} × {i.name} <span className="muted">{i.size}</span></td><td className="r">{money(i.unit_price * i.qty)}</td></tr>)}
            <tr><td><b>Items total</b></td><td className="r"><b>{money(items.reduce((a, i) => a + i.unit_price * i.qty, 0))}</b></td></tr>
          </tbody></table>
        </>
      )}

      {e.payments?.length > 0 && (
        <>
          <h3>Payments</h3>
          <ul className="history">
            {e.payments.map((p) => (
              <li key={p.id}>
                <strong>{money(p.amount, p.currency)}</strong> · {p.provider} ·{' '}
                <span className={p.status === 'paid' || p.status === 'resolved' ? 'ok' : p.status === 'pending' ? 'muted' : 'error'}>{p.status}</span>{' '}
                <span className="muted">{p.reference}</span>
                {(p.status === 'stale' || p.status === 'mismatch') && (
                  <div className="error">
                    {p.status === 'stale' ? 'Money arrived for an old quote, or the errand had already moved on.' : 'The amount or currency did not match the quote.'}
                    {' '}Check your gateway dashboard and refund if needed, then{' '}
                    <button className="linklike" onClick={() => resolve(p.id)}>mark reviewed</button>.
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>History</h3>
      <ul className="history">
        {e.history.map((h, i) => (
          <li key={i}><span className="muted">{formatDate(h.created_at)}</span> {h.from_status || 'New'} → <strong>{h.to_status}</strong>{h.note ? ` (${h.note})` : ''}</li>
        ))}
      </ul>

      {error && <p className="error" role="alert">{error}</p>}

      {e.status === 'Proof Uploaded' && (
        <div className="action-box">
          <h3>Review proof</h3>
          <p className="muted">Check the notes and files above, then approve to mark the errand Completed.</p>
          <button className="btn primary" disabled={busy} onClick={() => act('complete', {})}>Approve proof & mark completed</button>
        </div>
      )}

      {e.status !== 'Closed' && (
        <div className="action-box">
          <h3>Close request</h3>
          <p className="muted">{needsReason ? 'This errand is not completed yet, so a reason is required (for example: cancelled, refunded).' : 'Work is done. Close this request.'}</p>
          <textarea rows={2} value={note} onChange={(e2) => { setNote(e2.target.value); setConfirming(false); }} placeholder={needsReason ? 'Reason (required)' : 'Note (optional)'} />
          {confirming
            ? <button className="btn danger" disabled={busy} onClick={() => act('close', { note: note.trim() || undefined })}>Confirm: close {e.errand_id}</button>
            : <button className="btn danger" disabled={needsReason && note.trim().length < 3} onClick={() => setConfirming(true)}>Close request</button>}
        </div>
      )}
    </Modal>
  );
}
