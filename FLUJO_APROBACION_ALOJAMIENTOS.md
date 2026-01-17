# 📋 FLUJO DE APROBACIÓN - Alojamientos

## Overview

Dos tablas en Airtable con control de aprobación:

1. **Alojamientos_Solicitudes** → Formulario para socios (staging/pending)
2. **ServiciosTuristicos_SAI** → Tabla productiva (lo que usa la app)

---

## 🔄 Proceso Paso a Paso

### PASO 1️⃣: Socio Envía Solicitud

- Socio abre **formulario de Alojamientos_Solicitudes**
- Rellena todos los campos: nombre, tipo, precios 1/2/3/4+, amenities, RNT, contacto, plan alimentación, etc.
- Submit → Registro queda en **Estado = "Pendiente"**
- ✅ No toca la tabla productiva (`ServiciosTuristicos_SAI`)

**Formulario público:**
```
Nombre Alojamiento           [______________________]
Tipo de Alojamiento          [Select: Hotel / Posada / Casa...]
RNT                          [______________________]
Precio 1 Huésped             [______________________]
Precio 2 Huéspedes           [______________________]
Precio 3 Huéspedes           [______________________]
Precio 4+ Huéspedes          [______________________]
Acepta Bebés                 [☐ Sí]
Política Bebés               [______________________]
Plan de Alimentación         [Select: PE / PC / PAM / PA / TI]
Camas (Sencillas/Dobles/Q/K) [1 / 2 / 1 / 0]
Amenities (Piscina/Jacuzzi/Bar) [☐ ☐ ☐]
Descripción                  [______________________]
Teléfono                     [______________________]
Email                        [______________________]
Ubicación                    [San Andrés]
Imagen                       [Upload]
```

---

### PASO 2️⃣: Admin Revisa Solicitudes

**En Airtable → Tabla Alojamientos_Solicitudes**

1. Filtrar: `Estado = "Pendiente"`
2. Revisar registros uno por uno:
   - ¿Datos completos?
   - ¿RNT válido?
   - ¿Precios coherentes?
   - ¿Descripción apropiada?
   - ¿Imagen de calidad?

3. Completar campos de Admin:
   - `Revisor` = Tu nombre
   - `Fecha Revisión` = Hoy
   - `Notas Admin` = Comentarios (si aplica)

---

### PASO 3️⃣: Decisión - Aprobar o Rechazar

#### ✅ OPCIÓN A: Aprobar

1. Cambiar `Estado = "Aprobado"`
2. **Trigger automático** (Airtable Automation):
   - Si es **NUEVO** (sin link en "Hotel publicado"):
     - Crear registro en `ServiciosTuristicos_SAI` con:
       - Todos los campos mapeados
       - `Publicado = true` (va directo a producción)
   - Si es **EDICIÓN** (ya existe link):
     - Actualizar campos permitidos en el registro vinculado
     - `Publicado = true` si no estaba

3. ✅ Ahora aparece en la app (Home → Alojamientos → Detail)

#### ❌ OPCIÓN B: Rechazar

1. Cambiar `Estado = "Rechazado"`
2. Llenar `Notas Admin` = motivo (ej: "RNT inválido", "Precios demasiado altos", "Falta descripción")
3. **Trigger automático**:
   - Envía notificación al socio (opcional: via Zapier/Make)
   - No toca `ServiciosTuristicos_SAI`
4. Socio ve el rechazo en su panel y puede editar/reenviar

---

## 🔗 Estructura de Vinculación (Linking)

### Campo en Alojamientos_Solicitudes:
- **"Hotel publicado"** (Link to another record)
- Apunta a: `ServiciosTuristicos_SAI`
- Tipo: Single record (máx 1 enlace)

### Lookup inverso en ServiciosTuristicos_SAI (automático):
- Campo: **"Solicitud origen"**
- Muestra el registro de solicitud si fue aprobado

