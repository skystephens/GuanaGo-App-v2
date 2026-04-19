import express from 'express';
import * as directoryController from '../controllers/directoryController.js';

const router = express.Router();

// Rutas públicas — orden importa: /categories antes de /:id
router.get('/categories', directoryController.getCategories);
router.get('/',           directoryController.getDirectory);
router.get('/:id',        directoryController.getPlaceById);

export default router;
