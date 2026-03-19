import express from 'express';

const router = express.Router();

/**
 * @route   GET /api/quotations
 * @desc    Obtener todas las cotizaciones
 * @access  Admin
 */
router.get('/', async (req, res) => {
  try {
    const { status, agencyId, dateFrom, dateTo } = req.query;
    
    // Aquí integrarías con Airtable para obtener las cotizaciones
    // Por ahora devolvemos datos mock
    const quotations = [
      {
        id: 'QT-20260121-0001',
        agencyName: 'Agencia Caribe Tours',
        agencyEmail: 'contacto@caribetours.com',
        createdAt: '2026-01-21T10:30:00Z',
        status: 'pending', // pending, confirmed, cancelled
        total: 3600000,
        items: {
          accommodations: 2,
          tours: 1,
          transports: 1
        }
      }
    ];
    
    res.json({
      success: true,
      data: quotations,
      count: quotations.length
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotizaciones'
    });
  }
});

/**
 * @route   GET /api/quotations/:id
 * @desc    Obtener detalle de una cotización
 * @access  Admin
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - integrar con Airtable
    const quotation = {
      id: id,
      agencyName: 'Agencia Caribe Tours',
      agencyEmail: 'contacto@caribetours.com',
      agencyPhone: '+57 300 123 4567',
      createdAt: '2026-01-21T10:30:00Z',
      status: 'pending',
      total: 3600000,
      accommodations: [
        {
          id: '1',
          hotelId: 'h1',
          hotelName: 'Hotel Las Palmeras',
          roomType: 'doble',
          checkIn: '2026-02-15',
          checkOut: '2026-02-18',
          nights: 3,
          quantity: 2,
          pricePerNight: 500000,
          total: 3000000,
          partnerConfirmed: false,
          partnerResponse: null
        }
      ],
      tours: [
        {
          id: '2',
          tourId: 't1',
          tourName: 'Vuelta a la Isla Cultural',
          date: '2026-02-16',
          duration: '8 horas',
          quantity: 4,
          pricePerPerson: 150000,
          total: 600000,
          partnerConfirmed: false,
          partnerResponse: null
        }
      ],
      transports: []
    };
    
    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotización'
    });
  }
});

/**
 * @route   POST /api/quotations
 * @desc    Crear nueva cotización
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const quotationData = req.body;
    
    // Generar ID único
    const quotationId = `QT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    // Aquí enviarías los datos a Airtable y/o Make.com webhook
    console.log('Nueva cotización:', quotationId, quotationData);
    
    // Webhook de Make.com para procesar la cotización
    // await sendToMakeWebhook(quotationData);
    
    res.status(201).json({
      success: true,
      data: {
        id: quotationId,
        status: 'pending',
        message: 'Cotización creada exitosamente. Nuestros aliados la revisarán pronto.'
      }
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cotización'
    });
  }
});

/**
 * @route   PATCH /api/quotations/:id/status
 * @desc    Actualizar estado de cotización
 * @access  Admin
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: confirmed, cancelled, pending
    
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }
    
    // Aquí actualizarías el registro en Airtable
    console.log(`Actualizando cotización ${id} a estado: ${status}`);
    
    res.json({
      success: true,
      data: {
        id,
        status,
        reason,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado'
    });
  }
});

/**
 * @route   PATCH /api/quotations/:id/items/:itemId/confirm
 * @desc    Confirmar un item específico (alojamiento, tour, transporte)
 * @access  Admin or Partner
 */
router.patch('/:id/items/:itemId/confirm', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { confirmed, finalPrice, notes } = req.body;
    
    // Actualizar item en Airtable
    console.log(`Item ${itemId} de cotización ${id}: confirmed=${confirmed}`);
    
    res.json({
      success: true,
      data: {
        quotationId: id,
        itemId,
        confirmed,
        finalPrice,
        notes,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error confirming item:', error);
    res.status(500).json({
      success: false,
      error: 'Error al confirmar item'
    });
  }
});

/**
 * @route   POST /api/quotations/:id/send-email
 * @desc    Enviar cotización por email al cliente
 * @access  Admin
 */
router.post('/:id/send-email', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientEmail, message } = req.body;
    
    // Aquí integrarías con servicio de email (SendGrid, etc.)
    console.log(`Enviando cotización ${id} a ${recipientEmail}`);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar email'
    });
  }
});

export default router;
