import { S } from '../data/services';
import { wa } from '../lib/format';
import Features from '../components/Features';
import ServiceCard from '../components/ServiceCard';
import TrackerWidget from '../components/TrackerWidget';
import HeroSlider from '../components/HeroSlider';
import ShopHome from '../components/ShopHome';

// Home: hero, banner, how it works, featured services, about excerpt, why customers choose us, tracker.
export default function Home() {
  return (
    <>
      <HeroSlider />
      <ShopHome />
      <section className="carefig">
        <div className="wrap">
          <figure className="qualfig">
            <img src="/assets/img/care-team.jpg" alt="A carer in navy scrubs gently helping an older woman walk with a walker" />
            <figcaption>Care giving services are handled well by our team</figcaption>
          </figure>
        </div>
      </section>
      <div className="wrap hero">
        <div>
          <h1>Tell us what you need done. We'll find someone to do it.</h1>
          <p>Groceries, pickups, office errands, moving, house hunting and more. Send a request, get a clear price, follow your errand.</p>
          <div className="row">
            <a className="btn sun" href="#/request">Request an errand</a>
            <a className="btn out" href={wa('Hello Errand Boys, I need help with an errand.')} target="_blank" rel="noopener">Chat on WhatsApp</a>
          </div>
        </div>
        <div className="live">
          <small>Sample errand · EB-001245</small>
          <h3 style={{ marginTop: "4px" }}>Agent is on the way</h3>
          <div className="map">
            <svg viewBox="0 0 320 170">
              <path d="M20 130 C90 130 90 40 160 70 S260 30 300 40" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeDasharray="6 7" />
              <circle cx="300" cy="40" r="8" fill="#CE373E" />
            </svg>
            <span className="rider">🛵</span>
          </div>
          <small>Track yours with its Errand ID</small>
        </div>
      </div>
      <section style={{ padding: "0 0 56px" }}>
        <div className="wrap">
          <a href="#/services" aria-label="View our services" style={{ position: "relative", display: "block", borderRadius: "28px", overflow: "hidden" }}>
            <img src="/assets/img/home-banner-new.jpg" alt="Three excited friends looking at a phone" style={{ display: "block", width: "100%", height: "clamp(280px,42vw,460px)", objectFit: "cover", objectPosition: "50% 6%", background: "#3a3a3e" }} />
            <span className="btn sun" style={{ position: "absolute", right: "20px", bottom: "20px" }}>View our services →</span>
          </a>
        </div>
      </section>
      <section className="band">
        <div className="wrap">
          <h2>How it works</h2>
          <div className="hiw">
          <div className="grid hiwgrid">
            <div className="card">
              <h3>1. Request</h3>
              <p>Pick a service and describe the task, location and time.</p>
            </div>
            <div className="card">
              <h3>2. Quote</h3>
              <p>We review it and confirm your price.</p>
            </div>
            <div className="card">
              <h3>3. Pay</h3>
              <p>Confirm and pay with the payment link.</p>
            </div>
            <div className="card">
              <h3>4. Done</h3>
              <p>An agent completes it. You follow each status.</p>
            </div>
          </div>
          <img className="hiwimg" src="/assets/img/how-it-works.jpg" alt="A smiling Errand Boys delivery agent with arms folded in front of stacked boxes" />
          </div>
        </div>
      </section>
      <section>
        <div className="wrap">
          <h2>Our services</h2>
          <div className="grid">{[1, 5, 2, 3].map((i) => S.find((x) => x.id === i)).map((s) => <ServiceCard key={s.id} s={s} />)}</div>
          <div className="row" style={{ marginTop: '28px' }}><a className="btn" href="#/services">See all services</a></div>
        </div>
      </section>
      <section className="band">
        <div className="wrap tmgrid">
          <div>
          <h2>Your Time Matters. We’ll Handle the Rest.</h2>
          <p style={{ marginTop: "20px", fontSize: "1.1rem" }}>Life and business move fast. From grocery shopping and personal errands to business procurement, pickups, deliveries, and everyday tasks, ERRANDBOYS is your trusted partner for getting things done. We provide reliable, professional, and technology-enabled errand and concierge services designed to save you time… <a href="#/about" style={{ color: "#fff", fontWeight: "700", textDecoration: "underline", whiteSpace: "nowrap" }}>Read more about us →</a></p>
          <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #ffffff33" }}>
            <p style={{ fontSize: "1.05rem" }}>Have a question or want to know more?</p>
            <a className="btn sun" style={{ marginTop: "12px" }} href="#/contact">Contact us</a>
          </div>
          </div>
          <div className="tmpics">
            <img src="/assets/img/time-matters-1.jpg" alt="Two older people laughing together outdoors" />
            <img src="/assets/img/time-matters-2.jpg" alt="A busy market street in Ibadan with cars, umbrellas and a blue flyover" />
          </div>
        </div>
      </section>
      <Features />
      <section className="qualband">
        <div className="wrap">
          <figure className="qualfig">
            <img src="/assets/img/good-quality.jpg" alt="A damaged, overloaded yellow truck next to a clean yellow delivery truck" />
            <figcaption>We deliver good quality products and services</figcaption>
          </figure>
        </div>
      </section>
      <TrackerWidget />
      <section className="verifyband">
        <div className="wrap two">
          <div>
            <h2>Verification errand</h2>
            <p style={{ color: 'var(--mut)', margin: '14px 0 22px', fontSize: '1.1rem', maxWidth: '46ch' }}>Not sure a seller, property or address is real? Book an agent. We visit, check and send you evidence and a report before you commit.</p>
            <a className="btn sun" href="#/verify">Book a verification errand</a>
          </div>
          <img src="/assets/img/verification-errand.jpg" alt="Two women smiling at a phone together" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '24px', background: '#fff' }} />
        </div>
      </section>
    </>
  );
}
