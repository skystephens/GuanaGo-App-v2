/**
 * docs.js — Lista y sirve archivos .md del repo para verlos desde la app
 * (Super Admin → Centro Estratégico → Documentación).
 *
 * Seguridad: solo lee archivos .md, solo dentro de las carpetas permitidas,
 * sin permitir ../ (path traversal).
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..'); // raíz del repo

// Carpetas donde se permite buscar .md — evita exponer todo el filesystem
const CARPETAS_PERMITIDAS = ['.', 'backend', 'guiasai-b2b'];

function listarMdEnCarpeta(carpetaRelativa) {
  const carpetaAbs = path.join(ROOT, carpetaRelativa);
  if (!fs.existsSync(carpetaAbs)) return [];
  return fs.readdirSync(carpetaAbs)
    .filter(f => f.toLowerCase().endsWith('.md'))
    .map(f => {
      const rel = carpetaRelativa === '.' ? f : `${carpetaRelativa}/${f}`;
      const stat = fs.statSync(path.join(carpetaAbs, f));
      // Primera línea como título, si empieza con #
      let titulo = f.replace(/\.md$/i, '');
      try {
        const primeraLinea = fs.readFileSync(path.join(carpetaAbs, f), 'utf-8').split('\n')[0];
        if (primeraLinea.startsWith('#')) titulo = primeraLinea.replace(/^#+\s*/, '').trim();
      } catch {}
      return {
        archivo: rel,
        titulo,
        tamano_kb: Math.round(stat.size / 1024 * 10) / 10,
        modificado: stat.mtime,
      };
    });
}

const router = express.Router();

// GET /api/docs — lista todos los .md disponibles
router.get('/', (_req, res) => {
  try {
    const todos = CARPETAS_PERMITIDAS.flatMap(listarMdEnCarpeta);
    todos.sort((a, b) => new Date(b.modificado) - new Date(a.modificado));
    res.json(todos);
  } catch (err) {
    console.error('❌ /api/docs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/docs/contenido?archivo=xxx.md — devuelve el contenido crudo
router.get('/contenido', (req, res) => {
  try {
    const archivo = req.query.archivo || '';
    // Bloquear cualquier intento de salir de las carpetas permitidas
    if (archivo.includes('..') || !archivo.toLowerCase().endsWith('.md')) {
      return res.status(400).json({ error: 'Archivo no válido' });
    }
    const carpeta = archivo.includes('/') ? archivo.split('/')[0] : '.';
    if (!CARPETAS_PERMITIDAS.includes(carpeta)) {
      return res.status(403).json({ error: 'Carpeta no permitida' });
    }
    const rutaAbs = path.join(ROOT, archivo);
    if (!fs.existsSync(rutaAbs)) return res.status(404).json({ error: 'No encontrado' });
    const contenido = fs.readFileSync(rutaAbs, 'utf-8');
    res.json({ archivo, contenido });
  } catch (err) {
    console.error('❌ /api/docs/contenido:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
