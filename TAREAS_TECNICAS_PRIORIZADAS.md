# 🎯 TAREAS PRIORIZADAS - IMPLEMENTACIÓN TÉCNICA
## Orden de Ejecución para Producto Funcional con Pagos y Seguridad

> **Objetivo**: Guía detallada de implementación paso a paso  
> **Priorización**: Crítico → Alto → Medio  
> **Fecha**: 20 Enero 2026

---

## 🔥 SEMANA ACTUAL (20-26 Enero) - FUNDAMENTOS

### DÍA 1-2: Seguridad Backend Base

#### ✅ TAREA #1: JWT + Refresh Tokens
**Archivos a crear/modificar**:
```
backend/services/jwtService.js (NUEVO)
backend/middleware/auth.js (MODIFICAR)
backend/routes/auth.js (NUEVO)
```

**Pasos**:
```bash
# 1. Instalar dependencias
npm install jsonwebtoken bcryptjs

# 2. Crear jwtService.js
```

**Código base** (`backend/services/jwtService.js`):
```javascript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateTokens = (userId, email, role = 'user') => {
  const accessToken = jwt.sign(
    { userId, email, role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
};
```

**Variables de entorno a agregar** (`.env`):
```env
JWT_ACCESS_SECRET=tu-secret-super-seguro-aqui-cambiar-en-produccion
JWT_REFRESH_SECRET=otro-secret-diferente-para-refresh-tokens
```

**Tiempo estimado**: 3 horas

---

#### ✅ TAREA #2: Rate Limiting

**Archivo a crear**:
```
backend/middleware/rateLimiter.js (NUEVO)
```

**Pasos**:
```bash
npm install express-rate-limit express-slow-down
```

**Código** (`backend/middleware/rateLimiter.js`):
```javascript
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Rate limiter estricto para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general para API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes. Intenta más tarde.',
});

// Slow down para endpoints de búsqueda
export const searchSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 30,
  delayMs: 500,
});
```

**Uso en `server.js`**:
```javascript
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';

// Aplicar a rutas específicas
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);
```

**Tiempo estimado**: 2 horas

---

#### ✅ TAREA #3: Helmet + Seguridad Headers

**Pasos**:
```bash
npm install helmet cors
```

**Modificar `server.js`**:
```javascript
import helmet from 'helmet';
import cors from 'cors';

// Configurar helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com"],
      scriptSrc: ["'self'", "https://api.mapbox.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.mapbox.com", "https://hook.us1.make.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configurado correctamente
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://guanago.com', 'https://www.guanago.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Tiempo estimado**: 1 hora

---

### DÍA 3-4: Encriptación y Passwords

#### ✅ TAREA #4: Servicio de Encriptación

**Archivo a crear**:
```
backend/services/encryptionService.js (NUEVO)
```

**Código**:
```javascript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// Hash de passwords (bcrypt)
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Encriptación AES-256 para datos sensibles (PINs, etc)
export const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedData) => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

**Variables de entorno**:
```env
ENCRYPTION_KEY=genera-esto-con-crypto.randomBytes-32-hex
```

**Generar key segura**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Tiempo estimado**: 2 horas

---

### DÍA 5-6: Sesiones y Cookies Seguras

#### ✅ TAREA #5: Express Session

**Pasos**:
```bash
npm install express-session connect-redis redis
```

**Crear** `backend/config/session.js`:
```javascript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

let redisClient;

// Configurar Redis (opcional, usar memory store en desarrollo)
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(console.error);
}

export const sessionConfig = session({
  store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
  secret: process.env.SESSION_SECRET || 'change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only en prod
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
    sameSite: 'strict',
  },
  name: 'guanago.sid', // Nombre personalizado (no 'connect.sid')
});
```

**En `server.js`**:
```javascript
import { sessionConfig } from './config/session.js';

app.use(sessionConfig);
```

**Variables de entorno**:
```env
SESSION_SECRET=otro-secret-super-largo-para-sesiones
REDIS_URL=redis://localhost:6379 # Opcional
```

**Tiempo estimado**: 3 horas

---

## 🔥 SEMANA 2 (27 Enero - 2 Febrero) - AUTENTICACIÓN

