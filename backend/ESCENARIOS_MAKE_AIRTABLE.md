# Escenarios de Integración Backend ↔ Make.com ↔ Airtable

Este documento describe los principales escenarios implementados en el backend que utilizan Make.com como puente para interactuar con Airtable.

---

## 1. Consulta de Servicios Turísticos
- **Ruta:** `/api/services` (GET)
- **Descripción:** Obtiene la lista de servicios turísticos (tours, hoteles, etc.) desde la tabla `ServiciosTuristicos_SAI` de Airtable.
- **Flujo:**
  1. El backend recibe la solicitud.
  2. Envía un webhook a Make.com (`config.makeWebhooks.services`) con `{ action: 'LIST_SERVICES_REAL', table: 'ServiciosTuristicos_SAI' }`.
  3. Make.com consulta Airtable y responde con los servicios.

---

## 2. Creación y Consulta de Reservas
- **Ruta:** `/api/reservations` (POST), `/api/reservations/all` (GET)
- **Descripción:** Crea una nueva reserva o consulta todas las reservas en la tabla `Reservas` de Airtable.
- **Flujo:**
  1. El backend recibe la solicitud.
  2. Envía los datos a Make.com (`config.makeWebhooks.reservations`).
  3. Make.com crea o consulta la reserva en Airtable y responde al backend.

---

## 3. Login y Gestión de Usuarios
- **Ruta:** `/api/auth/login` (POST)
- **Descripción:** Valida el login de usuario contra la tabla de usuarios en Airtable.
- **Flujo:**
  1. El backend recibe email y password.
  2. Envía los datos a Make.com (`config.makeWebhooks.users`).
  3. Make.com consulta Airtable y responde si el usuario es válido.

---

## 4. Creación/Actualización de Servicios o Productos
- **Ruta:** `/api/services` (POST/PUT)
- **Descripción:** Permite a socios crear o actualizar productos/servicios en Airtable.
- **Flujo:**
  1. El backend recibe los datos del producto.
  2. Envía los datos a Make.com (`config.makeWebhooks.services`).
  3. Make.com crea o actualiza el registro en Airtable.

---

## 5. Registro de Logs de Trazabilidad
- **Descripción:** Cada acción importante (login, reserva, cotización, etc.) se registra en la tabla `Logs_Trazabilidad` de Airtable.
- **Flujo:**
  1. El backend llama a `registrarLogTrazabilidad`.
  2. Envía los datos a Make.com (`config.makeWebhooks.logsTrazabilidad`).
  3. Make.com guarda el log en Airtable.

---

## 6. Cotizaciones Inteligentes (Chatbot)
- **Ruta:** `/api/chatbot/cotizar` (POST)
- **Descripción:** El bot usa IA (Groq) y contexto de servicios desde Airtable para cotizar.
- **Flujo:**
  1. El backend consulta servicios vía Make.com.
  2. Usa los datos para construir el prompt de IA.
  3. Responde al usuario y registra el log.

---

> **Nota:** Todos estos escenarios dependen de los webhooks configurados en `backend/config.js` y de los flujos activos en Make.com.

---

**Actualizado:** 2026-01-15
