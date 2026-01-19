import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Import routes
import authRoutes from './backend/routes/auth.js';
import servicesRoutes from './backend/routes/services.js';
import reservationsRoutes from './backend/routes/reservations.js';
import directoryRoutes from './backend/routes/directory.js';
import chatbotRoutes from './backend/routes/chatbot.js';
import taxisRoutes from './backend/routes/taxis.js';
import tasksRoutes from './backend/routes/tasks.js';
import availabilityRoutes from './backend/routes/availability.js';
import systemRoutes from './backend/routes/system.js';

// Import middleware
import { requestLogger } from './backend/middleware/logger.js';
import { errorHandler, notFound } from './backend/middleware/errorHandler.js';
import { config } from './backend/config.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = config.port;

// Verificar que dist existe
const distPath = path.join(__dirname, 'dist');
console.log(`📁 Sirviendo desde: ${distPath}`);
console.log(`📁 Existe dist: ${fs.existsSync(distPath)}`);

if (fs.existsSync(distPath)) {
  console.log(`📂 Archivos en dist:`, fs.readdirSync(distPath));
}

// ==================== MIDDLEWARE ====================
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static files
app.use(express.static(distPath, { 
  maxAge: '1h',
  etag: false 
}));

// ==================== API ROUTES ====================

import validateAdminPinRoutes from './backend/routes/validateAdminPin.js';
import debugRoutes from './backend/routes/debug.js';
import userAuthRoutes from './backend/routes/userAuth.js';
console.log('🔧 Configurando rutas API...');

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// Diagnóstico de configuración (para verificar variables de entorno en producción)
app.get('/api/config-check', (req, res) => {
  const airtableKey = process.env.AIRTABLE_API_KEY;
  const airtableBase = process.env.AIRTABLE_BASE_ID;
  
  res.json({
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    airtable: {
      hasApiKey: Boolean(airtableKey),
      apiKeyLength: airtableKey?.length || 0,
      apiKeyPrefix: airtableKey?.substring(0, 6) || 'N/A',
      hasBaseId: Boolean(airtableBase),
      baseId: airtableBase || 'NOT_SET'
    },
    envVarsLoaded: Object.keys(process.env).filter(k => k.startsWith('AIRTABLE') || k.startsWith('VITE')).length
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User authentication routes (register/login)
app.use('/api/user-auth', userAuthRoutes);

// Admin PIN validation route
app.use('/api/validate-admin-pin', validateAdminPinRoutes);

// DEBUG routes (desarrollo)
app.use('/api/debug', debugRoutes);

// Services routes
app.use('/api/services', servicesRoutes);

// Reservations routes
app.use('/api/reservations', reservationsRoutes);

// Availability Requests routes
app.use('/api/availability-requests', availabilityRoutes);

// Directory routes
app.use('/api/directory', directoryRoutes);

// Chatbot routes
app.use('/api/chatbot', chatbotRoutes);

// Taxi routes
app.use('/api/taxis', taxisRoutes);

// Tasks routes (Panel de Tareas + Make.com)
app.use('/api/tasks', tasksRoutes);

// System routes (estructura backend)
app.use('/api/system', systemRoutes);

console.log('✅ Rutas API configuradas');

// ==================== SPA FALLBACK ====================
// Servir index.html para cualquier ruta no API
app.use((req, res, next) => {
  // No aplicar fallback a rutas de API
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');
  console.log(`📄 Sirviendo SPA: ${req.path} -> index.html`);
  
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(indexPath);
  } else {
    console.error(`❌ index.html no encontrado en ${indexPath}`);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GuanaGO - Build Required</title>
        </head>
        <body>
          <h1>🚧 App no construida</h1>
          <p>Ejecuta: <code>npm run build</code></p>
          <p>O visita: <a href="/api/health">/api/health</a> para verificar la API</p>
        </body>
      </html>
    `);
  }
});

// ==================== ERROR HANDLING ====================
app.use(notFound);
app.use(errorHandler);

// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
  console.log('\n🚀 =======================================');
  console.log(`   GuanaGO Backend Server`);
  console.log('   =======================================');
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   📊 Environment: ${config.nodeEnv}`);
  console.log(`   📡 API Base: http://localhost:${PORT}/api`);
  console.log('   =======================================\n');
}).on('error', (err) => {
  console.error('❌ Error al iniciar servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso`);
    process.exit(1);
  }
});
