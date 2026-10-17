import Features from '../components/Features';

export default function About() {
  return (
    <>
      <img className="fullpic" src="/assets/img/about-team.jpg" alt="Errand Boys team in blue uniforms loading boxes into a moving truck" />
      <section className="band">
        <div className="wrap abtgrid">
        <div>
          <h2>Your Time Matters. We’ll Handle the Rest.</h2>
          <p style={{ marginTop: "20px", fontSize: "1.1rem" }}>Life and business move fast. From grocery shopping and personal errands to business procurement, pickups, deliveries, and everyday tasks, ERRANDBOYS is your trusted partner for getting things done.</p>
          <p style={{ marginTop: "16px", fontSize: "1.1rem" }}>We provide reliable, professional, and technology-enabled errand and concierge services designed to save you time, reduce stress, and make everyday life more convenient.</p>
          <p style={{ marginTop: "24px", font: "800 1.5rem var(--font)" }}>You have things to do. Let us handle the errands!</p>
          <p style={{ marginTop: "28px", fontWeight: "800", letterSpacing: ".12em" }}>ERRANDBOYS</p>
          <p style={{ opacity: ".85" }}>Saving Time. Delivering Convenience. Building Trust.</p>
        </div>
        </div>
      </section>
      <section>
        <div className="wrap two">
          <div>
            <h2>About Errand Boys</h2>
            <p style={{ color: "var(--mut)", marginTop: "16px" }}>Our promise is simple: tell Errand Boys what you need done, and we'll find someone to do it. Every request is reviewed, priced clearly and handled by an assigned agent, with status updates until it is complete.</p>
          </div>
          <div className="grid" style={{ margin: "0" }}>
            <div className="card">
              <h3>Clear pricing</h3>
              <p>You confirm the quote before you pay.</p>
            </div>
            <div className="card">
              <h3>Assigned agent</h3>
              <p>You know who is handling your errand.</p>
            </div>
            <div className="card">
              <h3>Status updates</h3>
              <p>Follow progress with your Errand ID.</p>
            </div>
          </div>
        </div>
      </section>
      <Features />
    </>
  );
}
