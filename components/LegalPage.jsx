export default function LegalPage({ title, children }) {
  return (
    <section className="legal">
      <div className="wrap" style={{ maxWidth: '820px' }}>
        <h1>{title}</h1>
        <p className="lm">Last updated: October 2026 · Draft, to be reviewed before launch</p>
        {children}
      </div>
    </section>
  );
}
