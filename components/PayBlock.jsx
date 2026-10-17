import { b64e, fmt } from '../lib/format';

// PAY NOW for a quoted errand: opens our checkout page, which shows the fee and goes on to Paystack.
export default function PayBlock({ x }) {
  if (!(x && x.status === 'Quoted' && x.q)) return null;
  const code = b64e([x.v, x.svc, x.q.amount, x.pay || '', x.q.currency].join('|'));
  return (
    <div style={{ marginTop: '16px', textAlign: 'center' }}>
      <p>Amount due: <b>{fmt(x.q.amount, x.q.currency)}</b></p>
      <a className="btn sun" href={`#/checkout?c=${code}`}>PAY NOW</a>
    </div>
  );
}
