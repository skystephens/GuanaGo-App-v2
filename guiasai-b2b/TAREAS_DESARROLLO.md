# 📋 TAREAS DE DESARROLLO - GUIASAI B2B

## 🎯 PROYECTO: GuiaSAI B2B - Sistema de Cotización para Agencias
**Inicio**: 20 Enero 2026  
**Target**: Lanzamiento en ANATO (Mayo 2026)  
**Equipo**: Sky + Desarrolladores (a contratar)

---

## ✅ FASE 1: SETUP INICIAL (Enero 20-31)

### Infraestructura Base
- [x] Crear estructura de carpetas `/guiasai-b2b`
- [x] Configurar `package.json` con dependencias
- [x] Setup Vite + TypeScript + React
- [x] Configurar `vite.config.ts` con base path `/agencias/`
- [x] Crear `tsconfig.json`
- [x] Definir tipos TypeScript (`quotation.ts`)

### Design System
- [x] Crear paleta de colores GuiaSAI (naranja #FF6600 + turquesa #2FA9B8)
- [x] Implementar `guiasai-theme.css`
- [x] Crear componentes base (buttons, inputs, cards, alerts)
- [x] Documentación de identidad visual

### Componentes Iniciales
- [x] `NavigationBar.tsx` - Menú superior con tabs
- [x] `QuotationSummary.tsx` - Resumen de cotización y totales
- [ ] `UserProfileModal.tsx` - Perfil y datos de agencia
- [ ] `ConfirmationStatus.tsx` - Estado de confirmación por aliados
- [ ] `PaymentGateway.tsx` - Pasarela de pago final

**Responsables**: Sky (arquitectura) + Dev Junior (componentes)  
**Estimación**: 5-7 días  

---

## 🔨 FASE 2: MÓDULOS DE COTIZACIÓN (1-14 Febrero)

### Sección de Alojamientos
- [ ] Componente `AccommodationSection.tsx`
  - [ ] Input fechas (Check-in / Check-out)
  - [ ] Selector de huéspedes (1-10)
  - [ ] Filtro tipo de habitación
  - [ ] Búsqueda en tiempo real (conectar API Airtable)
  - [ ] Tarjetas con hoteles disponibles
  - [ ] Botón "Agregar alojamiento" a cotización
  
- [ ] Servicio `accommodationService.ts`
  - [ ] Función `searchHotels()` - Buscar por fechas
  - [ ] Función `getHotelDetails(hotelId)` - Detalles hotel
  - [ ] Función `checkAvailability()` - Verificar disponibilidad

- [ ] Hook `useAccommodations.ts`
  - [ ] Estado de búsqueda
  - [ ] Estado de selección
  - [ ] Manejo de cálculo de precios

**Responsables**: Dev Senior (arquitectura) + Dev Mid (implementación)  
**Estimación**: 5-6 días

### Sección de Tours
- [ ] Componente `ToursSection.tsx`
  - [ ] Catálogo de tours (cards)
  - [ ] Selector de cantidad de personas
  - [ ] Selector de fecha del tour
  - [ ] Checkbox para agregar múltiples tours
  - [ ] Descripción y detalle del tour
  - [ ] Precio por persona visible

- [ ] Servicio `tourService.ts`
  - [ ] Función `getAllTours()` - Listar tours disponibles
  - [ ] Función `getTourDetails(tourId)` - Detalles completos
  - [ ] Función `checkTourAvailability(tourId, date, quantity)` - Disponibilidad

- [ ] Hook `useTours.ts`
  - [ ] Estado de tours seleccionados
  - [ ] Cálculo de total por tour
  - [ ] Validaciones de cantidad

**Responsables**: Dev Mid (senior review)  
**Estimación**: 4-5 días

### Sección de Traslados
- [ ] Componente `TransportsSection.tsx`
  - [ ] Selector tipo traslado (Aeropuerto-Hotel / Hotel-Hotel / Custom)
  - [ ] Inputs origen y destino
  - [ ] Selector tipo vehículo (Minivan, Carro, Lancha)
  - [ ] Cantidad de vehículos y pasajeros
  - [ ] Selector de fecha y hora
  - [ ] Precio cálculo dinámico

- [ ] Servicio `transportService.ts`
  - [ ] Función `getTransportOptions()` - Tipos disponibles
  - [ ] Función `calculateTransportPrice()` - Precio según parámetros
  - [ ] Función `checkTransportAvailability()` - Disponibilidad

- [ ] Hook `useTransports.ts`
  - [ ] Estado de traslados agregados
  - [ ] Validación de cantidad pasajeros vs vehículos

**Responsables**: Dev Mid  
**Estimación**: 4-5 días

**Total Fase 2**: 13-16 días (puede hacerse en paralelo)

---

## 🔗 FASE 3: LÓGICA CENTRAL DE COTIZACIÓN (15-22 Febrero)

### Sistema de Gestión de Cotizaciones
- [ ] Servicio `quotationService.ts`
  - [ ] Función `createQuotation()` - Crear nueva cotización
  - [ ] Función `addAccommodation(quotationId, item)` - Agregar alojamiento
  - [ ] Función `addTour(quotationId, item)` - Agregar tour
  - [ ] Función `addTransport(quotationId, item)` - Agregar traslado
  - [ ] Función `removeItem(quotationId, itemId)` - Eliminar item
  - [ ] Función `updateQuotationTotal()` - Recalcular total
  - [ ] Función `submitQuotation(quotationId)` - Enviar solicitud a aliados
  - [ ] Función `getQuotationHistory(userId)` - Historial

- [ ] Hook `useQuotation.ts`
  - [ ] Estado global de cotización (Context API o Zustand)
  - [ ] Acciones: agregar, eliminar, actualizar
  - [ ] Persistencia en localStorage para borradores

### Sistema de Notificaciones a Aliados
- [ ] Servicio `partnerService.ts`
  - [ ] Función `notifyPartners(quotationId)` - Enviar vía Make/WhatsApp
  - [ ] Función `trackPartnerResponse()` - Monitorear confirmaciones
  - [ ] Función `getSuggestedAlternatives()` - Alternativas si no hay disponibilidad

- [ ] Integración con Make
  - [ ] Webhook para recibir confirmaciones de aliados
  - [ ] Sistema de polling cada 30 segundos para actualizar estado

### Estado de Confirmación en Tiempo Real
- [ ] Componente `ConfirmationStatus.tsx`
  - [ ] Display de estado por servicio (✓ Confirmado / ⏳ Esperando / ✗ No disponible)
  - [ ] Timer para vencimiento de solicitud
  - [ ] Botón para solicitar alternativas
  - [ ] Actualización en tiempo real vía WebSocket o polling

**Responsables**: Dev Senior (arquitectura) + Dev Mid (implementación)  
**Estimación**: 7-8 días

---

## 👤 FASE 4: GESTIÓN DE USUARIO (23 Febrero - 2 Marzo)

### Perfil de Agencia
- [ ] Componente `UserProfileModal.tsx`
  - [ ] Display datos empresa (nombre, NIT, email, teléfono)
  - [ ] Logo de empresa
  - [ ] Historial de cotizaciones
  - [ ] Estadísticas de uso
  - [ ] Configuración de cuenta

- [ ] Servicio `authService.ts`
  - [ ] Función `registerAgency()` - Registro
  - [ ] Función `loginAgency()` - Login
  - [ ] Función `getUserProfile(userId)` - Obtener perfil
  - [ ] Función `updateProfile()` - Editar perfil

- [ ] Componente `HistoryPage.tsx`
  - [ ] Tabla de cotizaciones previas
  - [ ] Filtros por estado, fecha, rango de precio
  - [ ] Botón para duplicar cotización
  - [ ] Detalles de cotización anterior

**Responsables**: Dev Mid + Dev Junior (UI)  
**Estimación**: 5-6 días

---

## 💳 FASE 5: SISTEMA DE PAGOS (3-10 Marzo)

### Integración de Pagos
- [ ] Componente `PaymentGateway.tsx`
  - [ ] Integración SDK Wompi
  - [ ] Integración SDK Stripe
  - [ ] Selector de método (Tarjeta / Transferencia)
  - [ ] Resumen final con breakdown de costos
  - [ ] Términos y condiciones

- [ ] Servicio `paymentService.ts`
  - [ ] Función `initializePayment()` - Iniciar pago en Wompi
  - [ ] Función `handlePaymentCallback()` - Procesar respuesta
  - [ ] Función `generateVoucher()` - Crear voucher con QR
  - [ ] Función `sendConfirmationEmail()` - Email confirmación

- [ ] Generación de Voucher
  - [ ] QR code con info de reserva
  - [ ] PDF descargable
  - [ ] Envío vía email

**Responsables**: Dev Senior (integraciones) + Dev Mid  
**Estimación**: 5-7 días

---

## 🎨 FASE 6: PULIDO Y OPTIMIZACIÓN (11-20 Marzo)

### Testing
- [ ] Tests unitarios de servicios (Jest)
- [ ] Tests de componentes (React Testing Library)
- [ ] Testing e2e de flujo completo (Cypress/Playwright)
- [ ] Testing de performance

### Optimización
- [ ] Lazy loading de componentes
- [ ] Optimización de imágenes
- [ ] Minificación de CSS/JS
- [ ] Caché de datos (Service Workers)

### Responsividad
- [ ] Testing en mobile (iPhone 12 / Samsung S21)
- [ ] Testing en tablet (iPad)
- [ ] Testing en desktop (1920x1080)
- [ ] Ajustes de diseño responsive

### Accesibilidad
- [ ] WCAG 2.1 AA compliance
- [ ] Testing con screen readers
- [ ] Contraste de colores

**Responsables**: QA Lead + Dev Team  
**Estimación**: 8-10 días

---

## 🚀 FASE 7: INTEGRACIÓN WORDPRESS (21-30 Marzo)

### Setup Plugin
- [ ] Crear estructura `/guiasai-agencias/` en WordPress
- [ ] Crear archivo `guiasai-agencias.php` (plugin main)
- [ ] Configurar shortcode `[guiasai_quotation]`
- [ ] Enqueue de scripts y estilos

### Integración Frontend
- [ ] Build de React a carpeta `dist/`
- [ ] Configuración de rutas `/agencias/*`
- [ ] Setup de .htaccess para SPA routing
- [ ] Variables de entorno en WordPress

### Conexión a Backend
- [ ] Variables API en wp-config.php
- [ ] Seguridad: Nonces en llamadas AJAX
- [ ] CORS configuración

### Testing en WordPress
- [ ] Verificar que carga en /agencias
- [ ] Navegar entre tabs sin refrescar
- [ ] Flujo completo de cotización

**Responsables**: Dev Senior (setup) + Dev Mid (testing)  
**Estimación**: 5-7 días

---

## 📱 FASE 8: PREPARACIÓN ANATO (1-30 Abril)

### Demo y Materiales
- [ ] Crear demo data (hoteles, tours, traslados ficticios)
- [ ] Video tutorial de 2-3 min
- [ ] Flyer digital explicando funcionalidades
- [ ] Presentación PowerPoint para stand

### Marketing
- [ ] Banner en guiasanandresislas.com
- [ ] Email campaign a agencias registradas
- [ ] Social media posts (LinkedIn, Instagram)
- [ ] WhatsApp broadcast

### Final Polishing
- [ ] Bug fixes finales
- [ ] Performance optimization
- [ ] Copias de seguridad

### Go-Live
- [ ] Deploy a producción
- [ ] Monitoreo de errors (Sentry/LogRocket)
- [ ] Setup de alertas

**Responsables**: Sky (coordinación) + Full team  
**Estimación**: 30 días (paralelo a otros trabajos)

---

## 📊 ESTIMACIÓN TOTAL

| Fase | Días | Rango |
|------|------|-------|
| 1 - Setup | 5-7 | ✅ Completada |
| 2 - Módulos | 13-16 | Parallelizable |
| 3 - Lógica Central | 7-8 | Bloqueante |
| 4 - Usuario | 5-6 | Independiente |
| 5 - Pagos | 5-7 | Importante |
| 6 - Pulido | 8-10 | QA |
| 7 - WordPress | 5-7 | Integración |
| 8 - ANATO | 30 | Paralelo |
| **TOTAL** | **78-91 días** | **3 meses** |

**Timeline agresivo (con overlap)**: 60-70 días  
**Recomendado (con buffer)**: 90 días  

---

## 👥 EQUIPO NECESARIO

### Para Timeline Agresivo (60-70 días):
- **1x Dev Senior** (Arquitectura + Integraciones)
- **2x Dev Mid** (Componentes + Lógica)
- **1x Dev Junior** (UI + Testing)
- **1x QA** (Testing exhaustivo)
- **Sky** (Coordinación + Decisiones)

**Costo aproximado**: $12M-$15M COP/mes x 2-3 meses

### Para Timeline Relajado (90 días):
- **1x Dev Senior** (Part-time)
- **1x Dev Mid**
- **Sky** (20% dedicación)

**Costo aproximado**: $8M-$10M COP/mes x 3 meses

---

## 🎯 ENTREGABLES POR FASE

### Fase 1 ✅
- Repositorio con estructura base
- Componentes navigationales
- Design system funcional

### Fase 2
- Módulos de búsqueda (Alojamientos, Tours, Traslados)
- Integración API Airtable funcional

### Fase 3
- Sistema de cotización completo
- Notificaciones a aliados en tiempo real

### Fase 4
- Autenticación y perfiles
- Historial de cotizaciones

### Fase 5
- Pasarela de pago funcional
- Vouchers y confirmaciones

### Fase 6
- App completamente testeada
- Optimizada para producción

### Fase 7
- Plugin WordPress instalado
- Integración funcionando en /agencias

### Fase 8
- Lanzamiento en ANATO
- Demo en vivo

---

## ⚠️ RIESGOS Y CONSIDERACIONES

### Riesgos Técnicos
- [ ] Integración Airtable API - **Mitigación**: Crear mock data temprano
- [ ] Real-time updates (WebSocket) - **Mitigación**: Usar polling como fallback
- [ ] Performance en móvil - **Mitigación**: Testing temprano, lazy loading
- [ ] Integración Wompi/Stripe - **Mitigación**: Usar API sandbox desde inicio

### Riesgos de Negocio
- [ ] Confirmación de aliados en 2h - **Mitigación**: Sistema de push/SMS como respaldo
- [ ] Cambios de scope último minuto - **Mitigación**: Feature flagging modulada
- [ ] Disponibilidad de aliados para testing - **Mitigación**: Mock data de partners

### Dependencias Externas
- [ ] Make.com APIs estables
- [ ] Wompi SDK actualizado
- [ ] WordPress hosting performance
- [ ] Airtable rate limits

---

## 📅 CRONOGRAMA SUGERIDO

```
Enero:   [Setup ==================] ✅
Febrero: [Módulos ==================][Lógica =========]
Marzo:   [Pagos ======][Pulido ======][WordPress ====]
Abril:   [ANATO PREP ====================] [ANATO 🎉]
```

---

## 💬 CONTACTOS IMPORTANTES

**Sky Stephens** (CEO/CTO)  
- Decisiones arquitectura
- Comunicación con aliados

**Dev Lead** (Por asignar)
- Coordinación técnica
- Code reviews
- QA oversight

**Contact Aliados**
- Validar API Airtable
- Configurar Make webhooks
- Testing con partners reales

---

**Última actualización**: 20 de Enero, 2026  
**Status**: 🟢 Proyecto Iniciado  
**Próxima revisión**: 27 de Enero, 2026
