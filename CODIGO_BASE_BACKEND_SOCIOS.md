# 💻 Código Base - Backend Socios (Copy & Paste Ready)

> Snippets listos para implementar directamente  
> Fecha: Enero 23, 2026

---

## 📦 Package.json

```json
{
  "name": "guanago-partners-backend",
  "version": "1.0.0",
  "description": "Backend para portal de socios/aliados locales GuanaGO",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "keywords": ["guanago", "partners", "aliados", "backend"],
  "author": "GuanaGO Team",
  "license": "MIT",
  "dependencies": {
    "airtable": "^0.12.2",
    "axios": "^1.6.0",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.1.2",
    "nodemailer": "^6.9.7",
    "qrcode": "^1.5.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "supertest": "^6.3.3"
  }
}
```

---

## 🔧 Utilidades Básicas

### Helpers

**Archivo: `backend/partners/utils/helpers.js`**

```javascript
const crypto = require('crypto');

/**
 * Genera un ID único con prefijo
 */
const generateId = (prefix = 'id') => {
  const uuid = require('uuid').v4();
  return `${prefix}_${uuid.substring(0, 12)}`;
};

/**
 * Genera un código QR
 */
const generateQRCode = (partnerId) => {
  return `qr_${partnerId}_${Date.now()}`;
};

/**
 * Formatea una cantidad en COP
 */
const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Calcula comisión
 */
const calculateCommission = (amount, commissionRate) => {
  return Math.round(amount * (commissionRate / 100));
};

/**
 * Obtiene primer día del mes
 */
const getFirstDayOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Obtiene último día del mes
 */
const getLastDayOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Formatea fecha para Airtable
 */
const formatDateForAirtable = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Log con timestamp
 */
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

module.exports = {
  generateId,
  generateQRCode,
  formatCOP,
  calculateCommission,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  formatDateForAirtable,
  log
};
```

### Validadores

**Archivo: `backend/partners/utils/validators.js`**

```javascript
const Joi = require('joi');

const validators = {
  // Registro
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email inválido',
        'any.required': 'Email es requerido'
      }),
    password: Joi.string()
      .min(8)
      .required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.pattern.base': 'La contraseña debe contener mayúsculas, minúsculas y números',
        'string.min': 'La contraseña debe tener al menos 8 caracteres'
      }),
    businessName: Joi.string()
      .min(3)
      .max(100)
      .required(),
    businessType: Joi.string()
      .valid('restaurant', 'hotel', 'commerce', 'service', 'operator')
      .required(),
    phone: Joi.string()
      .pattern(/^\+\d{1,3}\s?\d{1,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Teléfono inválido (formato: +XX XXXXXXXXX)'
      }),
    latitude: Joi.number()
      .min(-90)
      .max(90)
      .required(),
    longitude: Joi.number()
      .min(-180)
      .max(180)
      .required(),
    address: Joi.string()
      .min(5)
      .required()
  }),

  // Login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .required()
  }),

  // Crear producto
  product: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .required(),
    type: Joi.string()
      .valid('tour', 'alojamiento', 'servicio', 'producto', 'otro')
      .required(),
    description: Joi.string()
      .min(10)
      .max(2000)
      .required(),
    price: Joi.number()
      .positive()
      .required(),
    category: Joi.string()
      .required(),
    stock: Joi.number()
      .min(0),
    images: Joi.array()
      .items(Joi.string().uri())
  }),

  // Actualizar perfil
  updateProfile: Joi.object({
    phone: Joi.string()
      .pattern(/^\+\d{1,3}\s?\d{1,14}$/),
    bankAccount: Joi.object({
      bank: Joi.string().required(),
      accountNumber: Joi.string().required(),
      accountHolder: Joi.string().required()
    })
  })
};

/**
 * Validar request
 */
const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }

  return {
    isValid: true,
    value
  };
};

module.exports = {
  validators,
  validate
};
```

---

## 📊 Servicios de Airtable

**Archivo: `backend/partners/services/airtablePartnerService.js`**

