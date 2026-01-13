# 🔧 Configuración de Make.com para GuanaGO

Esta guía te ayudará a configurar los escenarios en Make.com para que tu backend funcione completamente.

---

## 📋 Webhooks Necesarios

Necesitas crear **7 escenarios** en Make.com, uno para cada módulo:

1. **Directory** (Directorio)
2. **Services** (Servicios Turísticos)
3. **Reservations** (Reservas)
4. **Users** (Usuarios/Auth)
5. **Chatbot** (Asistente IA)
6. **Taxis** (Taxis)
7. **Payments** (Pagos - Opcional)

---

## 🎯 Escenario 1: Directory (YA CONFIGURADO)

**Webhook URL:** `https://hook.us1.make.com/gleyxf83giw4xqr7i6i94mb7syclmh2o`

### Flujo:
```
Webhook → Router (por action) → Airtable "Directorio SAI"
  ├─ list → Search Records (filtrar por category/search)
  └─ get → Get Record (por placeId)
```

### Request de ejemplo:
```json
{
  "actionID": "GET_DIRECTORY",
  "action": "list",
  "filters": {
    "category": "restaurant",
    "search": "pizza"
  }
}
```

### Response esperada:
```json
{
  "directory": [
    {
      "id": "rec123",
      "name": "Pizza Paradise",
      "category": "restaurant",
      "address": "Av. 20 de Julio",
      "phone": "+57 300 123 4567"
    }
  ],
  "total": 1
}
```

---

## 🎯 Escenario 2: Services (Servicios Turísticos)

### Crear Webhook:
1. Make.com → New Scenario
2. Add "Webhooks" → "Custom webhook"
3. Copia la URL generada
4. Actualiza `.env`: `MAKE_WEBHOOK_SERVICES=URL_COPIADA`

### Flujo:
```
Webhook → Router (por action)
  ├─ list → Airtable: Search "ServiciosTuristicos SAI"
  ├─ get → Airtable: Get Record
  ├─ checkAvailability → 
  │     Airtable: Get Record
  │     Set Variable: available = capacidad_diaria - cupos_ocupados
  ├─ create → Airtable: Create Record
  └─ update → Airtable: Update Record
```

### Actions que debe manejar:

#### 1. List Services
**Request:**
```json
{
  "action": "list",
  "filters": {
    "category": "tour",
    "featured": true
  }
}
```

**Airtable Formula (en Search):**
```
AND(
  {categoria} = "tour",
  {destacado} = 1
)
```

**Response:**
```json
{
  "services": [...],
  "total": 10
}
```

#### 2. Get Service by ID
**Request:**
```json
{
  "action": "get",
  "serviceId": "rec123456"
}
```

**Response:**
```json
{
  "service": {
    "id": "rec123456",
    "name": "Tour Johnny Cay",
    "price": 150000,
    "capacidad_diaria": 20,
    "cupos_ocupados": 5
  }
}
```

#### 3. Check Availability
**Request:**
```json
{
  "action": "checkAvailability",
  "serviceId": "rec123456",
  "date": "2026-02-15",
  "people": 4
}
```

**Make.com Logic:**
```
1. Get Record from Airtable
2. Set variable: disponibles = {{capacidad_diaria}} - {{cupos_ocupados}}
3. Set variable: available = {{disponibles}} >= {{people}}
```

**Response:**
```json
{
  "available": true,
  "cuposDisponibles": 15,
  "message": "Hay cupos disponibles"
}
```

---

## 🎯 Escenario 3: Reservations (Reservas)

### Flujo:
```
Webhook → Router
  ├─ create → 
  │     Airtable: Get Service (verificar disponibilidad)
  │     Airtable: Create Reservation
  │     Airtable: Update Service (sumar cupos_ocupados)
  │     HTTP: Call Hedera (opcional)
  │     Email: Send confirmation
  ├─ getUserReservations → Airtable: Search by userId
  ├─ getPartnerReservations → Airtable: Search by partnerId
  ├─ validate → Airtable: Update status to "validated"
  └─ cancel → Airtable: Update status to "cancelled"
```

### Actions importantes:

#### Create Reservation
**Request:**
```json
{
  "action": "create",
  "serviceId": "rec123",
  "date": "2026-02-15",
  "people": 2,
  "customerInfo": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+57 300 123 4567"
  },
  "paymentMethod": "card"
}
```

**Make.com Steps:**
1. Get service record
2. Verify: `capacidad_diaria - cupos_ocupados >= people`
3. If OK:
   - Create reservation record
   - Update service: `cupos_ocupados = cupos_ocupados + people`
   - Generate QR code
   - Send email confirmation

