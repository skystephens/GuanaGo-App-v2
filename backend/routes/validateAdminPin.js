const express = require('express');
const router = express.Router();
const { validateAdminPin } = require('../../services/adminService');

router.post('/', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ success: false, error: 'PIN requerido' });
  try {
    const user = await validateAdminPin(pin);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});

module.exports = router;