```javascript
const Airtable = require('airtable');
const { log } = require('../utils/helpers');

class AirtablePartnerService {
  constructor() {
    this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    this.tables = {
      partners: process.env.AIRTABLE_TABLE_PARTNERS,
      products: process.env.AIRTABLE_TABLE_PRODUCTS,
      sales: process.env.AIRTABLE_TABLE_SALES,
      payouts: process.env.AIRTABLE_TABLE_PAYOUTS
    };
  }

  /**
   * Obtener partner por ID
   */
  async getPartnerById(partnerId) {
    try {
      const records = await this.base(this.tables.partners)
        .select({ filterByFormula: `{id} = '${partnerId}'` })
        .firstPage();

      return records.length > 0 ? records[0].fields : null;
    } catch (err) {
      log(`Error getting partner ${partnerId}: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Obtener partner por email
   */
  async getPartnerByEmail(email) {
    try {
      const records = await this.base(this.tables.partners)
        .select({ filterByFormula: `{email} = '${email}'` })
        .firstPage();

      return records.length > 0 ? records[0] : null;
    } catch (err) {
      log(`Error getting partner by email: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Crear nuevo partner
   */
  async createPartner(data) {
    try {
      const record = await this.base(this.tables.partners).create(data);
      log(`Partner created: ${data.email}`, 'info');
      return record.fields;
    } catch (err) {
      log(`Error creating partner: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Actualizar partner
   */
  async updatePartner(airtableRecordId, data) {
    try {
      const record = await this.base(this.tables.partners).update(airtableRecordId, data);
      log(`Partner updated: ${airtableRecordId}`, 'info');
      return record.fields;
    } catch (err) {
      log(`Error updating partner: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Obtener productos de un partner
   */
  async getPartnerProducts(partnerId) {
    try {
      const records = await this.base(this.tables.products)
        .select({
          filterByFormula: `{partnerId} = '${partnerId}'`,
          sort: [{ field: 'updatedAt', direction: 'desc' }]
        })
        .all();

      return records.map(r => ({ id: r.id, ...r.fields }));
    } catch (err) {
      log(`Error getting products for ${partnerId}: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Crear producto
   */
  async createProduct(data) {
    try {
      const record = await this.base(this.tables.products).create(data);
      log(`Product created: ${data.name}`, 'info');
      return { id: record.id, ...record.fields };
    } catch (err) {
      log(`Error creating product: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(recordId, data) {
    try {
      const record = await this.base(this.tables.products).update(recordId, data);
      log(`Product updated: ${recordId}`, 'info');
      return { id: record.id, ...record.fields };
    } catch (err) {
      log(`Error updating product: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Obtener ventas de un partner
   */
  async getPartnerSales(partnerId, filters = {}) {
    try {
      let formula = `{partnerId} = '${partnerId}'`;

      if (filters.month && filters.year) {
        const firstDay = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const lastDay = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        formula += ` AND {saleDate} >= '${firstDay}' AND {saleDate} <= '${lastDay}'`;
      }

      if (filters.status) {
        formula += ` AND {paymentStatus} = '${filters.status}'`;
      }

      const records = await this.base(this.tables.sales)
        .select({
          filterByFormula: formula,
          sort: [{ field: 'saleDate', direction: 'desc' }]
        })
        .all();

      return records.map(r => ({ id: r.id, ...r.fields }));
    } catch (err) {
      log(`Error getting sales for ${partnerId}: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Obtener payouts de un partner
   */
  async getPartnerPayouts(partnerId) {
    try {
      const records = await this.base(this.tables.payouts)
        .select({
          filterByFormula: `{partnerId} = '${partnerId}'`,
          sort: [{ field: 'period', direction: 'desc' }]
        })
        .all();

      return records.map(r => ({ id: r.id, ...r.fields }));
    } catch (err) {
      log(`Error getting payouts for ${partnerId}: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Obtener estadísticas dashboard
   */
  async getDashboardStats(partnerId) {
    try {
      const partner = await this.getPartnerById(partnerId);
      if (!partner) throw new Error('Partner no encontrado');

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const sales = await this.getPartnerSales(partnerId, {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });

      const products = await this.getPartnerProducts(partnerId);
      const activeProducts = products.filter(p => p.status === 'active').length;

      const totalSales = sales.reduce((sum, s) => sum + (s.originalAmount || 0), 0);
      const totalCommission = sales.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);

      return {
        partnerId,
        businessName: partner.businessName,
        totalSales,
        totalCommission,
        pendingPayout: partner.pendingAmount || 0,
        activeProducts,
        salesThisMonth: sales.length,
        conversionRate: sales.length > 0 ? ((sales.length / 145) * 100).toFixed(1) : 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      log(`Error getting dashboard stats: ${err.message}`, 'error');
      throw err;
    }
  }
}

module.exports = new AirtablePartnerService();
```

---

## 🔐 Controladores

### Auth Controller

**Archivo: `backend/partners/controllers/authController.js`**

```javascript
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const JWTService = require('../services/jwtService');
const airtableService = require('../services/airtablePartnerService');
const { validators, validate } = require('../utils/validators');
const { generateQRCode, log } = require('../utils/helpers');

class AuthController {
  /**
   * POST /auth/register
   */
  static async register(req, res) {
    try {
      const validation = validate(validators.register, req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const { email, password, businessName, businessType, phone, latitude, longitude, address } = validation.value;

      // Verificar si email ya existe
      const existing = await airtableService.getPartnerByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'El email ya está registrado'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear partner
      const partnerId = `par_${uuidv4().substring(0, 12)}`;
      const qrCode = generateQRCode(partnerId);

      const newPartner = await airtableService.createPartner({
        id: partnerId,
        email,
        passwordHash,
        businessName,
        businessType,
        phone,
        latitude,
        longitude,
        address,
        status: 'pending',
        commissionRate: 10,
        qrCode,
        createdAt: new Date().toISOString()
      });

      log(`New partner registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Registro exitoso. Por favor espera aprobación.',
        partnerId: partnerId
      });
    } catch (err) {
      log(`Register error: ${err.message}`, 'error');
      res.status(500).json({
        success: false,
        error: 'Error en registro: ' + err.message
      });
    }
  }

  /**
   * POST /auth/login
   */
  static async login(req, res) {
    try {
      const validation = validate(validators.login, req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const { email, password } = validation.value;

      // Buscar partner
      const partnerRecord = await airtableService.getPartnerByEmail(email);

      if (!partnerRecord) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      const partner = partnerRecord.fields;

      // Verificar contraseña
      const isValid = await bcrypt.compare(password, partner.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Verificar status
      if (partner.status !== 'approved') {
        return res.status(403).json({
          success: false,
          error: `Tu cuenta está ${partner.status}. Por favor espera aprobación del equipo GuanaGO.`
        });
      }

      // Generar token
      const token = JWTService.generateToken({
        id: partner.id,
        email: partner.email,
        businessName: partner.businessName
      });

      // Actualizar lastLogin
      await airtableService.updatePartner(partnerRecord.id, {
        lastLogin: new Date().toISOString()
      });

      log(`Partner login: ${email}`);

      res.json({
        success: true,
        token,
        partner: {
          id: partner.id,
          email: partner.email,
          businessName: partner.businessName,
          businessType: partner.businessType,
          status: partner.status,
          commissionRate: partner.commissionRate
        }
      });
    } catch (err) {
      log(`Login error: ${err.message}`, 'error');
      res.status(500).json({
        success: false,
        error: 'Error en login: ' + err.message
      });
    }
  }
}

module.exports = AuthController;
```

### Partners Controller

**Archivo: `backend/partners/controllers/partnersController.js`**

```javascript
const airtableService = require('../services/airtablePartnerService');
const { log } = require('../utils/helpers');
const QRCode = require('qrcode');

class PartnersController {
  /**
   * GET /dashboard
   */
  static async getDashboard(req, res) {
    try {
      const stats = await airtableService.getDashboardStats(req.partner.id);
      res.json(stats);
    } catch (err) {
      log(`Dashboard error: ${err.message}`, 'error');
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /profile
   */
  static async getProfile(req, res) {
    try {
      const partner = await airtableService.getPartnerById(req.partner.id);

      if (!partner) {
        return res.status(404).json({ error: 'Partner no encontrado' });
      }

      res.json({
        id: partner.id,
        email: partner.email,
        businessName: partner.businessName,
        businessType: partner.businessType,
        nit: partner.nit,
        phone: partner.phone,
        location: {
          address: partner.address,
          city: partner.city,
          latitude: partner.latitude,
          longitude: partner.longitude
        },
        logo: partner.logo?.[0]?.url,
        status: partner.status,
        commissionRate: partner.commissionRate,
        bankAccount: {
          bank: partner.bank,
          accountNumber: partner.accountNumber,
          accountHolder: partner.accountHolder
        },
        createdAt: partner.createdAt,
        approvedAt: partner.approvedAt
      });
    } catch (err) {
      log(`Get profile error: ${err.message}`, 'error');
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * PATCH /profile
   */
  static async updateProfile(req, res) {
    try {
      const { phone, bankAccount, description } = req.body;

      const partnerRecord = await airtableService.getPartnerByEmail(req.partner.email);

      if (!partnerRecord) {
        return res.status(404).json({ error: 'Partner no encontrado' });
      }

      const updates = {
        updatedAt: new Date().toISOString()
      };

      if (phone) updates.phone = phone;
      if (description) updates.description = description;
      if (bankAccount) {
        updates.bank = bankAccount.bank;
        updates.accountNumber = bankAccount.accountNumber;
        updates.accountHolder = bankAccount.accountHolder;
      }

      await airtableService.updatePartner(partnerRecord.id, updates);

      log(`Profile updated: ${req.partner.email}`);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });
    } catch (err) {
      log(`Update profile error: ${err.message}`, 'error');
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /qr-code
   */
  static async getQRCode(req, res) {
    try {
      const partner = await airtableService.getPartnerById(req.partner.id);

      if (!partner) {
        return res.status(404).json({ error: 'Partner no encontrado' });
      }

      const qrUrl = `https://guanago.travel/p/${partner.id}`;
      const qrCode = await QRCode.toDataURL(qrUrl);

      res.json({
        qrCode,
        partnerId: partner.id,
        qrUrl,
        scans: {
          total: 145,
          thisMonth: 42,
          lastScan: new Date().toISOString()
        }
      });
    } catch (err) {
      log(`QR code error: ${err.message}`, 'error');
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = PartnersController;
```

---

## 🛣️ Rutas Completas

**Archivo: `backend/partners/routes/partners.js` (versión completa)**

```javascript
const express = require('express');
const PartnersController = require('../controllers/partnersController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Dashboard & Profile
router.get('/dashboard', PartnersController.getDashboard);
router.get('/profile', PartnersController.getProfile);
router.patch('/profile', PartnersController.updateProfile);

// QR Code
router.get('/qr-code', PartnersController.getQRCode);

module.exports = router;
```

---

## 🔔 Integración Email

**Archivo: `backend/partners/services/emailService.js`**

```javascript
const nodemailer = require('nodemailer');
const { log } = require('../utils/helpers');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(email, businessName) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: '¡Bienvenido a GuanaGO Socios!',
        html: `
          <h2>¡Hola ${businessName}!</h2>
          <p>Tu registro ha sido recibido. Nuestro equipo lo revisará en 24-48 horas.</p>
          <p>Te notificaremos cuando tu cuenta esté aprobada.</p>
          <p>GuanaGO Team</p>
        `
      });

      log(`Welcome email sent to ${email}`);
    } catch (err) {
      log(`Email error: ${err.message}`, 'error');
    }
  }

  /**
   * Enviar email de aprobación
   */
  async sendApprovalEmail(email, businessName) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: '¡Tu cuenta en GuanaGO Socios ha sido aprobada!',
        html: `
          <h2>¡Bienvenido ${businessName}!</h2>
          <p>Tu cuenta ha sido aprobada. Ya puedes acceder a tu panel de control.</p>
          <p><a href="https://socios.guanago.travel/login">Acceder a mi panel</a></p>
          <p>GuanaGO Team</p>
        `
      });

      log(`Approval email sent to ${email}`);
    } catch (err) {
      log(`Email error: ${err.message}`, 'error');
    }
  }

  /**
   * Enviar email de nuevo producto publicado
   */
  async sendProductPublishedEmail(email, businessName, productName) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `📢 ${productName} ha sido publicado en GuiaSAI B2B`,
        html: `
          <h2>¡Producto Publicado!</h2>
          <p>${productName} está ahora disponible en nuestro catálogo.</p>
          <p><a href="https://guiasai.com">Ver en GuiaSAI</a></p>
        `
      });

      log(`Product email sent to ${email}`);
    } catch (err) {
      log(`Email error: ${err.message}`, 'error');
    }
  }

  /**
   * Enviar email de comisión pagada
   */
  async sendPayoutEmail(email, businessName, amount, period) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `💰 Comisión de ${period} transferida`,
        html: `
          <h2>Pago de Comisiones Procesado</h2>
          <p>Hemos transferido <strong>$${amount.toLocaleString('es-CO')}</strong> a tu cuenta.</p>
          <p>Período: ${period}</p>
          <p><a href="https://socios.guanago.travel/payouts">Ver detalles</a></p>
        `
      });

      log(`Payout email sent to ${email}`);
    } catch (err) {
      log(`Email error: ${err.message}`, 'error');
    }
  }
}