### Flujo:
```
NUEVA SOLICITUD (ej: Hotel La Posada)
↓
Estado = Pendiente
↓ (Admin aprueba)
↓
Estado = Aprobado
↓ (Automation: Create en ServiciosTuristicos_SAI)
↓
Link "Hotel publicado" ← señala al nuevo registro en productiva
↓
ServiciosTuristicos_SAI → Publicado = true
↓
App consume → aparece en Home → Alojamientos
```

---

## 🤖 Automation en Airtable (Paso a Paso)

### Automation 1: Crear en Productiva (NUEVO)

**Nombre:** "Aprobar Nueva Solicitud"

**Trigger:**
```
When a record matches conditions:
  AND
  - Estado is Aprobado
  - Hotel publicado is empty
```

**Action:**
```
Create record in ServiciosTuristicos_SAI with:
  - Nombre = {Nombre Alojamiento}
  - Tipo de Alojamiento = {Tipo de Alojamiento}
  - RNT = {RNT}
  - Precio 1 Huesped = {Precio 1 Huésped}
  - Precio 2 Huespedes = {Precio 2 Huéspedes}
  - Precio 3 Huespedes = {Precio 3 Huéspedes}
  - Precio 4+ Huespedes = {Precio 4+ Huéspedes}
  - Acepta Bebes = {Acepta Bebés}
  - Politica Bebes = {Política Bebés}
  - Plan de Alimentación = {Plan de Alimentación}
  - Camas Sencillas = {Camas Sencillas}
  - Camas Dobles = {Camas Dobles}
  - Cama Queen = {Cama Queen}
  - Cama King = {Cama King}
  - Acceso a Piscina = {Acceso a Piscina}
  - Acceso a Jacuzzi = {Acceso a Jacuzzi}
  - Acceso a Bar = {Acceso a Bar}
  - Tiene Cocina = {Tiene Cocina}
  - Incluye Desayuno = {Incluye Desayuno}
  - Minimo Noches = {Minimo Noches}
  - Capacidad Maxima = {Capacidad Maxima}
  - Descripcion = {Descripción}
  - Telefono Contacto = {Teléfono}
  - Email Contacto = {Email}
  - Moneda Precios = {Moneda Precios}
  - Ubicacion = San Andres
  - Publicado = true
  - Imagen = {Imagen}
  
Then update Hotel publicado = [Link al registro creado] ← Esto se hace automático
```

---

### Automation 2: Actualizar Existente (EDICIÓN)

**Nombre:** "Aprobar Edición Solicitud"

**Trigger:**
```
When a record matches conditions:
  AND
  - Estado is Aprobado
  - Hotel publicado is not empty
```

**Action:**
```
Update linked record in ServiciosTuristicos_SAI:
  - Precio 1 Huesped = {Precio 1 Huésped}
  - Precio 2 Huespedes = {Precio 2 Huéspedes}
  - Precio 3 Huespedes = {Precio 3 Huéspedes}
  - Precio 4+ Huespedes = {Precio 4+ Huéspedes}
  - Acepta Bebes = {Acepta Bebés}
  - Politica Bebes = {Política Bebés}
  - Plan de Alimentación = {Plan de Alimentación}
  - Camas Sencillas = {Camas Sencillas}
  - Camas Dobles = {Camas Dobles}
  - Cama Queen = {Cama Queen}
  - Cama King = {Cama King}
  - Acceso a Piscina = {Acceso a Piscina}
  - Acceso a Jacuzzi = {Acceso a Jacuzzi}
  - Acceso a Bar = {Acceso a Bar}
  - Tiene Cocina = {Tiene Cocina}
  - Incluye Desayuno = {Incluye Desayuno}
  - Minimo Noches = {Minimo Noches}
  - Descripcion = {Descripción}
  - Telefono Contacto = {Teléfono}
  - Email Contacto = {Email}
```

---

### Automation 3: Volver a Pendiente si se edita

