import express from 'express';

const router = express.Router();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';

/**
 * DEBUG ENDPOINT - Obtener todos los usuarios admin
 * GET /api/debug/admins
 * 
 * ⚠️ SOLO PARA DESARROLLO - Mostrar estructura sin revelar PINs
 */
router.get('/admins', async (req, res) => {
  console.log('\n🔍 DEBUG: Obteniendo lista de admins...');
  
  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ 
      error: 'AIRTABLE_API_KEY no configurada',
      hint: 'Verifica tu archivo .env'
    });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Usuarios_Admins`;
    
    console.log(`📡 Solicitando: ${url}`);
    console.log(`🔑 API Key: ${AIRTABLE_API_KEY.substring(0, 10)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${errorText}`);
      return res.status(response.status).json({ 
        error: 'Error obteniendo datos de Airtable',
        details: errorText
      });
    }

    const data = await response.json();
    
    console.log(`✅ Admins encontrados: ${data.records?.length || 0}`);
    
    // Retornar sin revelar PINs completos
    const admins = (data.records || []).map(record => ({
      id: record.id,
      nombre: record.fields.Nombre || 'Sin nombre',
      email: record.fields.Email || 'Sin email',
      pin_length: String(record.fields.PIN || '').length,
      pin_first_digit: String(record.fields.PIN || '').substring(0, 1),
      pin_last_digit: String(record.fields.PIN || '').substring(-1),
      pin_masked: '●'.repeat(String(record.fields.PIN || '').length),
      rol: record.fields.Rol || 'Sin rol',
      activo: record.fields.Activo === true,
      tipo_pin: typeof record.fields.PIN === 'number' ? 'NUMBER' : 'TEXT'
    }));

    res.json({
      success: true,
      count: admins.length,
      admins: admins,
      hint: 'Pin almacenado como ' + (admins[0]?.tipo_pin || 'DESCONOCIDO')
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * DEBUG ENDPOINT - Validar PIN manualmente
 * POST /api/debug/validate-pin
 * Body: { pin: "166400" }
 */
router.post('/validate-pin', async (req, res) => {
  const { pin } = req.body;
  
  console.log(`\n🔍 DEBUG: Validando PIN manualmente...`);
  console.log(`📝 PIN recibido: "${pin}" (${pin?.length || 0} dígitos)`);
  console.log(`📊 Tipo: ${typeof pin}`);
  
  if (!pin) {
    return res.status(400).json({ error: 'PIN requerido' });
  }

  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ 
      error: 'AIRTABLE_API_KEY no configurada',
      hint: 'Verifica tu archivo .env'
    });
  }

  try {
    const pinStr = String(pin).trim();
    console.log(`🔐 PIN trimmed: "${pinStr}"`);
    
    // Intentar fórmula con OR
    const escapedPin = pinStr.replace(/'/g, "''");
    const filterFormula = `AND(OR({PIN} = '${escapedPin}', {PIN} = ${pinStr}), {Activo} = TRUE())`;
    
    console.log(`📋 Fórmula: ${filterFormula}`);
    
    const params = new URLSearchParams({
      filterByFormula: filterFormula,
      maxRecords: '1'
    });

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Usuarios_Admins?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${errorText}`);
      
      // Intentar fallback
      console.log(`🔄 Intentando fallback sin OR...`);
      return validateAdminPinFallback(pinStr, res);
    }

    const data = await response.json();
    console.log(`📦 Records encontrados: ${data.records?.length || 0}`);
    
    if (data.records && data.records.length > 0) {
      const user = data.records[0].fields;
      console.log(`✅ Usuario encontrado: ${user.Nombre}`);
      
      return res.json({
        success: true,
        message: 'PIN válido',
        user: {
          nombre: user.Nombre,
          email: user.Email,
          rol: user.Rol,
          activo: user.Activo
        }
      });
    }
    
    console.log(`⚠️ PIN no coincide en la fórmula OR, intentando fallback...`);
    return validateAdminPinFallback(pinStr, res);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Fallback: obtener todos y validar localmente
 */
async function validateAdminPinFallback(pinStr, res) {
  try {
    console.log(`🔄 Fallback: Obteniendo todos los admins activos...`);
    
    const params = new URLSearchParams({
      filterByFormula: '{Activo} = TRUE()',
      maxRecords: '100'
    });

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Usuarios_Admins?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Fallback API error ${response.status}`);
      return res.status(500).json({ error: 'Error en fallback' });
    }

    const data = await response.json();
    console.log(`📦 Fallback: ${data.records?.length || 0} admins activos`);
    
    // Buscar manualmente
    for (const record of (data.records || [])) {
      const user = record.fields;
      const recordPin = String(user.PIN).trim();
      
      console.log(`   Comparando: "${pinStr}" === "${recordPin}" ?`);
      console.log(`   - Longitud entrada: ${pinStr.length}, Longitud Airtable: ${recordPin.length}`);
      console.log(`   - Tipo Airtable: ${typeof user.PIN}`);
      
      if (recordPin === pinStr) {
        console.log(`✅ Fallback: PIN coincide! Usuario: ${user.Nombre}`);
        
        return res.json({
          success: true,
          message: 'PIN válido (vía fallback)',
          user: {
            nombre: user.Nombre,
            email: user.Email,
            rol: user.Rol,
            activo: user.Activo
          }
        });
      }
    }
    
    console.log(`❌ Fallback: PIN no encontrado`);
    return res.json({
      success: false,
      message: 'PIN no válido',
      debug: `PIN "${pinStr}" no coincide con ningún usuario activo`,
      all_admins: data.records?.map(r => ({
        nombre: r.fields.Nombre,
        pin: String(r.fields.PIN),
        tipo: typeof r.fields.PIN
      })) || []
    });
    
  } catch (error) {
    console.error('❌ Fallback error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

export default router;
