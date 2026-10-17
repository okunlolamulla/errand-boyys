import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import RequestPage from './pages/Request';
import VerifyPage from './pages/Verify';
import Live from './pages/Live';
import Track from './pages/Track';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Paid from './pages/Paid';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Refunds from './pages/legal/Refunds';
import Compliance from './pages/legal/Compliance';

// address after the # -> page
export default {
  '/': Home, '/services': Services, '/service': ServiceDetail, '/request': RequestPage, '/verify': VerifyPage,
  '/live': Live, '/shop': Shop, '/cart': Cart, '/track': Track, '/checkout': Checkout, '/paid': Paid, '/about': About, '/contact': Contact,
  '/terms': Terms, '/privacy': Privacy, '/refunds': Refunds, '/compliance': Compliance,
};
