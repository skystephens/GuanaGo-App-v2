# GuanaGO Backend - Documentación de API

Backend completo para la plataforma GuanaGO con integración Make.com/Airtable.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus webhooks de Make.com
```

### 3. Iniciar servidor

#### Desarrollo (con hot-reload)
```bash
npm run dev:server
```

#### Desarrollo completo (Frontend + Backend)
```bash
npm run dev:all
```

#### Producción
```bash
npm run build
npm start
```

## 📡 Endpoints API

### Health Check
```
GET /api/health
```

### 🔐 Autenticación (`/api/auth`)

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "phone": "+57 300 123 4567"
}
```

#### Perfil (requiere token)
```http
GET /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

### 🏨 Servicios Turísticos (`/api/services`)

#### Listar servicios
```http
GET /api/services?category=tour&featured=true
```

#### Obtener servicio
```http
GET /api/services/:id
```

#### Verificar disponibilidad
```http
POST /api/services/check-availability
Content-Type: application/json

{
  "serviceId": "rec123456",
  "date": "2026-02-15",
  "people": 4
}
```

#### Crear servicio (Partner/Admin)
```http
POST /api/services
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Tour a Playa Spratt Bight",
  "category": "tour",
  "price": 150000,
  "capacidad_diaria": 20
}
```

### 📅 Reservas (`/api/reservations`)

#### Crear reserva
```http
POST /api/reservations
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "serviceId": "rec123456",
  "date": "2026-02-15",
  "people": 2,
  "customerInfo": {
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+57 300 555 1234"
  },
  "paymentMethod": "card"
}
```

#### Mis reservas
```http
GET /api/reservations/my-reservations
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Reservas del partner
```http
GET /api/reservations/partner/reservations?status=confirmed
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Validar QR
```http
POST /api/reservations/validate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "reservationId": "rec789",
  "qrCode": "QR123XYZ"
}
```

### 📍 Directorio (`/api/directory`)

#### Listar lugares
```http
GET /api/directory?category=restaurant&search=pizza
```

#### Obtener lugar
```http
GET /api/directory/:id
```

### 🤖 Chatbot (`/api/chatbot`)

#### Enviar mensaje
```http
POST /api/chatbot/message
Content-Type: application/json

{
  "message": "¿Cuáles son los mejores tours?",
  "context": "tourism",
  "conversationId": "conv_123"
}
```

### 🚕 Taxis (`/api/taxis`)

#### Obtener tarifas
```http
GET /api/taxis/rates?origin=aeropuerto&destination=centro
```

#### Solicitar taxi
```http
POST /api/taxis/request
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "origin": "Hotel Casablanca",
  "destination": "Aeropuerto",
  "vehicleType": "sedan",
  "pickupTime": "2026-02-15T14:00:00Z",
  "passengers": 3
}
```

## 🔒 Autenticación

La mayoría de endpoints requieren un token JWT en el header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Roles disponibles:
- `tourist`: Usuario turista
- `partner`: Operador turístico
- `admin`: Administrador del sistema

## 🏗️ Arquitectura

```
backend/
├── config.js                  # Configuración central
├── routes/                    # Definición de rutas
│   ├── auth.js
│   ├── services.js
│   ├── reservations.js
│   ├── directory.js
│   ├── chatbot.js
│   └── taxis.js
├── controllers/               # Lógica de negocio
│   ├── authController.js
│   ├── servicesController.js
│   ├── reservationsController.js
│   ├── directoryController.js
│   ├── chatbotController.js
│   └── taxiController.js
├── middleware/                # Middleware
│   ├── auth.js               # JWT authentication
│   ├── errorHandler.js       # Error handling
│   └── logger.js             # Request logging
└── utils/                     # Utilidades
    └── helpers.js            # Funciones helper
```

## 🔄 Flujo de Datos

1. **Cliente** → Hace request a `/api/...`
2. **Express** → Middleware de autenticación (si aplica)
3. **Controller** → Valida datos y llama a Make.com
4. **Make.com** → Procesa y consulta Airtable
5. **Response** → Devuelve JSON al cliente

## 🧪 Testing con cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Listar servicios
```bash
curl http://localhost:5000/api/services
```

### Chatbot
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola, necesito información sobre tours"}'
```

## 📝 Notas Importantes

1. **Seguridad**: Cambiar `JWT_SECRET` en producción
2. **Make.com**: Configurar todos los webhooks necesarios
3. **CORS**: Ajustar `CORS_ORIGIN` según necesidad
4. **Logs**: Revisar console para debugging

## 🐛 Solución de Problemas

### Error: "Token no proporcionado"
- Verifica que estés enviando el header `Authorization: Bearer TOKEN`

### Error: "Make.com respondió con status 500"
- Verifica que los webhooks estén correctamente configurados
- Revisa los logs en Make.com

### Puerto ocupado
```bash
# Cambiar puerto en .env
PORT=3000
```

## 🚀 Deploy

Para producción en Render/Railway/Heroku:

1. Asegurar que `.env` está en `.gitignore`
2. Configurar variables de entorno en el dashboard
3. El comando `npm start` iniciará el servidor


## Revisar los archivos .MD para contexto.
debo usar una ia para analizar la tablas de airtable y los flujos de la misma herramienta, que la app apoye para facilitar el uso de la herramienta. tanto b2c como b2b.

debo ver la tabla para usar escenarios de Make, por que aun no estan conectados con la app, y debemos mapear eso en el backend. 