### ✅ TAREA #6: Google Sign-In

**Frontend**: Instalar
```bash
npm install @react-oauth/google
```

**Configurar en** `App.tsx`:
```typescript
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        {/* tu app */}
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
```

**Crear componente** `components/GoogleLoginButton.tsx`:
```typescript
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../services/api';

export function GoogleLoginButton() {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential
      });
      
      // Guardar JWT
      localStorage.setItem('token', response.data.token);
      // Redirigir
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error login Google:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.error('Login falló')}
      useOneTap
    />
  );
}
```

**Backend**: Crear endpoint `backend/routes/auth.js`:
```javascript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    // Buscar o crear usuario en Airtable
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({ email, name, avatar: picture });
    }
    
    // Generar JWT
    const { accessToken, refreshToken } = generateTokens(user.id, email);
    
    res.json({ 
      success: true, 
      token: accessToken,
      user: { email, name, avatar: picture }
    });
  } catch (error) {
    res.status(401).json({ error: 'Token de Google inválido' });
  }
});
```

**Variables de entorno**:
```env
# Frontend (.env.local)
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Backend (.env)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

**Obtener credenciales**:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto nuevo
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Configurar URLs autorizadas

**Tiempo estimado**: 5 horas

---

## 💳 SEMANA 3-4 (3-16 Febrero) - PASARELAS DE PAGO

### ✅ TAREA #7: Integración PayU Latam

**Backend**: Instalar
```bash
npm install crypto
```

**Crear** `backend/services/paymentService.js`:
```javascript
import crypto from 'crypto';
import axios from 'axios';

const PAYU_MERCHANT_ID = process.env.PAYU_MERCHANT_ID;
const PAYU_API_KEY = process.env.PAYU_API_KEY;
const PAYU_ACCOUNT_ID = process.env.PAYU_ACCOUNT_ID;
const PAYU_API_URL = process.env.PAYU_API_URL || 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi';

