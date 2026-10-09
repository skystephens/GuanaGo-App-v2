# 📋 Sistema de Tareas GuanaGO - Guía de Uso

## ✅ Estado Actual

**TODO lo necesario ya está configurado:**
- ✅ Credenciales Airtable en `.env`
- ✅ Componente AdminTasks.tsx completo (1300+ líneas)
- ✅ Funciones CRUD conectadas: `getTareas()`, `createTarea()`, `updateTarea()`, `deleteTarea()`
- ✅ Ruta configurada en App.tsx
- ✅ Botón de acceso en AdminDashboard

---

## 🚀 Cómo Acceder al Sistema de Tareas

### Desde la App (localhost:3002)

1. **Inicia sesión como Admin**
   - Ve a la sección de Cuenta/Perfil
   - Ingresa con credenciales de administrador

2. **Accede al Panel de Admin**
   - Una vez autenticado, verás el botón "Panel" en la navegación inferior
   - Click en "Panel" → AdminDashboard

3. **Abre el Sistema de Tareas**
   - En AdminDashboard verás un botón "Tareas"
   - Click en "Tareas" → AdminTasks

---

## 📊 Estructura de Airtable

### Tabla: `Tareas_To_do`

**Campos principales:**
```
- Titulo (texto)
- Descripcion (texto largo)
- Status (pendiente | en_progreso | urgente_pendiente | terminado | bloqueado)
- Prioridad (baja | media | alta | critica)
- Categoria (backend | frontend | infraestructura | diseno | documentacion | testing | blockchain | negocio)
- Archivo_Referencia (texto) - archivo .md relacionado
- Seccion_Referencia (texto) - sección dentro del archivo
- Estimacion_Horas (número)
- Horas_Reales (número)
- Creado_Por (texto)
- Asignado_A (texto)
- Fecha_Creacion (fecha)
- Fecha_Actualizacion (fecha)
- Fecha_Vencimiento (fecha)
- Depende_De (texto) - IDs de tareas separadas por coma
- Notas_IA (texto largo) - sugerencias de Copilot
- Fecha_Completado (fecha)
```

**Nombres alternativos soportados** (para compatibilidad):
- El sistema detecta automáticamente campos en español o inglés
- Ejemplo: `Titulo` / `Title` / `Nombre` / `Name`

---

## 🎯 Funcionalidades del Sistema

### Vista Principal
- **Dashboard con estadísticas**: Total, Completadas, En Progreso, Pendientes, Bloqueadas
- **Filtros**: Por status, prioridad, categoría
- **Búsqueda**: Por título o descripción
- **Ordenamiento**: Por fecha, prioridad, categoría

### Gestión de Tareas
- ✅ **Crear nueva tarea** (botón + superior derecho)
- ✅ **Editar tarea existente** (click en tarea)
- ✅ **Cambiar status** (drag & drop o selector)
- ✅ **Eliminar tarea** (botón papelera)
- ✅ **Ver detalles completos** (expandir tarea)

### Integración con Documentación
- Cada tarea puede referenciar archivos `.md` del proyecto
- Ejemplo: `archivoReferencia: "RIMM_NFT_STRATEGY.md"`
- Sección específica: `seccionReferencia: "Fase 2: Contenido"`

### Notas de IA
- Campo `notasIA` para guardar sugerencias de GitHub Copilot
- Útil para tracking de decisiones técnicas

---

## 🔧 Sincronización con Airtable

### Automática
El componente AdminTasks:
1. Carga tareas al montar (`useEffect` con `getTareas()`)
2. Crea en Airtable al agregar (`createTarea()`)
3. Actualiza en Airtable al editar (`updateTarea()`)
4. Elimina de Airtable al borrar (`deleteTarea()`)

### Manual
Puedes actualizar directamente en Airtable y recargar la vista en la app.

---

## 📝 Ejemplo: Crear Tarea desde la App

1. Click en botón **"+ Nueva Tarea"**
2. Completa el formulario:
   ```
   Título: Implementar calendario iCal
   Descripción: Sincronizar disponibilidad de hoteles vía URL iCal
   Status: pendiente
   Prioridad: alta
   Categoría: backend
   Archivo: GUIA_SISTEMA_TAREAS.md
   Sección: Calendario iCal
   Estimación: 8 horas
   Creado Por: skysk
   ```
3. Click en **"Guardar"**
4. ✅ La tarea se crea en Airtable automáticamente

---

## 🐛 Troubleshooting

### No se cargan las tareas
1. Verifica en consola del navegador (F12):
   - Busca mensajes "📋 Cargadas X tareas desde Airtable"
   - Si ves "⚠️ Airtable no configurado", revisa `.env`

2. Verifica credenciales en `.env`:
   ```bash
   AIRTABLE_API_KEY=pat_TU_TOKEN_AQUI
   VITE_AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk
   ```

3. Reinicia el servidor:
   ```bash
   npm run dev
   ```

### Error al crear tarea
- Verifica que la tabla `Tareas_To_do` exista en Airtable
- Revisa permisos de la API key (debe tener write access)
- Mira consola para error específico (status 403/404/422)

### Campos no se mapean
- El sistema detecta automáticamente nombres en español/inglés
- Verifica que los nombres de campos en Airtable coincidan con alguna variante soportada
- Ejemplo válido: `Titulo`, `Title`, `Nombre`, `Name`

---

## 🎨 Personalización

### Agregar nuevos estados
Edita `types.ts`:
```typescript
export type TaskStatus = 'pendiente' | 'en_progreso' | 'urgente_pendiente' | 'terminado' | 'bloqueado' | 'tu_nuevo_estado';

export const TASK_STATUS_CONFIG = {
  // ...estados existentes
  tu_nuevo_estado: { label: 'Tu Label', color: 'bg-purple-100', textColor: 'text-purple-700', icon: 'Sparkles' }
};
```

### Agregar nuevas categorías
Similar al anterior:
```typescript
export type TaskCategory = 'backend' | 'frontend' | ... | 'tu_categoria';

export const TASK_CATEGORY_CONFIG = {
  tu_categoria: { label: 'Tu Categoría', color: '#HEXCOLOR', icon: 'IconName' }
};
```

---

## 📚 Próximas Integraciones

### 1. Calendario iCal (Prioridad: Alta)
- Sincronizar disponibilidad de hoteles
- Reducir tiempos de confirmación
- Implementación: 2 días

### 2. WhatsApp con Twilio (Prioridad: Media)
- Confirmaciones automáticas de reserva
- Mensajes bidireccionales
- Implementación: 2-3 días

### 3. Google Calendar API (Prioridad: Media)
- Sincronización bidireccional
- Creación de eventos desde app
- Implementación: 4-7 días

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa logs en consola del navegador (F12)
2. Verifica mensajes en terminal donde corre `npm run dev`
3. Consulta documentación de Airtable API: https://airtable.com/developers/web/api/introduction

---

**Última actualización**: 18 enero 2026
**Versión**: 1.0
