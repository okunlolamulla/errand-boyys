import { useState } from 'react';
import ServiceForm from '../components/ServiceForm';
import Confirmation from '../components/Confirmation';

// Shared by the Request and Verify pages: the form, then the "Request ready" screen once it is submitted.
export function RequestShell({ title, blurb, initialSel, locked, pic, picAlt }) {
  const [result, setResult] = useState(null);
  if (result) return <Confirmation result={result} />;
  return (
    <>
      {pic && <img className="fullpic" src={pic} alt={picAlt || ""} />}
      <section>
        <div className="wrap two" style={{ alignItems: 'start' }}>
          <div>
            <h2>{title}</h2>
            <p style={{ color: 'var(--mut)', margin: '12px 0' }}>{blurb}</p>
          </div>
          <ServiceForm initialSel={initialSel} locked={locked} onDone={setResult} />
        </div>
      </section>
    </>
  );
}

export default function RequestPage({ query }) {
  return (
    <RequestShell title="Request an errand" blurb="Tell us the details. We get back to you with a price. You only pay once you confirm." initialSel={query.get('s') || 1} pic="/assets/img/request-errand.jpg" picAlt="Two Errand Boys agents reviewing a request on a laptop" />
  );
}
