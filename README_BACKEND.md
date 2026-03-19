# 🌴 GuanaGO Socios - Backend + Frontend Local

> Sistema completo de gestión para socios locales (Restaurantes, Alojamientos, Servicios)

## 🚀 Inicio Rápido (3 Pasos)

### 1. Abre PowerShell en la carpeta del proyecto

```powershell
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
```

### 2. Ejecuta el script de inicio

```powershell
.\INICIO_LOCAL.bat
```

### 3. ¡Listo! Accede a:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api  
- **Health Check:** http://localhost:3001/api/health

---

## 📊 Sistema Completo

```
┌─────────────────────────────────────────────┐
│        Frontend (React + Vite)              │
│        http://localhost:5173                │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────────┐
│      Backend (Express + Node.js)            │
│      http://localhost:3001/api              │
└────────────────┬────────────────────────────┘
                 │
                 │ API Calls
                 ↓
        ┌────────────────┐
        │ Airtable API   │
        │ (Base de datos)│
        └────────────────┘
```

---

## ✨ Características

### 🎯 Dashboard de Socios
- Estadísticas en tiempo real (Ingresos, Ventas, Productos)
- Gráficos de rendimiento
- Listado de ventas recientes
- Top productos vendidos
- Rating y reseñas

### ⚙️ Configuración
- Perfil del negocio (Nombre, contacto, ubicación)
- Información de pagos
- Preferencias de notificaciones
- Gestión de productos

### 📊 Análisis
- Ingresos por período (día, semana, mes, año)
- Conversión de productos
- Análisis de clientes
- Reseñas y calificaciones

---

## 📋 Requisitos Previos

