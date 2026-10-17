import { useState } from 'react';

// A real picture if there is one, otherwise the emoji. Pictures can come from an `img` address in catalog.json,
// or (when "photo_folders" is true) from files named after the id, e.g. /assets/products/groceries-1.jpg
export default function Thumb({ src, emoji, alt }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return <span aria-hidden="true">{emoji}</span>;
  const real = /\.(jpe?g|png|webp)$/i.test(src);
  return <img className={real ? 'real' : undefined} src={src} alt={alt} loading="lazy" onError={() => setBad(true)} />;
}
