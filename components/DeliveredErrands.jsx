import { DELIVERED } from '../data/delivered';
import { ST } from '../data/services';

// "Successful errands delivered" on the Contact page. The three cards are SAMPLES (see data/delivered.js).
export default function DeliveredErrands() {
  return (
    <section>
      <div className="wrap">
        <h2 style={{ textAlign: 'center' }}>Successful errands <span style={{ color: 'var(--mint)' }}>delivered</span></h2>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '16px 0 14px' }}>
          <span style={{ width: '46px', height: '4px', borderRadius: '4px', background: 'var(--mint)' }} />
          <span style={{ width: '46px', height: '4px', borderRadius: '4px', background: 'var(--sun)' }} />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--mut)', marginBottom: '28px' }}>Examples of how a completed errand looks on Errand Boys.</p>
        <div className="grid" style={{ marginTop: 0 }}>
          {DELIVERED.map((d) => (
            <div className="hwc" style={{ margin: 0 }} key={d.id}>
              <small>ERRAND ID · SAMPLE</small>
              <div className="hwid">{d.id}</div>
              <span className="hwb">✓ DELIVERED</span>
              <div className="hwbar" aria-hidden="true">{ST.map((s) => <i className="f" key={s} />)}</div>
              <div className="hwd">
                <div><small>SERVICE</small><b>{d.s}</b></div>
                <div><small>ROUTE</small><b>{d.r}</b></div>
              </div>
              <small>Completed with proof from the agent</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
