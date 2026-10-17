// "Why customers choose Errand Boys" (Home and About pages).
export default function Features() {
  return (
    <section>
      <div className="wrap">
        <h2 style={{ textAlign: "center" }}>Why customers choose <span style={{ color: "var(--mint)" }}>Errand Boys</span></h2>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", margin: "16px 0 36px" }}>
          <span style={{ width: "46px", height: "4px", borderRadius: "4px", background: "var(--mint)" }} />
          <span style={{ width: "46px", height: "4px", borderRadius: "4px", background: "var(--sun)" }} />
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", marginTop: "0" }}>
          <div className="card" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "1.7rem", boxShadow: "inset 0 0 0 2px var(--line)" }}>🛡️</div>
            <h3 style={{ fontSize: "1.05rem" }}>Reliable and secure</h3>
            <p>Every errand has an Errand ID and an assigned agent, so you know who has it.</p>
          </div>
          <div className="card" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "1.7rem", boxShadow: "inset 0 0 0 2px var(--line)" }}>💳</div>
            <h3 style={{ fontSize: "1.05rem" }}>Clear pricing</h3>
            <p>You see your price before you pay. No surprises.</p>
          </div>
          <div className="card" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "1.7rem", boxShadow: "inset 0 0 0 2px var(--line)" }}>📍</div>
            <h3 style={{ fontSize: "1.05rem" }}>Track your errand</h3>
            <p>Follow its progress with your Errand ID.</p>
          </div>
          <div className="card" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "1.7rem", boxShadow: "inset 0 0 0 2px var(--line)" }}>✅</div>
            <h3 style={{ fontSize: "1.05rem" }}>Verified work</h3>
            <p>We can check an address, seller or property before you commit.</p>
          </div>
          <div className="card" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "1.7rem", boxShadow: "inset 0 0 0 2px var(--line)" }}>🎧</div>
            <h3 style={{ fontSize: "1.05rem" }}>Customer focused</h3>
            <p>Reach a real person on WhatsApp or by phone.</p>
          </div>
          <div className="card" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "1.7rem", boxShadow: "inset 0 0 0 2px var(--line)" }}>🧰</div>
            <h3 style={{ fontSize: "1.05rem" }}>Many services</h3>
            <p>Groceries, pharmacy, moving, house hunting, car service and more.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
