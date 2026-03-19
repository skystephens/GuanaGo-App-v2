╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                   🌴 GUANAGO SOCIOS - BACKEND LISTO ✅                       ║
║                                                                               ║
║                   Sistema de Gestión para Aliados Locales                    ║
║                   (Restaurantes, Alojamientos, Servicios)                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🚀 PARA EMPEZAR (3 PASOS SIMPLES)                                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

PASO 1️⃣: ABRE POWERSHELL

  Haz clic en el menú Inicio
  Busca: "PowerShell"
  Abre: "Windows PowerShell"


PASO 2️⃣: NAVEGA A LA CARPETA

  Copia y pega esto en PowerShell:

    cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"


PASO 3️⃣: EJECUTA EL SCRIPT

  Copia y pega esto en PowerShell:

    .\INICIO_LOCAL.bat

  ✨ ¡El script hará el resto automáticamente!


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ⏱️ QUE PASA CUANDO EJECUTAS EL SCRIPT                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

[✓] PASO 1: Verifica que Node.js esté instalado
[✓] PASO 2: Instala dependencias del Backend (si faltan)
[✓] PASO 3: Instala dependencias del Frontend (si faltan)
[✓] PASO 4: Libera puertos 3001 y 5173 (si están ocupados)
[✓] PASO 5: Abre Backend en ventana nueva (puerto 3001)
[✓] PASO 6: Abre Frontend en ventana nueva (puerto 5173)
[✓] PASO 7: Abre navegador automáticamente


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📍 QUE VAS A VER DESPUÉS                                                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

VAN A ABRIRSE DOS VENTANAS DE CONSOLA:

  VENTANA 1: Backend
  ┌─────────────────────────────────────────┐
  │ > npm run dev                           │
  │                                         │
  │ ╔════════════════════════════════════╗ │
  │ ║   GuanaGO Backend Server 🚀       ║ │
  │ ╚════════════════════════════════════╝ │
  │                                         │
  │ ✓ Servidor escuchando en:              │
  │   http://localhost:3001                │
  │ ✓ API base: http://localhost:3001/api  │
  │                                         │
  └─────────────────────────────────────────┘


  VENTANA 2: Frontend
  ┌─────────────────────────────────────────┐
  │ > npm run dev                           │
  │                                         │
  │ VITE v5.x.x ready in 1000 ms           │
  │                                         │
  │ ➜ Local: http://localhost:5173/        │
  │                                         │
  └─────────────────────────────────────────┘


Y SE ABRIRÁ AUTOMÁTICAMENTE TU NAVEGADOR:

  🌐 http://localhost:5173    ← La app en React
  🌐 http://localhost:3001    ← El API en Express


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔓 PRUEBA EL LOGIN                                                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Email:      socio@test.com
Contraseña: Test123456!

Después de hacer login deberías ver:
  ✓ Dashboard con estadísticas
  ✓ Ventas recientes
  ✓ Top 5 productos
  ✓ Acceso a configuración


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🧪 VERIFICAR QUE FUNCIONA                                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

En una TERCERA terminal (cmd, PowerShell o Git Bash):

  # Test 1: Health check
  curl http://localhost:3001/api/health

  Resultado esperado:
  {
    "status": "OK",
    "uptime": 45.2,
    "environment": "development",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }


  # Test 2: API Root
  curl http://localhost:3001/api

  Resultado esperado:
  {
    "name": "GuanaGO Backend API",
    "version": "1.0.0",
    "status": "running",
    "endpoints": { ... }
  }


  # Test 3: Login
  curl -X POST http://localhost:3001/api/partners/login ^
    -H "Content-Type: application/json" ^
    -d "{\"email\": \"socio@test.com\", \"password\": \"Test123456!\"}"

  Resultado esperado:
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "partner": { ... }
  }


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📊 LO QUE ESTÁ FUNCIONANDO                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

✅ Express Server (Node.js)
✅ CORS configurado
✅ Health Checks
✅ Login y Register endpoints
✅ Dashboard Statistics
✅ Sales y Products endpoints
✅ Perfil management
✅ Mock data de prueba
✅ Error handling
✅ Request logging
✅ React Frontend
✅ Vite dev server
✅ TypeScript support


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🐛 ¿ALGO NO FUNCIONA?                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Problema 1: "Node.js not found"
├─ Solución: Instala Node.js desde https://nodejs.org/
└─ Luego reinicia PowerShell

