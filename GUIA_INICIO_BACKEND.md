# 🎯 GuanaGO Backend - Guía Rápida de Inicio

## ✅ ¡Tu backend está listo!

Has creado exitosamente un backend completo con:
- ✓ Arquitectura modular y profesional
- ✓ Integración con Make.com/Airtable
- ✓ Autenticación JWT
- ✓ 6 módulos principales (Auth, Services, Reservations, Directory, Chatbot, Taxis)
- ✓ Middleware de seguridad y logging
- ✓ Documentación completa

---

## 🚀 Comandos Principales

### 1️⃣ Iniciar el servidor backend
```bash
npm run dev:server
```
El servidor arranca en: **http://localhost:5000**

### 2️⃣ Iniciar frontend + backend simultáneamente
```bash
npm run dev:all
```

### 3️⃣ Construir para producción
```bash
npm run build
npm start
```

---

## 🧪 Probar el Backend

### Opción 1: API Tester Visual
1. Abre en tu navegador: `backend/api-tester.html`
2. Verás una interfaz gráfica para probar todos los endpoints
3. El indicador muestra si el servidor está online/offline

### Opción 2: cURL desde Terminal

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Listar servicios:**
```bash
curl http://localhost:5000/api/services
```

**Chatbot:**
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Hola\"}"
```

---

## 📋 Endpoints Disponibles

### 🔓 Públicos (sin autenticación)
- `GET /api/health` - Estado del servidor
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/services` - Listar servicios
- `GET /api/directory` - Directorio de lugares
- `POST /api/chatbot/message` - Chatbot
- `GET /api/taxis/rates` - Tarifas de taxis

### 🔒 Protegidos (requieren token)
- `GET /api/auth/profile` - Perfil del usuario
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations/my-reservations` - Mis reservas
- `POST /api/taxis/request` - Solicitar taxi

### 👤 Solo Partners/Admins
- `POST /api/services` - Crear servicio
- `GET /api/reservations/partner/reservations` - Reservas del partner
- `POST /api/reservations/validate` - Validar QR

---

## ⚙️ Configuración de Make.com

### Paso 1: Crear Webhooks en Make.com
1. Ve a Make.com
2. Crea un nuevo escenario para cada módulo
3. Agrega un módulo "Webhook"
4. Copia la URL del webhook

### Paso 2: Actualizar .env
Abre el archivo `.env` y actualiza:
```env
MAKE_WEBHOOK_SERVICES=https://hook.us1.make.com/TU_WEBHOOK_AQUI
MAKE_WEBHOOK_RESERVATIONS=https://hook.us1.make.com/TU_WEBHOOK_AQUI
MAKE_WEBHOOK_CHATBOT=https://hook.us1.make.com/TU_WEBHOOK_AQUI
# ... etc
```

### Paso 3: Configurar Escenarios en Make.com

**Ejemplo: Webhook de Servicios**
```
Webhook → Router (por action) → Airtable
  ├─ list → Search Records (Servicios SAI)
  ├─ get → Get Record
  └─ checkAvailability → Formula: Capacidad - Ocupados
```

---

## 🔐 Autenticación JWT

### 1. Login y obtener token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "123", "name": "Test", "role": "tourist" }
}
```

### 2. Usar el token en requests
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📁 Estructura del Backend

```
backend/
├── config.js                    # Configuración central
├── routes/                      # Rutas (endpoints)
│   ├── auth.js
│   ├── services.js
│   ├── reservations.js
│   ├── directory.js
│   ├── chatbot.js
│   └── taxis.js
├── controllers/                 # Lógica de negocio
│   ├── authController.js
│   ├── servicesController.js
│   ├── reservationsController.js
│   ├── directoryController.js
│   ├── chatbotController.js
│   └── taxiController.js
├── middleware/                  # Middleware
│   ├── auth.js                 # JWT authentication
│   ├── errorHandler.js         # Manejo de errores
│   └── logger.js               # Logging
├── utils/                       # Utilidades
│   └── helpers.js
├── README.md                    # Documentación completa
└── api-tester.html             # Herramienta de testing
```

---

## 🔄 Flujo de Trabajo

### Para desarrollo:
1. Abre 2 terminales
2. Terminal 1: `npm run dev` (Frontend - Vite)
3. Terminal 2: `npm run dev:server` (Backend - Nodemon)
4. O usa: `npm run dev:all` para ambos

### Para probar APIs:
1. Asegúrate que el servidor esté corriendo
2. Abre `backend/api-tester.html` en el navegador
3. Haz clic en los botones para probar cada endpoint

---

## 🐛 Solución de Problemas

### ❌ Error: "Cannot GET /api/..."
- Verifica que el servidor esté corriendo
- Revisa que la ruta exista en `backend/routes/`

### ❌ Error: "Token inválido"
- Haz login de nuevo para obtener un token fresco
- Verifica que estés enviando el header correcto: `Authorization: Bearer TOKEN`

### ❌ Error: "Make.com respondió con 500"
- Verifica que el webhook en Make.com esté activo
- Revisa los logs en Make.com para ver el error específico

### ❌ Puerto 5000 ocupado
```bash
# Cambiar puerto en .env
PORT=3000
```

---

## 📊 Monitoreo

### Logs en consola
El servidor imprime logs automáticamente:
```
[2026-01-12T10:30:45.123Z] GET /api/services - 200 (45ms)
📡 Enviando a Make.com [GET_SERVICES]: ...
✅ Respuesta de Make.com [GET_SERVICES]: ...
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

---

## 🚢 Deploy a Producción

### Render.com
1. Conecta tu repositorio
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Agrega variables de entorno desde `.env`

### Variables de entorno requeridas:
- `PORT` (lo asigna Render automáticamente)
- `NODE_ENV=production`
- `JWT_SECRET` (genera uno seguro)
- Todos los `MAKE_WEBHOOK_*`

---

## 📚 Próximos Pasos

1. **Configurar Make.com**: Crea los webhooks y actualiza `.env`
2. **Conectar Frontend**: Actualiza `services/api.ts` para usar los nuevos endpoints
3. **Testing**: Usa `api-tester.html` para verificar cada endpoint
4. **Hedera**: Configura las credenciales de blockchain si lo necesitas
5. **Deploy**: Sube a Render cuando estés listo

---

## 💡 Tips

- **Nodemon**: El servidor se reinicia automáticamente al guardar cambios
- **API Tester**: Mantén `api-tester.html` abierto mientras desarrollas
- **Logs**: Revisa la consola para debugging
- **CORS**: Ya está configurado para permitir requests desde cualquier origen en desarrollo

---

## 🎉 ¡Listo!

Tu backend está completamente funcional y listo para conectarse con Make.com/Airtable.

**¿Necesitas ayuda?** Revisa:
- `backend/README.md` - Documentación completa de API
- `backend/api-tester.html` - Tester visual
- Console logs del servidor

**Siguiente paso recomendado:**
```bash
npm run dev:server
```
Luego abre `backend/api-tester.html` en tu navegador y comienza a probar! 🚀
