
import express from 'express';
import * as reservationsController from '../controllers/reservationsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import * as vouchersService from '../services/vouchersService.js';

const router = express.Router();

// ── VOUCHERS — Generador_vouchers (Airtable: appij4vUx7GZEwf5x) ──────────────

// Listar vouchers (admin only, sin middleware de auth para simplificar desde el panel)
router.get('/vouchers', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const vouchers = await vouchersService.getVouchers(limit);
    res.json({ success: true, data: vouchers });
  } catch (err) {
    next(err);
  }
});

// Servicios Civitatis — DEBE ir antes de /vouchers/:id para no ser capturada como id
router.get('/vouchers/civitatis-servicios', async (req, res, next) => {
  try {
    const servicios = await vouchersService.getCivitatisServicios();
    res.json({ success: true, data: servicios });
  } catch (err) {
    next(err);
  }
});

// Obtener un voucher por ID
router.get('/vouchers/:id', async (req, res, next) => {
  try {
    const voucher = await vouchersService.getVoucherById(req.params.id);
    res.json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
});

// Crear voucher
router.post('/vouchers', async (req, res, next) => {
  try {
    const voucher = await vouchersService.createVoucher(req.body);
    res.status(201).json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
});

// Actualizar estado de voucher
router.patch('/vouchers/:id/estado', async (req, res, next) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ success: false, error: 'estado requerido' });
    const voucher = await vouchersService.updateVoucherStatus(req.params.id, estado);
    res.json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
});

// Obtener todas las reservas (admin/chatbot)
router.get('/all', reservationsController.getAllReservations);

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear reserva (turistas)
router.post('/', reservationsController.createReservation);

// Obtener reservas del usuario
router.get('/my-reservations', reservationsController.getUserReservations);

// Cancelar reserva
router.post('/:id/cancel', reservationsController.cancelReservation);

// Rutas para partners
router.get('/partner/reservations', 
  authorizeRole('partner', 'admin'), 
  reservationsController.getPartnerReservations
);

router.post('/validate', 
  authorizeRole('partner', 'admin'), 
  reservationsController.validateReservation
);

// Registrar solicitud/reserva en Airtable (solo admin)
router.post('/sync-to-airtable', 
  authorizeRole('admin'),
  reservationsController.syncToAirtable
);

export default router;