export const createPayUPayment = async (orderData) => {
  const {
    referenceCode,
    description,
    amount,
    currency = 'COP',
    buyerEmail,
    buyerName,
    buyerPhone,
  } = orderData;

  // Generar firma
  const signature = crypto
    .createHash('md5')
    .update(`${PAYU_API_KEY}~${PAYU_MERCHANT_ID}~${referenceCode}~${amount}~${currency}`)
    .digest('hex');

  const payload = {
    language: 'es',
    command: 'SUBMIT_TRANSACTION',
    merchant: {
      apiKey: PAYU_API_KEY,
      apiLogin: process.env.PAYU_API_LOGIN,
    },
    transaction: {
      order: {
        accountId: PAYU_ACCOUNT_ID,
        referenceCode,
        description,
        language: 'es',
        signature,
        additionalValues: {
          TX_VALUE: {
            value: amount,
            currency,
          },
        },
        buyer: {
          emailAddress: buyerEmail,
          fullName: buyerName,
          contactPhone: buyerPhone,
        },
      },
      type: 'AUTHORIZATION_AND_CAPTURE',
      paymentMethod: 'PSE', // o 'VISA', 'MASTERCARD', etc
      paymentCountry: 'CO',
      ipAddress: '127.0.0.1',
    },
    test: process.env.NODE_ENV !== 'production',
  };

  const response = await axios.post(PAYU_API_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data;
};

export const verifyPayUSignature = (params) => {
  const { merchant_id, reference_sale, value, currency, state_pol } = params;
  const receivedSignature = params.signature;

  const expectedSignature = crypto
    .createHash('md5')
    .update(`${PAYU_API_KEY}~${merchant_id}~${reference_sale}~${value}~${currency}~${state_pol}`)
    .digest('hex');

  return receivedSignature === expectedSignature;
};
```

**Crear rutas** `backend/routes/payments.js`:
```javascript
import express from 'express';
import { createPayUPayment, verifyPayUSignature } from '../services/paymentService.js';

const router = express.Router();

// Crear sesión de pago
router.post('/create', async (req, res) => {
  try {
    const { items, user, total } = req.body;
    
    // Crear orden en Airtable
    const order = await createOrderInAirtable({
      userId: user.id,
      items,
      total,
      status: 'Pendiente',
    });

    // Crear pago en PayU
    const paymentResponse = await createPayUPayment({
      referenceCode: order.id,
      description: `Orden GuanaGO #${order.id}`,
      amount: total,
      buyerEmail: user.email,
      buyerName: user.name,
      buyerPhone: user.phone,
    });

    res.json({
      success: true,
      paymentUrl: paymentResponse.paymentUrl,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Error creando pago:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook de confirmación
router.post('/webhook', async (req, res) => {
  try {
    const params = req.body;
    
    // Verificar firma
    if (!verifyPayUSignature(params)) {
      return res.status(400).json({ error: 'Firma inválida' });
    }

    const { reference_sale, state_pol, value } = params;

    // Actualizar orden en Airtable
    if (state_pol == '4') {
      await updateOrderStatus(reference_sale, 'Aprobado');
      // Enviar email de confirmación
      await sendConfirmationEmail(reference_sale);
    } else if (state_pol == '6') {
      await updateOrderStatus(reference_sale, 'Rechazado');
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(500);
  }
});

export default router;
```

**Variables de entorno**:
```env
PAYU_MERCHANT_ID=tu-merchant-id
PAYU_API_KEY=tu-api-key
PAYU_API_LOGIN=tu-api-login
PAYU_ACCOUNT_ID=tu-account-id
PAYU_API_URL=https://api.payulatam.com/payments-api/4.0/service.cgi
```

**Frontend**: Crear `components/PaymentCheckout.tsx`:
```typescript
export function PaymentCheckout({ cart, user }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/create', {
        items: cart.items,
        user: user,
        total: cart.total,
      });

      // Redirigir a PayU
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      alert('Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Procesando...' : 'Pagar con PayU'}
    </button>
  );
}
```

**Tiempo estimado**: 12 horas

---

## 📊 CHECKLIST DE PROGRESO

### Semana 1 (20-26 Enero)
- [ ] JWT implementado
- [ ] Rate limiting activo
- [ ] Helmet configurado
- [ ] Encriptación funcionando
- [ ] Sesiones seguras

### Semana 2 (27 Enero - 2 Febrero)
- [ ] Google Sign-In funcionando
- [ ] 2FA básico implementado
- [ ] Recuperación de contraseña

### Semana 3-4 (3-16 Febrero)
- [ ] PayU integrado y testeado
- [ ] Stripe configurado
- [ ] Binance Pay investigado

### Semana 5-6 (17 Febrero - 2 Marzo)
- [ ] Panel de transacciones
- [ ] Facturación electrónica con Make.com
- [ ] Testing end-to-end

### Semana 7-12 (3 Marzo - 14 Abril)
- [ ] Compliance legal completo
- [ ] Performance optimizado
- [ ] Beta testing
- [ ] Lanzamiento soft

---

## 🚨 BLOQUEADORES COMUNES Y SOLUCIONES

### Problema: "PayU rechaza todas las transacciones"
**Solución**: 
1. Verificar que estás usando API de producción, no sandbox
2. Comprobar firma MD5
3. Verificar que cuenta esté activa

### Problema: "JWT expira muy rápido"
**Solución**:
- Implementar refresh tokens
- Endpoint `/auth/refresh` que devuelve nuevo accessToken

### Problema: "Airtable límite de API"
**Solución**:
- Implementar caché con Redis
- Batch de actualizaciones cada 5 minutos en lugar de tiempo real

### Problema: "CORS errors en producción"
**Solución**:
```javascript
const corsOptions = {
  origin: ['https://tudominio.com'],
  credentials: true,
};
app.use(cors(corsOptions));
```

---

## 📞 SOPORTE Y RECURSOS

- **PayU Soporte**: soporte@payulatam.com
- **Stripe Soporte**: https://support.stripe.com
- **Stack Overflow**: Buscar por "node.js payment gateway"
- **GitHub Copilot**: Usar para debugging de código

---

**Creado**: 20 Enero 2026  
**Por**: GitHub Copilot + CEO GuanaGO

Para el plan estratégico completo ver: [PLAN_90_DIAS_PAGOS_SEGURIDAD.md](PLAN_90_DIAS_PAGOS_SEGURIDAD.md)
