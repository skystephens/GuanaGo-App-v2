import fs from 'fs';
import path from 'path';

const listDir = (basePath) => {
  const result = {};
  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      result[entry.name] = listDir(fullPath);
    } else {
      result[entry.name] = 'file';
    }
  }
  return result;
};

export const getStructure = (req, res) => {
  try {
    const backendRoot = path.join(process.cwd(), 'backend');
    const structure = listDir(backendRoot);

    const summary = {
      routes: Object.keys(structure.routes || {}),
      controllers: Object.keys(structure.controllers || {}),
      services: Object.keys(structure.services || {}),
      middleware: Object.keys(structure.middleware || {}),
      utils: Object.keys(structure.utils || {}),
      other: Object.keys(structure).filter(k => !['routes','controllers','services','middleware','utils'].includes(k))
    };

    res.json({ success: true, structure, summary });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};
