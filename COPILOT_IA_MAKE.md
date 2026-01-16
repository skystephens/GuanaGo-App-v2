# 🤖 GuanaGO Copilot - Integración Make.com + Groq/Gemini

> Documento: Guía de implementación del copilot IA  
> Creado: 16 Enero 2026  
> Status: 🔴 **EN DESARROLLO**

---

## 📌 Visión General

Convertir GuanaGO en un **copilot inteligente** para:
- ✅ **Atención al Cliente**: Responder preguntas sobre servicios, horarios, precios
- ✅ **Asistencia a Socios**: Guiar en procesos, resolver dudas operativas
- ✅ **Análisis de Datos**: Generar reportes automáticos desde tareas/reservas
- ✅ **Automatización**: Ejecutar acciones basadas en IA (crear ofertas, notificaciones)

---

## 🔄 Flujo Arquitectónico

```
┌─────────────────────────────────────────────────────────────────┐
│                      APLICACIÓN (Frontend)                       │
│  GuanaChatbot → Mensaje de usuario                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
            ┌──────────────────────────────┐
            │   Backend Express.js          │
            │   /api/copilot/message       │
            │   /api/copilot/analyze       │
            │   /api/copilot/actions       │
            └──────────────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                   │
        ↓                  ↓                   ↓
    ┌─────────┐      ┌──────────┐       ┌──────────┐
    │ Groq    │      │ Gemini   │       │Make.com  │
    │(Gratis) │      │(Pagado)  │       │Webhooks  │
    │70B      │      │Pro       │       │          │
    └─────────┘      └──────────┘       └──────────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
                    ┌──────────────┐
                    │  Airtable    │
                    │  (Contexto)  │
                    └──────────────┘
```

---

## 🎯 Casos de Uso Principales

### 1️⃣ Chatbot Turista (Groq + Contexto Airtable)

**Entrada:**
```json
{
  "usuario_id": "c1",
  "mensaje": "¿Qué tours hay para mañana? ¿Cuál es más económico?",
  "contexto": "turista",
  "idioma": "es"
}
```

**Proceso:**
1. Backend consulta tabla `ServiciosTuristicos_SAI` + `Directorio_Mapa`
2. Agrupa contexto con datos en tiempo real
3. Envía a Groq con prompt específico (turismo)
4. Groq responde con opciones + precios + recomendaciones
5. Frontend muestra respuesta + botones de acción (reservar, más info)

**Salida:**
```json
{
  "respuesta": "Tengo 3 opciones para mañana:\n\n🏝️ Tour Hoyo Soplador (8am, $25k)\nSnorkel en Acuario (2pm, $30k)\nCueva Morgan (4pm, $20k)\n\nRecomiendo el de Acuario por cantidad de peces 🐠",
  "acciones": [
    {"texto": "Reservar Hoyo", "action": "reserve", "serviceId": "srv-001"},
    {"texto": "Ver horarios", "action": "details", "serviceId": "srv-002"}
  ],
  "modelo": "groq",
  "tiempo_respuesta": "1.2s"
}
```

---

### 2️⃣ Asistencia a Partner/Socio (Gemini)

**Entrada:**
```json
{
  "usuario_id": "p1",
  "rol": "partner",
  "mensaje": "¿Cómo cargo disponibilidad de mis tours?",
  "contexto": "partner_ops"
}
```

**Proceso:**
1. Backend identifica rol = partner
2. Consulta `Directorio_Mapa` para obtener servicios del partner
3. Envía a Gemini con prompt especializado (operaciones)
4. Gemini responde con pasos, enlaces, ejemplos
5. Incluye botones para navegar a features

**Salida:**
```json
{
  "respuesta": "Para cargar disponibilidad:\n\n1️⃣ Ve a Panel → Mis Servicios\n2️⃣ Haz click en 'Editar Disponibilidad'\n3️⃣ Selecciona fechas y horarios\n4️⃣ Guarda cambios\n\n¿Necesitas ayuda con algún paso?",
  "acciones": [
    {"texto": "Ir a Panel", "action": "navigate", "route": "PARTNER_DASHBOARD"},
    {"texto": "Ver tutorial", "action": "video", "url": "https://..."}
  ],
  "modelo": "gemini"
}
```

---

### 3️⃣ Análisis Automático (Make.com Webhook)

