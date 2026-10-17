import { useState } from 'react';
import { PHD } from '../lib/config';
import Steps from './Steps';

const NEXT_STEPS = ['Request created', 'You send it on WhatsApp', 'We review and confirm your price', 'You confirm and pay', 'Agent assigned'];

// "Request ready": the Errand ID, the WhatsApp button, and (if photos were added) a way to send them too.
export default function Confirmation({ result }) {
  const { id, link } = result;
  const [copied, setCopied] = useState(false);
  const [shmsg, setShmsg] = useState('');

  if (result.kind === 'generic') {
    return (
      <section>
        <div className="wrap" style={{ maxWidth: '600px' }}>
          <div style={{ fontSize: '3rem' }}>📨</div>
          <h2>Request ready</h2>
          <p style={{ color: 'var(--mut)', margin: '12px 0' }}>Your errand ID is <span className="tag">{id}</span>. Send it on WhatsApp so our team receives it.</p>
          <a className="btn sun" target="_blank" rel="noopener" href={link}>Send on WhatsApp</a>
          <Steps items={NEXT_STEPS} n={1} />
          <a className="btn out" href="#/track">Track errand</a>
        </div>
      </section>
    );
  }

  const { saved, n, m, long, photos } = result;

  // WhatsApp links cannot carry photos, so the phone's share sheet is used (the customer picks the chat).
  async function sharePhotos() {
    const how = `After sending the message, tap + in the WhatsApp chat with ${PHD}, add your photos and mention ${id}.`;
    try {
      if (navigator.canShare && navigator.canShare({ files: photos })) {
        await navigator.share({ files: photos, text: 'Photos for errand ' + id });
        setShmsg('Choose WhatsApp, then the Errand Boys chat (' + PHD + '), and send.');
      } else setShmsg('This browser cannot attach photos automatically. ' + how);
    } catch (e) {
      if (e.name !== 'AbortError') setShmsg('Could not share the photos. ' + how);
    }
  }

  return (
    <section>
      <div className="wrap" style={{ maxWidth: '600px' }}>
        <div style={{ fontSize: '3rem' }}>📨</div>
        <h2>Request ready</h2>
        <p style={{ color: 'var(--mut)', margin: '12px 0' }}>Your errand ID is <span className="tag">{id}</span>.{saved ? ' We have saved your request' + (n ? ' and photos' : '') + '.' : ''} Send it on WhatsApp so our team receives it.</p>
        <a className="btn sun" target="_blank" rel="noopener" href={link}>1. Send request on WhatsApp</a>
        {long && (
          <>
            <p className="muted" style={{ margin: '10px 0' }}>Your message is long. Tap below, then paste it in the chat after the first message.</p>
            <button className="btn out" onClick={() => { navigator.clipboard.writeText(m); setCopied(true); }}>{copied ? 'Copied ✓' : 'Copy full request'}</button>
          </>
        )}
        {n > 0 && (
          <div style={{ margin: '16px 0' }}>
            <button className="btn" onClick={sharePhotos}>2. Send {n} photo{n > 1 ? 's' : ''} on WhatsApp</button>
            <p id="shmsg" style={{ color: 'var(--mut)', marginTop: '8px' }}>{shmsg}</p>
          </div>
        )}
        <Steps items={NEXT_STEPS} n={1} />
        <a className="btn out" href="#/track">Track errand</a>
      </div>
    </section>
  );
}
