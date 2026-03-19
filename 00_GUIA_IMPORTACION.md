# 📥 GUÍA DE IMPORTACIÓN AIRTABLE - GuanaGO Project Hub

## ✅ PRE-REQUISITOS

1. Tener cuenta de Airtable (gratis o pro)
2. Los 4 archivos CSV descargados:
   - `01_Tasks_Kanban.csv`
   - `02_Documentos_RAG.csv`
   - `03_Componentes_App.csv`
   - `04_Features_Roadmap.csv`

---

## 🚀 PASO A PASO: IMPORTAR TABLAS

### **PASO 1: Crear Base Nueva**

1. Ve a https://airtable.com
2. Click en "+" → "Start from scratch"
3. Nombra la base: **"GuanaGO_ProjectHub"**
4. Elimina la tabla "Table 1" que viene por defecto (ya la crearemos)

---

### **PASO 2: Importar Tabla 1 - Tasks_Kanban**

1. En tu base vacía, click en "+" junto a las pestañas
2. Selecciona **"CSV file"**
3. Arrastra o selecciona `01_Tasks_Kanban.csv`
4. Airtable detectará automáticamente las columnas
5. **IMPORTANTE**: Revisa que los tipos de campo sean correctos:
   - `ID_Task` → Single line text
   - `Nombre_Tarea` → Single line text
   - `Descripción` → Long text
   - `Estado` → Single select (con opciones: Backlog, To Do, En Progreso, Review, Done)
   - `Prioridad` → Single select (Baja, Media, Alta, Crítica)
   - `Estimación_Horas` → Number
   - `Fecha_Creación` → Date
6. Click **"Import"**
7. Renombra la tabla a: **"Tasks_Kanban"**

---

### **PASO 3: Configurar Vista Kanban**

1. En la tabla `Tasks_Kanban`, click en "Grid view" (arriba izquierda)
2. Click **"+ Create"** → "Kanban"
3. Nombra la vista: **"Kanban Board"**
4. Configurar:
   - **Stack by**: Estado
   - **Card title**: Nombre_Tarea
   - **Show on card**: Prioridad, Asignado_a, Estimación_Horas
5. ¡Listo! Ya tienes tu Kanban funcionando

---

### **PASO 4: Importar Tabla 2 - Documentos_RAG**

1. Click en "+" para nueva tabla
2. Selecciona **"CSV file"**
3. Sube `02_Documentos_RAG.csv`
4. Revisa tipos de campo:
   - `ID_Documento` → Single line text
   - `Título` → Single line text
   - `Tipo` → Single select (Spec Técnica, Decisión, Research, Tutorial, API Docs)
   - `Contenido_Markdown` → Long text
   - `Tags` → Multiple select (o Single line text separado por |)
   - `Última_Actualización` → Date
   - `Embedding_Status` → Single select (Pendiente, Procesado)
5. Click **"Import"**
6. Renombra a: **"Documentos_RAG"**

---

### **PASO 5: Importar Tabla 3 - Componentes_App**

1. Repetir proceso:
   - Click "+"
   - CSV file
   - Sube `03_Componentes_App.csv`
2. Tipos de campo:
   - `ID_Componente` → Single line text
   - `Nombre` → Single line text
   - `Tipo` → Single select (React Component, Service, Hook, Utility, Page)
   - `Ubicación` → Single line text
   - `Estado` → Single select (Planeado, En Desarrollo, Implementado, Deprecated)
   - `Última_Modificación` → Date
3. Click **"Import"**
4. Renombra a: **"Componentes_App"**

---

### **PASO 6: Importar Tabla 4 - Features_Roadmap**

1. Última tabla:
   - Click "+"
   - CSV file
   - Sube `04_Features_Roadmap.csv`
2. Tipos de campo:
   - `ID_Feature` → Single line text
   - `Nombre` → Single line text
   - `Estado` → Single select (Idea, Planeado, En Desarrollo, Lanzado)
   - `Prioridad_Negocio` → Single select (Baja, Media, Alta, Crítica)
   - `User_Story` → Long text
   - `Success_Metrics` → Long text
3. Click **"Import"**
4. Renombra a: **"Features_Roadmap"**

---

## 🔗 PASO 7: CREAR RELACIONES ENTRE TABLAS

Ahora conectamos las tablas para que funcionen juntas.

### **Relación 1: Tasks ↔ Documentos**

1. Ve a tabla `Tasks_Kanban`
2. Click "+" para agregar campo
3. Selecciona **"Link to another record"**
4. Nombra el campo: **"Documentos_Relacionados"**
5. Selecciona tabla: `Documentos_RAG`
6. Checkbox: "Allow linking to multiple records" ✅
7. Click "Create field"

