import axios from 'axios';

// Uso: AIRTABLE_API_KEY=... node check-airtable.js  (nunca pegar el token en el archivo)
const API_KEY = process.env.AIRTABLE_API_KEY;
if (!API_KEY) { console.error('Falta AIRTABLE_API_KEY'); process.exit(1); }
const BASE_ID = 'appiReH55Qhrbv4Lk';

axios.get(`https://api.airtable.com/v0/${BASE_ID}/ServiciosTuristicos_SAI?maxRecords=5&filterByFormula=AND({Tipo de Servicio}='Tour',{Publicado}=1)`, {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
}).then(r => {
  console.log('✅ Tours encontrados:', r.data.records.length);
  r.data.records.forEach((rec, idx) => {
    console.log('\n' + '='.repeat(60));
    console.log(`📍 TOUR ${idx + 1}: ${rec.fields.Servicio}`);
    console.log('='.repeat(60));
    
    // Mostrar todos los campos que contienen "Precio"
    const precioFields = Object.keys(rec.fields).filter(k => k.toLowerCase().includes('precio'));
    console.log('\n🔍 CAMPOS CON "PRECIO":');
    precioFields.forEach(field => {
      console.log(`  - ${field}: ${rec.fields[field]}`);
    });
    
    console.log('\n📋 TODOS LOS CAMPOS:');
    Object.keys(rec.fields).sort().forEach(field => {
      const value = rec.fields[field];
      const displayValue = Array.isArray(value) ? `[Array: ${value.length}]` : 
                          typeof value === 'object' ? '[Object]' : value;
      console.log(`  - ${field}: ${displayValue}`);
    });
  });
}).catch(e => {
  console.error('❌ Error:', e.message);
  if (e.response) {
    console.error('Response:', e.response.status, e.response.data);
  }
});
