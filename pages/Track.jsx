import { useEffect, useRef, useState } from 'react';
import { look } from '../lib/track';
import { ST } from '../data/services';
import Steps from '../components/Steps';
import PayBlock from '../components/PayBlock';

export default function Track({ query }) {
  const first = query.get('id') || '';
  const [input, setInput] = useState(first);
  const [res, setRes] = useState({ state: 'idle' }); // idle | loading | error | notfound | ok
  const latest = useRef(0);

  async function search(value) {
    const mine = ++latest.current;
    setRes({ state: 'loading' });
    let next;
    try { const x = await look(value); next = x ? { state: 'ok', x } : { state: 'notfound' }; }
    catch (e) { next = { state: 'error', msg: e.message }; }
    if (mine === latest.current) setRes(next); // ignore an older answer that arrives late
  }

  // /track?id=EB-... opens straight to the result
  useEffect(() => { if (first) search(first); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section>
      <div className="wrap">
        <img className="trackpic" src="/assets/img/track-friends.jpg" alt="Three excited friends checking their errand status on a phone" />
      </div>
      <div className="wrap two">
        <div>
          <h2>Track your errand</h2>
          <p style={{ color: 'var(--mut)', margin: '12px 0 20px' }}>Enter your Errand ID, for example EB-K7M2QX.</p>
          <label htmlFor="tc">Errand ID</label>
          <input id="tc" placeholder="EB-K7M2QX" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn" onClick={() => search(input)}>Track errand</button>
        </div>
        <div className="card" id="res"><Result res={res} /></div>
      </div>
    </section>
  );
}

function Result({ res }) {
  if (res.state === 'idle') return <p>Your errand status appears here.</p>;
  if (res.state === 'loading') return <p>Searching…</p>;
  if (res.state === 'error') return <><h3>Something went wrong</h3><p>{res.msg}</p></>;
  if (res.state === 'notfound') return <><h3>Errand ID not found</h3><p>Check the ID and try again. It looks like EB-K7M2QX.</p></>;
  const x = res.x;
  return (
    <>
      <span className="tag">{x.v}</span>
      {x.ver ? <p style={{ marginTop: '10px' }}><b style={{ color: 'var(--mint)' }}>✓ Verified by Errand Boys</b></p> : null}
      {x.can
        ? <p style={{ marginTop: '10px' }}><b>This errand was cancelled.</b> Contact us if you have questions.</p>
        : <Steps items={ST} n={x.i === 9 ? 10 : x.i} />}
      {x.agent ? <p className="muted" style={{ marginTop: '10px' }}>Your agent: {x.agent}</p> : null}
      <PayBlock x={x} />
    </>
  );
}
