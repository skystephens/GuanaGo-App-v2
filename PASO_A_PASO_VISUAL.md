# 📸 INSTRUCCIONES PASO A PASO CON PANTALLAS

## OBJETIVO
Que veas esto en http://localhost:5173:

```
╔════════════════════════════════════════╗
║          GUANAGO - INICIO              ║
║                                        ║
║  [Panel del Socio] [Configuración]    ║
║                                        ║
║  Bienvenido, Socio                     ║
║  tu@email.com                          ║
║                                        ║
║  Dashboard                             ║
║  Ingresos: $XXXX                       ║
║  Productos: XX                         ║
║  Ventas: XX                            ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## PASO 1: Abre PowerShell

**Donde ver:**
- Tecla Windows + R
- Escribe: `powershell`
- Enter

**Deberías ver:**
```
PS C:\Users\skysk>
```

---

## PASO 2: Navega a la carpeta

**Escribe:**
```powershell
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
```

**Deberías ver:**
```
PS C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main>
```

---

## PASO 3A: Opción FÁCIL - Script Automático

**Escribe:**
```powershell
.\DIAGNOSTICO.bat
```

**Deberías ver:**

```
╔════════════════════════════════════════╗
║     DIAGNÓSTICO GUANAGO LOCAL          ║
║     Detectando problemas...            ║
╚════════════════════════════════════════╝

[1/8] Verificando Node.js...
✓ Node.js: v18.x.x

[2/8] Verificando npm...
✓ npm: 9.x.x

[3/8] Verificando archivos...
✓ package.json encontrado
✓ backend/package.json encontrado
✓ .env.local encontrado
✓ backend/.env.local encontrado

[4/8] Verificando dependencias...
✓ node_modules encontrado
✓ backend/node_modules encontrado

[5/8] Verificando puertos...
✓ Puerto 5173 disponible
✓ Puerto 3001 disponible

[6/8] Verificando configuración Vite...
✓ vite.config.ts encontrado

[7/8] Verificando TypeScript...
✓ tsconfig.json encontrado

[8/8] Verificando backend...
✓ backend/server.js encontrado

╔════════════════════════════════════════╗
║  ✓ TODO PARECE OK                    ║
║  Puedes ejecutar: INICIO_LOCAL.bat  ║
╚════════════════════════════════════════╝
```

**Si ves ✓ en todo, continúa al PASO 4**
**Si ves ✗, necesitas PASO 3B**

---

## PASO 3B: Opción MANUAL - Si el diagnóstico muestra errores

### Si dice "✗ Node.js no instalado"
1. Ve a https://nodejs.org
2. Descarga LTS (versión recomendada)
3. Instala siguiendo el wizard
4. Reinicia PowerShell
5. Vuelve al PASO 1

### Si dice "✗ package.json no encontrado"
1. Verifica que estás en la carpeta correcta
2. Escribe: `ls` (para ver archivos)
3. Deberías ver `package.json` en el listado

### Si dice "⚠ Falta instalar: npm install"
```powershell
npm install
# Espera a que termine (puede tardar 2-3 minutos)

cd backend
npm install
cd ..
# Espera a que termine
```

---

## PASO 4: Ejecuta INICIO_LOCAL.bat

**En la misma terminal, escribe:**
```powershell
.\INICIO_LOCAL.bat
```

**Deberías ver:**

```
╔════════════════════════════════════════╗
║   GuanaGO - Desarrollo Local (DEV)    ║
║   Frontend + Backend + Airtable        ║
╚════════════════════════════════════════╝

✓ Frontend ejecutará en: http://localhost:5173
✓ Backend ejecutará en:  http://localhost:3001
✓ API disponible en:     http://localhost:3001/api

Instalando dependencias (si es necesario)...
📦 Iniciando Frontend (Vite)...
📦 Iniciando Backend (Express)...

╔════════════════════════════════════════╗
║        ✓ Servicios iniciados           ║
╚════════════════════════════════════════╝

