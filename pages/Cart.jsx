import { useCart } from '../context/CartContext';
import { fmt } from '../lib/format';

const Pic = () => <img className="cartpic" src="/assets/img/cart-friends.jpg" alt="A woman checking her shopping order on her phone beside a trolley" />;

export default function Cart() {
  const { list, subtotal, setQty, clear } = useCart();
  if (!list.length) {
    return (
      <>
      <Pic />
      <section>
        <div className="wrap" style={{ maxWidth: '720px' }}>
            <h2>Your cart</h2>
          <p style={{ color: 'var(--mut)', margin: '12px 0 20px' }}>Your cart is empty.</p>
          <a className="btn sun" href="#/shop">Browse the shop</a>
        </div>
      </section>
      </>
    );
  }
  return (
    <>
    <Pic />
    <section>
      <div className="wrap" style={{ maxWidth: '820px' }}>
        <h2>Your cart</h2>
        <div className="card" style={{ marginTop: '16px' }}>
          {list.map((i) => (
            <div className="cartrow" key={i.id}>
              <div className="cinfo"><b>{i.name}</b><small>{i.size}</small><span>{fmt(i.price)}</span></div>
              <div className="qty" role="group" aria-label={`Quantity of ${i.name}`}>
                <button aria-label={`Remove one ${i.name}`} onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                <span>{i.qty}</span>
                <button aria-label={`Add one more ${i.name}`} onClick={() => setQty(i.id, i.qty + 1)}>+</button>
              </div>
              <div className="ctotal">{fmt(i.price * i.qty)}</div>
              <button className="btn ghost" aria-label={`Remove ${i.name} from the cart`} onClick={() => setQty(i.id, 0)}>✕</button>
            </div>
          ))}
          <div className="line"><span>Items total</span><b>{fmt(subtotal)}</b></div>
          <p style={{ color: 'var(--mut)', fontSize: '.9rem' }}>Delivery and service fees are confirmed in your quotation before you pay.</p>
          <div className="row" style={{ marginTop: '12px' }}>
            <a className="btn out" href="#/shop">Continue shopping</a>
            <a className="btn sun" href="#/checkout">Proceed to checkout</a>
          </div>
          <button className="linkbtn" onClick={clear}>Empty cart</button>
        </div>
      </div>
    </section>
    </>
  );
}
