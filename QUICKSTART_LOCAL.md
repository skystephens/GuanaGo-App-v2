# ⚡ Quick Start - Ejecutar GuanaGO Localmente (3 minutos)

## 🚀 Inicio Rápido Windows

### Paso 1: Abre PowerShell en el proyecto

```powershell
cd "C:\Users\<tu-usuario>\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
```

### Paso 2: Ejecuta el script de inicio

```powershell
.\INICIO_LOCAL.bat
```

**¡Listo!** Se abrirán automáticamente:
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:3001

---

## 🚀 Inicio Rápido Mac/Linux

```bash
cd ~/path/to/GuanaGO
chmod +x INICIO_LOCAL.sh
./INICIO_LOCAL.sh
```

---

## 🌐 Acceso a la Aplicación

Una vez iniciado, abre tu navegador:

| Servicio | URL |
|----------|-----|
| **Aplicación** | http://localhost:5173 |
| **Backend API** | http://localhost:3001/api |
| **Dashboard Socio** | http://localhost:5173/#/dashboard |

---

## 🔐 Credenciales de Prueba

```
Email: socio@test.com
Contraseña: Test123456!
```

---

## ⚙️ Sin Script Automático

Si el script no funciona, inicia manualmente en dos terminales:

**Terminal 1 - Frontend:**
```bash
npm install  # Primera vez
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install  # Primera vez
npm run dev
```

---

## ✅ Verificar Instalación

Abre http://localhost:5173 en tu navegador.

**Deberías ver:**
- ✅ Pantalla de inicio de GuanaGO
- ✅ Opción para iniciar sesión como socio
- ✅ Dashboard con métricas

---

## 🛠️ Herramientas Útiles

### Abre DevTools
Presiona **F12** para ver:
- Consola (errores)
- Network (peticiones API)
- Storage (localStorage)

### Ver Logs del Backend
En la terminal del backend deberías ver:
```
Server running on port 3001
Connected to Airtable ✓
```

---

## 🐛 Problemas Rápidos

| Problema | Solución |
|----------|----------|
| "Port already in use" | Cambia puerto: `npm run dev -- --port 5174` |
| "npm not found" | Instala Node.js desde nodejs.org |
| "Cannot connect to API" | Verifica que backend está corriendo |
| "Blank page" | Presiona F5 para refrescar |

---

## 📚 Guías Completas

Para más detalles, consulta:
- **[SETUP_LOCAL.md](SETUP_LOCAL.md)** - Guía completa
- **[GUIA_DASHBOARD_SOCIOS.md](GUIA_DASHBOARD_SOCIOS.md)** - Dashboard details
- **[AIRTABLE_CONFIG_LOCAL.md](AIRTABLE_CONFIG_LOCAL.md)** - Configuración Airtable

---

## 💾 Hotkeys Útiles

| Acción | Hotkey |
|--------|--------|
| Abrir DevTools | F12 |
| Refrescar | F5 |
| Limpiar caché | Ctrl+Shift+Delete |
| Detener servidor | Ctrl+C |

---

**¡A desarrollar! 🎉**
