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
import accommodationsRoutes from './backend/routes/accommodations.js';
import agentRoutes from './backend/routes/agent.js';
import quotationsRoutes from './backend/routes/quotations.js';
import storageRoutes from './backend/routes/storage.js';
import coworkRoutes from './backend/routes/cowork.js';
import publicQuoteRoutes from './backend/routes/publicQuote.js';
import publicVoucherRoutes from './backend/routes/publicVoucher.js';
import paymentsRoutes from './backend/routes/payments.js';

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
import firebaseAuthRoutes from './backend/routes/firebaseAuth.js';
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

// Firebase authentication routes
app.use('/api/firebase-auth', firebaseAuthRoutes);

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

// Accommodations submissions routes
app.use('/api/accommodations', accommodationsRoutes);

// Agent IA multi-modo (turista / cotizador / admin) + Firestore
app.use('/api/agent', agentRoutes);

// Quotations (cotizaciones B2B)
app.use('/api/quotations', quotationsRoutes);

// Cowork B2B — catálogo OTA y calculadora grupos
app.use('/api/cowork', coworkRoutes);

// Firebase Storage (imágenes de servicios)
app.use('/api/storage', storageRoutes);

console.log('✅ Rutas API configuradas');

// ==================== GUIASAI B2B ====================
const agenciasDistPath = path.join(__dirname, 'dist', 'agencias');

// Proxy de Airtable para GuiaSAI-B2B (reemplaza proxy.php de WordPress)
// El frontend llama: /agencias/api/proxy.php?path=/v0/BASE/TABLE?...
app.all('/agencias/api/proxy.php', async (req, res) => {
  const airtablePath = req.query.path;
  if (!airtablePath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  if (!AIRTABLE_API_KEY) {
    return res.status(503).json({ error: 'AIRTABLE_API_KEY not configured on server' });
  }

  try {
    const targetUrl = `https://api.airtable.com${airtablePath}`;
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    // Pasar body en PATCH/POST
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const airtableRes = await fetch(targetUrl, fetchOptions);
    const data = await airtableRes.json();
    res.status(airtableRes.status).json(data);
  } catch (err) {
    console.error('❌ GuiaSAI Airtable proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Archivos estáticos de GuiaSAI-B2B
app.use('/agencias', express.static(agenciasDistPath, { maxAge: '1h', etag: false }));

// SPA fallback para GuiaSAI-B2B
app.use('/agencias', (req, res) => {
  const indexPath = path.join(agenciasDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('GuiaSAI B2B not built. Run: cd guiasai-b2b && npm run build');
  }
});

// ==================== PUBLIC QUOTATION PAGE ====================
// /cotizacion/:id — página pública sin auth (compartible con clientes)
app.use('/cotizacion', publicQuoteRoutes);

// ==================== PUBLIC VOUCHER PAGE ====================
// /voucher/:id — voucher público con punto de encuentro + Google Maps
app.use('/voucher', publicVoucherRoutes);

// ==================== PAYMENT LINKS ====================
// POST /api/payments/create   → genera link de pago firmado (PayU)
// GET  /pagar/:referenceCode  → página de pago auto-submit a PayU
// POST /api/payments/webhook  → confirmación de pago desde PayU
app.use('/api/payments', paymentsRoutes);
app.use('/pagar', paymentsRoutes);

// ==================== SPA FALLBACK ====================
// Servir index.html para cualquier ruta no API (GuanaGO)
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

// ==================== AI ASSISTANT (Claude proxy) ====================
app.post('/api/ai/chat', async (req, res) => {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  const { messages, systemPrompt, model: requestedModel } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Se requiere array de messages' });
  }

  // Preferir Claude, fallback a Groq si no hay key
  if (ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

      const response = await anthropic.messages.create({
        model: requestedModel || 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt || 'Eres un asistente de GuanaGO para San Andrés Isla.',
        messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
      });

      return res.json({
        reply: response.content[0]?.text || '',
        model: response.model,
        usage: response.usage,
      });
    } catch (err) {
      console.error('❌ Claude chat error:', err.message);
      // si falla Claude, intenta con Groq
    }
  }

  // Fallback: Groq
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'No hay ANTHROPIC_API_KEY ni GROQ_API_KEY en .env' });
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt || 'Eres un asistente de proyecto.' },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || '', model: 'llama-3.3-70b (fallback)' });
  } catch (err) {
    console.error('AI chat fallback error:', err);
    res.status(500).json({ error: 'Error al contactar el servicio de IA' });
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
