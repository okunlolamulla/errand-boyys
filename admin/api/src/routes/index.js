import { Router } from 'express';
import { authenticate, authenticateAllowPending, requireRole } from '../middleware/auth.js';
import { cartLimiter, createLimiter, loginLimiter, trackLimiter } from '../middleware/rateLimit.js';
import { uploadProductImage, uploadProof, uploadRequestPhotos } from '../middleware/upload.js';
import { changePassword, forgotPassword, login, resetPassword } from '../controllers/auth.controller.js';
import { createErrand, trackErrand } from '../controllers/errands.controller.js';
import {
  assignAgent, closeErrand, completeErrand, getErrand, listAgents, listErrands, listPaymentIssues, markPaid, resolvePayment, setQuote,
} from '../controllers/admin.controller.js';
import {
  overview, listOrders, listCustomers, getCustomer, updateCustomer, listServices, updateService, publicServices,
  listPayments, verifyPayment, decideApproval,
} from '../controllers/controlpanel.controller.js';
import {
  catalog, saveCart, listStock, createProduct, updateProduct, deleteProduct, uploadProductPicture,
  listCategories, createCategory, updateCategory, deleteCategory, listCarts, deleteCart, orderItems,
} from '../controllers/stock.controller.js';
import { listMyErrands, updateStatus } from '../controllers/agent.controller.js';

const router = Router();

// Public
router.post('/errands', createLimiter, uploadRequestPhotos, createErrand);
router.get('/errands/track/:errand_id', trackLimiter, trackErrand);
router.post('/auth/login', loginLimiter, login);
router.post('/auth/forgot-password', loginLimiter, forgotPassword);
router.post('/auth/reset-password', loginLimiter, resetPassword);
router.post('/auth/change-password', loginLimiter, authenticateAllowPending, changePassword);
router.get('/services', trackLimiter, publicServices);
router.get('/catalog', cartLimiter, catalog);
router.put('/cart/:cid', cartLimiter, saveCart);

// Admin
const admin = Router();
admin.use(authenticate, requireRole('admin'));
admin.get('/overview', overview);
admin.get('/orders', listOrders);
admin.get('/customers', listCustomers);
admin.get('/customers/:id', getCustomer);
admin.put('/customers/:id', updateCustomer);
admin.get('/services', listServices);
admin.put('/services/:id', updateService);
admin.get('/payments', listPayments);
admin.post('/payments/:id/verify', verifyPayment);
admin.put('/errands/:id/approval', decideApproval);
admin.get('/stock', listStock);
admin.post('/products', createProduct);
admin.post('/products/image', uploadProductImage, uploadProductPicture);
admin.put('/products/:id', updateProduct);
admin.delete('/products/:id', deleteProduct);
admin.get('/categories', listCategories);
admin.post('/categories', createCategory);
admin.put('/categories/:id', updateCategory);
admin.delete('/categories/:id', deleteCategory);
admin.get('/carts', listCarts);
admin.delete('/carts/:id', deleteCart);
admin.get('/errands/:id/items', orderItems);
admin.get('/errands', listErrands);
admin.get('/errands/:id', getErrand);
admin.get('/agents', listAgents);
admin.get('/payments/issues', listPaymentIssues);
admin.put('/payments/:id/resolve', resolvePayment);
admin.put('/errands/:id/quote', setQuote);
admin.put('/errands/:id/assign', assignAgent);
admin.put('/errands/:id/payment', markPaid);
admin.put('/errands/:id/complete', completeErrand);
admin.put('/errands/:id/close', closeErrand);
router.use('/admin', admin);

// Agent
const agent = Router();
agent.use(authenticate, requireRole('agent'));
agent.get('/errands', listMyErrands);
agent.put('/errands/:id/status', uploadProof, updateStatus);
router.use('/agent', agent);

export default router;
