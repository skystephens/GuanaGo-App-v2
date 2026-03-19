# 🔧 Troubleshooting - Problemas y Soluciones

## 🆘 Problemas Comunes al Ejecutar Localmente

---

## ❌ "npm: command not found"

### ¿Por qué ocurre?
Node.js no está instalado o no está en el PATH

### ✅ Solución

```bash
# 1. Verifica si está instalado
node --version
npm --version

# 2. Si no muestra versión, descarga Node.js
# Visita: https://nodejs.org
# Descarga LTS version (18.x o superior)

# 3. Instala siguiendo el wizard

# 4. Reinicia PowerShell y verifica nuevamente
node --version  # Debe mostrar v18.x.x o superior
npm --version   # Debe mostrar 9.x.x o superior
```

---

## ❌ "Port 5173 already in use"

### ¿Por qué ocurre?
Otro proceso está usando el puerto (probablemente otra instancia de Vite)

### ✅ Solución Opción 1 - Cambiar Puerto

```bash
npm run dev -- --port 5174
# Ahora accede a http://localhost:5174
```

### ✅ Solución Opción 2 - Matar Proceso (Windows)

**Task Manager:**
1. Presiona `Ctrl + Shift + Esc`
2. Busca "node"
3. Selecciona y haz clic en "End Task"

**PowerShell:**
```powershell
# Encontrar proceso en puerto 5173
netstat -ano | findstr :5173

# Matar proceso (reemplaza PID con el número encontrado)
taskkill /PID <PID> /F
```

**Command Prompt:**
```cmd
# Matar proceso en puerto 5173
for /f "tokens=5" %a in ('netstat -ano ^| find "5173"') do taskkill /PID %a /F
```

---

## ❌ "Port 3001 already in use"

### ✅ Solución

```bash
# Similar al puerto 5173, pero para backend
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# O cambiar puerto en backend/.env.local
PORT=3002
```

---

## ❌ "Cannot find module 'react'" o "Cannot find module 'express'"

### ¿Por qué ocurre?
Las dependencias no están instaladas

### ✅ Solución

```bash
# Frontend
npm install

# Backend
cd backend
npm install

# O limpia y reinstala
rm -r node_modules
npm install
```

---

## ❌ "API Connection Refused" o "Cannot connect to 127.0.0.1:3001"

### ¿Por qué ocurre?
El backend no está corriendo

### ✅ Solución

**Verifica que el backend está ejecutándose:**

```bash
# Abre nueva terminal
cd backend
npm run dev

# Deberías ver:
# Server running on port 3001
# Connected to Airtable ✓
```

**Verifica que no hay errores:**
- Abre http://localhost:3001/api/health
- Debe responder con un JSON (no error)

---

## ❌ "CORS error" en Consola

### Mensaje típico:
```
Access to XMLHttpRequest at 'http://localhost:3001/api/partners' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### ✅ Solución

**Backend (.env.local):**
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

**O en backend/server.js:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## ❌ "401 Unauthorized" en Dashboard

### ¿Por qué ocurre?
Token JWT inválido o expirado

### ✅ Solución

**Opción 1 - Limpiar localStorage:**
```javascript
// Abre DevTools (F12) → Console y ejecuta:
localStorage.removeItem('partner_token');
location.reload();
```

**Opción 2 - Login nuevamente:**
1. Ve a http://localhost:5173
2. Cierra sesión (si tiene opción)
3. Login con credenciales:
   - Email: socio@test.com
   - Contraseña: Test123456!

---

## ❌ "Airtable Connection Failed"

### ¿Por qué ocurre?
Credenciales inválidas o sin internet

### ✅ Solución

**Verifica credenciales:**

```bash
# 1. Ve a backend/.env.local
# 2. Verifica estas líneas:
AIRTABLE_API_KEY=patDWx13o3qtNjLqv.37cd343946b889d2044f1f5fa9039c06931d38a192f794c115f0efd21cca1658
AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk

# 3. Si están vacías o incorrectas, obtén nuevas:
# a. Ve a https://airtable.com/account/tokens
# b. Crea un token personal
# c. Copia y pega
```

**Prueba la conexión:**
```javascript
// En backend, crea un archivo test.js
const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

