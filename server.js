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

const validateAdminPinRoutes = require('./backend/routes/validateAdminPin.js');
console.log('🔧 Configurando rutas API...');

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Admin PIN validation route
app.use('/api/validate-admin-pin', validateAdminPinRoutes);

// Services routes
app.use('/api/services', servicesRoutes);

// Reservations routes
app.use('/api/reservations', reservationsRoutes);

// Directory routes
app.use('/api/directory', directoryRoutes);

// Chatbot routes
app.use('/api/chatbot', chatbotRoutes);

// Taxi routes
app.use('/api/taxis', taxisRoutes);

// Tasks routes (Panel de Tareas + Make.com)
app.use('/api/tasks', tasksRoutes);

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
app.listen(PORT, () => {
  console.log('\n🚀 =======================================');
  console.log(`   GuanaGO Backend Server`);
  console.log('   =======================================');
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   📊 Environment: ${config.nodeEnv}`);
  console.log(`   📡 API Base: http://localhost:${PORT}/api`);
  console.log('   =======================================\n');
});