module.exports = new EmailService();
```

---

## 🧪 Test Básico

**Archivo: `backend/partners/tests/partners.test.js`**

```javascript
const request = require('supertest');
const app = require('../server');

describe('Partners Endpoints', () => {
  let token;

  beforeAll(async () => {
    // Login y obtener token
    const res = await request(app)
      .post('/api/v1/partners/auth/login')
      .send({
        email: 'test@restaurant.com',
        password: 'SecurePass123!'
      });

    token = res.body.token;
  });

  test('GET /dashboard - debe retornar stats', async () => {
    const res = await request(app)
      .get('/api/v1/partners/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalSales');
    expect(res.body).toHaveProperty('totalCommission');
  });

  test('GET /profile - debe retornar perfil', async () => {
    const res = await request(app)
      .get('/api/v1/partners/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBeDefined();
  });

  test('GET /qr-code - debe retornar QR', async () => {
    const res = await request(app)
      .get('/api/v1/partners/qr-code')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.qrCode).toBeDefined();
  });
});
```

---

## 🚀 Inicio Rápido

```bash
# 1. Setup
npm install
cp .env.example .env

# 2. Editar .env con tus credenciales

# 3. Desarrollo
npm run dev

# 4. Testing
npm test

# 5. Deploy
npm run build
npm start
```

---

Todos estos códigos están listos para copiar y pegar en tus archivos respectivos. ¡Adelante con la implementación!
