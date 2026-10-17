import { S } from '../data/services';
import ServiceCard from '../components/ServiceCard';

export default function Services() {
  return (
    <>
    <img className="fullpic" src="/assets/img/service-moving.jpg" alt="Errand Boys movers loading a truck" />
    <section>
      <div className="wrap">
        <h2>Services</h2>
        <p style={{ color: 'var(--mut)', marginTop: '12px' }}>Each request is reviewed and quoted before you pay.</p>
        <div className="grid svgrid">{S.map((s) => <ServiceCard key={s.id} s={s} />)}</div>
      </div>
    </section>
    </>
  );
}
