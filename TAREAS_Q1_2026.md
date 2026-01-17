# 📋 Tareas Estructuradas - Q1 2026

> Última actualización: 16 Enero 2026  
> Coordinador: Copilot IA  
> Status General: 🔴 Críticas en progreso

---

## 🎯 TAREAS CRÍTICAS - ESTA SEMANA (16-22 Enero)

### TAREA #001: Crear Rutas Copilot en Backend
- **Prioridad**: 🔴 CRÍTICA
- **Estimación**: 4 horas
- **Dependencias**: Ninguna
- **Descripción**: Crear `/backend/routes/copilot.js` con endpoints:
  - `POST /api/copilot/message` → Procesa mensajes IA
  - `POST /api/copilot/analyze` → Análisis con Gemini
  - `POST /api/copilot/actions` → Ejecuta acciones automáticas

**Checklist:**
- [ ] Crear archivo `backend/routes/copilot.js`
- [ ] Implementar validaciones de entrada
- [ ] Agregar logging
- [ ] Conectar en `server.js` (línea: `app.use('/api/copilot', copilotRoutes)`)
- [ ] Testing con Postman

**Archivo Referencia**: [COPILOT_IA_MAKE.md - PASO 1](COPILOT_IA_MAKE.md#paso-1-crear-endpoint-backend-apicopilotmessage)

---

### TAREA #002: Crear Controlador Groq
- **Prioridad**: 🔴 CRÍTICA
- **Estimación**: 6 horas
- **Dependencias**: TAREA #001
- **Descripción**: Implementar lógica de Groq en `backend/controllers/copilotController.js`

**Tareas Subtarea:**
- [ ] Instalar `npm install groq-sdk` en backend
- [ ] Crear función `sendGroqMessage()`
- [ ] Implementar carga de contexto desde Airtable
- [ ] Crear prompts por tipo de usuario (turista, partner, admin)
- [ ] Función de extracción de acciones
- [ ] Manejo de errores y timeouts

**Archivo Referencia**: [COPILOT_IA_MAKE.md - PASO 2](COPILOT_IA_MAKE.md#paso-2-crear-controlador-groq)

**Variables Necesarias:**
```bash
GROQ_API_KEY=gsk_...  # Obtener en https://console.groq.com
GROQ_MODEL=llama-3.3-70b-versatile
```

---

### TAREA #003: Actualizar Frontend GuanaChatbot
- **Prioridad**: 🔴 CRÍTICA
- **Estimación**: 4 horas
- **Dependencias**: TAREA #001, #002
- **Descripción**: Conectar componente `GuanaChatbot.tsx` con nuevo endpoint

**Checklist:**
- [ ] Agregar función en `services/api.ts`: `chatbotApi.sendCopilotMessage()`
- [ ] Actualizar `handleSendMessage()` en GuanaChatbot.tsx
- [ ] Mostrar modelo usado (Groq/Gemini)
- [ ] Renderizar acciones como botones
- [ ] Indicador de carga mientras espera respuesta
- [ ] Manejo de errores con UI amigable

**Variables Necesarias:**
```bash
VITE_API_URL=https://guana-go-app.onrender.com  # O localhost en dev
```

---

### TAREA #004: Testing Local Copilot
- **Prioridad**: 🔴 CRÍTICA
- **Estimación**: 3 horas
- **Dependencias**: TAREA #001, #002, #003
- **Descripción**: Probar flujo completo en desarrollo

**Escenarios a Probar:**
- [ ] Turista pregunta: "¿Qué tours hay?" → Groq responde con opciones
- [ ] Partner pregunta: "¿Cómo cargo disponibilidad?" → Groq da pasos
- [ ] Admin pregunta: "¿Análisis de tareas?" → (Preparar para Gemini)
- [ ] Probar botones de acción (Reservar, Ir a Panel, etc)
- [ ] Verificar tiempos de respuesta (<2s)
- [ ] Probar con conectividad lenta

**Comandos útiles:**
```bash
# Terminal 1: Backend
cd GuanaGo-App-Enero-main
npm run dev:server

# Terminal 2: Frontend
npm run dev

# Terminal 3: Tests
curl -X POST http://localhost:5000/api/copilot/message \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Qué tours?","contexto":"turista","usuario_id":"c1","tipo_usuario":"turista"}'
```

---

## 🟡 TAREAS ALTAS - ESTA SEMANA (Después de críticas)

### TAREA #005: Instalar y Configurar Groq SDK
- **Prioridad**: 🟡 ALTA
- **Estimación**: 1 hora
- **Status**: Bloqueada por TAREA #002

```bash
npm install groq-sdk
```

**Documentación**: https://github.com/groqai/groq-sdk-js

---

### TAREA #006: Crear Controlador Gemini (Backend)
- **Prioridad**: 🟡 ALTA
- **Estimación**: 6 horas
- **Dependencias**: TAREA #002 (aprovechar estructura)
- **Descripción**: Similar a Groq pero con API de Gemini

**Checklist:**
- [ ] Instalar `npm install @google/generative-ai`
- [ ] Crear función `sendGeminiMessage()`
- [ ] Prompts especializados para partners/admin
- [ ] Análisis más profundos que Groq
- [ ] Manejo de límite de rate (1000 reqs/min)

**Variables Necesarias:**
```bash
GEMINI_API_KEY=AIzaSy...  # Obtener en https://ai.google.dev
GEMINI_MODEL=gemini-2.0-flash
```

---

### TAREA #007: Endpoint `/api/copilot/analyze` para Gemini
- **Prioridad**: 🟡 ALTA
- **Estimación**: 4 horas
- **Dependencias**: TAREA #006
- **Descripción**: Crear endpoint específico para análisis profundos

**Casos de Uso:**
- Análisis de tareas bloqueadas (admin)
- Predicción de esfuerzo en proyectos
- Recomendaciones de optimización

---

## 🟢 TAREAS MEDIANAS - PRÓXIMAS 2 SEMANAS

### TAREA #008: PWA Cache Service Worker (Imágenes Offline)
- **Prioridad**: 🟢 MEDIA/ALTA
- **Estimación**: 6 horas
- **Dependencias**: Ninguna (independiente)
- **Descripción**: Implementar Service Worker para cachear imágenes y funcionalidad offline

**Subtareas:**
- [ ] Crear `public/sw.js` con estrategia cache-first para imágenes
- [ ] Registrar SW en `src/index.tsx`
- [ ] Agregar funciones helper en `services/cacheService.ts`
- [ ] Testing local en modo offline (DevTools)
- [ ] Medir tamaño cache (~20MB esperado)
- [ ] Verificar en todos los navegadores

**Beneficios:**
- ✅ Imágenes 95% más rápidas en cargas subsecuentes
- ✅ Funciona 100% offline
- ✅ Reduce 87% consumo de datos móvil
- ✅ Mejor batería (30% ahorro)

**Archivo Referencia**: [PWA_CACHE_TECNICO.md](PWA_CACHE_TECNICO.md)

**Comandos útiles:**
```bash
# Testing local
npm run dev

# DevTools: Application > Service Workers
# Marcar "Offline" para simular sin internet
```

---

### TAREA #008b: Panel Sincronización - Testing en Render
- **Prioridad**: 🟢 MEDIA
- **Estimación**: 3 horas
- **Dependencias**: Ya está desarrollado, solo testing
- **Descripción**: Verificar AdminBackend panel en producción

**Checklist:**
- [ ] Acceder a https://guana-go-app.onrender.com
- [ ] Login Admin (PIN)
- [ ] Verificar sincronización de tablas Airtable
- [ ] Testing de botón "Sincronizar todas"
- [ ] Verificar logs del servidor
- [ ] Documentar procedimientos

---

### TAREA #009: Integración Make.com - Escenario Análisis Tareas
- **Prioridad**: 🟡 MEDIA
- **Estimación**: 8 horas
- **Dependencias**: TAREA #006, TAREA #007
- **Descripción**: Configurar webhook en Make para análisis automático

**Checklist:**
- [ ] Crear cuenta/workspace en Make.com (si no existe)
- [ ] Crear nuevo escenario "GuanaGO - Análisis IA Tareas"
- [ ] [Webhook] Trigger en Make
- [ ] [Get Airtable Data] Obtener tareas pendientes
- [ ] [Gemini API] Procesar análisis
- [ ] [Update Airtable] Guardar resultados
- [ ] [Notification] Enviar email/alert a admin

**Webhook URL a configurar en Backend:**
```bash
MAKE_WEBHOOK_ANALYSIS=https://hook.make.com/...
```

---

### TAREA #010: Deploy a Render - Testing en Producción
- **Prioridad**: 🟢 MEDIA
- **Estimación**: 3 horas
- **Dependencias**: TAREA #003, #004, #008 (testing local OK)
- **Descripción**: Deploy de cambios copilot + PWA Cache a Render

**Checklist:**
- [ ] Push a GitHub (`git push`)
- [ ] Monitorear build en Render (5-10 min)
- [ ] Verificar logs: `npm start`
- [ ] Testing en producción: https://guana-go-app.onrender.com
- [ ] Modo offline (DevTools)
- [ ] Probar con usuarios piloto
- [ ] Documentar resultados

---

### TAREA #011: Training de Usuarios Piloto
- **Prioridad**: 🟢 MEDIA
- **Estimación**: 4 horas
- **Dependencias**: TAREA #010
- **Descripción**: Documentación y capacitación para usuarios beta

**Entregables:**
- [ ] Video tutorial (2-3 min)
- [ ] Guía escrita PDF
- [ ] Ejemplos de preguntas frecuentes
- [ ] Canal de feedback (formulario/Discord)

---

### TAREA #012: Feedback Loop & Iteración
- **Prioridad**: 🟢 MEDIA
- **Estimación**: 2-4 horas
- **Dependencias**: TAREA #011
- **Descripción**: Recopilar feedback y hacer ajustes

---

## 🔴 TAREAS PENDIENTES - PRÓXIMAS SEMANAS

### TAREA #013: Parámetros Avanzados de Groq
- **Prioridad**: 🔴 ALTA
- **Estimación**: 6 horas
- **Descripción**: Optimizar temperatura, tokens, prompts por contexto

### TAREA #014: Integración Pasarela Pagos (Wompi/ePayco)
- **Prioridad**: 🔴 ALTA
- **Estimación**: 16 horas
- **Descripción**: Procesar pagos reales en checkout

### TAREA #015: Sistema de Notificaciones
- **Prioridad**: 🟡 ALTA
- **Estimación**: 12 horas
- **Descripción**: Emails, SMS, Push notifications

### TAREA #016: Onboarding Artistas RIMM (3-5 Piloto)
- **Prioridad**: 🟡 ALTA
- **Estimación**: 8 horas
- **Descripción**: Crear tablas + registros de artistas

### TAREA #017: Hedera Testnet Setup
- **Prioridad**: 🟡 MEDIA
- **Estimación**: 4 horas
- **Descripción**: Configurar blockchain para NFTs

---

## 📊 Matriz de Dependencias

```
        TAREA #001 (Rutas)
            ↓
        TAREA #002 (Groq Controlador)
            ↓
    ┌───────┼───────────┐
    ↓       ↓           ↓
 TAREA   TAREA      TAREA #008
 #003    #005       (PWA Cache)
    ↓       ↓           ↓
    └───────┼───────────┘
            ↓
        TAREA #004 (Testing)
            ↓
    ┌───────┼────────┐
    ↓       ↓        ↓
 TAREA   TAREA    TAREA
 #006    #007     #008b
    ↓       ↓        ↓
    └───────┼────────┘
            ↓
        TAREA #009 (Make.com)
            ↓
        TAREA #010 (Deploy)
            ↓
        TAREA #011 (Training)
            ↓
        TAREA #012 (Feedback)
```

---

## 📈 Timeline Estimado

```
SEMANA 1 (Esta semana):
├─ TAREA #001: Copilot Routes (2h)
├─ TAREA #002: Groq Controlador (4h)
├─ TAREA #003: Frontend GuanaChatbot (2h)
├─ TAREA #004: Testing Local (1h)
└─ TAREA #005: Groq SDK (1h)

SEMANA 2 (Próxima semana):
├─ TAREA #006: Gemini Controlador (6h)
├─ TAREA #007: Analyze Endpoint (4h)
├─ TAREA #008: PWA Cache Service Worker (6h)
└─ TAREA #008b: Panel Testing (3h)

SEMANA 3 (22-29 Enero):
├─ TAREA #009: Make.com Escenario (8h)
└─ TAREA #010: Deploy Render (3h)

SEMANA 4 (29+ Enero):
├─ TAREA #011: Training Usuarios (4h)
└─ TAREA #012: Feedback Loop (2-4h)

DESPUÉS (Febrero):
├─ TAREA #013-017 (Features adicionales)
└─ Optimizaciones y features de largo plazo
```

---

## 📞 Documentación Referencias

| Tarea | Documento |
|-------|-----------|
| #001-003 | [COPILOT_IA_MAKE.md](COPILOT_IA_MAKE.md) |
| #004 | [Testing](#testing) |
| #005 | [Groq Docs](https://groq.com) |
| #006-007 | [Gemini Docs](https://ai.google.dev) |
| #008 | [Make Docs](https://make.com/docs) |
| #009 | [ESTADO_PROYECTO_2026.md - Deployment](ESTADO_PROYECTO_2026.md#-deployment) |
| #010 | Wiki/Docs |

---

## ✅ Validación de Completitud

Después de completar cada tarea, marcar:
- ✅ Código escrito y committeado
- ✅ Testing local completado
- ✅ Documentación actualizada
- ✅ Ready para review

**Formato de Commit:**
```bash
git commit -m "feat(copilot): TAREA #XXX - Descripción corta"
```

---

**Mantén este documento actualizado conforme completes tareas. ¡Vamos a crear un copilot increíble! 🚀**
