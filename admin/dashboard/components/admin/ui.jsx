'use client';
import { useEffect, useState } from 'react';
import { money } from '../../lib/format';

export const SERVICES = ['Grocery shopping', 'Moving service', 'Pharmacy pickup', 'Office errand', 'House hunting', 'Verification errand', 'Custom errand', 'Car service', 'Care giving services', 'Shop order'];
export const STATUSES = ['Pending Review', 'Quoted', 'Paid', 'Assigned', 'On the way', 'In Progress', 'Proof Uploaded', 'Completed', 'Closed'];

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

// { NGN: 5000, USD: 20 } -> "₦5,000.00 · $20.00"
export function moneyMap(m) {
  const keys = Object.keys(m || {}).filter((k) => Number(m[k]) > 0);
  if (!keys.length) return money(0, 'NGN');
  return keys.map((k) => money(m[k], k)).join(' · ');
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat${tone ? ' ' + tone : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub ? <span className="stat-sub">{sub}</span> : null}
    </div>
  );
}

export function Pager({ page, per, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / per));
  if (pages <= 1) return <p className="muted pager">{total} result{total === 1 ? '' : 's'}</p>;
  return (
    <div className="pager">
      <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button>
      <span className="muted">Page {page} of {pages} · {total} results</span>
      <button className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

export function ApprovalBadge({ value }) {
  const label = { pending: 'Awaiting approval', approved: 'Approved', disapproved: 'Disapproved' }[value] || value;
  return <span className={`badge badge-ap-${value}`}>{label}</span>;
}

export function Contact({ c = {} }) {
  return <div><strong>{c.name}</strong><div className="muted">{c.phone}{c.email ? ` · ${c.email}` : ''}</div></div>;
}

// Small hook for a paged, filtered list that reloads when the filters change.
export function useList(request, path, params, deps = []) {
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: '', extra: null });
  const key = JSON.stringify(params);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    const qs = Object.entries(params).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    setState((s) => ({ ...s, loading: true }));
    request(`${path}?${qs}`).then((r) => { if (live) setState({ rows: r.rows, total: r.total, loading: false, error: '', extra: r }); })
      .catch((e) => { if (live) setState((s) => ({ ...s, loading: false, error: e.message })); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, path, key, tick, ...deps]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
