# 🔴 NO VEO NADA EN LOCALHOST - GUÍA COMPLETA

## ❌ Síntomas Posibles

### 1️⃣ "Connection refused" o "Cannot reach server"
**Significa:** Los servicios NO están corriendo

### 2️⃣ "Blank white page"
**Significa:** Frontend carga pero sin contenido

### 3️⃣ "Page Not Found" (404)
**Significa:** El servidor responde pero no encuentra la ruta

### 4️⃣ "CORS error" en console
**Significa:** Frontend sí carga pero no puede hablar con backend

---

## 🔧 SOLUCIÓN PASO A PASO

### PASO 1: Verifica que los servicios están REALMENTE corriendo

**En PowerShell, ejecuta:**

```powershell
# Verifica qué está en los puertos
netstat -ano | findstr :5173
netstat -ano | findstr :3001
```

**Debería mostrar algo como:**
```
TCP    127.0.0.1:5173          LISTENING    12345
TCP    127.0.0.1:3001          LISTENING    12346
```

**Si NO muestra nada = Los servicios NO están corriendo**

---

### PASO 2: Ejecuta manualmente (No uses el .bat)

**Terminal 1 - Frontend:**
```bash
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
npm run dev
```

**Deberías ver:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Si ves ERRORES:**
- Cópialo completo
- Ve al PASO 5 (Errores Específicos)

---

### PASO 3: En OTRA Terminal - Backend

```bash
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main\backend"
npm run dev
```

**Deberías ver:**
```
Server running on port 3001
Connected to Airtable ✓
```

**Si ves ERRORES:**
- Cópialo completo
- Ve al PASO 5 (Errores Específicos)

---

### PASO 4: Ahora abre en navegador

**URL:** http://localhost:5173

**Presiona F12** para abrir DevTools

**Ve a Console y busca ERRORES (mensajes rojos)**

---

### PASO 5: Soluciona errores específicos

#### Si ves: "npm: command not found"
```bash
# Node.js no está instalado
node --version
npm --version

# Si no muestra versión, descarga: https://nodejs.org
# Reinicia PowerShell después
```

#### Si ves: "Port 5173 already in use"
```bash
# Matar proceso que usa puerto
netstat -ano | findstr :5173
# Anota el PID (número)
taskkill /PID <numero> /F

# O cambiar puerto
npm run dev -- --port 5174
```

#### Si ves: "Cannot find module"
```bash
# Instalar dependencias
npm install

# Para backend también:
cd backend
npm install
```

#### Si ves: "CORS error"
```bash
# Editar backend/.env.local
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Si ves: "Airtable error"
```bash
# Verificar credenciales en .env.local
VITE_AIRTABLE_API_KEY=patDWx13o3qtNjLqv...
VITE_AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk
```

---

## 📋 CHECKLIST RÁPIDO

```
¿Instalé Node.js?                  ☐
¿Versión es 18+?                   ☐
¿Ejecuté npm install?              ☐
¿Ejecuté cd backend && npm install? ☐
¿.env.local existe?                ☐
¿backend/.env.local existe?        ☐
¿Airtable key es válida?           ☐
¿Presioné F12 para ver errors?     ☐
```

---

## 🎯 MÉTODO COMPROBADO

### Opción A: Desde CERO (Nuclear)

```bash
# 1. Cerrar todo (Ctrl+C en todas las terminales)

# 2. Limpiar y reinstalar
rm -r node_modules
rm -r backend\node_modules
npm cache clean --force

# 3. Reinstalar
npm install
cd backend
npm install
cd ..

# 4. Ejecutar
npm run dev

# 5. En otra terminal
cd backend
npm run dev
```

---

### Opción B: Verificar con script

```bash
# Ejecutar diagnóstico
.\DIAGNOSTICO.bat

# Verá una lista de qué está bien y qué mal
```

---

### Opción C: Usar Docker (Si todo lo anterior falla)

```bash
# Instala Docker desde: https://www.docker.com/products/docker-desktop

# Ejecuta:
docker-compose up -d

# Espera 1 minuto y abre:
# http://localhost:5173
```

---

## 🎥 Lo que DEBERÍAS VER

### En localhost:5173 (Frontend)

```
┌─────────────────────────────────────┐
│ GuanaGO                             │
│ [Logo]                              │
│                                     │
│ ► Inicio                            │
│ ► Tours                             │
│ ► Alojamientos                      │
│ ► Transportes                       │
│ ► Mi Itinerario                     │
│ ...                                 │
└─────────────────────────────────────┘
```

### En localhost:3001/api/health

```json
{
  "status": "ok",
  "timestamp": "2026-01-23T10:30:00Z",
  "uptime": 123.456
}
```

### En Terminal Frontend

```
VITE v5.x.x  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### En Terminal Backend

```
Server running on port 3001
Connected to Airtable ✓
Listening for requests...
```

---

## 🚨 ÚLTIMA OPCIÓN: Reset Total

Si NADA funciona, hazlo completamente desde cero:

```bash
# 1. Elimina carpetas
rm -r node_modules
rm -r backend\node_modules
rm -r .vite
rm -r backend\.vite

# 2. Limpia cache
npm cache clean --force

# 3. Reinstala TODO
npm install
cd backend
npm install
cd ..

# 4. Verifica archivos clave existen
ls package.json
ls backend\package.json
ls .env.local
ls backend\.env.local

# 5. Ejecuta diagnóstico
.\DIAGNOSTICO.bat

# 6. Si dice OK, prueba:
npm run dev
# En otra terminal:
cd backend && npm run dev
```

---

## 📞 INFORMACIÓN PARA COMPARTIR

Cuando pidas ayuda, incluye esto:

```
Versión Node.js: [output de: node --version]
Versión npm: [output de: npm --version]
Error en terminal: [copiar errores completos]
Error en console (F12): [copiar errores rojos]
URL intentada: http://localhost:5173
¿Qué ves?: [página blanca, error, etc]
```

---

## ✅ CHECKLIST FINAL

Antes de decir "no funciona", verifica:

- [ ] Presionaste F12 en navegador
- [ ] Viste la pestaña "Console"
- [ ] Buscaste mensajes ROJOS
- [ ] Anotaste los errores completos
- [ ] Ejecutaste en DIFERENTES terminales
- [ ] No cerraste las terminales accidentalmente
- [ ] Esperaste 10 segundos después de ejecutar
- [ ] Abriste http (no https)
- [ ] Usaste localhost (no 127.0.0.1)
- [ ] Puertos correctos (5173 y 3001)

---

**Si aún no funciona, comparte:**

1. Capturas de pantalla de los errores
2. Output completo de las terminales
3. Lo que ves en Console (F12)
4. Resultado de ejecutar DIAGNOSTICO.bat

**Estamos aquí para ayudar! 🚀**
