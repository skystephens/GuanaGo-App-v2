import express from 'express';
import { validateAdminPin } from '../services/adminService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({ success: false, error: 'PIN requerido' });
    }

    const user = await validateAdminPin(pin);
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: 'PIN inválido' });
    }
  } catch (err) {
    console.error('❌ Error en validación de PIN:', err);
    res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});

export default router;
