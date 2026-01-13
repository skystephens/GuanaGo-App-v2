#!/usr/bin/env node

/**
 * 🧪 Testing Suite para Make.com Webhooks - GuanaGO Auth & Leads
 * Escenario 1: Puente Auth & Leads (Backend <-> Make <-> Airtable)
 * 
 * Flujo:
 * 1. Webhook recibe: email, nombre, metodo_auth, avatar_url, action
 * 2. Make busca en Airtable por Email
 * 3. Router:
 *    - Nuevo Usuario (bundles=0): Crea registro, asigna 20 GUANA, genera Guana_ID
 *    - Usuario Existente (bundles>0): Actualiza UltimaInteraccion, retorna saldo actual
 * 
 * Uso:
 *   node tests/make-webhook-tests.mjs              # Ejecutar todos los tests
 *   node tests/make-webhook-tests.mjs newUserRegistration  # Ejecutar un test específico
 * 
 * Versión ESM para Node.js 18+ (usa fetch nativo)
 */

// Configuración - URL del Webhook de Make.com
const MAKE_WEBHOOK_URL = 'https://hook.us1.make.com/8lz93j5qs3m5qu4cakeukxeq6hhgx6hc';
const DELAY_BETWEEN_TESTS = 3000; // 3 segundos entre tests para no saturar Make

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  header: () => console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
  separator: () => console.log(`${colors.cyan}───────────────────────────────────────${colors.reset}`)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tests - Casos de prueba para el escenario Auth & Leads
const testCases = {
  // Test 1: Registro de nuevo usuario (debería crear en Airtable y retornar 20 GUANA)
  newUserRegistration: {
    name: '🆕 Nuevo Usuario - Registro',
    request: {
      email: `test_${Date.now()}@guanago.com`,
      nombre: 'Juan Test García',
      metodo_auth: 'email',
      avatar_url: 'https://ui-avatars.com/api/?name=Juan+Test&background=random',
      action: 'register'
    },
    description: 'Simula registro de nuevo usuario → Espera: action=registered, saldo=20',
    expectedAction: 'registered',
    expectedSaldo: 20
  },

  // Test 2: Login de usuario existente (usa un email que YA existe en Airtable)
  existingUserLogin: {
    name: '🔄 Usuario Existente - Login',
    request: {
      email: 'usuario@existente.com', // ⚠️ CAMBIAR por un email real en tu Airtable
      nombre: 'Usuario Existente',
      metodo_auth: 'email',
      avatar_url: 'https://ui-avatars.com/api/?name=Usuario+Existente&background=random',
      action: 'login'
    },
    description: 'Simula login de usuario existente → Espera: action=logged_in, saldo=actual',
    expectedAction: 'logged_in'
  },

  // Test 3: Autenticación OAuth Google (nuevo usuario)
  googleAuth: {
    name: '🔐 OAuth Google - Nuevo Usuario',
    request: {
      email: `google_${Date.now()}@gmail.com`,
      nombre: 'Google Test User',
      metodo_auth: 'google',
      avatar_url: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      action: 'register'
    },
    description: 'Simula registro vía Google OAuth → Espera: action=registered, saldo=20',
    expectedAction: 'registered',
    expectedSaldo: 20
  },

  // Test 4: Login rápido con el mismo email (debería retornar logged_in)
  repeatLogin: {
    name: '🔁 Login Repetido (mismo usuario)',
    request: {
      email: 'test_repeat@guanago.com',
      nombre: 'Usuario Repetido',
      metodo_auth: 'email',
      avatar_url: 'https://ui-avatars.com/api/?name=Repeat&background=random',
      action: 'login'
    },
    description: 'Usuario que ya fue registrado → Espera: action=logged_in',
    expectedAction: 'logged_in'
  }
};

