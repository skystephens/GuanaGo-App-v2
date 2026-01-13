<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🌴 GuanaGO - Plataforma Turística de San Andrés Isla

Aplicación web progresiva (PWA) para reservas turísticas con integración blockchain, IA y gestión completa de operaciones.

View your app in AI Studio: https://ai.studio/apps/drive/1fxv8VcDkjF8Xkwe-myRjbJVDCUs9kqMI

## 🚀 Inicio Rápido

**Prerequisites:** Node.js v18+

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

**Backend (.env):**
```bash
cp .env.example .env
# Editar .env con tus webhooks de Make.com
```

**Frontend (.env.local):**
```bash
cp .env.local.example .env.local
# Configurar VITE_API_URL y GEMINI_API_KEY
```

### 3. Ejecutar la aplicación

**Solo Frontend:**
```bash
npm run dev
```

**Solo Backend:**
```bash
npm run dev:server
```

**Frontend + Backend (Recomendado):**
```bash
npm run dev:all
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- API Tester: Abrir `backend/api-tester.html` en el navegador

## 📚 Documentación

- **[GUIA_INICIO_BACKEND.md](GUIA_INICIO_BACKEND.md)** - Guía rápida del backend
- **[CONFIGURACION_MAKE.md](CONFIGURACION_MAKE.md)** - Configuración de Make.com
- **[RESUMEN_BACKEND.md](RESUMEN_BACKEND.md)** - Resumen completo del backend
- **[backend/README.md](backend/README.md)** - Documentación completa de la API
- **[backend/INTEGRACION_FRONTEND.ts](backend/INTEGRACION_FRONTEND.ts)** - Ejemplos de integración
- **[ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md)** - Arquitectura técnica

## 🏗️ Estructura del Proyecto

```
GuanaGo-App/
├── backend/              # Backend Express.js
│   ├── routes/          # Endpoints API
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Auth, logging, errores
│   ├── utils/           # Utilidades
│   └── api-tester.html  # Herramienta de testing
├── components/          # Componentes React
├── pages/              # Páginas de la app
├── services/           # Servicios API
├── context/            # Context providers
└── server.js           # Servidor Express principal
```

## 🔌 API Endpoints

### Públicos
- `GET /api/health` - Estado del servidor
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/services` - Listar servicios turísticos
- `GET /api/directory` - Directorio de lugares
- `POST /api/chatbot/message` - Chatbot IA

### Protegidos (requieren autenticación)
- `GET /api/auth/profile` - Perfil del usuario
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations/my-reservations` - Mis reservas
- `POST /api/taxis/request` - Solicitar taxi

Ver documentación completa en [backend/README.md](backend/README.md)

## 🧪 Testing

### API Tester Visual
1. Iniciar servidor: `npm run dev:server`
2. Abrir en navegador: `backend/api-tester.html`
3. Probar endpoints con la interfaz gráfica

### cURL
```bash
# Health check
curl http://localhost:5000/api/health

# Listar servicios
curl http://localhost:5000/api/services

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## ⚙️ Configuración

### Make.com Webhooks
1. Crear webhooks en Make.com para cada módulo
2. Actualizar `.env` con las URLs:
   ```env
   MAKE_WEBHOOK_SERVICES=https://hook.us1.make.com/...
   MAKE_WEBHOOK_RESERVATIONS=https://hook.us1.make.com/...
   ```
3. Ver guía completa: [CONFIGURACION_MAKE.md](CONFIGURACION_MAKE.md)

### Hedera Blockchain (Opcional)
```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_KEY
HEDERA_NETWORK=testnet
```

## 🚢 Deploy

### Render.com
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Agregar variables de entorno del archivo `.env`

Ver más: [README_DEPLOY.md](README_DEPLOY.md)

## 🛠️ Stack Tecnológico

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Mapbox GL

**Backend:**
- Express.js
- JWT Authentication
- CORS
- Nodemon (dev)

**Integraciones:**
- Make.com (automation)
- Airtable (database)
- Hedera (blockchain)
- Gemini AI (chatbot)

## 📊 Características

✅ Sistema completo de autenticación JWT  
✅ Gestión de servicios turísticos  
✅ Sistema de reservas con QR  
✅ Chatbot con IA (RAG)  
✅ Directorio de lugares  
✅ Gestión de taxis  
✅ Panel de administración  
✅ Dashboard para partners  
✅ Integración blockchain  
✅ API REST completa  

## 🎯 Scripts Disponibles

```bash
npm run dev              # Frontend (Vite)
npm run dev:server       # Backend (Express + Nodemon)
npm run dev:all         # Frontend + Backend simultáneo
npm run build           # Build para producción
npm start               # Servidor de producción
npm run preview         # Preview del build
```

## 🐛 Troubleshooting

### Puerto ocupado
```bash
# Cambiar puerto en .env
PORT=3000
```

### Error de CORS
Verificar `CORS_ORIGIN` en `.env`

### Webhooks no responden
1. Verificar que los escenarios estén activos en Make.com
2. Revisar los logs en Make.com
3. Verificar las URLs en `.env`

## 📞 Soporte

- **Issues**: Reportar en GitHub Issues
- **Documentación**: Ver carpeta `/backend` y archivos `.md`
- **API Tester**: `backend/api-tester.html`

## 📝 Licencia

Proyecto privado - GuanaGO 2026

---

**¡Desarrollado con ❤️ para San Andrés Isla!** 🏝️
