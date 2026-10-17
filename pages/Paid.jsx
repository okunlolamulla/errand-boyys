import { fmt, wa } from '../lib/format';
import { getD, getPending } from '../lib/storage';

// Where customers land after paying on Paystack.
export default function Paid() {
  const p = getPending();
  const d = p.id ? getD(p.id) : {};
  const m = p.id
    ? `Errand Boys payment\nErrand ID: ${p.id}\nService: ${p.sv}\nAmount: ${fmt(p.p, p.cur)}\nName: ${d.nm || ''}\nPhone: ${d.ph || ''}\nLocation: ${d.lc || ''}\nWhen: ${d.dt || 'Flexible'}\nTask: ${d.ds || ''}`
    : 'Hello Errand Boys, I have just made a payment.';
  return (
    <section>
      <div className="wrap" style={{ maxWidth: '560px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>✅</div>
        <h2>Thank you</h2>
        <p style={{ color: 'var(--mut)', margin: '12px 0' }}>If your payment went through, we will confirm it and assign an agent. A quick confirmation on WhatsApp helps us act faster.</p>
        {p.id ? <p><span className="tag">{p.id}</span> · {fmt(p.p, p.cur)}</p> : null}
        <div className="row" style={{ justifyContent: 'center', marginTop: '16px' }}>
          <a className="btn sun" target="_blank" rel="noopener" href={wa(m)}>Send payment confirmation on WhatsApp</a>
          {p.id ? <a className="btn out" href={`#/track?id=${encodeURIComponent(p.id)}`}>Track errand</a> : null}
        </div>
      </div>
    </section>
  );
}
