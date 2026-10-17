import { useRef, useState } from 'react';
import { look } from '../lib/track';
import { ST } from '../data/services';
import PayBlock from './PayBlock';

// The "Track your errand" card at the bottom of the Home page.
export default function TrackerWidget() {
  const [input, setInput] = useState('');
  const [res, setRes] = useState(null); // null | {state:'loading'} | {state:'error',msg} | {state:'notfound'} | {state:'ok',x}
  const latest = useRef(0);

  async function search(value) {
    const mine = ++latest.current;
    setRes({ state: 'loading' });
    let next;
    try { const x = await look(value); next = x ? { state: 'ok', x } : { state: 'notfound' }; }
    catch (e) { next = { state: 'error', msg: e.message }; }
    if (mine === latest.current) setRes(next); // ignore an older answer that arrives late
  }

  return (
    <section>
      <div className="wrap" style={{ maxWidth: '640px' }}>
        <div className="card" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img className="lg2" alt="" src="/assets/img/logo.png" style={{ height: '44px', width: 'auto', background: 'var(--lb)', borderRadius: '10px', padding: '2px 4px' }} />
            <div>
              <h2 style={{ fontSize: '1.6rem' }}>Track your errand</h2>
              <span className="tag">Errand Boys</span>
            </div>
          </div>
          <p style={{ color: 'var(--mut)' }}>Enter your Errand ID to see where your errand is.</p>
          <label htmlFor="hw_in">Errand ID</label>
          <input id="hw_in" placeholder="EB-001245" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(input); }} />
          <div className="row">
            <button className="btn" onClick={() => search(input)}>Track errand</button>
            <button className="btn out" onClick={() => { setInput('EB-001245'); search('EB-001245'); }}>Try sample: EB-001245</button>
          </div>
          <div id="hw_res" aria-live="polite">{res && <Result res={res} />}</div>
        </div>
      </div>
    </section>
  );
}

function Result({ res }) {
  if (res.state === 'loading') return <div className="hwc"><p>Searching…</p></div>;
  if (res.state === 'error') return <div className="hwc"><b>Something went wrong</b><p style={{ opacity: 0.8, marginTop: '4px' }}>{res.msg}</p></div>;
  if (res.state === 'notfound') return <div className="hwc"><b>Errand ID not found</b><p style={{ opacity: 0.8, marginTop: '4px' }}>Check the ID and try again.</p></div>;
  const x = res.x;
  return (
    <div className="hwc">
      <small>ERRAND ID{x.smp ? ' · SAMPLE' : ''}</small>
      <div className="hwid">{x.v}</div>
      <span className={'hwb ' + (x.can ? 'c' : '')}>{x.can ? 'Cancelled' : ST[x.i]}</span>
      {x.ver ? <span className="hwb">✓ Verified</span> : null}
      <div className="hwbar" aria-hidden="true">{ST.map((s, k) => <i key={s} className={k <= x.i && !x.can ? 'f' : ''} />)}</div>
      {x.smp ? (
        <div className="hwd">
          <div><small>SERVICE</small><b>Grocery shopping</b></div>
          <div><small>ROUTE</small><b>Ikeja → Lekki Phase 1</b></div>
        </div>
      ) : null}
      {x.agent ? <p style={{ marginBottom: '10px' }}>Your agent: <b>{x.agent}</b></p> : null}
      <PayBlock x={x} />
      <a href={`#/track?id=${encodeURIComponent(x.v)}`} style={{ display: 'block', marginTop: '12px' }}>Open full tracking page →</a>
    </div>
  );
}
