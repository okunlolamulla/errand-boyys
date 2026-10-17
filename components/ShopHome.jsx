import { useCatalog } from '../hooks/useCatalog';
import CategoryTiles from './CategoryTiles';
import ProductCard from './ProductCard';

// Home page shop sections: Shop by Category and Featured Products.
export default function ShopHome() {
  const { data, error } = useCatalog();
  if (error) return null; // the rest of the home page still works
  if (!data) return <section><div className="wrap"><h2>Shop by Category</h2><p className="muted">Loading the shop…</p></div></section>;
  const cats = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const featured = data.products.filter((p) => p.featured).slice(0, 6);
  return (
    <>
      <section>
        <div className="wrap">
          <div className="sechead"><h2>Shop by Category</h2><a href="#/shop">See all</a></div>
          <CategoryTiles categories={data.categories} products={data.products} folders={data.photo_folders} />
        </div>
      </section>
      <section className="cartband">
        <div className="wrap two">
          <div>
            <h2>Fill your cart, we do the running</h2>
            <p style={{ color: 'var(--mut)', margin: '14px 0 22px', fontSize: '1.1rem', maxWidth: '46ch' }}>Pick what you need from the shop and check out. An agent buys it and brings it to your door.</p>
            <a className="btn sun" href="#/shop">Start shopping</a>
          </div>
          <img src="/assets/img/shop-cart.jpg" alt="A shopping trolley full of groceries" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
        </div>
      </section>
      <section>
        <div className="wrap">
          <div className="sechead"><h2>Featured Products</h2><a href="#/shop?list=featured">View all</a></div>
          <div className="pgrid">{featured.map((p) => <ProductCard key={p.id} p={p} cat={cats[p.cat]} folders={data.photo_folders} />)}</div>
        </div>
      </section>
    </>
  );
}
