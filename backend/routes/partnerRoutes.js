/**
 * Partner Routes
 */

const express = require('express');
const router = express.Router();

// Mock data para desarrollo
const mockPartners = {
  'rec123abc': {
    id: 'rec123abc',
    businessName: 'Hotel Paraíso',
    contactName: 'Juan Pérez',
    email: 'socio@test.com',
    phone: '+573001234567',
    category: 'Alojamiento',
    commission: 12,
    status: 'active',
    rating: 4.5,
    totalSales: 150,
    createdAt: new Date('2024-01-01').toISOString()
  }
};

const mockProducts = [
  {
    id: 'prod001',
    partnerId: 'rec123abc',
    name: 'Habitación Suite Deluxe',
    price: 200000,
    status: 'active',
    sales: 45,
    revenue: 9000000,
    views: 1200,
    conversionRate: 3.75,
    rating: 4.8
  },
  {
    id: 'prod002',
    partnerId: 'rec123abc',
    name: 'Habitación Estándar',
    price: 120000,
    status: 'active',
    sales: 82,
    revenue: 9840000,
    views: 2000,
    conversionRate: 4.1,
    rating: 4.6
  }
];

const mockSales = [
  {
    id: 'sale001',
    productName: 'Habitación Suite Deluxe',
    customerName: 'María García',
    amount: 200000,
    commission: 24000,
    date: new Date().toISOString(),
    status: 'completed'
  },
  {
    id: 'sale002',
    productName: 'Habitación Estándar',
    customerName: 'Carlos López',
    amount: 120000,
    commission: 14400,
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed'
  }
];

// ==========================================
// AUTENTICACIÓN
// ==========================================

/**
 * POST /api/partners/login
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña requeridos'
    });
  }

  // Mock login
  if (email === 'socio@test.com' && password === 'Test123456!') {
    return res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJlYzEyM2FiYyIsImVtYWlsIjoic29jaW9AdGVzdC5jb20iLCJpYXQiOjE2MDMxMzIwMjB9.test_token',
      partner: mockPartners['rec123abc']
    });
  }

  res.status(401).json({
    success: false,
    message: 'Email o contraseña incorrectos'
  });
});

/**
 * POST /api/partners/register
 */
router.post('/register', (req, res) => {
  const { businessName, contactName, email, phone, password, category } = req.body;

  if (!businessName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Campos requeridos faltantes'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Registro exitoso. Por favor verifica tu email.'
  });
});

// ==========================================
// DASHBOARD
// ==========================================

/**
 * GET /api/partners/:partnerId/dashboard/stats
 */
router.get('/:partnerId/dashboard/stats', (req, res) => {
  const { partnerId } = req.params;
  const { period = 'month' } = req.query;

  res.json({
    totalRevenue: 18840000,
    monthlyRevenue: 18840000,
    revenueChange: 15,
    totalProducts: 2,
    activeProducts: 2,
    pendingProducts: 0,
    totalSales: 127,
    monthlySales: 127,
    salesChange: 22,
    pendingPayouts: 2160000,
    nextPayoutDate: new Date(Date.now() + 604800000).toISOString(),
    avgRating: 4.7,
    totalReviews: 248
  });
});

/**
 * GET /api/partners/:partnerId/sales/recent
 */
router.get('/:partnerId/sales/recent', (req, res) => {
  const { limit = 10 } = req.query;

  res.json(mockSales.slice(0, parseInt(limit)));
});

/**
 * GET /api/partners/:partnerId/products/top
 */
router.get('/:partnerId/products/top', (req, res) => {
  const { limit = 5 } = req.query;

  res.json(mockProducts.slice(0, parseInt(limit)));
});

// ==========================================
// PERFIL
// ==========================================

/**
 * GET /api/partners/:partnerId
 */
router.get('/:partnerId', (req, res) => {
  const { partnerId } = req.params;
  const partner = mockPartners[partnerId];

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: 'Socio no encontrado'
    });
  }

  res.json(partner);
});

/**
 * PUT /api/partners/:partnerId
 */
router.put('/:partnerId', (req, res) => {
  const { partnerId } = req.params;
  const updates = req.body;

  const partner = mockPartners[partnerId];
  if (!partner) {
    return res.status(404).json({
      success: false,
      message: 'Socio no encontrado'
    });
  }

  // Actualizar mock data
  const updatedPartner = { ...partner, ...updates, updated_at: new Date().toISOString() };
  mockPartners[partnerId] = updatedPartner;

  res.json({
    success: true,
    message: 'Perfil actualizado',
    partner: updatedPartner
  });
});

// ==========================================
// PRODUCTOS
// ==========================================

/**
 * GET /api/partners/:partnerId/products
 */
router.get('/:partnerId/products', (req, res) => {
  const products = mockProducts.filter(p => p.partnerId === req.params.partnerId);
  res.json(products);
});

/**
 * POST /api/partners/:partnerId/products
 */
router.post('/:partnerId/products', (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y precio requeridos'
    });
  }

  const newProduct = {
    id: `prod${Date.now()}`,
    partnerId: req.params.partnerId,
    name,
    price,
    category,
    status: 'pending',
    sales: 0,
    revenue: 0,
    views: 0,
    rating: 0
  };

  mockProducts.push(newProduct);

  res.status(201).json({
    success: true,
    message: 'Producto creado',
    product: newProduct
  });
});

// ==========================================
// VENTAS
// ==========================================

/**
 * GET /api/partners/:partnerId/sales
 */
router.get('/:partnerId/sales', (req, res) => {
  const sales = mockSales;
  res.json(sales);
});

// ==========================================
// PAGOS
// ==========================================

/**
 * GET /api/partners/:partnerId/payouts
 */
router.get('/:partnerId/payouts', (req, res) => {
  res.json([
    {
      id: 'payout001',
      amount: 2160000,
      status: 'pending',
      date: new Date().toISOString()
    }
  ]);
});

module.exports = router;