Problema 2: "Puerto 3001 ya está en uso"
├─ Solución: El script intenta liberarlo automáticamente
├─ Si falla, cierra todas las ventanas de PowerShell
└─ Vuelve a ejecutar .\INICIO_LOCAL.bat

Problema 3: "npm install falla"
├─ Solución 1: Elimina node_modules y package-lock.json
├─ Solución 2: Abre PowerShell como Administrador
└─ Solución 3: Ejecuta npm cache clean --force

Problema 4: "Frontend muestra página en blanco"
├─ Abre DevTools: Presiona F12
├─ Ve a Console y busca errores rojos
├─ Verifica que Backend esté corriendo en http://localhost:3001/api
└─ Revisa backend/.env.local y CORS_ORIGINS

Problema 5: "Backend no responde"
├─ Revisa que la ventana del Backend no esté congelada
├─ Presiona Enter en la ventana del Backend
└─ Cierra todo y ejecuta nuevamente .\INICIO_LOCAL.bat


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🎯 ARCHIVOS IMPORTANTES                                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📄 Para leer primero:
  • QUICKSTART_BACKEND.md       ← Lee esto
  • README_BACKEND.md            ← O esto

🚀 Para ejecutar:
  • INICIO_LOCAL.bat             ← Ejecuta esto

💻 Código del Backend:
  • backend/server.js            ← Servidor Express
  • backend/routes/partnerRoutes.js  ← Rutas de API
  • backend/package.json         ← Dependencias

⚙️ Configuración:
  • backend/.env.local           ← Variables de ambiente

📊 Documentación Técnica:
  • ARQUITECTURA_SISTEMA_COMPLETO.md
  • AIRTABLE_CONFIG_LOCAL.md
  • TROUBLESHOOTING_LOCAL.md
  • INDICE_ARCHIVOS_BACKEND.md


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📋 ENDPOINTS DISPONIBLES                                                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Autenticación:
  POST   /api/partners/login
  POST   /api/partners/register

Perfil:
  GET    /api/partners/:id
  PUT    /api/partners/:id

Dashboard:
  GET    /api/partners/:id/dashboard/stats
  GET    /api/partners/:id/sales/recent
  GET    /api/partners/:id/products/top

Productos:
  GET    /api/partners/:id/products
  POST   /api/partners/:id/products

Ventas:
  GET    /api/partners/:id/sales

Pagos:
  GET    /api/partners/:id/payouts

Salud:
  GET    /api/health
  GET    /api/health/ping


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🎓 PRÓXIMOS PASOS                                                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. ✅ Ejecuta .\INICIO_LOCAL.bat
2. ✅ Verifica que Todo funciona
3. ✅ Prueba el login con socio@test.com
4. ✅ Explora el Dashboard
5. ⏳ Conecta Airtable real (reemplaza mock data)
6. ⏳ Configura Make.com webhooks
7. ⏳ Agrega más endpoints según necesites
8. ⏳ Deploy a producción


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💡 TIPS                                                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

• Hot Reload: Los cambios en el código se ven automáticamente
• Abre DevTools: F12 en el navegador para ver console y debugger
• Revisa Logs: Las ventanas de PowerShell muestran todos los requests
• Mock Data: Cambiar credenciales en backend/routes/partnerRoutes.js
• Puertos: Frontend 5173, Backend 3001 (no cambiar si es posible)
• Tokens: Expire después de 30 días (configurar en backend/.env.local)


╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                  ✨ ¡LISTO PARA COMENZAR! ✨                                 ║
║                                                                               ║
║              Ejecuta esto en PowerShell:                                     ║
║                                                                               ║
║              cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\            ║
║                       GuanaGo-App-Enero-main"                                ║
║                                                                               ║
║              .\INICIO_LOCAL.bat                                              ║
║                                                                               ║
║              Y estarás listo en segundos! 🚀                                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝


ARCHIVO: README_INICIO.txt
VERSIÓN: 1.0.0
FECHA: Enero 2026
ESTADO: ✅ Backend Funcional - Listo para Ejecutar