base('Partners_Aliados').select().firstPage((err, records) => {
  if (err) {
    console.error('ERROR:', err);
  } else {
    console.log('SUCCESS:', records.length, 'records found');
  }
});
```

---

## ❌ "404 Not Found" en API

### Mensaje:
```
GET http://localhost:3001/api/partners
404 Not Found
```

### ✅ Solución

**Verifica que las rutas están definidas:**

```javascript
// backend/server.js debe incluir:
const partnerRoutes = require('./routes/partnerRoutes');
app.use('/api', partnerRoutes);
```

**Verifica el nombre del endpoint:**
```bash
# Debería ser:
GET /api/partners
# No:
GET /api/partner  (sin "s")
GET /partners      (sin /api)
```

---

## ❌ "Blank Page" en Frontend

### ¿Por qué ocurre?
Error de JavaScript o componente no renderizado

### ✅ Solución

**Opción 1 - Abre DevTools:**
```
1. Presiona F12
2. Ve a Console
3. Revisa mensajes de error
4. Copia el error completo
```

**Opción 2 - Refresca:**
```
1. Presiona Ctrl+Shift+Delete (limpiar caché)
2. O presiona Ctrl+R (hard refresh)
3. O presiona Ctrl+F5
```

**Opción 3 - Reinicia:**
```bash
# Ctrl+C en terminal (detiene servidor)
# Ejecuta nuevamente:
npm run dev
```

---

## ❌ "Cannot read property 'monthlyRevenue' of null"

### ¿Por qué ocurre?
Los datos no han cargado aún

### ✅ Solución

**En PartnerDashboard.tsx:**
```tsx
// ❌ Incorrecto:
<p>{stats.monthlyRevenue}</p>

// ✅ Correcto:
<p>{stats ? stats.monthlyRevenue : 'Cargando...'}</p>

// ✅ O mejor:
{loading && <LoadingSpinner />}
{stats && (
  <p>{stats.monthlyRevenue}</p>
)}
```

---

## ❌ "Images not loading"

### ¿Por qué ocurre?
Ruta incorrecta o servidor no sirve archivos estáticos

### ✅ Solución

**En backend/server.js:**
```javascript
// Servir archivos estáticos
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));
```

**Crear carpeta si no existe:**
```bash
mkdir -p backend/uploads
```

---

## ❌ "Hot reload no funciona"

### ¿Por qué ocurre?
Vite no está viendo cambios

### ✅ Solución

**Opción 1 - Reinicia servidor:**
```bash
# Ctrl+C
npm run dev
```

**Opción 2 - Verifica vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true  // Para WSL/Docker
    }
  }
});
```

**Opción 3 - Aumenta límite de watchers (Linux):**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## ❌ "Too many files open"

### ¿Por qué ocurre?
Límite de archivos abiertos excedido

### ✅ Solución

**Windows:**
```
No hay límite típicamente
Reinicia la terminal
```

**Mac/Linux:**
```bash
# Ver límite actual
ulimit -a

# Aumentar límite
ulimit -n 4096

# Permanente (en ~/.zshrc o ~/.bashrc):
ulimit -n 4096
```

---

## ❌ "Script '.\INICIO_LOCAL.bat' cannot be loaded"

### ¿Por qué ocurre?
PowerShell no permite ejecutar scripts sin firmar

### ✅ Solución

**Opción 1 - Ejecutar directamente con cmd:**
```cmd
INICIO_LOCAL.bat
```

**Opción 2 - Cambiar política de ejecución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Opción 3 - Ejecutar manualmente:**
```powershell
npm install
npm run dev
# En otra terminal:
cd backend
npm install
npm run dev
```

---

## ❌ "Syntax error" o "Unexpected token"

### ¿Por qué ocurre?
Error de tipeo en código

### ✅ Solución

1. Abre DevTools (F12)
2. Ve a Console
3. Lee el mensaje de error
4. Haz clic en el archivo indicado
5. Busca la línea del error
6. Revisa sintaxis (comillas, llaves, punto y coma)

---

## ⚠️ Logs Esperados en Backend

Cuando ejecutas `npm run dev` en backend, deberías ver:

```
nodemon started
Server running on port 3001
Connected to Airtable ✓
Listening for requests...
```

---

## ⚠️ Logs Esperados en Frontend

Cuando ejecutas `npm run dev`, deberías ver:

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## 🆘 Aún así no funciona?

**Checklist final:**

- [ ] Node.js v18+ instalado
- [ ] npm install ejecutado (ambas carpetas)
- [ ] .env.local configurado (ambas carpetas)
- [ ] AIRTABLE_API_KEY válida
- [ ] CORS configurado correctamente
- [ ] Puertos 5173 y 3001 disponibles
- [ ] Internet disponible (para Airtable)
- [ ] Firewall no bloqueando localhost

**Si aún hay problemas:**

1. Limpia todo:
```bash
rm -r node_modules
npm cache clean --force
npm install
cd backend && npm install
```

2. Reinicia PowerShell

3. Ejecuta nuevamente:
```bash
npm run dev
# En otra terminal:
cd backend && npm run dev
```

---

## 📞 Contacto

Si el problema persiste:
1. Captura pantalla del error
2. Revisa SETUP_LOCAL.md completo
3. Consulta FAQ_TECNICO_BACKEND_SOCIOS.md
4. Crea issue en GitHub

---

**Última actualización:** 23 Enero 2026  
**Versión:** 1.0