- **Node.js** 18+ (Descarga: https://nodejs.org/)
- **npm** 9+ (Incluido con Node.js)
- **Windows** (Script optimizado para Windows PowerShell)

### Verificar instalación:
```powershell
node --version
npm --version
```

---

## 🏗️ Arquitectura del Proyecto

```
GuanaGo-App-Enero-main/
│
├── 📄 INICIO_LOCAL.bat              ← 🚀 EJECUTA ESTO
├── 📄 QUICKSTART_BACKEND.md         ← Guía rápida
├── 📄 VERIFICACION_BACKEND_COMPLETO.md
│
├── 📁 backend/                      ← Backend Express
│   ├── server.js                    ← Punto de entrada
│   ├── package.json                 ← Dependencias
│   ├── .env.local                   ← Configuración
│   ├── routes/
│   │   ├── healthRoutes.js          ← Health checks
│   │   └── partnerRoutes.js         ← Endpoints de socios
│   ├── controllers/                 ← Lógica (próximamente)
│   └── services/                    ← Servicios (próximamente)
│
├── 📁 pages/                        ← Frontend pages
│   ├── PartnerDashboard.tsx         ← Dashboard socios
│   └── PartnerSettings.tsx          ← Configuración socios
│
├── 📁 services/
│   └── partnerService.ts            ← Cliente API
│
├── 📁 components/                   ← Componentes React
├── 📁 context/                      ← Context API
└── 📁 styles/                       ← Estilos Tailwind
```

---

## 🔌 API Endpoints

### Autenticación
```
POST   /api/partners/login           Iniciar sesión
POST   /api/partners/register        Registrarse
```

### Perfil
```
GET    /api/partners/:id             Obtener perfil
PUT    /api/partners/:id             Actualizar perfil
```

### Dashboard
```
GET    /api/partners/:id/dashboard/stats      Estadísticas
GET    /api/partners/:id/sales/recent         Ventas recientes
GET    /api/partners/:id/products/top         Top productos
```

### Productos
```
GET    /api/partners/:id/products     Listar productos
POST   /api/partners/:id/products     Crear producto
```

### Ventas
```
GET    /api/partners/:id/sales        Listar ventas
```

### Pagos
```
GET    /api/partners/:id/payouts      Obtener pagos pendientes
```

---

## 🧪 Credenciales de Prueba

Para probar el login:

- **Email:** `socio@test.com`
- **Contraseña:** `Test123456!`

---

## 📊 Mock Data

El backend incluye datos de prueba para:
- 1 Hotel (Hotel Paraíso)
- 2 Productos/Habitaciones
- Múltiples ventas
- Estadísticas de ejemplo

---

## 🛠️ Stack Tecnológico

### Frontend
- **React** 18+ - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool (super rápido)
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** 18+ - Runtime
- **Express** 4.18 - Web framework
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Airtable API** - Database
- **Nodemailer** - Email

### DevOps
- **Docker** & **Docker Compose**
- **npm** - Package manager

---

## 🚨 Solución de Problemas

### Puerto ya está en uso
```powershell
# El script intenta liberar automáticamente.
# Si aún falla:

netstat -ano | findstr :3001
# Reemplaza XXXX con el número del proceso:
taskkill /PID XXXX /F
```

### Node.js no está instalado
```
Descarga de https://nodejs.org/
Instala versión LTS (18+)
Reinicia PowerShell
```

### npm install falla
```powershell
# Limpia caché
rm -r node_modules, package-lock.json

# Reinstala
npm install
```

### Frontend muestra página en blanco
1. Abre DevTools: `F12`
2. Revisa Console para errores
3. Verifica que Backend esté corriendo en 3001
4. Revisa CORS en `backend/.env.local`

### Backend no responde
1. Cierra y vuelve a ejecutar `INICIO_LOCAL.bat`
2. Verifica que no hay otro proceso en puerto 3001
3. Revisa los logs en la terminal del backend

---

## 📚 Documentación Completa

- **[Inicio Rápido Backend](./backend/INICIO_BACKEND.md)** - Guía detallada
- **[Arquitectura Completa](./ARQUITECTURA_SISTEMA_COMPLETO.md)** - Diseño del sistema
- **[Configuración Airtable](./AIRTABLE_CONFIG_LOCAL.md)** - Schema de BD
- **[Troubleshooting](./TROUBLESHOOTING_LOCAL.md)** - Solución de problemas
- **[Setup Local](./SETUP_LOCAL.md)** - Instalación manual

---

## ✅ Verificación de Instalación

Después de ejecutar `INICIO_LOCAL.bat`:

```bash
# Terminal 3 - Pruebas
curl http://localhost:3001/api/health
# Debería retornar JSON con status: "OK"

curl http://localhost:3001/api
# Debería retornar información de la API

# En navegador:
# http://localhost:5173 → Frontend
# http://localhost:3001/api → Backend responde
```

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar `INICIO_LOCAL.bat`
2. ✅ Verificar que Frontend y Backend están corriendo
3. ✅ Hacer login con credenciales de prueba
4. ✅ Explorar el Dashboard
5. ⏳ Conectar Base de Datos Real (Airtable)
6. ⏳ Configurar Make.com Webhooks
7. ⏳ Deployar a Producción

---

## 📞 Estructura de Comandos

```powershell
# Inicio automático (recomendado)
.\INICIO_LOCAL.bat

# Inicio manual del backend
cd backend
npm install
npm run dev

# Inicio manual del frontend (otra terminal)
npm install
npm run dev
```

---

## 🔐 Seguridad

- JWT tokens con expiración (30 días)
- Contraseñas hasheadas con bcryptjs
- CORS configurado para localhost
- Environment variables en .env.local
- Validación de inputs con Joi

---

## 📈 Performance

- Frontend: Vite Hot Module Replacement (instantáneo)
- Backend: Nodemon con auto-reload
- Database: Airtable cloud (escalable)
- Caching: Configurado para optimizar

---

## 🤝 Contribuir

Para agregar nuevas características:

1. Crea una rama: `git checkout -b feature/nueva-caracteristica`
2. Commit cambios: `git commit -am 'Agrega nueva característica'`
3. Push a rama: `git push origin feature/nueva-caracteristica`
4. Abre Pull Request

---

## 📜 Licencia

Proyecto privado de GuanaGO - Todos los derechos reservados

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa la documentación en este README
2. Consulta [TROUBLESHOOTING_LOCAL.md](./TROUBLESHOOTING_LOCAL.md)
3. Revisa los logs de las terminales
4. Abre DevTools con `F12` en el navegador

---

## 🚀 ¡Vamos!

```bash
.\INICIO_LOCAL.bat
```

**Tu backend está listo en http://localhost:3001** ✨

---

**Última actualización:** Enero 2026  
**Estado:** ✅ Backend Funcional - Ready to Test