**Entrada (desde Admin Panel):**
```json
{
  "accion": "analizar_tareas",
  "filtros": {"status": "bloqueado"},
  "tipo_analisis": "predicción_esfuerzo"
}
```

**Flujo:**
1. Admin panel envía webhook a Make.com
2. Make obtiene tareas desde Airtable (tabla custom o API)
3. Prepara datos contextuales
4. Envía a Gemini para análisis profundo
5. Gemini genera reporte con estimaciones
6. Make guarda resultado en Airtable + notifica admin

**Salida:**
```json
{
  "analisis": "Tienes 4 tareas bloqueadas. Las 2 críticas son...",
  "recomendaciones": [
    "Priorizar task-005 (Hedera), liberará 3 dependencias",
    "Task-009 necesita split en subtareas"
  ],
  "estimacion_total": "120 horas",
  "probabilidad_exito": "65% sin cambios de scope"
}
```

---

## 🛠️ Implementación Paso a Paso

### PASO 1: Crear Endpoint Backend `/api/copilot/message`

**Archivo:** `backend/routes/copilot.js`

```javascript
import express from 'express';
import { sendGroqMessage } from '../controllers/copilotController.js';

const router = express.Router();

/**
 * POST /api/copilot/message
 * Input: { mensaje, contexto, usuario_id, tipo_usuario }
 * Output: { respuesta, acciones, modelo, tiempo_respuesta }
 */
router.post('/message', async (req, res) => {
  try {
    const { mensaje, contexto = 'turista', usuario_id, tipo_usuario = 'turista' } = req.body;

    if (!mensaje || !usuario_id) {
      return res.status(400).json({ 
        error: 'mensaje y usuario_id requeridos' 
      });
    }

    // Determinar qué modelo usar
    const modelo = tipo_usuario === 'admin' || tipo_usuario === 'partner' 
      ? 'gemini' 
      : 'groq'; // Turistas usan Groq (más económico)

    const resultado = await sendGroqMessage(mensaje, contexto, usuario_id, tipo_usuario);

    res.json({
      respuesta: resultado.respuesta,
      acciones: resultado.acciones || [],
      modelo: modelo,
      tiempo_respuesta: resultado.tiempo_respuesta || '0ms'
    });

  } catch (error) {
    console.error('❌ Error copilot:', error);
    res.status(500).json({ error: 'Error procesando mensaje' });
  }
});

export default router;
```

**Archivo:** `backend/routes/index.js` (agregar importación)
```javascript
import copilotRoutes from './copilot.js';
app.use('/api/copilot', copilotRoutes);
```

---

### PASO 2: Crear Controlador Groq

**Archivo:** `backend/controllers/copilotController.js`

```javascript
import Groq from 'groq-sdk';
import { airtableService } from '../services/airtableService.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Enviar mensaje a Groq con contexto de Airtable
 */
export async function sendGroqMessage(mensaje, contexto, usuario_id, tipo_usuario) {
  try {
    const inicio = Date.now();

    // 1. OBTENER CONTEXTO DE AIRTABLE (según tipo de usuario)
    let contextoDatos = '';
    
    if (tipo_usuario === 'turista') {
      // Cargar tours y directorio disponibles
      const tours = await airtableService.getServices();
      const directorio = await airtableService.getDirectoryPoints();
      
      contextoDatos = `
SERVICIOS DISPONIBLES (Tours, Hoteles, Paquetes):
${tours.slice(0, 5).map(t => `- ${t.title} ($${t.price}, Rating: ${t.rating}/5)`).join('\n')}

DIRECTORIO (Restaurantes, Hoteles, POIs):
${directorio.slice(0, 5).map(d => `- ${d.nombre} (${d.categoria}): ${d.ubicacion}`).join('\n')}
`;
    } else if (tipo_usuario === 'partner') {
      // Cargar datos del socio específico
      contextoDatos = `
Rol: Partner/Socio Operador
Acceso a: Dashboard, Reservas, Gestión de Disponibilidad, Wallet
Features disponibles: Panel, Reservas, Canje (QR), Caja
`;
    } else if (tipo_usuario === 'admin') {
      // Acceso admin completo
      contextoDatos = `
