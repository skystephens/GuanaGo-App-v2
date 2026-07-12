/**
 * AdminEditorHome — Editor del Home GuiaSAI (estilo WordPress)
 *
 * Edita el contenido del nuevo Home sin tocar código:
 * hero (frase Kriol, título, subtítulo, imágenes del carrusel),
 * bandera del día, sección Ruta Raizal, grupos, WhatsApp y
 * las experiencias destacadas.
 *
 * Guarda en Airtable → tabla Home_Config (vía PUT /api/home-config).
 * Vista previa: ?p=home2
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, Flag, Type, Users, Sparkles } from 'lucide-react';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface CatItem {
  id: string; tabla: string; nombre: string; tipo: string;
  precio: number; imagen: string; descripcion: string; destacado: boolean;
}

interface Props { onBack: () => void }

const CAMPOS: { clave: string; label: string; tipo: 'text' | 'textarea' | 'imagenes' | 'bandera' | 'json'; ayuda?: string; seccion: string }[] = [
  { seccion: 'Hero (portada)', clave: 'hero_kriol',    label: 'Frase en Kriol (arriba del título)', tipo: 'text' },
  { seccion: 'Hero (portada)', clave: 'hero_titulo',   label: 'Título principal', tipo: 'text', ayuda: 'Usa | para separar las dos líneas. La segunda sale en naranja.' },
  { seccion: 'Hero (portada)', clave: 'hero_sub',      label: 'Subtítulo', tipo: 'textarea' },
  { seccion: 'Hero (portada)', clave: 'hero_imagenes', label: 'Imágenes del carrusel de paisajes', tipo: 'imagenes', ayuda: 'URLs separadas por coma (usa las de tu WordPress). Rotan cada 6 segundos.' },
  { seccion: 'Bandera del día', clave: 'bandera',       label: 'Estado del mar hoy (reporte Capitanía)', tipo: 'bandera' },
  { seccion: 'Bandera del día', clave: 'bandera_texto', label: 'Texto de la franja', tipo: 'textarea' },
  { seccion: 'Ruta Raizal', clave: 'raizal_kriol',   label: 'Frase Kriol de la sección', tipo: 'text' },
  { seccion: 'Ruta Raizal', clave: 'raizal_texto_1', label: 'Párrafo 1', tipo: 'textarea' },
  { seccion: 'Ruta Raizal', clave: 'raizal_texto_2', label: 'Párrafo 2', tipo: 'textarea' },
  { seccion: 'Ruta Raizal', clave: 'raizal_imagen',  label: 'Imagen de la sección (URL)', tipo: 'text' },
  { seccion: 'Grupos & eventos', clave: 'grupos_titulo', label: 'Título', tipo: 'text' },
  { seccion: 'Grupos & eventos', clave: 'grupos_texto',  label: 'Texto', tipo: 'textarea' },
  { seccion: 'Contacto', clave: 'whatsapp', label: 'WhatsApp (solo números con 57)', tipo: 'text' },
  // experiencias se edita visualmente con el selector de catálogo (ver abajo)
];

const ICONO_SECCION: Record<string, React.ReactNode> = {
  'Hero (portada)': <ImageIcon size={14} />,
  'Bandera del día': <Flag size={14} />,
  'Ruta Raizal': <Sparkles size={14} />,
  'Grupos & eventos': <Users size={14} />,
  'Contacto': <Type size={14} />,
  'Experiencias destacadas': <Sparkles size={14} />,
};

const AdminEditorHome: React.FC<Props> = ({ onBack }) => {
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [catalogo, setCatalogo] = useState<CatItem[]>([]);
  const [busqCat, setBusqCat] = useState('');
  const [selIds, setSelIds] = useState<string[]>([]);
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/home-config`).then(r => r.json()),
      fetch(`${API}/api/home-config/catalogo-selector`).then(r => r.json()).catch(() => []),
    ]).then(([configData, catData]) => {
      setCfg(configData);
      setOriginal(configData);
      if (Array.isArray(catData)) setCatalogo(catData);
      // Pre-seleccionar los que ya están en el JSON guardado
      try {
        const actuales = JSON.parse(configData.experiencias || '[]');
        setSelIds(actuales.map((e: any) => e.id).filter(Boolean));
      } catch {}
    }).catch(() => setMsg({ ok: false, texto: 'No se pudo cargar la configuración' }))
      .finally(() => setLoading(false));
  }, []);

  const cambios = Object.fromEntries(Object.entries(cfg).filter(([k, v]) => original[k] !== v));
  const hayCambios = Object.keys(cambios).length > 0;

  const guardar = async () => {
    // Validar JSON de experiencias antes de guardar
    if ('experiencias' in cambios) {
      try { JSON.parse(cfg.experiencias); }
      catch { setMsg({ ok: false, texto: 'El JSON de experiencias tiene un error de formato — revísalo antes de guardar.' }); return; }
    }
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/api/home-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cambios }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error guardando');
      setOriginal({ ...cfg });
      setMsg({ ok: true, texto: 'Cambios publicados ✅ — recarga el Home para verlos (?p=home2)' });
    } catch (e: any) {
      setMsg({ ok: false, texto: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={28} /></div>;
  }

  const secciones = [...new Set(CAMPOS.map(c => c.seccion))];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-44">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-base">Editor del Home</h1>
            <p className="text-[10px] text-gray-500">Edita la portada como en WordPress — los cambios se publican al guardar</p>
          </div>
          <a href="/?p=home2" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300">
            <Eye size={13} /> Vista previa
          </a>
          <button onClick={guardar} disabled={!hayCambios || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-xs font-black text-white transition-colors">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-6">
        {secciones.map(sec => (
          <div key={sec} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              {ICONO_SECCION[sec]} {sec}
            </p>
            <div className="space-y-4">
              {CAMPOS.filter(c => c.seccion === sec).map(campo => (
                <div key={campo.clave}>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">{campo.label}</label>

                  {campo.tipo === 'bandera' ? (
                    <div className="flex gap-2">
                      {([['verde', '🟢 Verde'], ['amarilla', '🟡 Amarilla'], ['roja', '🔴 Roja']] as const).map(([v, l]) => (
                        <button key={v} onClick={() => setCfg(p => ({ ...p, bandera: v }))}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            cfg.bandera === v ? 'border-orange-500 bg-orange-950/40 text-orange-300' : 'border-gray-800 text-gray-500 hover:border-gray-600'
                          }`}>{l}</button>
                      ))}
                    </div>
                  ) : campo.tipo === 'text' ? (
                    <input value={cfg[campo.clave] || ''} onChange={e => setCfg(p => ({ ...p, [campo.clave]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm" />
                  ) : (
                    <textarea value={cfg[campo.clave] || ''} onChange={e => setCfg(p => ({ ...p, [campo.clave]: e.target.value }))}
                      rows={campo.tipo === 'json' ? 10 : campo.tipo === 'imagenes' ? 4 : 3}
                      className={`w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm leading-relaxed ${campo.tipo === 'json' ? 'font-mono text-[11px]' : ''}`} />
                  )}

                  {campo.ayuda && <p className="text-[10px] text-gray-600 mt-1">{campo.ayuda}</p>}

                  {/* Miniaturas del carrusel */}
                  {campo.tipo === 'imagenes' && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(cfg.hero_imagenes || '').split(',').map(u => u.trim()).filter(Boolean).map(u => (
                        <img key={u} src={u} alt="" className="w-20 h-12 object-cover rounded-lg border border-gray-700" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Selector visual de experiencias destacadas ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            ✨ Experiencias destacadas en el Home
          </p>
          <p className="text-[10px] text-gray-500 mb-3">Selecciona hasta 5 servicios del catálogo real. Se muestran en el orden que los eliges.</p>
          {selIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selIds.map(id => {
                const it = catalogo.find(c => c.id === id);
                if (!it) return null;
                return (
                  <div key={id} className="flex items-center gap-1.5 bg-orange-950/40 border border-orange-800 text-orange-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl">
                    {it.nombre.slice(0, 28)} · ${Math.round(it.precio / 1000)}k
                    <button onClick={() => toggleSel(id)} className="text-orange-400 hover:text-white">×</button>
                  </div>
                );
              })}
            </div>
          )}
          <input
            type="text"
            value={busqCat}
            onChange={e => setBusqCat(e.target.value)}
            placeholder="Buscar en catálogo..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs mb-3"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {catalogo.length === 0 && (
              <div className="col-span-4 py-8 text-center">
                <p className="text-[11px] text-gray-500">El catálogo llegó vacío — revisa los logs de Render (línea "catalogo-selector") o recarga la página.</p>
              </div>
            )}
            {catalogo
              .filter(it => !busqCat || it.nombre.toLowerCase().includes(busqCat.toLowerCase()) || it.tipo.toLowerCase().includes(busqCat.toLowerCase()))
              .map(it => {
                const activo = selIds.includes(it.id);
                const lleno = selIds.length >= 5 && !activo;
                const badgeColor = it.tabla === 'tours' ? 'bg-teal-600' : 'bg-orange-500';
                const fallback = it.tabla === 'tours'
                  ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=70'
                  : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70';
                return (
                  <button
                    key={it.id}
                    onClick={() => !lleno && toggleSel(it.id)}
                    disabled={lleno}
                    className={`relative bg-white rounded-2xl overflow-hidden text-left transition-all border-2 flex flex-col ${
                      activo ? 'border-orange-500 ring-2 ring-orange-300 shadow-lg scale-[1.02]'
                      : lleno ? 'border-gray-200 opacity-40 cursor-not-allowed'
                      : 'border-gray-100 hover:border-teal-400 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Nº de orden cuando está seleccionado */}
                    {activo && (
                      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow">
                        #{selIds.indexOf(it.id) + 1}
                      </div>
                    )}
                    {/* Imagen */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
                      <img
                        src={it.imagen || fallback}
                        alt={it.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = fallback; }}
                      />
                      <div className={`absolute top-2 left-2 ${badgeColor} text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide`}>
                        {it.tabla === 'tours' ? '⚓ Tour' : '🏠 Aloj.'}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-2.5 flex flex-col gap-1 flex-1">
                      <p className="text-[11px] font-bold text-gray-900 leading-snug line-clamp-2">{it.nombre}</p>
                      <p className="text-[9px] text-gray-400 mt-auto pt-1 border-t border-gray-100">
                        <span className="text-teal-700 font-black">${Math.round(it.precio).toLocaleString('es-CO')}</span>
                        {' '}<span className="text-gray-400">COP / {it.tabla === 'tours' ? 'persona' : 'noche'}</span>
                      </p>
                    </div>
                  </button>
                );
              })
            }
          </div>
        </div>

      {/* Barra de guardado */}
      <div className="fixed bottom-20 inset-x-3 md:inset-x-0 md:bottom-0 bg-gray-900/95 backdrop-blur border border-gray-800 md:border-x-0 md:border-b-0 rounded-2xl md:rounded-none px-4 py-3 z-20 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {msg && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold flex-1 ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {msg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg.texto}
            </p>
          )}
          {!msg && <p className="text-xs text-gray-500 flex-1">{hayCambios ? `${Object.keys(cambios).length} campo(s) modificado(s) sin publicar` : 'Sin cambios pendientes'}</p>}
          <button onClick={guardar} disabled={!hayCambios || saving}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm px-6 py-3 rounded-xl transition-colors">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Publicar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEditorHome;
