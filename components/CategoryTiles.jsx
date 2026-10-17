import Thumb from './Thumb';

// "Shop by Category": one tile per category, A to Z.
export default function CategoryTiles({ categories, products, folders }) {
  const count = (id) => products.filter((p) => p.cat === id).length;
  return (
    <div className="ctiles">
      {categories.map((c) => (
        <a key={c.id} className="ctile" href={`#/shop?cat=${c.id}`} style={{ background: c.tint }}>
          <span className="cemoji"><Thumb key={c.id} src={c.img || (folders ? `/assets/categories/${c.id}.svg` : null)} emoji={c.e} alt="" /></span>
          <b>{c.name}</b>
          <small>{count(c.id)} items</small>
        </a>
      ))}
    </div>
  );
}