async function runTest(testName, testConfig, testIndex) {
  log.separator();
  log.title(`Test ${testIndex + 1}: ${testConfig.name}`);
  console.log(`${colors.cyan}Descripción:${colors.reset} ${testConfig.description}`);
  console.log(`${colors.cyan}Request Body:${colors.reset}`);
  log.json(testConfig.request);
  
  try {
    log.info(`Enviando POST a Make.com...`);
    const startTime = Date.now();
    
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig.request)
    });

    const elapsed = Date.now() - startTime;
    
    // Intentar parsear JSON, si falla mostrar texto
    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw_response: responseText };
    }
    
    console.log(`${colors.cyan}Tiempo de respuesta:${colors.reset} ${elapsed}ms`);
    
    if (response.ok) {
      log.success(`HTTP ${response.status} - Respuesta recibida`);
      console.log(`${colors.cyan}Response Body:${colors.reset}`);
      log.json(data);
      
      // Validar respuesta esperada
      if (testConfig.expectedAction && data.action) {
        if (data.action === testConfig.expectedAction) {
          log.success(`Action correcto: ${data.action}`);
        } else {
          log.warning(`Action diferente. Esperado: ${testConfig.expectedAction}, Recibido: ${data.action}`);
        }
      }
      
      if (testConfig.expectedSaldo && data.saldo !== undefined) {
        if (data.saldo === testConfig.expectedSaldo) {
          log.success(`Saldo correcto: ${data.saldo} GUANA`);
        } else {
          log.warning(`Saldo diferente. Esperado: ${testConfig.expectedSaldo}, Recibido: ${data.saldo}`);
        }
      }
      
      // Verificar campos esenciales
      if (data.guana_id) {
        log.success(`Guana_ID asignado: ${data.guana_id}`);
      }
      if (data.db_id) {
        log.success(`DB Record ID: ${data.db_id}`);
      }
      
      return { success: true, testName, response: data, elapsed };
    } else {
      log.error(`HTTP ${response.status}`);
      log.json(data);
      return { success: false, testName, error: data, elapsed };
    }
  } catch (error) {
    log.error(`Error de conexión: ${error.message}`);
    return { success: false, testName, error: error.message };
  }
}

async function runAllTests() {
  log.header();
  log.title('🧪 GuanaGO - Auth & Leads Webhook Test Suite');
  log.title('   Escenario 1: Make.com <-> Airtable');
  log.header();
  console.log(`${colors.cyan}Webhook URL:${colors.reset} ${MAKE_WEBHOOK_URL}`);
  console.log(`${colors.cyan}Timestamp:${colors.reset} ${new Date().toISOString()}\n`);

  const results = [];
  const testEntries = Object.entries(testCases);

  for (let i = 0; i < testEntries.length; i++) {
    const [testKey, testConfig] = testEntries[i];
    const result = await runTest(testKey, testConfig, i);
    results.push(result);
    
    if (i < testEntries.length - 1) {
      console.log(`\n${colors.yellow}⏳ Esperando ${DELAY_BETWEEN_TESTS/1000}s antes del siguiente test...${colors.reset}\n`);
      await sleep(DELAY_BETWEEN_TESTS);
    }
  }

  // Resumen
  log.header();
  log.title('📊 RESUMEN DE RESULTADOS');
  log.header();

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const validElapsed = results.filter(r => r.elapsed);
  const avgTime = validElapsed.length > 0 
    ? validElapsed.reduce((a, b) => a + b.elapsed, 0) / validElapsed.length 
    : 0;

  console.log(`${colors.green}✓ Exitosos: ${successCount}${colors.reset}`);
  console.log(`${colors.red}✗ Fallidos: ${failCount}${colors.reset}`);
  console.log(`${colors.cyan}⏱ Tiempo promedio: ${Math.round(avgTime)}ms${colors.reset}`);
  
  log.separator();
  console.log(`\n${colors.bright}Próximos pasos:${colors.reset}`);
  console.log(`1. Verifica en Airtable que los registros se crearon correctamente`);
  console.log(`2. Confirma que el Guana_ID tiene formato GGO-26-XXXX`);
  console.log(`3. Revisa que el Saldo_GUANA sea 20 para nuevos usuarios\n`);
}

// Función para ejecutar un solo test (útil para debugging)
async function runSingleTest(testKey) {
  const testConfig = testCases[testKey];
  if (!testConfig) {
    console.log(`${colors.red}Test no encontrado: ${testKey}${colors.reset}`);
    console.log(`Tests disponibles: ${Object.keys(testCases).join(', ')}`);
    return;
  }
  
  log.header();
  log.title(`🧪 Test Individual: ${testConfig.name}`);
  log.header();
  
  await runTest(testKey, testConfig, 0);
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.length > 0 && args[0] !== '--all') {
  runSingleTest(args[0]).catch(console.error);
} else {
  runAllTests().catch(console.error);
}
