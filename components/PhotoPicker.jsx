import { useEffect, useState } from 'react';
import { shrink } from '../lib/image';

// Optional photos: shrinks big phone photos, max 5, previews with a remove button.
export default function PhotoPicker({ label, photos, setPhotos, setError }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const u = photos.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [photos]);

  async function pick(e) {
    const picked = [...e.target.files];
    e.target.value = ''; // lets the same photo be chosen again
    setError('');
    const next = [...photos];
    for (const f of picked) {
      if (next.length >= 5) { setError('You can add up to 5 photos.'); break; }
      if (!f.type.startsWith('image/')) { setError('Only photos are allowed.'); continue; }
      const r = await shrink(f);
      if (r.size > 5 * 1024 * 1024) { setError('A photo is larger than 5 MB.'); continue; }
      next.push(r);
    }
    setPhotos(next);
  }

  return (
    <>
      <label htmlFor="g_fl">{label}</label>
      <input id="g_fl" type="file" accept="image/*" multiple onChange={pick} />
      <div id="g_th" className="thumbs">
        {urls.length === photos.length && urls.map((u, i) => (
          <div className="th" key={u}>
            <img alt="" src={u} />
            <button type="button" aria-label="Remove photo" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
