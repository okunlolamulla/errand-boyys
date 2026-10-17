import { D, S } from '../data/services';
import { wa } from '../lib/format';
import Steps from '../components/Steps';

export default function ServiceDetail({ query }) {
  const s = S.find((x) => x.id == query.get('s')) || S[0]; // eslint-disable-line eqeqeq
  const d = D[s.id];
  return (
    <>
      <section style={{ paddingBottom: '32px' }}>
        <div className="wrap">
          <a href="#/services" style={{ color: 'var(--mut)' }}>← All services</a>
          <div className="hero" style={{ padding: '28px 0 0' }}>
            <div>
              <div style={{ fontSize: '3.2rem' }}>{s.i}</div>
              <h1 style={{ fontSize: 'clamp(2.2rem,6vw,4rem)' }}>{s.n}</h1>
              <p>{d.t}</p>
              <div className="row">
                <a className="btn sun" href={`#/request?s=${s.id}`}>Request this service</a>
                <a className="btn out" target="_blank" rel="noopener" href={wa('Hello Errand Boys, I need help with: ' + s.n)}>Ask on WhatsApp</a>
                {s.c && <a className="btn out" href={`tel:${s.c}`}>Call {s.c}</a>}
              </div>
            </div>
            <div className="live">
              <h3>How it works</h3>
              <Steps items={s.f.split(' → ')} n={-1} liStyle={{ color: '#fff' }} />
              <small>Your price is confirmed before you pay.</small>
            </div>
          </div>
        </div>
      </section>
      <section style={{ paddingTop: '24px' }}>
        <div className="wrap two" style={{ alignItems: 'start' }}>
          <div>
            <h2>About this service</h2>
            <p style={{ color: 'var(--mut)', marginTop: '14px', maxWidth: '60ch' }}>{d.l}</p>
            {d.img && <img src={d.img} alt={d.alt || s.n} style={{ width: '100%', maxWidth: '520px', maxHeight: '480px', objectFit: 'cover', borderRadius: '22px', marginTop: '24px', display: 'block', boxShadow: '8px 8px 0 var(--sun)' }} />}
          </div>
          <div className="grid" style={{ margin: 0, gridTemplateColumns: '1fr 1fr' }}>
            {d.w.map((x) => <div className="card" key={x}><b>✓</b><p style={{ color: 'var(--ink)' }}>{x}</p></div>)}
          </div>
        </div>
      </section>
      <section className="band">
        <div className="wrap two">
          <div>
            <h2>What we will ask you</h2>
            <p style={{ color: '#fff', marginTop: '12px' }}>Have these ready and your request is quick to review.</p>
          </div>
          <ul style={{ paddingLeft: '20px' }}>{d.n.map((x) => <li key={x} style={{ margin: '8px 0' }}>{x}</li>)}</ul>
        </div>
      </section>
      <section>
        <div className="wrap">
          <h2>Other services</h2>
          <div className="row" style={{ marginTop: '20px' }}>
            {S.filter((x) => x.id !== s.id).map((x) => <a key={x.id} className="btn out" href={`#/service?s=${x.id}`}>{x.i} {x.n}</a>)}
          </div>
        </div>
      </section>
    </>
  );
}
