import express from 'express';
import { getStructure } from '../controllers/systemController.js';

const router = express.Router();

// Estructura del backend
router.get('/structure', getStructure);

export default router;
