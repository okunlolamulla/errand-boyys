import { Fragment } from 'react';
import { NG_CITIES, NG_OUT, NG_ROUTES } from '../data/nigeria';

const X = (lo) => +((lo - 2.5) * 60).toFixed(1);
const Y = (la) => +((14.2 - la) * 60).toFixed(1);
const VEHICLES = ['🚚', '🛵', '🚗'];

// Illustrative map of Nigeria: city points, delivery routes and vehicles driving along them.
export default function NigeriaMap() {
  // People who asked their device for reduced motion get a still map.
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
  const land = 'M' + NG_OUT.map((p) => X(p[0]) + ' ' + Y(p[1])).join('L') + 'Z';
  const routes = NG_ROUTES.map(([a, b], i) => {
    const A = NG_CITIES[a], B = NG_CITIES[b], x1 = X(A[0]), y1 = Y(A[1]), x2 = X(B[0]), y2 = Y(B[1]);
    const dx = x2 - x1, dy = y2 - y1, cx = (x1 + x2) / 2 - dy * 0.16, cy = (y1 + y2) / 2 + dx * 0.16;
    return { i, x1, y1, d: `M${x1} ${y1}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`, dur: Math.max(10, Math.hypot(dx, dy) / 9 + (i % 5) * 2).toFixed(1), v: VEHICLES[i % 3] };
  });

  return (
    <section>
      <div className="wrap">
        <h2 style={{ textAlign: 'center' }}>Errands on the move across <span style={{ color: 'var(--mint)' }}>Nigeria</span></h2>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '16px 0 22px' }}>
          <span style={{ width: '46px', height: '4px', borderRadius: '4px', background: 'var(--mint)' }} />
          <span style={{ width: '46px', height: '4px', borderRadius: '4px', background: 'var(--sun)' }} />
        </div>
        <svg viewBox="0 0 744 600" role="img" aria-label="Map of Nigeria with city points and moving delivery vehicles" style={{ width: '100%', maxWidth: '760px', height: 'auto', display: 'block', margin: '0 auto' }}>
          <path d={land} fill="var(--card)" stroke="var(--blue)" strokeWidth="3" strokeLinejoin="round" />
          {routes.map((r) => <path key={r.i} id={`r${r.i}`} d={r.d} fill="none" stroke="var(--mint)" strokeWidth="1.8" strokeDasharray="4 6" opacity=".6" />)}
          {Object.entries(NG_CITIES).map(([n, c], i) => {
            const x = X(c[0]), y = Y(c[1]), hub = c[2], right = x > 560, begin = `${(i * 0.37).toFixed(2)}s`;
            return (
              <Fragment key={n}>
                {hub && !still && (
                  <circle cx={x} cy={y} r="5" fill="none" stroke="var(--sun)" strokeWidth="2">
                    <animate attributeName="r" values="5;18" dur="2.4s" begin={begin} repeatCount="indefinite" />
                    <animate attributeName="opacity" values=".9;0" dur="2.4s" begin={begin} repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={hub ? 5.5 : 3.8} fill="var(--sun)" stroke="#fff" strokeWidth="1.5"><title>{n}</title></circle>
                {hub && (
                  <text x={x + (right ? -10 : 10)} y={y + 5} textAnchor={right ? 'end' : 'start'} fontSize="16" fontWeight="700" fill="var(--ink)" style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: '4px' }}>{n}</text>
                )}
              </Fragment>
            );
          })}
          {routes.map((r) => (
            <text key={r.i} fontSize="22" textAnchor="middle" dominantBaseline="central" {...(still ? { x: r.x1, y: r.y1 } : {})}>
              {r.v}
              {!still && (
                <animateMotion dur={`${r.dur}s`} begin={`-${(r.i * 1.7).toFixed(1)}s`} repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear">
                  <mpath href={`#r${r.i}`} />
                </animateMotion>
              )}
            </text>
          ))}
        </svg>
        <p style={{ textAlign: 'center', color: 'var(--mut)', fontSize: '.9rem', marginTop: '14px' }}>Illustrative map. Contact us to confirm we serve your city.</p>
      </div>
    </section>
  );
}
