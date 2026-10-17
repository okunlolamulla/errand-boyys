'use client';
import { useState } from 'react';
import { formatDate, money, timeAgo } from '../../lib/format';
import { Pager, Stat, useList } from './ui';

// Customer carts: what shoppers have in their baskets right now, and carts that became orders.
export default function Carts({ request, openOrder }) {
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const { rows, total, loading, error, extra, reload } = useList(request, '/admin/carts', { status, page, per: 20 });
  const t = extra?.totals;
  async function clear(id) { try { await request(`/admin/carts/${id}`, { method: 'DELETE' }); reload(); } catch { /* shown on reload */ } }

  return (
    <>
      <div className="stats">
        <Stat label="Open carts" value={t ? t.open : '…'} sub="customers shopping now" />
        <Stat label="Items in carts" value={t ? t.items : '…'} />
        <Stat label="Value in carts" value={t ? money(t.value) : '…'} tone="green" sub="before delivery fees" />
      </div>
      <section className="panel">
        <div className="filters">
          {[['open', 'Open carts'], ['ordered', 'Became orders']].map(([v, l]) => <button key={v} className={`tab${status === v ? ' on' : ''}`} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>)}
          <button className="btn ghost" onClick={reload}>Refresh</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="cart-list">
          {rows.map((c) => (
            <article key={c.id} className="cartcard">
              <div className="cart-top">
                <div><strong>Cart {c.id.slice(0, 8)}</strong><div className="muted">{status === 'open' ? `Last active ${timeAgo(c.updated_at)}` : formatDate(c.updated_at)}</div></div>
                <div><b>{c.item_count}</b> item{c.item_count === 1 ? '' : 's'}</div>
                <div><b>{money(c.total)}</b></div>
                {status === 'ordered' && c.errand_id && <div><button className="linklike" onClick={() => openOrder({ errand_id: c.errand_id })}>{c.errand_id}</button><div className="muted">{c.errand?.contact_info?.name}</div></div>}
                {status === 'open' && <button className="btn" onClick={() => clear(c.id)}>Clear</button>}
              </div>
              <table className="mini"><tbody>
                {c.items.map((i) => <tr key={i.id}><td>{i.qty} × {i.name} <span className="muted">{i.size}</span></td><td className="r">{money(i.price * i.qty)}</td></tr>)}
              </tbody></table>
            </article>
          ))}
          {!loading && rows.length === 0 && <p className="empty">{status === 'open' ? 'No one has items in a cart right now.' : 'No carts have become orders yet.'}</p>}
        </div>
        <Pager page={page} per={20} total={total} onPage={setPage} />
      </section>
    </>
  );
}
