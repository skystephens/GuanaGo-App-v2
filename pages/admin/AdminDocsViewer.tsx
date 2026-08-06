/**
 * AdminDocsViewer — Lee y renderiza los archivos .md del repo desde la app.
 * Lista todos los .md disponibles (raíz, backend/, guiasai-b2b/) y los
 * muestra ya formateados, sin tener que abrir GitHub ni descargar nada.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Loader2, Search, Clock } from 'lucide-react';
import { marked } from 'marked';
import { AppRoute } from '../../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface DocItem {
  archivo: string;
  titulo: string;
  tamano_kb: number;
  modificado: string;
}

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

export default function AdminDocsViewer({ onBack }: Props) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<DocItem | null>(null);
  const [contenido, setContenido] = useState('');
  const [cargandoContenido, setCargandoContenido] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/docs`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setDocs(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const abrir = async (doc: DocItem) => {
    setSeleccionado(doc);
    setCargandoContenido(true);
    try {
      const r = await fetch(`${API}/api/docs/contenido?archivo=${encodeURIComponent(doc.archivo)}`);
      const data = await r.json();
      setContenido(data.contenido || '');
    } catch {
      setContenido('_No se pudo cargar este archivo._');
    } finally {
      setCargandoContenido(false);
    }
  };

  const filtrados = docs.filter(d =>
    d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.archivo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Vista de documento abierto
  if (seleccionado) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSeleccionado(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0">
            <ArrowLeft size={20} className="text-gray-800" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{seleccionado.titulo}</h1>
            <p className="text-[11px] text-gray-400 truncate">{seleccionado.archivo}</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-5 py-8">
          {cargandoContenido ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
          ) : (
            <div
              className="prose-doc"
              dangerouslySetInnerHTML={{ __html: marked.parse(contenido) as string }}
            />
          )}
        </div>
        <style>{`
          .prose-doc h1 { font-size: 1.6rem; font-weight: 900; color: #003D5C; margin: 1.2rem 0 0.6rem; }
          .prose-doc h2 { font-size: 1.3rem; font-weight: 800; color: #003D5C; margin: 1.4rem 0 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
          .prose-doc h3 { font-size: 1.1rem; font-weight: 700; color: #0f2422; margin: 1.1rem 0 0.4rem; }
          .prose-doc p { color: #374151; line-height: 1.7; margin: 0.6rem 0; font-size: 0.92rem; }
          .prose-doc ul, .prose-doc ol { margin: 0.5rem 0 0.5rem 1.3rem; color: #374151; font-size: 0.92rem; }
          .prose-doc li { margin: 0.25rem 0; line-height: 1.6; }
          .prose-doc code { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; color: #b91c1c; }
          .prose-doc pre { background: #0f172a; color: #e2e8f0; padding: 0.9rem; border-radius: 0.6rem; overflow-x: auto; font-size: 0.8rem; margin: 0.8rem 0; }
          .prose-doc pre code { background: none; color: inherit; padding: 0; }
          .prose-doc table { border-collapse: collapse; width: 100%; margin: 0.8rem 0; font-size: 0.85rem; }
          .prose-doc th, .prose-doc td { border: 1px solid #e5e7eb; padding: 0.5rem 0.7rem; text-align: left; }
          .prose-doc th { background: #f9fafb; font-weight: 700; }
          .prose-doc blockquote { border-left: 3px solid #2AABBB; padding-left: 0.9rem; color: #6b7280; margin: 0.8rem 0; }
          .prose-doc a { color: #f97316; font-weight: 600; }
          .prose-doc hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.2rem 0; }
        `}</style>
      </div>
    );
  }

  // Lista de documentos
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#003D5C]">Documentación</h1>
          <p className="text-xs text-gray-400">{docs.length} archivos .md del repositorio</p>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar documento..."
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="px-5 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No hay documentos que coincidan.</div>
        ) : filtrados.map(doc => (
          <button
            key={doc.archivo}
            onClick={() => abrir(doc)}
            className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl p-3.5 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-teal-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-gray-900 truncate">{doc.titulo}</p>
              <p className="text-[11px] text-gray-400 truncate">{doc.archivo}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock size={10} /> {new Date(doc.modificado).toLocaleDateString('es-CO')}
              </p>
              <p className="text-[10px] text-gray-300">{doc.tamano_kb} KB</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