Rol: Administrador
Acceso: Dashboard Completo, Sincronización Airtable, Finanzas, Gestión de Socios, Panel de Tareas
Puede: Ver todos los datos, modificar configuración, ejecutar reportes
`;
    }

    // 2. CONSTRUIR PROMPT CONTEXTUAL
    const prompts = {
      turista: `Eres GuanaAI, un asistente turístico experto en San Andrés Isla. 
Responde sobre tours, hoteles, actividades y servicios disponibles.
Sé amigable, usa emojis, ofrece opciones con precios.
Si el usuario pregunta por algo fuera del turismo, redirige gentilmente.

CONTEXTO ACTUAL:
${contextoDatos}

Pregunta del usuario: "${mensaje}"

Responde de forma concisa (max 300 caracteres) con emojis.`,

      partner: `Eres GuanaAI, asistente de operaciones para socios turísticos.
Ayuda con procesos del panel, gestión de reservas, disponibilidad y pagos.
Proporciona pasos claros y enlaces útiles.

CONTEXTO:
${contextoDatos}

Pregunta: "${mensaje}"

Responde con pasos numerados si es procedimiento. Max 400 caracteres.`,

      admin: `Eres GuanaAI, asistente administrativo experto en gestión turística.
Ayuda con reportes, análisis, configuración del sistema y tareas operativas.

CONTEXTO:
${contextoDatos}

Pregunta: "${mensaje}"

Responde con análisis detallado si es necesario. Max 500 caracteres.`
    };

    const promptSeleccionado = prompts[tipo_usuario] || prompts['turista'];

    // 3. LLAMAR A GROQ
    const respuesta = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: promptSeleccionado
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0.5
    });

    const textoRespuesta = respuesta.choices[0]?.message?.content || '❌ Sin respuesta';
    const tiempoRespuesta = Date.now() - inicio;

    // 4. EXTRAER ACCIONES (si es turista, agregar botones)
    const acciones = extraerAcciones(textoRespuesta, tipo_usuario);

    return {
      respuesta: textoRespuesta,
      acciones,
      tiempo_respuesta: `${tiempoRespuesta}ms`
    };

  } catch (error) {
    console.error('❌ Error Groq:', error);
    throw error;
  }
}

/**
 * Extraer acciones del contexto (reservas, navegación, etc)
 */
function extraerAcciones(respuesta, tipo_usuario) {
  const acciones = [];

  // Si menciona "Reservar", agregar botón
  if (respuesta.toLowerCase().includes('reservar') || 
      respuesta.toLowerCase().includes('book')) {
    acciones.push({
      texto: '📅 Reservar',
      action: 'reserve',
      color: 'emerald'
    });
  }

  // Si es partner y menciona panel
  if (tipo_usuario === 'partner' && 
      respuesta.toLowerCase().includes('panel')) {
    acciones.push({
      texto: '📊 Ir al Panel',
      action: 'navigate',
      route: 'PARTNER_DASHBOARD',
      color: 'blue'
    });
  }

  // Si es admin y menciona tareas
  if (tipo_usuario === 'admin' && 
      respuesta.toLowerCase().includes('tarea')) {
    acciones.push({
      texto: '✅ Ver Tareas',
      action: 'navigate',
      route: 'ADMIN_TASKS',
      color: 'purple'
    });
  }

  return acciones;
}
```

---

### PASO 3: Actualizar Frontend (GuanaChatbot.tsx)

```typescript
// En services/api.ts, agregar:
export const chatbotApi = {
  async sendCopilotMessage(mensaje: string, contexto: string, tipo_usuario: string) {
    const res = await fetch('/api/copilot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje,
        contexto,
        usuario_id: 'c1', // del auth del usuario
        tipo_usuario
      })
    });
    return res.json();
  }
};

// En GuanaChatbot.tsx:
const handleSendMessage = async () => {
  if (!input.trim()) return;

  const newMessage = { role: 'usuario', content: input };
  setMessages(prev => [...prev, newMessage]);
  setInput('');

  try {
    const response = await chatbotApi.sendCopilotMessage(
      input,
      'turista',
      'turista' // o partner/admin según rol
    );

    setMessages(prev => [...prev, {
      role: 'ia',
      content: response.respuesta,
      acciones: response.acciones,
      modelo: response.modelo
    }]);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🔌 Integración Make.com (Opcional pero Poderosa)

### Escenario 1: Análisis Automático de Tareas

**Trigger:** Webhook desde Admin Panel  
**Acción:** Groq/Gemini analiza tareas bloqueadas  
**Resultado:** Notifica admin con recomendaciones

```
[Webhook] → [Get Airtable Data] → [Gemini API] → [Update Airtable] → [Send Notification]
```

**Webhook JSON esperado:**
```json
{
  "evento": "tareas_analisis",
  "filtros": {"status": "bloqueado"},
  "tipo_analisis": "predicción"
}
```

### Escenario 2: Responder a Preguntas Comunes Automáticamente

**Trigger:** Reserva no confirmada (24h)  
**Acción:** Groq responde automáticamente con detalles  
**Resultado:** Aumento de confirmaciones

```
[Timer/Webhook] → [Get Reservation] → [Groq Email] → [Send Via Make] → [Log Result]
```

---

## 💾 Variables de Entorno Necesarias

### .env (Backend)
```bash
# APIs de IA
GROQ_API_KEY=gsk_...                # https://console.groq.com
GEMINI_API_KEY=AIzaSy...             # https://ai.google.dev
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-2.0-flash

