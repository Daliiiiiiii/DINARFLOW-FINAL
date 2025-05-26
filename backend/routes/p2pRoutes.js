import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import * as p2pController from '../controllers/p2pController.js';

const router = express.Router();

// Profile routes
router.get('/profile/:userId', authenticate, p2pController.getProfile);
router.put('/profile', authenticate, p2pController.updateProfile);
router.post('/profile', authenticate, p2pController.createProfile);

// Offer routes
router.get('/offers', authenticate, p2pController.getOffers);
router.post('/offers', authenticate, p2pController.createOffer);
router.put('/offers/:offerId', authenticate, p2pController.updateOffer);
router.delete('/offers/:offerId', authenticate, p2pController.deleteOffer);

// Block/Unblock routes
router.post('/block/:targetUserId', authenticate, p2pController.blockUser);
router.delete('/block/:targetUserId', authenticate, p2pController.unblockUser);

// Report route
router.post('/report/:targetUserId', authenticate, p2pController.reportUser);

// Order routes
router.get('/orders', authenticate, p2pController.getOrders);
router.get('/orders/:orderId', authenticate, p2pController.getOrder);
router.post('/orders', authenticate, p2pController.createOrder);
router.put('/orders/:orderId', authenticate, p2pController.updateOrder);

// Chat routes
router.get('/orders/:orderId/messages', authenticate, p2pController.getOrderMessages);
router.post('/orders/:orderId/messages', authenticate, p2pController.createOrderMessage);

// Review routes
router.get('/reviews/:userId', authenticate, p2pController.getReviews);
router.post('/reviews', authenticate, p2pController.createReview);

const p2pRoutes = router;
export { p2pRoutes as default }; 