# 📊 RESUMEN EJECUTIVO - GUIASAI B2B
**Documento Estratégico | Proyecto de Cotización B2B para Agencias**

---

## 🎯 VISIÓN EN UNA ORACIÓN

**GuiaSAI B2B es el sistema de cotización diseñado para agencias de viaje, mayoristas y operadores turísticos, permitiendo solicitar simultáneamente alojamientos, tours y traslados de San Andrés con confirmación en tiempo real de socios locales.**

---

## 💡 EL PROBLEMA

### Para Agencias de Viaje
- **Cotizar viajes a San Andrés es tedioso**: Requiere contactar múltiples proveedores manualmente
- **Fragmentación de información**: No existe un portal centralizado con todo en un lugar
- **Lentitud en confirmaciones**: Esperar respuestas de múltiples socios toma horas o días
- **Sin control de disponibilidad**: No hay visibilidad real-time de inventario

### Oportunidad en ANATO 2026
- **500+ agencias nacionales e internacionales** convergen en mayo en Cartagena
- **Necesitan soluciones rápidas** para empacar viajes a destinos colombianos
- **San Andrés no tiene presencia tech** en la industria de mayoristas
- **GuiaSAI puede ser el "oficial" OTA para agencias**

---

## ✨ LA SOLUCIÓN: GUIASAI B2B

### Propuesta de Valor

| Para Agencias | Para Aliados (Proveedores) |
|---------------|---------------------------|
| Cotizar en 5 minutos (vs 1+ hora) | Recibir solicitudes verificadas |
| Precio competitivo (+25-30% vs otras OTAs) | Aceptar/rechazar en dashboard |
| Confirmación en 2 horas máximo | Control total de disponibilidad |
| Dashboard de historial | Margen justo (comisiones bajas) |
| Acceso a 500+ proveedores validados | Visibilidad de demanda futura |

### Cómo Funciona

```
1. Agencia accede a /agencias
   ↓
2. Completa 3 secciones:
   - 🏨 Alojamientos (fechas, huéspedes)
   - 🎫 Tours (actividades, personas)
   - 🚕 Traslados (origen, destino, vehículo)
   ↓
3. Sistema calcula total y muestra resumen
   ↓
4. Agencia confirma solicitud
   ↓
5. Aliados reciben notificación (WhatsApp/Email)
   ↓
6. Confirman disponibilidad en sus dashboards
   ↓
7. Cotización se actualiza en tiempo real
   ↓
8. Una vez todo confirmado → Habilitar pago
```

---

## 📈 OPORTUNIDAD COMERCIAL

### Mercado
- **200,000+ turistas/año** en San Andrés
- **Agencias venden 60-70% de viajes** a Colombia
- **Comisión típica**: 15-30% del total viaje
- **Viaje promedio a San Andrés**: $2-5M COP/persona

### Modelo de Ingresos (GuiaSAI B2B)

**Opción 1: Por Comisión**
- Agencia cotiza → Se vende → GuiaSAI retiene 15% del total
- Ejemplo: Viaje $3M → GuiaSAI gana $450k

**Opción 2: Por Suscripción**
- Agencia Básica: $500k/mes → 20 cotizaciones/mes
- Agencia Pro: $1.2M/mes → Cotizaciones ilimitadas

**Opción 3: Híbrido** (Recomendado)
- Suscripción: $500k-1.2M/mes (depende de plan)
- Comisión reducida: 10-12% por venta (vs 15%)

### Proyección de Ingresos

| Métrica | Q2 2026 | Q3 2026 | Q4 2026 |
|---------|---------|---------|---------|
| Agencias registradas | 5 | 25 | 60 |
| Cotizaciones/mes | 50 | 200 | 500 |
| Viajes completados | 10 | 60 | 150 |
| Valor promedio viaje | $3M | $3M | $3.5M |
| **Ingresos Comisiones** | $4.5M | $36M | $105M |
| **Ingresos Suscripciones** | $2.5M | $15M | $40M |
| **TOTAL** | **$7M** | **$51M** | **$145M** |

*(Proyecciones conservadoras; upside potencial 2-3x)*

---

## 🎯 DIFERENCIACIÓN VS COMPETENCIA

### vs Civitatis, GetYourGuide
```
Ellos:     Comisiones 20-30%, impersonal, interfaz genérica
GuiaSAI:   Comisiones 10-15%, relación directa, especializado en San Andrés
```

### vs Booking.com, Expedia
```
Ellos:     Plataformas masivas, muy competencia de precio
GuiaSAI:   Nicho B2B, socios valorizados, márgenes sostenibles
```

### vs Ningún competidor en Colombia
```
✓ Primera plataforma B2B de cotización para San Andrés
✓ Integración directa con proveedores locales
✓ Confirmación en tiempo real
✓ Precio justo para toda la cadena
```

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Frontend**: React 19 + TypeScript (PWA)
- **Backend**: Node.js + Express (existente)
- **Base Datos**: Airtable → PostgreSQL (escalamiento)
- **Pagos**: Wompi + Stripe
- **Notificaciones**: Make.com + WhatsApp API
- **Deployment**: WordPress plugin en /agencias

### Flujo de Datos
```
Agencia (React PWA)
    ↓
Backend Node.js
    ├→ Airtable (inventario de aliados)
    ├→ Make.com (orquestación de notificaciones)
    ├→ WhatsApp API (alertas a socios)
    ├→ Wompi (procesamiento pagos)
    └→ PostgreSQL (historial cotizaciones)
```

---

## 📅 ROADMAP 2026

### Pre-ANATO (Enero - Abril)
- **Enero**: Setup y componentes base ✅
- **Febrero**: Módulos de cotización funcionales
- **Marzo**: Sistema de pagos + WordPress integration
- **Abril**: Testing, marketing, preparación demo

