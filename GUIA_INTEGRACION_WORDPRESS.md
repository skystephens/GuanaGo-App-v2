# 🔗 Guía de Integración GuiaSAI B2B con WordPress

## 📋 Tabla de Contenidos
1. [Arquitectura](#arquitectura)
2. [Instalación](#instalación)
3. [Configuración Backend](#configuración-backend)
4. [Configuración WordPress](#configuración-wordpress)
5. [Uso](#uso)
6. [Panel de Administración](#panel-de-administración)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    WORDPRESS (guiasai.com)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐        ┌────────────────────────┐   │
│  │  Página Pública  │        │   Panel Admin WP       │   │
│  │   /cotizacion    │        │  (Dashboard)           │   │
│  │                  │        │                        │   │
│  │ [Shortcode]      │        │  • Ver cotizaciones    │   │
│  │ Formulario React │        │  • Confirmar/Cancelar  │   │
│  └────────┬─────────┘        │  • Enviar emails       │   │
│           │                  └───────────┬────────────┘   │
└───────────┼──────────────────────────────┼────────────────┘
            │                              │
            │ HTTP REST API                │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS                          │
│                  (Puerto 3000 o 4000)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST   /api/quotations              (Crear cotización)    │
│  GET    /api/quotations              (Listar todas)        │
│  GET    /api/quotations/:id          (Ver detalle)         │
│  PATCH  /api/quotations/:id/status   (Cambiar estado)      │
│  PATCH  /api/quotations/:id/items/:itemId/confirm          │
│  POST   /api/quotations/:id/send-email                     │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Webhooks Make.com
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      AIRTABLE                               │
│                                                             │
│  • Tabla: Cotizaciones                                      │
│  • Tabla: Items (Alojamientos/Tours/Transportes)           │
│  • Tabla: Partners (Hoteles, Tour Ops, etc.)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación

### 1. Backend (Node.js)

```bash
# Ir a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# AIRTABLE_API_KEY=tu_api_key
# AIRTABLE_BASE_ID=tu_base_id
# MAKE_WEBHOOK_URL=tu_webhook_make
# PORT=3000

# Iniciar servidor en desarrollo
npm run dev

# O en producción
npm start
```

### 2. Frontend GuiasAI B2B (React)

```bash
# Ir a la carpeta guiasai-b2b
cd guiasai-b2b

# Instalar dependencias
npm install

# Compilar para WordPress
npm run build:wordpress
```

Esto copiará automáticamente los archivos compilados a:
`wordpress-theme/guiasai-agencias/`

---

## ⚙️ Configuración Backend

### Agregar ruta de cotizaciones al servidor

Edita tu archivo principal del backend (ej: `backend/server.js` o `backend/index.js`):

```javascript
import quotationsRouter from './routes/quotations.js';

// ... otras rutas

app.use('/api/quotations', quotationsRouter);
```

### Conectar con Airtable

En `backend/services/airtableService.js`, asegúrate de tener:

```javascript
export async function createQuotation(quotationData) {
  const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
    .base(process.env.AIRTABLE_BASE_ID);
  
  const record = await base('Cotizaciones').create({
    'ID': quotationData.id,
    'Agencia': quotationData.agencyName,
    'Email': quotationData.agencyEmail,
    'Total': quotationData.total,
    'Estado': 'Pendiente',
    'Fecha': new Date().toISOString(),
    // ... más campos
  });
  
  return record;
}
```

---

## 🌐 Configuración WordPress

### 1. Subir archivos al servidor

Copia la carpeta `wordpress-theme/` a tu instalación de WordPress:

```
wp-content/themes/tu-tema/
  ├── functions.php  (archivo actualizado)
  ├── guiasai-agencias/
  │   └── assets/
  │       ├── index.js
  │       └── index.css
```

### 2. Crear página de cotización

1. En WordPress Admin, ve a **Páginas → Añadir nueva**
2. Título: "Cotización para Agencias"
3. URL amigable: `/cotizacion-agencias`
4. Contenido:
   ```
   [guiasai_cotizador]
   ```
5. Publicar

### 3. Configurar URL de API

En WordPress Admin:
- Ve a **GuiaSAI B2B → Configuración**
- Ingresa la URL de tu backend: `https://api.tudominio.com/api`
- Guarda cambios

---

## 💻 Uso

### Para Agencias (Frontend Público)

1. Visitar: `https://tudominio.com/cotizacion-agencias/`
2. Seleccionar servicios (alojamientos, tours, transportes)
3. Hacer clic en **"Vista Previa"** para ver el PDF
4. Hacer clic en **"Enviar Cotización"**
5. La cotización se envía al backend y queda pendiente de aprobación

### Para Administradores (Panel WordPress)

1. Ir a **WordPress Admin → GuiaSAI B2B → Todas las Cotizaciones**
2. Ver lista de cotizaciones pendientes
3. Acciones disponibles:
   - **Ver Detalle**: Ver cotización completa
   - **Confirmar**: Aprobar la cotización
   - **Cancelar**: Rechazar con motivo

---

## 🛠️ Panel de Administración

### Funcionalidades del Panel

#### 1. Lista de Cotizaciones
- Tabla con todas las cotizaciones
- Filtros por estado: Pendiente / Confirmada / Cancelada
- Búsqueda por agencia o ID
- Ordenar por fecha

#### 2. Detalle de Cotización
- Información de la agencia
- Lista completa de servicios solicitados
- Estado de cada servicio
- Botones de acción

#### 3. Gestión de Items
Cada servicio (alojamiento, tour, transporte) puede:
- ✅ **Confirmarse** individualmente
- ❌ **Rechazarse** con motivo
- 💰 **Ajustar precio** final
- 📝 **Agregar notas** para el partner

#### 4. Comunicación
- Enviar cotización por email al cliente
- Notificar a partners
- Histórico de cambios

---

## 🔐 Seguridad

### Autenticación WordPress
El panel de administración usa los permisos de WordPress:
- Solo usuarios con rol **Administrador** pueden acceder
- AJAX protegido con nonces
- Validación en backend

### API Backend
Agregar autenticación JWT para producción:

```javascript
// middleware/auth.js
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({error: 'No autorizado'});
  
  // Validar token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({error: 'Token inválido'});
  }
}
```

---

## 📱 Integración con Make.com

### Webhook para notificaciones automáticas

Cuando se crea una cotización, enviar a Make.com:

```javascript
// En backend/routes/quotations.js
import axios from 'axios';

async function notifyMake(quotationData) {
  await axios.post(process.env.MAKE_WEBHOOK_URL, {
    event: 'new_quotation',
    data: quotationData
  });
}
```

### Escenario Make.com sugerido:
1. Recibir webhook de nueva cotización
2. Crear registros en Airtable
3. Enviar notificación por email a admin
4. Notificar a partners correspondientes
5. Crear tarea en sistema de gestión

---

## 🎨 Personalización

### Shortcode con opciones

```php
// Vista embebida simple
[guiasai_cotizador view="simple"]

// Vista completa (por defecto)
[guiasai_cotizador view="full"]

// Vista para iframe
[guiasai_cotizador view="embed"]
```

### Estilos personalizados

Agrega CSS personalizado en WordPress:
```css
.guiasai-cotizador-container {
  max-width: 1200px;
  margin: 0 auto;
}
```

---

## 🐛 Troubleshooting

### Backend no responde
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/api/health

# Ver logs
npm run dev
```

### Frontend no carga en WordPress
1. Verificar que `functions.php` esté actualizado
2. Comprobar rutas de archivos en navegador (F12 → Network)
3. Limpiar caché de WordPress

### CORS Errors
Agregar en tu backend:
```javascript
app.use(cors({
  origin: ['https://tudominio.com', 'http://localhost:8080'],
  credentials: true
}));
```

---

## 📊 Próximos Pasos

- [ ] Agregar notificaciones push
- [ ] Dashboard con estadísticas
- [ ] Reportes en PDF automáticos
- [ ] Integración con sistema de pagos
- [ ] App móvil para partners
- [ ] Chatbot para seguimiento

---

## 📞 Soporte

¿Necesitas ayuda?
- Email: soporte@guiasai.com
- Tel: +57 3153836043
- RNT: 48674

---

**¡Tu sistema B2B está listo para escalar! 🚀**