# Make.com (opcional)
MAKE_WEBHOOK_URL=https://hook.make.com/...
MAKE_API_KEY=...                     # Para autenticar webhooks

# Airtable (ya configurado)
AIRTABLE_API_KEY=pat_...
AIRTABLE_BASE_ID=appi...
```

### .env.local (Frontend)
```bash
VITE_GROQ_API_KEY=gsk_...            # Si usas Groq frontend
VITE_GEMINI_API_KEY=AIzaSy...        # Si usas Gemini frontend
```

---

## 📊 Matriz de Decisión: Groq vs Gemini

| Criterio | Groq | Gemini |
|----------|------|--------|
| **Costo** | ✅ Gratis | 💸 ~$0.005/solicitud |
| **Velocidad** | ✅ 0.5-1s | ✅ 0.5-1s |
| **Calidad Turismo** | ✅✅ Excelente | ✅ Muy bueno |
| **Análisis Complejo** | ✅ Bueno | ✅✅ Mejor |
| **Límites** | ⚠️ 30 reqs/minuto | ✅ 1000 reqs/minuto |
| **Recomendación** | **Turistas** | **Admins/Análisis** |

---

## ✅ Checklist de Implementación

- [ ] **PASO 1**: Crear `/backend/routes/copilot.js`
- [ ] **PASO 2**: Crear `/backend/controllers/copilotController.js`
- [ ] **PASO 3**: Instalar dependencia `npm install groq-sdk`
- [ ] **PASO 4**: Configurar variables de entorno (GROQ_API_KEY)
- [ ] **PASO 5**: Actualizar `GuanaChatbot.tsx` con nuevo endpoint
- [ ] **PASO 6**: Testing local en http://localhost:5173
- [ ] **PASO 7**: Deploy a Render
- [ ] **PASO 8**: Testing en producción
- [ ] **PASO 9**: (Opcional) Crear escenarios en Make.com
- [ ] **PASO 10**: Documentar en README

---

## 🧪 Testing

### Curl Command (Backend)
```bash
curl -X POST http://localhost:5000/api/copilot/message \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "¿Qué tours hay?",
    "contexto": "turista",
    "usuario_id": "c1",
    "tipo_usuario": "turista"
  }'
```

### Frontend Component Test
```typescript
// En App.tsx o una página test
<button onClick={async () => {
  const resp = await chatbotApi.sendCopilotMessage(
    '¿Qué hacer en San Andrés?',
    'turista',
    'turista'
  );
  console.log(resp);
}}>
  Test Copilot
</button>
```

---

## 📚 Recursos

| Recurso | Enlace |
|---------|--------|
| **Groq Console** | https://console.groq.com |
| **Groq Docs** | https://groq.com/openrouter |
| **Google Gemini** | https://ai.google.dev |
| **Make.com** | https://make.com/webhooks |
| **SDK Groq JS** | https://github.com/groqai/groq-sdk-python |

---

## 🚀 Próximos Hitos

1. **Semana 1**: Implementar Groq básico (turistas)
2. **Semana 2**: Agregar Gemini (partners/admin)
3. **Semana 3**: Integrar Make.com para análisis
4. **Semana 4**: Training de usuarios, optimizaciones

---

**¡Estamos a punto de transformar GuanaGO en un copilot inteligente! 🤖✨**