**Response:**
```json
{
  "reservation": {
    "id": "rec789",
    "serviceId": "rec123",
    "customerName": "Juan Pérez",
    "date": "2026-02-15",
    "people": 2,
    "status": "confirmed",
    "qrCode": "QR123ABC",
    "total": 300000
  },
  "hederaTransactionId": "0.0.123456@1234567890.123"
}
```

---

## 🎯 Escenario 4: Users (Auth)

### Flujo:
```
Webhook → Router
  ├─ login → 
  │     Airtable: Search user by email
  │     Tools: Verify password (bcrypt si usas)
  │     Response: user data
  ├─ register → 
  │     Airtable: Create user
  ├─ getProfile → Airtable: Get user by ID
  └─ updateProfile → Airtable: Update user
```

### Actions:

#### Login
**Request:**
```json
{
  "action": "login",
  "email": "test@example.com",
  "password": "password123"
}
```

**Make.com Logic:**
1. Search in "Usuarios SAI" where email = {{email}}
2. Compare password (si guardas hash, usa bcrypt)
3. If match, return user

**Response:**
```json
{
  "user": {
    "id": "recUSER123",
    "email": "test@example.com",
    "name": "Test User",
    "role": "tourist"
  }
}
```

#### Register
**Request:**
```json
{
  "action": "register",
  "email": "nuevo@example.com",
  "password": "pass123",
  "name": "Nuevo Usuario",
  "phone": "+57 300 555 1234",
  "role": "tourist"
}
```

**Response:**
```json
{
  "user": {
    "id": "recNEW123",
    "email": "nuevo@example.com",
    "name": "Nuevo Usuario",
    "role": "tourist"
  }
}
```

---

## 🎯 Escenario 5: Chatbot

### Flujo:
```
Webhook → Router
  └─ chat → 
        Airtable: Search "Procedimientos RAG" (keywords in message)
        OpenAI/Gemini: Generate response with context
        Response: AI message
```

### Action:

**Request:**
```json
{
  "action": "chat",
  "message": "¿Cuáles son los mejores tours?",
  "context": "tourism"
}
```

**Make.com Logic:**
1. Extract keywords from message
2. Search in "Procedimientos RAG" table
3. Call Gemini/OpenAI with:
   - User message
   - RAG context
   - System prompt
4. Return AI response

**Response:**
```json
{
  "response": "Los tours más populares son...",
  "conversationId": "conv_123",
  "suggestions": [
    "Johnny Cay",
    "Acuario",
    "Hoyo Soplador"
  ]
}
```

---

## 🎯 Escenario 6: Taxis

### Flujo:
```
Webhook → Router
  ├─ getRates → Airtable: Search "Taxis SAI"
  └─ request → Airtable: Create booking
```

### Actions:

#### Get Rates
**Request:**
```json
{
  "action": "getRates",
  "origin": "aeropuerto",
  "destination": "centro",
  "vehicleType": "sedan"
}
```

**Response:**
```json
{
  "rates": [
    {
      "origin": "Aeropuerto",
      "destination": "Centro",
      "price": 15000,
      "vehicleType": "sedan",
      "duration": "15 min"
    }
  ]
}
```

---

## ✅ Checklist de Configuración

- [ ] Crear 7 escenarios en Make.com
- [ ] Copiar URLs de webhooks
- [ ] Actualizar archivo `.env` con todas las URLs
- [ ] Reiniciar servidor: `npm run dev:server`
- [ ] Probar con `api-tester.html`
- [ ] Verificar logs en Make.com
- [ ] Confirmar respuestas correctas

---

## 🧪 Testing

Después de configurar cada webhook:

1. Abre `backend/api-tester.html`
2. Prueba el endpoint correspondiente
3. Revisa los logs en Make.com
4. Verifica la respuesta en el tester

---

## 💡 Tips

- **Naming**: Nombra los escenarios claramente: "GuanaGO - Services", "GuanaGO - Auth", etc.
- **Logging**: Activa el logging en Make.com para debugging
- **Testing**: Usa el "Run once" en Make.com para probar
- **Error Handling**: Agrega módulos de "Error Handler" en Make.com
- **Rate Limits**: Ten en cuenta los límites de Make.com según tu plan

---

## 🆘 Troubleshooting

### Error: Webhook no responde
- Verifica que el escenario esté **ON** en Make.com
- Revisa el historial de ejecuciones en Make.com

### Error: Datos no llegan a Airtable
- Verifica la conexión de Airtable en Make.com
- Revisa que los nombres de campos coincidan

### Error: Response vacía
- Asegúrate de que Make.com esté retornando JSON válido
- Usa el módulo "Webhook Response" al final del flujo

---

## 📚 Recursos

- [Make.com Webhooks](https://www.make.com/en/help/tools/webhooks)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Router Module](https://www.make.com/en/help/tools/flow-control#flow-control-router)
