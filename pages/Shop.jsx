import { useCatalog } from '../hooks/useCatalog';
import { useCart } from '../context/CartContext';
import { fmt } from '../lib/format';
import CategoryTiles from '../components/CategoryTiles';
import ProductCard from '../components/ProductCard';

const LISTS = { deals: ['Hot Deals', (p) => p.was], featured: ['Featured Products', (p) => p.featured], new: ['New Arrivals', (p) => p.new] };

// The shop: Shop by Category (A to Z), a category page, all products grouped by category, search, and Hot Deals / Featured / New.
export default function Shop({ query }) {
  const { data, error } = useCatalog();
  const cart = useCart();
  const catId = query.get('cat'), q = (query.get('q') || '').trim(), list = query.get('list');

  if (error) return <section><div className="wrap"><h2>Shop</h2><p className="error">{error}</p></div></section>;
  if (!data) return <section><div className="wrap"><h2>Shop</h2><p className="muted">Loading the shop…</p></div></section>;

  const { categories, products } = data;
  const cats = Object.fromEntries(categories.map((c) => [c.id, c]));
  const grid = (items) => <div className="pgrid">{items.map((p) => <ProductCard key={p.id} p={p} cat={cats[p.cat]} folders={data.photo_folders} />)}</div>;
  const section = (title, items, viewAll) => items.length > 0 && (
    <div style={{ marginTop: '36px' }} key={title}>
      <div className="sechead"><h2>{title}</h2>{viewAll && <a href={viewAll}>View all</a>}</div>
      {grid(items)}
    </div>
  );

  let body, title = 'Shop by Category';
  const cat = cats[catId];
  if (q) {
    const ql = q.toLowerCase();
    const found = products.filter((p) => (p.name + ' ' + p.size + ' ' + cats[p.cat].name).toLowerCase().includes(ql));
    title = `Results for “${q}”`;
    body = found.length ? grid(found) : <p className="muted" style={{ marginTop: '16px' }}>Nothing matched “{q}”. Try another word or browse a category.</p>;
  } else if (LISTS[list]) {
    title = LISTS[list][0];
    body = grid(products.filter(LISTS[list][1]));
  } else if (cat) {
    title = cat.name;
    body = (
      <>
        {cat.age18 && <p className="notice">You must be 18 or older to buy alcohol. We ask you to confirm this at checkout.</p>}
        {grid(products.filter((p) => p.cat === cat.id))}
      </>
    );
  } else if (catId === 'all') {
    title = 'All products';
    body = categories.map((c) => section(c.name, products.filter((p) => p.cat === c.id)));
  } else {
    body = (
      <>
        <CategoryTiles categories={categories} products={products} folders={data.photo_folders} />
        {section('Hot Deals', products.filter((p) => p.was).slice(0, 6), '#/shop?list=deals')}
        {section('Featured Products', products.filter((p) => p.featured).slice(0, 6), '#/shop?list=featured')}
        {section('New Arrivals', products.filter((p) => p.new).slice(0, 6), '#/shop?list=new')}
      </>
    );
  }
  const home = !q && !LISTS[list] && !cat && catId !== 'all';

  return (
    <section>
      <div className="wrap">
        <img className="trackpic" style={{ objectPosition: '50% 20%', height: 'clamp(240px,34vw,380px)' }} src="/assets/img/shop-banner.jpg" alt="A smiling woman shopping on her phone" />
        <div className="sechead"><h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)' }}>{title}</h1>{home && <a href="#/shop?cat=all">See all</a>}</div>
        {data.sample && <p className="muted" style={{ fontSize: '.85rem', marginTop: '6px' }}>Sample catalogue: products and prices are placeholders.</p>}
        <form className="shopbar" role="search" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.target).get('q').toString().trim(); window.location.hash = v ? '#/shop?q=' + encodeURIComponent(v) : '#/shop'; }}>
          <label htmlFor="shopq" className="sr-only">Search the shop</label>
          <input id="shopq" name="q" defaultValue={q} placeholder="Search products, e.g. rice, shampoo" />
          <button className="btn" type="submit">Search</button>
        </form>
        {!home && (
          <nav className="chips" aria-label="Categories">
            <a className={'chip' + (catId === 'all' ? ' on' : '')} href="#/shop?cat=all">All</a>
            {categories.map((c) => <a key={c.id} className={'chip' + (cat && cat.id === c.id ? ' on' : '')} href={`#/shop?cat=${c.id}`}>{c.name}</a>)}
          </nav>
        )}
        {body}
      </div>
      {cart.count > 0 && (
        <a className="minicart" href="#/cart"><span>🛒 {cart.count} item{cart.count > 1 ? 's' : ''} · {fmt(cart.subtotal)}</span><b>View cart →</b></a>
      )}
    </section>
  );
}
