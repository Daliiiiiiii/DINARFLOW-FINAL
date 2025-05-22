import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import * as p2pController from '../controllers/p2pController.js';

const router = express.Router();

// Profile routes
router.get('/profile/:userId', authenticate, p2pController.getProfile);
router.put('/profile', authenticate, p2pController.updateProfile);

// Offer routes
router.get('/offers', authenticate, p2pController.getOffers);
router.post('/offers', authenticate, p2pController.createOffer);
router.put('/offers/:offerId', authenticate, p2pController.updateOffer);
router.delete('/offers/:offerId', authenticate, p2pController.deleteOffer);

// Order routes
router.get('/orders', authenticate, p2pController.getOrders);
router.post('/orders', authenticate, p2pController.createOrder);
router.put('/orders/:orderId', authenticate, p2pController.updateOrder);

// Review routes
router.get('/reviews/:userId', authenticate, p2pController.getReviews);
router.post('/reviews', authenticate, p2pController.createReview);

const p2pRoutes = router;
export { p2pRoutes as default }; 