import { EM, PH, PHD } from '../lib/config';
import { wa } from '../lib/format';
import NigeriaMap from '../components/NigeriaMap';
import DeliveredErrands from '../components/DeliveredErrands';

export default function Contact() {
  return (
    <>
      <img className="fullpic" style={{ objectPosition: '50% 40%' }} src="/assets/img/contact-phone.jpg" alt="A friendly figure holding a large red telephone handset" />
      <section>
        <div className="wrap two">
          <div>
            <h2>Contact us</h2>
            <p style={{ marginTop: "16px" }}>📞 <a href={`tel:${PH}`}>{PHD}</a><br />💬 WhatsApp: {PHD}<br />✉️ <a href={`mailto:${EM}`}>{EM}</a><br />Social: coming soon</p>
          </div>
          <div className="card">
            <h3>Prefer WhatsApp?</h3>
            <p>Message us and we will respond as soon as we can.</p>
            <a className="btn" target="_blank" rel="noopener" href={wa('Hello Errand Boys')}>Open WhatsApp</a>
          </div>
        </div>
      </section>
      <NigeriaMap />
      <DeliveredErrands />
    </>
  );
}
