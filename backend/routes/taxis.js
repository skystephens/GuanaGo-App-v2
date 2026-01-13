import express from 'express';
import * as taxiController from '../controllers/taxiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/rates', taxiController.getTaxiRates);

// Rutas protegidas
router.post('/request', authenticateToken, taxiController.requestTaxi);

export default router;