🌐 Frontend: http://localhost:5173
🔌 Backend:  http://localhost:3001
📚 API Docs: http://localhost:3001/api/docs

💡 Consejos:
   - Abre el navegador y ve a: http://localhost:5173
```

**Si ves esto, ¡EXCELENTE! Continúa al PASO 5**

---

## PASO 5: Abre Navegador

**Abre Chrome, Firefox o Edge**

**En la barra de direcciones escribe:**
```
http://localhost:5173
```

**Presiona Enter**

---

## PASO 6: Esperado - ¿Qué ves?

### ✅ SI FUNCIONA - Verás:

```
┌─────────────────────────────────────┐
│ 🏠 GuanaGO                          │
├─────────────────────────────────────┤
│                                     │
│ Dashboard Socio                     │
│ ═════════════════════════════════   │
│                                     │
│ ┌─────────┐ ┌─────────┐             │
│ │ INGRESOS│ │PRODUCTOS│             │
│ │  $0 COP │ │    0    │             │
│ └─────────┘ └─────────┘             │
│                                     │
│ ┌─────────┐ ┌─────────┐             │
│ │ VENTAS  │ │ PAGOS   │             │
│ │   0     │ │  $0 COP │             │
│ └─────────┘ └─────────┘             │
│                                     │
│ [Crear Producto] [Ver Catálogo]     │
│                                     │
└─────────────────────────────────────┘
```

### ❌ SI NO FUNCIONA - Verás:

- **Página en blanco:** Presiona F12 → Console → Busca errores rojos
- **"Cannot reach server":** El backend no está corriendo
- **"Connection refused":** Puertos no están disponibles
- **404 Not Found:** Las rutas no están configuradas

---

## PASO 7: Si ves errores - DevTools (F12)

**Presiona F12** en el navegador

**Ve a la pestaña "Console"**

**Busca mensajes ROJOS (errores)**

**Ejemplo de error:**
```
❌ Failed to fetch
GET http://localhost:3001/api/partners
CORS error: ...
```

**Solución:**
1. Backend debe tener CORS configurado
2. Edita `backend/.env.local`
3. Verifica: `CORS_ORIGINS=http://localhost:5173`

---

## PASO 8: Verificar Backend está corriendo

**Abre OTRA Terminal (Ctrl+Shift+N en PowerShell)**

**Escribe:**
```powershell
netstat -ano | findstr :3001
```

**Deberías ver algo como:**
```
TCP    127.0.0.1:3001    LISTENING    12345
```

**Si NO ves nada:** El backend NO está corriendo

**Solución:**
```powershell
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main\backend"
npm run dev
```

---

## PASO 9: Verifica Backend responde

**En navegador, abre:**
```
http://localhost:3001/api/health
```

**Deberías ver (en formato JSON):**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

**Si ves esto, Backend ✅ está bien**

---

## PASO 10: Login en la Aplicación

**En http://localhost:5173 escribe:**
- Email: `socio@test.com`
- Contraseña: `Test123456!`

**Click en "Ingresar"**

**Deberías ver el Dashboard con datos**

---

## 🆘 SI AÚN NO FUNCIONA

### Copila ESTO y comparte:

1. **Screenshot de lo que ves**
   - Windows + Shift + S para captura

2. **Terminal Frontend (todo el output)**
   - Copia desde `VITE v5.x.x` en adelante

3. **Terminal Backend (todo el output)**
   - Copia desde `Server running` en adelante

4. **Console en navegador (F12)**
   - Copia todos los errores ROJOS

5. **Resultado de:**
   ```bash
   netstat -ano | findstr :5173
   netstat -ano | findstr :3001
   ```

---

## ✅ RESUMEN

```
1. Abre PowerShell
2. cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
3. .\DIAGNOSTICO.bat
4. .\INICIO_LOCAL.bat
5. Abre navegador en http://localhost:5173
6. Presiona F12 si hay errores
7. Comparte screenshot si no funciona
```

**¡Debería funcionar en 5 minutos! 🚀**
