/**
 * /api/docs — Listado y contenido de archivos .md del proyecto
 *
 * GET /api/docs          → lista todos los .md con metadata
 * GET /api/docs/:slug    → devuelve contenido de un .md específico
 */

import express from 'express';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// El backend vive en codigoGG/backend/ — subir dos niveles para llegar a codigoGG/
const PROJECT_ROOT = join(__dirname, '..', '..');

// Carpetas donde buscar .md (relativo a PROJECT_ROOT)
const SEARCH_DIRS = [
  { path: '',        label: 'Raíz' },
  { path: 'docs',    label: 'Docs' },
  { path: 'docsGG',  label: 'DocsGG' },
  { path: 'tareasGG',label: 'Tareas' },
  { path: 'backend', label: 'Backend' },
];

// Categoría inferida del nombre del archivo
function inferCategoria(name) {
  const n = name.toLowerCase();
  if (n.includes('aliado') || n.includes('partner') || n.includes('socio')) return 'Aliados';
  if (n.includes('pago') || n.includes('payu') || n.includes('wompi') || n.includes('finanz')) return 'Pagos';
  if (n.includes('airtable') || n.includes('make') || n.includes('webhook')) return 'Integraciones';
  if (n.includes('deploy') || n.includes('render') || n.includes('firebase') || n.includes('setup') || n.includes('quickstart')) return 'DevOps';
  if (n.includes('checklist') || n.includes('tareas') || n.includes('roadmap') || n.includes('hoja_ruta') || n.includes('plan')) return 'Roadmap';
  if (n.includes('claude') || n.includes('contexto') || n.includes('master') || n.includes('spec')) return 'Contexto';
  if (n.includes('alojam') || n.includes('hotel')) return 'Alojamientos';
  if (n.includes('backend') || n.includes('arquitectura') || n.includes('api')) return 'Arquitectura';
  return 'Otros';
}

function slugify(filePath) {
  return filePath.replace(/[/\\]/g, '--').replace(/\.md$/i, '');
}

// ── GET /api/docs ─────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const files = [];

  for (const dir of SEARCH_DIRS) {
    const absDir = join(PROJECT_ROOT, dir.path);
    if (!existsSync(absDir)) continue;

    try {
      const entries = readdirSync(absDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || extname(entry.name).toLowerCase() !== '.md') continue;

        const absPath   = join(absDir, entry.name);
        const stat      = statSync(absPath);
        const relPath   = dir.path ? `${dir.path}/${entry.name}` : entry.name;

        // Primera línea no vacía como "título"
        let titulo = basename(entry.name, '.md').replace(/[_-]/g, ' ');
        try {
          const first = readFileSync(absPath, 'utf8').split('\n').find(l => l.trim());
          if (first) titulo = first.replace(/^#+\s*/, '').slice(0, 80);
        } catch { /* skip */ }

        files.push({
          slug:      slugify(relPath),
          nombre:    entry.name,
          ruta:      relPath,
          titulo,
          carpeta:   dir.label,
          categoria: inferCategoria(entry.name),
          tamaño:    stat.size,
          modificado: stat.mtime.toISOString(),
        });
      }
    } catch { /* dir no accesible */ }
  }

  // Ordenar por categoría luego por nombre
  files.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre));

  res.json({ total: files.length, files });
});

// ── GET /api/docs/:slug ───────────────────────────────────────────────────────

router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const relPath = slug.replace(/--/g, '/') + '.md';

  // Validar que no haya path traversal
  const abs = join(PROJECT_ROOT, relPath);
  if (!abs.startsWith(PROJECT_ROOT)) {
    return res.status(400).json({ error: 'Ruta inválida' });
  }
  if (!existsSync(abs)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  try {
    const contenido = readFileSync(abs, 'utf8');
    res.json({ slug, ruta: relPath, contenido });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