**Nombre:** "Requerir Nueva Revisión si se edita"

**Trigger:**
```
When a record is updated in Alojamientos_Solicitudes:
  AND any field matching [Precio 1, Precio 2, Tipo, Descripción, Imagen] is modified
  AND Estado is not "Pendiente"
```

**Action:**
```
Update record:
  - Estado = Pendiente
  - Revisor = (clear)
  - Fecha Revisión = (clear)
```

(Opcional: esto obliga a re-revisar si el socio edita después de aprobado)

---

## 📱 Panel de Socio (en la App)

**Ubicación:** Pages/Partner → Alojamientos → Solicitudes

### Vista: Mis Solicitudes

```
ID    | Nombre          | Estado       | Fecha Envío  | Notas Admin
──────┼─────────────────┼──────────────┼──────────────┼─────────────────
001   | Hotel Paradise  | ✅ Aprobado  | 15 ene       | Listo en app
002   | Posada Nativa   | ⏳ Pendiente  | 17 ene       | 
003   | Casa Playa      | ❌ Rechazado | 16 ene       | RNT no válido
```

### Acciones disponibles para socio:
- Ver detalles
- Editar (solo si está Pendiente o Rechazado)
- Reenviar (si fue rechazado)

---

## 🚀 Resumen del Flujo

```
SOCIO ENVÍA
    ↓
Alojamientos_Solicitudes (Estado=Pendiente)
    ↓
ADMIN REVISA
    ├─ Aprueba → Automation: Create/Update en ServiciosTuristicos_SAI
    └─ Rechaza → Nota Admin; Socio reeenvía
    ↓
ServiciosTuristicos_SAI (Publicado=true)
    ↓
APP (caché offline + sync)
    ↓
USUARIO VE en Home → Alojamientos
```

---

## ✅ Checklist - Airtable Setup

- [ ] Tabla `Alojamientos_Solicitudes` creada
- [ ] Campos de solicitud agregados (iguales a ServiciosTuristicos_SAI)
- [ ] Campos de control: Estado, Revisor, Fecha Revisión, Notas Admin
- [ ] Campo link: "Hotel publicado" apuntando a ServiciosTuristicos_SAI
- [ ] Formulario público creado sobre Alojamientos_Solicitudes
- [ ] Automation 1: Crear nueva solicitud → crear en productiva
- [ ] Automation 2: Aprobar edición → actualizar en productiva
- [ ] Automation 3 (opcional): Requerir revisión si se edita
- [ ] Probar flujo: enviar solicitud → aprobar → verificar en app

---

## 📞 Troubleshooting

| Problema | Solución |
|----------|----------|
| Aprobé pero no aparece en app | Verifica que `Publicado = true` en ServiciosTuristicos_SAI |
| El link no se crea automático | Revisa que Automation 1 esté ENABLED |
| Los precios no se actualizan | Verifica que el campo `Hotel publicado` tenga el link correcto |
| Socio puede editar tabla productiva | Restringe permisos: Alojamientos_Solicitudes = public link solo lectura+escritura; ServiciosTuristicos_SAI = solo admin |

---

## 🎯 Próximos Pasos (Futuro)

1. **Notificaciones al socio** (Make/Zapier):
   - "Tu solicitud fue aprobada"
   - "Tu solicitud fue rechazada: RNT inválido"

2. **Dashboard de Admin**:
   - Integrar Alojamientos_Solicitudes en panel admin de la app
   - Aprobar/rechazar directamente desde interfaz (sin ir a Airtable)

3. **Versionado**:
   - Guardar historial de cambios por socio
   - Auditoría de quién aprobó y cuándo

4. **Suscripción de Cambios**:
   - Si admin edita un alojamiento directamente en productiva, notificar al socio

---

**Status:** 🟢 Listo para implementar en Airtable  
**Última actualización:** 17 Enero 2026  
**Versión:** 1.0
