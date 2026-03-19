# 🚀 Guía de Setup - Ejecutar GuanaGO Localmente

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Rápida (3 minutos)](#instalación-rápida)
3. [Instalación Manual](#instalación-manual)
4. [Estructura de Desarrollo](#estructura-de-desarrollo)
5. [Comandos Disponibles](#comandos-disponibles)
6. [Troubleshooting](#troubleshooting)
7. [URLs de Acceso](#urls-de-acceso)

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### 1. **Node.js** (versión 18.0.0 o superior)

```bash
node --version  # Debe ser v18 o superior
npm --version   # Debe ser 9 o superior
```

**Descargar:** [nodejs.org](https://nodejs.org)

### 2. **Git** (para clonar el repositorio)

```bash
git --version   # Debe estar instalado
```

**Descargar:** [git-scm.com](https://git-scm.com)

### 3. **VS Code** (Recomendado para desarrollo)

**Descargar:** [code.visualstudio.com](https://code.visualstudio.com)

---

## ⚡ Instalación Rápida (3 minutos)

### Opción 1: Script Automático (Recomendado)

**Windows PowerShell:**

```bash
# 1. Navega a la carpeta del proyecto
cd "C:\Users\<tu-usuario>\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"

# 2. Ejecuta el script de inicio
.\INICIO_LOCAL.bat
```

**✓ Esto inicia automáticamente:**
- ✅ Frontend (Vite) en http://localhost:5173
- ✅ Backend (Express) en http://localhost:3001

---

### Opción 2: Inicio Manual paso a paso

**Terminal 1 - Frontend:**
```bash
cd "C:\Users\<tu-usuario>\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
npm install        # Solo la primera vez
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install        # Solo la primera vez
npm run dev
```

---

## 📚 Instalación Manual

### Paso 1: Clonar o descargar el repositorio

```bash
# Si lo clonaste de GitHub:
git clone https://github.com/skystephens/GuanaGo-App-v2.git
cd GuanaGo-App-v2

# Si lo descargaste:
# Extrae el ZIP y abre la carpeta en Terminal
```

---

### Paso 2: Instalar dependencias Frontend

```bash
# Desde la raíz del proyecto
npm install

# Verificar instalación
npm list react      # Debe mostrar React 18+
npm list vite       # Debe mostrar Vite 5+
npm list typescript # Debe mostrar TypeScript 5+
```

---

### Paso 3: Instalar dependencias Backend

```bash
# Navega a backend
cd backend

# Instala dependencias
npm install

# Verifica instalación
npm list express    # Debe mostrar Express 4.18+
npm list axios      # Debe mostrar Axios 1.6+
npm list dotenv     # Debe estar instalado
```

---

### Paso 4: Configurar Archivos .env

#### Frontend `.env.local`

Ya está creado en la raíz. Contiene:

```env
VITE_API_URL=http://localhost:3001/api
VITE_AIRTABLE_API_KEY=patDWx13o3qtNjLqv.37cd343946b889d2044f1f5fa9039c06931d38a192f794c115f0efd21cca1658
VITE_AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk
VITE_ENV=development
VITE_ENABLE_PARTNER_DASHBOARD=true
```

#### Backend `backend/.env.local`

Ya está creado en la carpeta backend. Contiene:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-development-only
AIRTABLE_API_KEY=patDWx13o3qtNjLqv.37cd343946b889d2044f1f5fa9039c06931d38a192f794c115f0efd21cca1658
AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk
```

---

### Paso 5: Iniciar servicios

**Terminal 1 - Frontend:**
```bash
npm run dev
# Output esperado: "Local:   http://localhost:5173/"
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Output esperado: "Server running on port 3001"
```

---

## 🏗️ Estructura de Desarrollo

```
GuanaGO-App-Enero-main/
├── 📁 src/
│   ├── components/
│   │   ├── UnifiedPanel.tsx
│   │   ├── PartnerDashboard.tsx (🆕)
│   │   └── ...
│   ├── pages/
│   │   ├── PartnerDashboard.tsx (🆕)
│   │   ├── PartnerSettings.tsx (🆕)
│   │   └── ...
│   ├── services/
│   │   ├── partnerService.ts (🆕)
│   │   └── ...
│   ├── App.tsx
│   └── index.tsx
├── 📁 backend/
│   ├── routes/
│   │   └── partnerRoutes.js (🆕)
│   ├── controllers/
│   │   └── partnerController.js (🆕)
│   ├── services/
│   │   └── partnerService.js (🆕)
│   ├── middleware/
│   │   ├── auth.js (🆕)
│   │   └── rateLimiter.js (🆕)
│   ├── package.json
│   ├── server.js
│   └── .env.local
├── 📄 .env.local
├── 📄 package.json
├── 📄 INICIO_LOCAL.bat (🆕)
├── 📄 INICIO_FRONTEND.bat (🆕)
├── 📄 GUIA_DASHBOARD_SOCIOS.md (🆕)
└── 📄 SETUP_LOCAL.md (este archivo)
```

---

## 🎮 Comandos Disponibles

### Frontend (Raíz del Proyecto)

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de la build
npm run preview

# Ejecutar linter/formatter
npm run lint

# Tests (si están configurados)
npm run test
```

### Backend (Carpeta `backend`)

```bash
# Iniciar servidor en modo desarrollo (con auto-reload)
npm run dev

# Iniciar servidor en producción
npm start

# Ejecutar tests
npm test

# Linter
npm run lint
```

---

## 🐛 Troubleshooting

### ❌ Error: "npm: command not found"

**Solución:** Node.js no está instalado correctamente

```bash
# Verifica instalación
node --version
npm --version

# Si no aparecen, descarga desde nodejs.org e instala
# Después, reinicia la Terminal
```

---

### ❌ Error: "Port 5173 already in use"

**Causa:** Otro proceso está usando el puerto

**Solución 1 - Cambiar puerto:**
```bash
npm run dev -- --port 5174
```

**Solución 2 - Matar el proceso:**
```bash
# Windows PowerShell - Encuentra y mata el proceso
Get-Process | Where-Object {$_.Port -eq 5173} | Stop-Process -Force

# O manualmente:
# 1. Abre Task Manager (Ctrl+Shift+Esc)
# 2. Busca "node"
# 3. Haz clic derecho → Terminar tarea
```

---

### ❌ Error: "Cannot find module 'react'"

**Solución:** Instalar dependencias

```bash
# Desde la raíz
npm install

# Verificar
npm list react
```

---

### ❌ Error: "API connection refused" o "Cannot connect to 127.0.0.1:3001"

**Causa:** El backend no está corriendo

**Solución:**

```bash
# Abre una nueva Terminal
cd backend
npm run dev

# Verifica que muestra "Server running on port 3001"
```

---

### ❌ Error: "401 Unauthorized" al acceder al dashboard

**Causa:** Token JWT inválido o expirado

**Solución:**

```bash
# Opción 1: Limpiar localStorage
# 1. Abre DevTools (F12)
# 2. Ve a Application → Local Storage
# 3. Elimina "partner_token"
# 4. Recarga la página

# Opción 2: Login nuevamente
# El token debería regenerarse automáticamente
```

---

### ❌ Error: "CORS error" en consola

**Causa:** Backend no tiene CORS configurado correctamente

**Solución:** Editar `backend/.env.local`

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

O en `backend/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

---

### ⚠️ Airtable no funciona

**Verificar credenciales:**

```bash
# Abre .env.local y verifica:
VITE_AIRTABLE_API_KEY=patDWx13o3qtNjLqv.37cd343946b889d2044f1f5fa9039c06931d38a192f794c115f0efd21cca1658
VITE_AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk

# Si está vacío, obtén las credenciales de Airtable:
# 1. Ve a https://airtable.com/account/tokens
# 2. Crea un token personal
# 3. Copia la BASE_ID desde la URL: https://airtable.com/app[BASE_ID]
```

---

## 🌐 URLs de Acceso

Una vez que todo está corriendo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicación principal |
| **Backend API** | http://localhost:3001/api | Base para las APIs |
| **Dashboard** | http://localhost:5173/dashboard | Panel del socio |
| **Configuración** | http://localhost:5173/settings | Settings del socio |
| **Dev Tools** | http://localhost:5173/__dev | Herramientas de dev (si existen) |

---

## 💾 Carpeta de Uploads (Local)

Los archivos subidos se guardan en:

```
backend/uploads/
├── images/
│   ├── product_123.jpg
│   └── profile_456.png
├── documents/
│   └── invoice_789.pdf
└── temp/
    └── ...
```

**Limpieza:**
```bash
# Borrar archivos antiguos (>7 días)
node scripts/cleanup-uploads.js
```

---

## 🔐 Credenciales de Desarrollo

Para testing local, puedes usar:

```
Email: socio@test.com
Contraseña: Test123456!
Partner ID: recXXXXXXXXXXXXXX (obten de Airtable)
```

---

## 📊 Hot Reload (Auto-refresh)

✅ **Frontend:** Si - Vite tiene hot reload nativo
✅ **Backend:** Si - Con `npm run dev` (nodemon configurado)

Esto significa que los cambios en el código se reflejan automáticamente sin reiniciar.

---

## 🚀 Deploying a Producción

Cuando estés listo para desplegar:

```bash
# Frontend - Build
npm run build
# Genera carpeta 'dist/' lista para subir a Netlify/Vercel

# Backend - Deploying
# Ver instrucciones en: README_DEPLOY.md
```

---

## 📞 Ayuda Rápida

**¿Problema?** Sigue este orden:

1. ✅ Lee este documento (SETUP_LOCAL.md)
2. ✅ Revisa `GUIA_DASHBOARD_SOCIOS.md`
3. ✅ Consulta `FAQ_TECNICO_BACKEND_SOCIOS.md`
4. ✅ Abre una issue en GitHub
5. ✅ Contacta al equipo técnico

---

## ✅ Checklist de Inicio

- [ ] Node.js v18+ instalado
- [ ] Git instalado
- [ ] Proyecto clonado/descargado
- [ ] `.env.local` en raíz configurado
- [ ] `backend/.env.local` configurado
- [ ] `npm install` ejecutado
- [ ] `cd backend && npm install` ejecutado
- [ ] `npm run dev` funcionando (Frontend)
- [ ] `cd backend && npm run dev` funcionando (Backend)
- [ ] Airtable API Key y Base ID válidos
- [ ] Puedo acceder a http://localhost:5173
- [ ] Puedo acceder a http://localhost:3001/api

---

## 📝 Notas Importantes

- **No subas .env.local a GitHub** - Contiene claves de API privadas
- **Hot reload puede ser lento** con muchos archivos - En ese caso, reinicia manualmente
- **Limpia node_modules** si hay problemas: `rm -r node_modules && npm install`
- **Usa siempre el mismo Node.js version** en frontend y backend

---

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Desarrollar localmente con hot reload
- ✅ Probar el dashboard de socios
- ✅ Hacer cambios en el código en tiempo real
- ✅ Debug con DevTools (F12)
- ✅ Usar la consola del navegador

**¡Feliz desarrollo!** 🚀

---

**Última actualización:** 23 Enero 2026  
**Versión:** 1.0  
**Autor:** GuanaGO Development Team
