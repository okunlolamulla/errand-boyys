import { fmt } from '../lib/format';
import { useCart } from '../context/CartContext';
import Thumb from './Thumb';

// One product with "Add to cart", which turns into a quantity stepper once it is in the cart.
export default function ProductCard({ p, cat, folders }) {
  const { items, add, setQty } = useCart();
  const q = items[p.id]?.qty || 0;
  return (
    <div className="pcard">
      <div className="pimg" style={{ background: cat.tint }}>
        <Thumb key={p.id} src={p.img || (folders ? `/assets/products/${p.id}.svg` : null)} emoji={p.e || cat.e} alt={p.name} />
        {p.out ? <span className="pbadge out">Sold out</span> : p.was ? <span className="pbadge">Sale</span> : null}
      </div>
      <div className="pbody">
        <h3>{p.name}</h3>
        <small>{p.size}</small>
        <div className="pprice"><b>{fmt(p.price)}</b>{p.was ? <s>{fmt(p.was)}</s> : null}</div>
        {p.left ? <small className="lowstock">Only {p.left} left</small> : null}
        {p.out
          ? <button className="btn pbtn" disabled>Out of stock</button>
          : q === 0
          ? <button className="btn pbtn" onClick={() => add(p)}>Add to cart</button>
          : (
            <div className="qty" role="group" aria-label={`Quantity of ${p.name}`}>
              <button aria-label={`Remove one ${p.name}`} onClick={() => setQty(p.id, q - 1)}>−</button>
              <span aria-live="polite">{q}</span>
              <button aria-label={`Add one more ${p.name}`} onClick={() => setQty(p.id, q + 1)}>+</button>
            </div>
          )}
      </div>
    </div>
  );
}
