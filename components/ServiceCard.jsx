import { D } from '../data/services';

export default function ServiceCard({ s }) {
  const d = D[s.id];
  return (
    <div className="card">
      {d.thumb && <img src={d.img} alt={d.alt} style={{ width: '100%', height: '170px', objectFit: 'cover', objectPosition: '50% 62%', borderRadius: '14px' }} />}
      <div className="ic">{s.i}</div>
      <h3>{s.n}</h3>
      <p>{s.d}</p>
      <small style={{ color: 'var(--mut)' }}>{s.f}</small>
      <a href={`#/service?s=${s.id}`} style={{ fontWeight: 700 }}>Learn more</a>
      <a className="btn" href={`#/request?s=${s.id}`}>Request this</a>
      {s.c && <a className="btn out" href={`tel:${s.c}`}>Call {s.c}</a>}
    </div>
  );
}
