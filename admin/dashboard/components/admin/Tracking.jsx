'use client';
import { useState } from 'react';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { formatDate, money, shortText } from '../../lib/format';
import { ApprovalBadge, Contact, Pager, STATUSES, useList } from './ui';

const STEPS = STATUSES.slice(0, 8); // up to Completed

// Errand tracking: follow every errand through its stages and approve or disapprove it.
export default function Tracking({ request, open, refreshKey, onChanged }) {
  const [approval, setApproval] = useState('pending');
  const [page, setPage] = useState(1);
  const [decide, setDecide] = useState(null); // { errand, decision }
  const { rows, total, loading, error, reload } = useList(request, '/admin/orders', { approval, page, per: 12 }, [refreshKey]);
  const done = () => { setDecide(null); reload(); onChanged(); };

  return (
    <section className="panel">
      <div className="filters">
        {[['pending', 'Awaiting approval'], ['approved', 'Approved'], ['disapproved', 'Disapproved'], ['', 'All']].map(([v, l]) => (
          <button key={l} className={`tab${approval === v ? ' on' : ''}`} onClick={() => { setApproval(v); setPage(1); }}>{l}</button>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="track-list">
        {rows.map((r) => {
          const at = STEPS.indexOf(r.status);
          const closed = r.status === 'Closed';
          return (
            <article key={r.errand_id} className="track">
              <div className="track-top">
                <div>
                  <button className="linklike" onClick={() => open(r)}>{r.errand_id}</button> <span className="muted">{r.service_type}</span>
                  <div style={{ marginTop: 4 }}><StatusBadge status={r.status} /> <ApprovalBadge value={r.approval_status} /></div>
                </div>
                <Contact c={r.contact_info} />
                <div className="muted">Placed {formatDate(r.created_at)}<br />{money(r.quote_amount, r.quote_currency)}</div>
              </div>
              <p>{shortText(r.task_description, 160)}</p>
              {r.pickup_location || r.delivery_location ? <p className="muted">{[r.pickup_location, r.delivery_location].filter(Boolean).join(' → ')}</p> : null}
              <ol className={`steps${closed ? ' dead' : ''}`} aria-label="Progress">
                {STEPS.map((s, i) => <li key={s} className={!closed && i < at ? 'done' : !closed && i === at ? 'now' : ''}><span>{s}</span></li>)}
              </ol>
              {r.approval_note && <p className="muted">Note: {r.approval_note}</p>}
              <div className="actions">
                {r.approval_status !== 'approved' && !closed && <button className="btn primary" onClick={() => setDecide({ errand: r, decision: 'approve' })}>Approve</button>}
                {r.approval_status !== 'disapproved' && ['Pending Review', 'Quoted'].includes(r.status) && <button className="btn danger" onClick={() => setDecide({ errand: r, decision: 'disapprove' })}>Disapprove</button>}
                <button className="btn" onClick={() => open(r)}>Details</button>
              </div>
            </article>
          );
        })}
        {!loading && rows.length === 0 && <p className="empty">{approval === 'pending' ? 'Nothing is waiting for approval. 🎉' : 'No errands here.'}</p>}
      </div>
      <Pager page={page} per={12} total={total} onPage={setPage} />
      {decide && <Decision {...decide} request={request} onClose={() => setDecide(null)} onDone={done} />}
    </section>
  );
}

function Decision({ errand, decision, request, onClose, onDone }) {
  const approve = decision === 'approve';
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setError('');
    try { await request(`/admin/errands/${errand.errand_id}/approval`, { method: 'PUT', body: { decision, note: note || undefined } }); onDone(); }
    catch (e) { setError(e.message); setBusy(false); }
  }
  return (
    <Modal title={approve ? `Approve ${errand.errand_id}` : `Disapprove ${errand.errand_id}`} onClose={onClose}>
      <p>{approve ? 'Approving lets this order go ahead.' : 'Disapproving refuses the order and closes it. This only works before the customer has paid.'}</p>
      <label htmlFor="dn">{approve ? 'Note (optional)' : 'Reason (required)'}</label>
      <textarea id="dn" rows="3" maxLength="500" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className={`btn ${approve ? 'primary' : 'danger'}`} disabled={busy || (!approve && note.trim().length < 3)} onClick={go}>{approve ? 'Approve order' : 'Disapprove order'}</button>
      </div>
    </Modal>
  );
}
