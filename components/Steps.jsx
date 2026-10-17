// A vertical list of steps. Steps before n are done, step n is the current one.
export default function Steps({ items, n, liStyle }) {
  return (
    <ul className="steps">
      {items.map((s, k) => <li key={s} className={k < n ? 'done' : k === n ? 'now' : ''} style={liStyle}>{s}</li>)}
    </ul>
  );
}