### ANATO 2026 (Mayo)
- Stand interactivo demostrando sistema
- Captura de leads de agencias
- Cierre de partnerships B2B

### Post-ANATO (Junio - Diciembre)
- Onboarding masivo de agencias
- Optimización basada en feedback
- Expansión a Providencia
- Integración con más aliados

---

## 💰 INVERSIÓN NECESARIA

### Desarrollo (Febrero-Marzo)
- **Equipo**: 1 Dev Senior + 2 Mid + 1 Junior + 1 QA
- **Duración**: 8-10 semanas
- **Costo**: $12-15M COP
- **Entregable**: MVP completo, testeado, en producción

### Marketing & Eventos (Abril-Mayo)
- **Materiales**: Flyers, videos, stand físico
- **ANATO Stand**: Lugar en expo + personal
- **Costo**: $2-3M COP
- **Retorno**: 20+ leads calificas de agencias

### Operations (Junio-Diciembre)
- **Soporte**: 2 personas part-time
- **Infraestructura**: Hosting, dominios, APIs
- **Costo**: $2-3M COP/mes

**Total 2026**: $30-40M COP (inversión total)

---

## 🎬 HITO CLAVE: ANATO MAYO 2026

### Qué Demostraremos
1. **Sistema en vivo**: Agencia cotiza en iPad, ve total en 5 segundos
2. **Confirmación real-time**: Mostramos SMS desde proveedor confirmando
3. **Disponibilidad**: Dashboard de 500+ servicios disponibles en San Andrés
4. **Pagos**: Integración Wompi funcional
5. **Diferenciación**: Énfasis en "socios locales valorizados" vs OTAs extractivas

### Resultado Esperado
- **Contactos calificados**: 30-50 agencias
- **MOUs firmados**: 5-10 agencias para piloto
- **Cobertura media**: Artículos sobre innovación turística en Colombia

---

## 🤝 ESTRUCTURA DE ALIANZAS

### Aliados Locales (Proveedores)
```
Hoteles (10-15 socios)
Tours (20-30 operadores)
Taxis/Lanchas (cooperativa)
Restaurantes (5-10 premium)
```
**Incentivo**: Comisión reducida vs OTAs, acceso a demanda B2B

### Socios Tecnológicos
```
DSHG Sonic (CTO Partner)
Make.com (Orquestación)
Wompi (Pagos)
```

### Socios Estratégicos
```
Gobernación de San Andrés (avalización)
Cámara de Comercio
Tour Operators Federation
```

---

## ✅ FACTORES DE ÉXITO

### Críticos
1. **Confirmación en 2h**: Si falla esto, sistema es inútil
2. **UI/UX simple**: Agencias no son tech-savvy, debe ser intuitivo
3. **Precios competitivos**: Debe vencer OTAs tradicionales
4. **Soporte 24/7**: Agencias no esperan durante horas

### Importantes
1. Integración con sistemas existentes de aliados (iCal, Cloudbeds)
2. Escalabilidad para 1000+ cotizaciones/mes
3. Analytics dashboard para agencias
4. Programas de lealtad/incentivos

### Nice-to-Have
1. App móvil nativa
2. Traducción a idiomas adicionales
3. Integraciones con Amadeus, Sabre
4. IA para sugerencias de itinerarios

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Aliados no confirman en 2h | Media | Alto | SLA claro, penalización |
| Baja adopción agencias | Media | Alto | Demo fuerte en ANATO |
| Problemas técnicos en lanzamiento | Baja | Crítico | Testing exhaustivo |
| Competencia de OTAs grandes | Baja | Medio | Diferenciación clara |
| Costo operativo > ingresos | Baja | Medio | Modelo de precios optimizado |

---

## 🚀 PRÓXIMOS PASOS (Enero 2026)

### Semana 1-2
- ✅ Validar diseño con stakeholders
- ✅ Crear documento técnico detallado (TAREAS_DESARROLLO.md)
- Iniciar contratos de desarrolladores

### Semana 3-4
- Comenzar desarrollo Fase 1 (Setup)
- Reunión con aliados clave (socios)
- Planificación ANATO

### Mes 2-3 (Febrero-Marzo)
- Desarrollo intenso (módulos principales)
- Testing con data real
- Integración WordPress

### Mes 4 (Abril)
- Pulido y marketing
- Preparación de materiales ANATO
- Onboarding de primeras agencias piloto

---

## 📞 DECISION MAKERS Y CONTACTOS

**Sky Stephens** (CEO & CTO)  
- Decisiones finales
- Relación con aliados clave

**Manish / DSHG Sonic** (Potencial CTO Partner)  
- Arquitectura y escalamiento
- Soporte técnico

**Dev Lead** (Por asignar)  
- Ejecución técnica
- QA y deployment

**Marketing Lead** (Por asignar)  
- Campaña pre-ANATO
- Stand y presentación

---

## 🎓 CONCLUSIÓN

GuiaSAI B2B es una **oportunidad de ingresos de 6 cifras** para 2026, aprovechando:
1. **Fragmentación del mercado**: No existe solución B2B para San Andrés
2. **Evento catalítico**: ANATO 2026 es el escenario perfecto
3. **Tech stack existente**: Ya tenemos backend, API, base de datos
4. **Network local**: 500+ proveedores mapeados listos

**Inversión**: $30-40M COP  
**Ingresos proyectados 2026**: $150-200M COP  
**ROI**: 4-6x en el primer año

---

**Status**: 🟢 PROYECTO INICIADO  
**Próxima Reunión**: 27 de Enero, 2026  
**Responsable**: Sky Stephens, CEO  

---

*Documento preparado por: Equipo GuanaGO*  
*Última actualización: 20 de Enero, 2026*
