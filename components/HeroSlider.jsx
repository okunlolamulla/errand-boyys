import { useCallback, useEffect, useState } from 'react';
import { SLIDES } from '../data/slides';

// Slideshow at the top of the Home page: one slide per service, changes every 4 seconds.
// It pauses while you point at it or use the keyboard, and stays still if your device asks for reduced motion.
export default function HeroSlider() {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;
  const go = useCallback((i) => setCur((i + n) % n), [n]);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

  useEffect(() => {
    if (paused || reduced) return undefined;
    const t = setInterval(() => setCur((c) => (c + 1) % n), 2500);
    return () => clearInterval(t);
  }, [paused, reduced, n]);

  return (
    <section className="slider" aria-roledescription="carousel" aria-label="Our services"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); }}>
      <div className="wrap">
        <div className="slide-track">
          {SLIDES.map((s, i) => (
            <div key={s.id} className={'slide' + (i === cur ? ' on' : '')} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`} aria-hidden={i !== cur}>
              <div className="stext">
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <div className="row">
                  <a className="btn sun" href={s.cta[1]} tabIndex={i === cur ? 0 : -1}>{s.cta[0]}</a>
                  {s.cta2 ? <a className="btn out" href={s.cta2[1]} tabIndex={i === cur ? 0 : -1}>{s.cta2[0]}</a> : null}
                </div>
              </div>
              <div className="simg"><SlideImage s={s} eager={i === 0} /></div>
            </div>
          ))}
        </div>
        <div className="sctl">
          <button className="sbtn" aria-label="Previous slide" onClick={() => go(cur - 1)}>‹</button>
          <div className="sdots">
            {SLIDES.map((s, i) => <button key={s.id} className={'sdot' + (i === cur ? ' on' : '')} aria-label={`Show slide ${i + 1}: ${s.title}`} aria-current={i === cur} onClick={() => go(i)} />)}
          </div>
          <button className="sbtn" aria-label="Next slide" onClick={() => go(cur + 1)}>›</button>
        </div>
      </div>
    </section>
  );
}

// If a picture from the web cannot load, quietly switch to the local one.
function SlideImage({ s, eager }) {
  const [src, setSrc] = useState(s.img);
  return <img src={src} alt={s.alt} loading={eager ? 'eager' : 'lazy'} onError={() => { if (s.fallback && src !== s.fallback) setSrc(s.fallback); }} />;
}
