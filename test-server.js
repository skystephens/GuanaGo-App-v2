import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('<h1>GuanaGO Test Server</h1><p>Running on port 5000</p>');
});

const server = app.listen(PORT, () => {
  console.log(`\n✅ Servidor TEST funcionando en http://localhost:${PORT}\n`);
  console.log(`Visita: http://localhost:${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health\n`);
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} en uso. Ejecuta: Stop-Process -Name node -Force`);
  }
  process.exit(1);
});
