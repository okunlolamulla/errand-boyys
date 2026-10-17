import { useEffect } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import routes from './routes';
import { CartProvider } from './context/CartContext';

export default function App() {
  const route = useHashRoute();
  const Page = routes[route.path] || routes['/'];
  useEffect(() => { window.scrollTo(0, 0); }, [route.key]);
  return (
    <CartProvider>
      <Header path={route.path} />
      {/* key: a new address (even just a new ?query) starts the page fresh, as before */}
      <main id="app"><Page key={route.key} query={route.query} /></main>
      <Footer />
    </CartProvider>
  );
}
