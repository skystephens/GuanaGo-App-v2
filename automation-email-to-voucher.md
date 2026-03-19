# 🤖 AUTOMATIZACIÓN: EMAIL → VOUCHER AUTOMÁTICO

## OBJETIVO
Convertir emails de reserva en vouchers PDF automáticos sin intervención manual.

---

## PASO 1: PREPARAR AIRTABLE

### Tabla: Reservas

Crear tabla nueva en tu base con estos campos:

```
Campo                  | Tipo           | Descripción
-----------------------|----------------|----------------------------
ID_Reserva            | Formula        | "RES-" & RECORD_ID()
Fecha_Recepción       | Created time   | Auto
Estado                | Single select  | Pendiente|Confirmada|Cancelada
Email_Origen          | Email          | De dónde vino la reserva
Nombre_Cliente        | Single line    | Extraído del email
Email_Cliente         | Email          | Para enviar voucher
Teléfono_Cliente      | Phone          | 
Servicio_Solicitado   | Link           | → Tabla Servicios
Fecha_Servicio        | Date           | Día del tour/checkin
Num_Personas          | Number         | 
Precio_Total          | Currency       | 
Notas_Especiales      | Long text      | Del email del cliente
Voucher_URL           | URL            | Link al PDF generado
Proveedor_Notificado  | Checkbox       | Auto por Make.com
Cliente_Notificado    | Checkbox       | Auto por Make.com
```

---

## PASO 2: CREAR PLANTILLA DE VOUCHER

### Google Docs Template

Crear documento en Google Drive:

```
┌────────────────────────────────────────────┐
│        VOUCHER DE RESERVA - GUIASAI         │
│              San Andrés Islas               │
├────────────────────────────────────────────┤
│                                            │
│ Código Reserva: {{ID_Reserva}}            │
│ Fecha Emisión: {{Fecha_Actual}}           │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ CLIENTE                                    │
│ Nombre: {{Nombre_Cliente}}                │
│ Email: {{Email_Cliente}}                  │
│ Teléfono: {{Teléfono_Cliente}}            │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ SERVICIO RESERVADO                         │
│ {{Nombre_Servicio}}                        │
│ Fecha: {{Fecha_Servicio}}                 │
│ Personas: {{Num_Personas}}                │
│ Precio: ${{Precio_Total}} USD             │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ INSTRUCCIONES                              │
│ - Presentar este voucher el día del tour  │
│ - Llegar 15 minutos antes                 │
│ - Contacto emergencias: +57 300 XXX XXXX  │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ Proveedor: {{Nombre_Proveedor}}           │
│ Ubicación: {{Ubicacion_Punto_Encuentro}}  │
│                                            │
│            [Logo GuiaSAI]                  │
│     www.guiasanandresislas.com            │
└────────────────────────────────────────────┘
```

Guarda este doc y copia su ID:
`https://docs.google.com/document/d/1ABC123XYZ/edit`
                                              ↑
                                         Este ID

---

## PASO 3: CONFIGURAR MAKE.COM

### Scenario 1: Email → Airtable → Voucher

```
MÓDULOS DEL FLUJO:

┌─────────────────────────────────────────┐
│ 1. GMAIL: Watch Emails                  │
│    Folder: INBOX                        │
│    Filter: from:*@* subject:reserva     │
│    Limit: 10                            │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 2. OPENAI: Parse Email Content          │
│    Model: gpt-4o-mini                   │
│    Prompt: "Extrae del siguiente email: │
│     - Nombre del cliente                │
│     - Email del cliente                 │
│     - Teléfono                          │
│     - Servicio solicitado               │
│     - Fecha del servicio                │
│     - Número de personas                │
│                                         │
│     Email: {{1.textPlain}}              │
│                                         │
│     Responde solo en JSON"              │
│    Max tokens: 500                      │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 3. AIRTABLE: Create Record              │
│    Base: GuanaGO_ProjectHub             │
│    Table: Reservas                      │
│    Fields:                              │
│     - Email_Origen: {{1.from}}          │
│     - Nombre_Cliente: {{2.nombre}}      │
│     - Email_Cliente: {{2.email}}        │
│     - Teléfono_Cliente: {{2.telefono}}  │
│     - Servicio_Solicitado: {{2.servicio}}│
│     - Fecha_Servicio: {{2.fecha}}       │
│     - Num_Personas: {{2.personas}}      │
│     - Estado: Pendiente                 │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 4. AIRTABLE: Search Records             │
│    Table: Servicios                     │
│    Filter: Nombre = {{2.servicio}}      │
│    → Obtiene precio y detalles          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 5. GOOGLE DOCS: Create from Template    │
│    Template ID: 1ABC123XYZ              │
│    Replace:                             │
│     {{ID_Reserva}}: {{3.ID_Reserva}}    │
│     {{Nombre_Cliente}}: {{2.nombre}}    │
│     {{Email_Cliente}}: {{2.email}}      │
│     ... (todos los campos)              │
│    Output: New Google Doc               │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 6. GOOGLE DRIVE: Convert to PDF         │
│    Document: {{5.documentId}}           │
│    Output: PDF file                     │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 7. GMAIL: Send Email                    │
│    To: {{2.email}}                      │
│    Subject: Voucher Confirmado - GuiaSAI│
│    Body: "Adjunto tu voucher..."        │
│    Attachments: {{6.pdf}}               │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 8. TWILIO/WATI: Send WhatsApp           │
│    To: {{proveedor.whatsapp}}           │
│    Message: "Nueva reserva {{3.ID}}"    │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ 9. AIRTABLE: Update Record              │
│    Record: {{3.recordId}}               │
│    Fields:                              │
│     - Voucher_URL: {{6.pdfUrl}}         │
│     - Cliente_Notificado: true          │
│     - Proveedor_Notificado: true        │
└─────────────────────────────────────────┘
```

