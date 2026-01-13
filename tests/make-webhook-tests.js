#!/usr/bin/env node

/**
 * 🧪 Testing Suite para Make.com Webhooks - GuanaGO Auth & Leads
 * 
 * Este script prueba el escenario "Auth & Leads Sync" en Make.com
 * Simula: Nuevo usuario (registro) y usuario existente (login)
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración
const MAKE_WEBHOOK_URL = 'https://hook.us1.make.com/8lz93j5qs3m5qu4cakeukxeq6hhgx6hc';
const DELAY_BETWEEN_TESTS = 2000; // ms

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// ==================== UTILIDADES ====================

const log = {
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
  separator: () => console.log(`${colors.cyan}───────────────────────────────────────${colors.reset}`)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== TEST CASES ====================

const testCases = {
  // Test 1: Nuevo Usuario (Registro)
  newUserRegistration: {
    name: 'Nuevo Usuario - Registro',
    request: {
      email: `testuser_${Date.now()}@example.com`,
      nombre: 'Juan Pérez García',
      metodo_auth: 'email',
      avatar_url: 'https://api.example.com/avatars/default.png',
      action: 'register'
    },
    expectedResponse: {
      status: 'success',
      action: 'registered',
      should_have: ['db_id', 'guana_id', 'saldo']
    },
    description: 'Simula un registro de nuevo usuario'
  },

  // Test 2: Usuario Existente (Login)
  existingUserLogin: {
    name: 'Usuario Existente - Login',
    request: {
      email: 'existing_user@example.com',
      nombre: 'Usuario Existente',
      metodo_auth: 'email',
      avatar_url: 'https://api.example.com/avatars/existing.png',
      action: 'login'
    },
    expectedResponse: {
      status: 'success',
      action: 'logged_in',
      should_have: ['db_id', 'guana_id', 'saldo']
    },
    description: 'Simula login de usuario existente'
  },

  // Test 3: Autenticación Google (simulado)
  googleAuth: {
    name: 'Autenticación Google',
    request: {
      email: `google_user_${Date.now()}@gmail.com`,
      nombre: 'Google Usuario',
      metodo_auth: 'google',
      avatar_url: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      action: 'register'
    },
    expectedResponse: {
      status: 'success',
      action: 'registered',
      should_have: ['db_id', 'guana_id', 'saldo']
    },
    description: 'Simula autenticación mediante Google'
  },

  // Test 4: Actualización de Usuario
  userUpdate: {
    name: 'Actualización de Usuario',
    request: {
      email: 'update_test@example.com',
      nombre: 'Usuario Actualizado',
      metodo_auth: 'email',
      avatar_url: 'https://api.example.com/avatars/updated.png',
      action: 'login'
    },
    expectedResponse: {
      status: 'success',
      action: 'logged_in',
      should_have: ['db_id', 'guana_id', 'saldo']
    },
    description: 'Simula actualización de última interacción'
  }
};

// ==================== FUNCIONES DE TESTING ====================

/**
 * Ejecutar un test contra el webhook
 */
async function runTest(testName, testConfig, testIndex) {
  log.separator();
  log.title(`Test ${testIndex + 1}: ${testConfig.name}`);
  console.log(`${colors.cyan}Descripción:${colors.reset} ${testConfig.description}`);
  
  try {
    log.info(`Enviando request a Make.com...`);
    log.info(`Email: ${testConfig.request.email}`);
    
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig.request)
    });

    const data = await response.json();
    
    log.info(`Status HTTP: ${response.status}`);
    
    // Validar respuesta
    if (response.ok) {
      log.success(`Webhook respondió correctamente`);
      
      // Validar campos esperados
      let allFieldsPresent = true;
      for (const field of testConfig.expectedResponse.should_have) {
        if (data[field]) {
          log.success(`Campo presente: ${field} = ${data[field]}`);
        } else {
          log.error(`Campo faltante: ${field}`);
          allFieldsPresent = false;
        }
      }

      if (data.status === testConfig.expectedResponse.status) {
        log.success(`Status correcto: ${data.status}`);
      } else {
        log.error(`Status incorrecto. Esperado: ${testConfig.expectedResponse.status}, Recibido: ${data.status}`);
      }

      console.log(`${colors.cyan}Response completa:${colors.reset}`);
      log.json(data);

      return {
        success: true,
        testName,
        response: data,
        statusCode: response.status
      };
    } else {
      log.error(`Webhook retornó error HTTP ${response.status}`);
      console.log(`${colors.cyan}Respuesta:${colors.reset}`);
      log.json(data);
      
      return {
        success: false,
        testName,
        error: data,
        statusCode: response.status
      };
    }
  } catch (error) {
    log.error(`Error en el test: ${error.message}`);
    return {
      success: false,
      testName,
      error: error.message
    };
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  log.header();
  log.title('🧪 TESTING SUITE - Make.com Auth & Leads Sync');
  log.header();
  
  console.log(`\n${colors.cyan}Configuración:${colors.reset}`);
  console.log(`  Webhook URL: ${MAKE_WEBHOOK_URL}`);
  console.log(`  Total Tests: ${Object.keys(testCases).length}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  
  const results = [];
  const testEntries = Object.entries(testCases);

  for (let i = 0; i < testEntries.length; i++) {
    const [testKey, testConfig] = testEntries[i];
    
    const result = await runTest(testKey, testConfig, i);
    results.push(result);
    
    // Delay entre tests
    if (i < testEntries.length - 1) {
      log.info(`Esperando ${DELAY_BETWEEN_TESTS}ms antes del siguiente test...`);
      await sleep(DELAY_BETWEEN_TESTS);
    }
  }

  // Resumen
  log.header();
  log.title('📊 RESUMEN DE RESULTADOS');
  log.header();

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n${colors.green}✓ Exitosos: ${successCount}${colors.reset}`);
  console.log(`${colors.red}✗ Fallidos: ${failCount}${colors.reset}`);
  console.log(`${colors.bright}Total: ${results.length}${colors.reset}`);

  // Detalles de fallidos
  if (failCount > 0) {
    console.log(`\n${colors.red}${colors.bright}Tests Fallidos:${colors.reset}`);
    results.filter(r => !r.success).forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.testName}`);
      console.log(`     Error: ${result.error || 'Error desconocido'}`);
    });
  }

  // Guardar resultados
  saveResults(results);
}

/**
 * Guardar resultados en archivo
 */
function saveResults(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = path.join(__dirname, `test-results-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    webhook: MAKE_WEBHOOK_URL,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    results: results
  };

  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  log.success(`Resultados guardados en: ${filename}`);
}

// ==================== MAIN ====================

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

export { runTest, runAllTests, testCases };
