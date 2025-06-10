import express from 'express';
import { getBridgeBalance, processBridge, getBridgeStatus } from '../controllers/bridgeController.js';

const router = express.Router();

// Get bridge balance for an address
router.get('/balance/:address', getBridgeBalance);

// Process a bridge request
router.post('/process', processBridge);

// Get bridge status for an address
router.get('/status/:address', getBridgeStatus);

export default router; 