import axios from 'axios';

const API_KEY = 'patDWx13o3qtNjLqv.37cd343946b889d2044f1f5fa9039c06931d38a192f794c115f0efd21cca1658';
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