### **Relación 2: Tasks ↔ Componentes**

1. En tabla `Tasks_Kanban`
2. "+" → "Link to another record"
3. Nombre: **"Componentes_Relacionados"**
4. Tabla: `Componentes_App`
5. Multiple records: ✅
6. Create field

### **Relación 3: Features ↔ Tasks**

1. Ve a tabla `Features_Roadmap`
2. "+" → "Link to another record"
3. Nombre: **"Tareas"**
4. Tabla: `Tasks_Kanban`
5. Multiple records: ✅
6. Create field

### **Relación 4: Features ↔ Documentos**

1. En tabla `Features_Roadmap`
2. "+" → "Link to another record"
3. Nombre: **"Documentos"**
4. Tabla: `Documentos_RAG`
5. Multiple records: ✅
6. Create field

---

## 🎨 PASO 8: CREAR VISTAS ÚTILES

### **Vista: Mis Tareas Activas**

1. En `Tasks_Kanban`, crear nueva vista (Grid)
2. Nombre: **"Mis Tareas Activas"**
3. Filtros:
   - `Asignado_a` = "Tú"
   - `Estado` ≠ "Done"
4. Sort: `Prioridad` (Z→A), luego `Fecha_Creación` (newest first)

### **Vista: Sprint Actual**

1. Nueva vista Grid
2. Nombre: **"Sprint Actual"**
3. Filtro: `Sprint` = "Sprint 1 - ANATO Prep"
4. Group by: `Estado`

### **Vista: Bugs**

1. Nueva vista Grid
2. Nombre: **"Bugs 🐛"**
3. Filtro: `Tipo` = "Bug"
4. Sort: `Prioridad` (Z→A)

---

## 🤖 PASO 9: OBTENER API CREDENTIALS

Para conectar con Claude Code y scripts de sincronización:

1. Ve a https://airtable.com/create/tokens
2. Click **"Create new token"**
3. Nombre: "GuanaGO Development"
4. Scopes necesarios:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
   - ✅ `schema.bases:read`
5. Access: Selecciona tu base "GuanaGO_ProjectHub"
6. Click **"Create token"**
7. **COPIA EL TOKEN** (solo se muestra una vez)

8. Obtén el **Base ID**:
   - Ve a tu base en Airtable
   - URL será: `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - La parte `appXXXXXXXXXXXXXX` es tu Base ID

9. **Guarda en `.env`:**
```bash
VITE_AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXX
VITE_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

---

## ✅ PASO 10: VERIFICAR QUE TODO FUNCIONA

1. **Test manual:**
   - Abre tabla `Tasks_Kanban`
   - Arrastra una tarea de "To Do" a "En Progreso" en vista Kanban
   - Verifica que se actualiza

2. **Test de relaciones:**
   - Edita tarea TASK-001
   - En campo "Documentos_Relacionados", busca y selecciona DOC-001
   - Click afuera, verifica que se guardó

3. **Test de búsqueda:**
   - Usa la barra de búsqueda global de Airtable
   - Busca "puntos"
   - Deberías ver resultados en múltiples tablas

---

## 🎉 ¡LISTO! PRÓXIMOS PASOS

Ahora que tienes Airtable configurado:

### **1. Sincronizar con tu proyecto local**

Usa el script `sync-airtable.js` que te voy a crear.

### **2. Empezar a trabajar con Claude Code**

Claude Code leerá automáticamente el contexto de Airtable.

### **3. Mantener actualizado**

Cada vez que completes una tarea:
- Marca como "Done" en Airtable
- Actualiza "Horas_Reales"
- Agrega "Notas_Técnicas" si es relevante

---

## 🐛 TROUBLESHOOTING

### **Error: "Cannot import CSV"**

- Verifica que el archivo no esté corrupto
- Abre el CSV en Excel/Numbers, verifica que las comas estén bien
- Guarda como CSV UTF-8

### **Error: "Field types not detected correctly"**

- Después de importar, puedes cambiar tipos de campo
- Click en header del campo → "Customize field type"

### **No puedo crear vistas Kanban**

- Verifica que tengas el campo "Estado" como Single Select
- Free plan de Airtable solo permite 1 Kanban por base (upgrade a Pro si necesitas más)

---

## 📞 NECESITAS AYUDA?

Si tienes problemas con la importación:

1. Comparte screenshot del error
2. Te ayudo a debuggear
3. Si es necesario, creo la base manualmente y te comparto link

---

**Tiempo estimado total: 20-30 minutos**

Una vez termines, me avisas y te ayudo con el siguiente paso: **Scripts de sincronización automática**. 🚀
