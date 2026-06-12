import express from 'express';
import * as directoryController from '../controllers/directoryController.js';

const router = express.Router();

// orden importa: /categories y /slug antes de /:id
router.get('/categories', directoryController.getCategories);
router.get('/slug/:slug', directoryController.getPlaceBySlug);
router.get('/',           directoryController.getDirectory);
router.post('/',          directoryController.createPlace);
router.get('/:id',        directoryController.getPlaceById);
router.patch('/:id',      directoryController.updatePlace);

export default router;