---

## PASO 4: TESTING

### Email de Prueba

Envía este email a tu cuenta de reservas:

```
Para: reservas@guiasai.com
Asunto: Reserva Tour Acuario

Hola,

Quisiera reservar el Tour Acuario para 4 personas.

Datos:
- Nombre: Juan Pérez
- Email: juan.perez@example.com
- Teléfono: +57 300 123 4567
- Fecha deseada: 15 de Febrero 2026
- Personas: 4 adultos

Quedo atento,
Juan
```

### Verificar que:

1. ✅ Registro creado en Airtable.Reservas
2. ✅ Voucher PDF generado en Google Drive
3. ✅ Email enviado a juan.perez@example.com
4. ✅ WhatsApp enviado al proveedor
5. ✅ Campos actualizados en Airtable

---

## VARIANTE SIMPLIFICADA (Sin OpenAI)

Si quieres ahorrar costos, usa formulario en vez de AI:

### Landing Simple: /reservar

```html
<!-- Formulario embebido en tu sitio -->
<form action="https://hook.make.com/YOUR_WEBHOOK" method="POST">
  <input name="nombre" placeholder="Nombre completo" required>
  <input name="email" type="email" placeholder="Email" required>
  <input name="telefono" placeholder="Teléfono" required>
  
  <select name="servicio" required>
    <option>Tour Acuario + Johnny Cay</option>
    <option>Hoyo Soplador + La Piscinita</option>
    <option>Snorkeling Coral</option>
  </select>
  
  <input name="fecha" type="date" required>
  <input name="personas" type="number" min="1" required>
  
  <textarea name="notas" placeholder="Notas adicionales"></textarea>
  
  <button type="submit">Solicitar Reserva</button>
</form>
```

Make.com recibe el webhook y ejecuta el mismo flujo.

**Ventaja:** Sin OpenAI = gratis total
**Desventaja:** Cliente debe llenar formulario (no email libre)

---

## PASO 5: MANUAL DE ATENCIÓN AL CLIENTE

### Crear en Airtable: Tabla "Knowledge_Base"

```
Campo           | Tipo      | Ejemplo
----------------|-----------|----------------------------------
ID_Articulo     | Auto      | KB-001
Categoría       | Select    | Tour|Hotel|Transporte|General
Pregunta        | Text      | ¿Qué incluye el tour acuario?
Respuesta       | Long text | El tour incluye: transporte...
Tags            | Multi     | acuario, incluye, precio
Idioma          | Select    | ES | EN
Última_Mod      | Date      | Auto
```

### Datos de Ejemplo:

```
KB-001 | Tour | ¿Qué incluye tour acuario? | "Incluye: transporte marítimo, snorkeling, almuerzo típico, guía bilingüe"

KB-002 | Tour | ¿Qué debo llevar? | "Recomendado: protector solar, toalla, cámara acuática, efectivo para propinas"

KB-003 | General | Horarios de atención | "Lun-Vie 8am-6pm, Sab 9am-2pm. WhatsApp 24/7: +57 300..."

KB-004 | Cancelaciones | Política de cancelación | "Hasta 48h antes: reembolso 100%. 24-48h: 50%. Menos de 24h: no reembolsable"
```

### Chatbot Simple con Make.com

```
FLUJO:

WhatsApp del cliente → Make.com
                         ↓
              Buscar en Knowledge_Base
                         ↓
              Respuesta automática
                         ↓
         Si no encuentra → Notifica a humano
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Antes | Después | Ahorro |
|---------|-------|---------|--------|
| Tiempo/reserva | 15 min | 2 min | 87% |
| Errores manuales | 1/10 | 0 | 100% |
| Cliente espera | 2-4 horas | 5 minutos | 95% |
| Costo operativo | $XXX/mes | $10/mes | XX% |

---

## COSTOS TOTALES

- Make.com: $0 (Free tier)
- OpenAI API: ~$0.02/email
- Gmail: $0 (ya tienes)
- Google Drive: $0 (ya tienes)
- Twilio WhatsApp: $0.005/mensaje

**Total: ~$5-10/mes para 100+ reservas**

---

## PRÓXIMOS PASOS

1. ✅ Crear tabla Reservas en Airtable (15 min)
2. ✅ Crear plantilla voucher en Google Docs (30 min)
3. ✅ Setup Make.com scenario (1 hora)
4. ✅ Testing con email real (15 min)
5. ✅ Ajustes y refinamiento (30 min)

**Tiempo total: 2.5 horas**
**Ahorro: 5+ horas/semana para siempre**

---

¿Arrancamos con esto HOY? Es el Quick Win más grande que puedes tener.
