import express from 'express';
import * as directoryController from '../controllers/directoryController.js';

const router = express.Router();

// Todas las rutas son públicas
router.get('/', directoryController.getDirectory);
router.get('/:id', directoryController.getPlaceById);

export default router;
