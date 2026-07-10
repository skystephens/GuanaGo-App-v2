/**
 * AdminCampanas — Generador de campañas y anuncios GuiaSAI
 *
 * Genera copies prediseñados usando la data real de Airtable (catálogo de
 * tours/alojamientos vía /api/cowork/catalogo-completo) y las reglas de marca:
 *   · 80% cultura Raizal / 20% oferta
 *   · Toques de Kriol
 *   · Cierre #LaivStieg
 *   · Modo bandera DIMAR: si hay bandera roja, la campaña pivota a plan
 *     cultural de tierra + reprogramación garantizada para reservas pagas.
 *
 * Sin IA (decisión jul-2026): plantillas inteligentes con datos reales.
 * El precio publicado SIEMPRE lo controla Sky (campo editable) — nunca se
 * expone automáticamente el precio neto de agencia.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Megaphone, Copy, Check, RefreshCw, Loader2,
  Instagram, MessageCircle, Radio, Target, Flag, Palmtree,
} from 'lucide-react';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface CatalogItem {
  id: string;
  tabla: string;
  nombre: string;
  tipo: string;
  precioNeto: number;
  unidad: string;
}

type Canal = 'instagram' | 'whatsapp' | 'estado' | 'ads';
type Bandera = 'verde' | 'amarilla' | 'roja';
type Objetivo = 'nautico' | 'cultural' | 'alojamiento' | 'protocolo';

interface Props {
  onBack: () => void;
}

const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

// ─── Motor de plantillas ──────────────────────────────────────────────────────

const GANCHOS_CULTURA = [
  'En San Andrés el mar no es un paisaje: es la memoria viva del pueblo Raizal. 🌊',
  'Aquí las historias se tejen como la palma de coco: con paciencia, con manos que saben. 🥥',
  'Wi da piipl fram di sii — somos gente del mar. Y eso se siente en cada rincón de la isla. 🏝️',
  'El Caribe que no sale en las postales: el que se canta en Kriol y se baila descalzo. 🎶',
  'Cada ola que llega a la isla trae 400 años de historia Raizal. Ven a escucharlas. 🌊',
];

const GANCHOS_CULTURAL_TIERRA = [
  'Cuando el mar descansa, la cultura Raizal despierta. 🥥',
  'La isla es mucho más que playa: es tejido, es Kriol, es sabor, es música. 🎶',
  'Hoy el plan es de tierra: manos en la palma de coco, historia viva y sabor isleño. 🌴',
];

function generarCopies(opts: {
  objetivo: Objetivo;
  canal: Canal;
  bandera: Bandera;
  servicio: CatalogItem | null;
  precio: string;
  urgencia: string;
}): { titulo: string; cuerpo: string }[] {
  const { objetivo, canal, bandera, servicio, precio, urgencia } = opts;
  const nombre = servicio?.nombre || '[servicio]';
  const unidad = servicio?.unidad === 'noche' ? 'por noche' : 'por persona';
  const precioTxt = precio ? `${fmtCOP(Number(precio))} COP ${unidad}` : '';
  const cta = {
    instagram: 'Cotiza en el link de la bio 🔗 o escríbenos al WhatsApp 315 383 6043',
    whatsapp: 'Responde este mensaje o cotiza directo aquí 👉 https://app.guiasanandresislas.com',
    estado: '👉 Escríbenos: 315 383 6043',
    ads: 'Cotiza ahora en app.guiasanandresislas.com',
  }[canal];
  const rnd = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // ── Protocolo bandera roja (mensaje operativo a clientes con reserva paga) ──
  if (objetivo === 'protocolo') {
    return [
      {
        titulo: 'Mensaje a clientes con reserva paga (bandera roja)',
        cuerpo: `Hola 🌴 Te escribimos de GuíaSAI (RNT 48674).\n\nLa Capitanía de Puerto de San Andrés decretó *bandera roja* para hoy, por lo que las actividades náuticas quedan suspendidas por seguridad. Tu reserva está protegida ✅\n\nTienes dos opciones, tú eliges:\n\n1️⃣ *Reprogramar* tu tour para el siguiente día con bandera habilitada, sin ningún costo adicional.\n2️⃣ *Cambiar hoy mismo a un plan cultural de tierra*: experiencia de tejido en palma de coco con maestra artesana Raizal, recorrido cultural y sabor isleño.\n\nRespóndenos con la opción que prefieras y lo dejamos listo. Gracias por tu comprensión — el mar manda, y nosotros te cuidamos. 🙏\n\nGuíaSAI · Turismo Raizal\n#LaivStieg`,
      },
      {
        titulo: 'Aviso público (redes) — día de bandera roja',
        cuerpo: `⚠️ AVISO DEL DÍA · San Andrés Islas\n\nLa Autoridad Marítima decretó bandera roja: hoy no hay salidas náuticas. La seguridad primero, siempre. 🙏\n\nPero la isla no se detiene: ${rnd(GANCHOS_CULTURAL_TIERRA)}\n\nHoy te esperamos en tierra: Coco Art con Breda Sky, cultura Raizal y gastronomía isleña.\n\n${cta}\n\n#LaivStieg #SanAndres #TurismoRaizal`,
      },
      {
        titulo: 'Estado de WhatsApp — bandera roja',
        cuerpo: `🚩 Hoy: bandera roja, sin salidas al mar.\n🥥 Plan B activado: Coco Art + cultura Raizal en tierra.\nReservas pagas: reprogramación garantizada ✅\n👉 315 383 6043 · #LaivStieg`,
      },
    ];
  }

  // ── Bandera roja + objetivo náutico → pivotar automáticamente a cultural ──
  const pivotea = bandera === 'roja' && objetivo === 'nautico';
  const obj: Objetivo = pivotea ? 'cultural' : objetivo;

  const notaPivote = pivotea
    ? '⚠️ Bandera roja activa: las plantillas pivotaron a plan cultural de tierra. El copy náutico volverá con bandera verde.\n\n'
    : '';

  const urgTxt = urgencia ? `\n⏰ ${urgencia}` : '';
  const precioLinea = precioTxt ? `\n💰 Desde ${precioTxt}` : '';

  if (obj === 'cultural') {
    const base = [
      {
        titulo: 'Variante cultural — historia',
        cuerpo: `${rnd(GANCHOS_CULTURAL_TIERRA)}\n\nVive la experiencia Coco Art: aprende el tejido tradicional en palma de coco de la mano de una maestra artesana Raizal, llévate tu pieza y la historia que la acompaña.${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #CocoArt #SanAndres #CulturaRaizal #TurismoRegenerativo`,
      },
      {
        titulo: 'Variante experiencia — sensorial',
        cuerpo: `Imagina esto: la brisa del Caribe, una historia contada en Kriol, y tus manos aprendiendo un arte que lleva generaciones en la isla. 🥥✨\n\nEso es ${nombre !== '[servicio]' ? nombre : 'nuestra experiencia cultural Raizal'}. No es un tour — es un encuentro.${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #SanAndresIslas #ExperienciasAutenticas`,
      },
      {
        titulo: 'Variante comunidad — impacto',
        cuerpo: `Cuando reservas con GuíaSAI, tu viaje deja huella positiva: cada experiencia cultural apoya directamente a artesanos y familias Raizales de la isla. 🌴\n\n${nombre !== '[servicio]' ? `Hoy te recomendamos: ${nombre}.` : 'Conoce nuestras experiencias culturales.'}${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #TurismoConsciente #Raizal`,
      },
    ];
    return base.map(b => ({ ...b, cuerpo: notaPivote + b.cuerpo }));
  }

  if (obj === 'alojamiento') {
    return [
      {
        titulo: 'Variante hogar isleño',
        cuerpo: `${rnd(GANCHOS_CULTURA)}\n\nY al final del día, descansas como en casa: te presentamos ${nombre}. Comodidad real, atención isleña y la ubicación que necesitas para vivir la isla de verdad.${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #SanAndres #DondeQuedarse`,
      },
      {
        titulo: 'Variante planea tu viaje',
        cuerpo: `¿Ya tienes fecha para conocer San Andrés? 🏝️\n\nAsegura tu alojamiento con anticipación y viaja tranquilo: ${nombre}, verificado por GuíaSAI (RNT 48674), con cotización clara y pago seguro por Wompi.${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #SanAndresIslas #ViajaSeguro`,
      },
      {
        titulo: 'Variante grupos & eventos',
        cuerpo: `¿Vienes en grupo a la isla? 👥 Equipos deportivos, familias grandes, celebraciones — armamos tu hospedaje a la medida, con tarifas por grupo y logística resuelta.\n\n${nombre !== '[servicio]' ? `Opción destacada: ${nombre}.` : ''}${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #GruposSanAndres`,
      },
    ];
  }

  // Náutico (bandera verde o amarilla)
  const notaAmarilla = bandera === 'amarilla'
    ? '\n\n🟡 Nota del día: bandera amarilla — operamos con precaución las actividades habilitadas por Capitanía.'
    : '';
  return [
    {
      titulo: 'Variante cultura + mar',
      cuerpo: `${rnd(GANCHOS_CULTURA)}\n\nHoy el mar está listo para recibirte: ${nombre}. Sal con operadores locales que conocen estas aguas de toda la vida.${precioLinea}${urgTxt}${notaAmarilla}\n\n${cta}\n\n#LaivStieg #SanAndres #MarDeSieteColores`,
    },
    {
      titulo: 'Variante cupos & urgencia',
      cuerpo: `🌊 CUPOS DISPONIBLES · ${nombre}\n\nSalida confirmada según reporte de Capitanía de Puerto ✅ Asegura tu cupo con pago anticipado y viaja sin filas ni sorpresas.${precioLinea}${urgTxt}${notaAmarilla}\n\n⚡ Los cupos con pago confirmado tienen prioridad de embarque.\n\n${cta}\n\n#LaivStieg #SanAndresIslas`,
    },
    {
      titulo: 'Variante garantía GuíaSAI',
      cuerpo: `¿Y si el clima cambia? Tranquilo. 🌦️\n\nCon GuíaSAI tu reserva está protegida: si la Autoridad Marítima suspende las salidas, reprogramamos tu tour sin costo o lo cambias por una experiencia cultural Raizal en tierra. Tu pago nunca se pierde.\n\n${nombre !== '[servicio]' ? `Reserva hoy: ${nombre}.` : ''}${precioLinea}${urgTxt}\n\n${cta}\n\n#LaivStieg #ViajaSeguro #SanAndres`,
    },
  ];
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AdminCampanas: React.FC<Props> = ({ onBack }) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [objetivo, setObjetivo] = useState<Objetivo>('nautico');
  const [canal, setCanal] = useState<Canal>('instagram');
  const [bandera, setBandera] = useState<Bandera>('verde');
  const [servicioId, setServicioId] = useState('');
  const [precio, setPrecio] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [copies, setCopies] = useState<{ titulo: string; cuerpo: string }[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/cowork/catalogo-completo`);
        const data = await r.json();
        const items: CatalogItem[] = [
          ...(data.tours || []),
          ...(data.alojamientos || []),
        ];
        setCatalog(items);
      } catch (e) {
        console.error('catalogo error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const serviciosFiltrados = useMemo(() => {
    if (objetivo === 'alojamiento') return catalog.filter(c => c.tabla === 'alojamientos');
    if (objetivo === 'protocolo') return [];
    return catalog.filter(c => c.tabla === 'tours');
  }, [catalog, objetivo]);

  const servicio = catalog.find(c => c.id === servicioId) || null;

  useEffect(() => {
    // Prellenar precio editable al elegir servicio (Sky controla lo publicado)
    if (servicio) setPrecio(String(servicio.precioNeto || ''));
  }, [servicioId]);

  const generar = () => {
    setCopies(generarCopies({ objetivo, canal, bandera, servicio, precio, urgencia }));
    setCopiedIdx(null);
  };

  const copiar = async (texto: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* noop */ }
  };

  const OBJETIVOS: { id: Objetivo; label: string; icon: React.ReactNode }[] = [
    { id: 'nautico', label: 'Tour náutico', icon: <Palmtree size={14} /> },
    { id: 'cultural', label: 'Cultural / tierra', icon: <Palmtree size={14} /> },
    { id: 'alojamiento', label: 'Alojamiento', icon: <Palmtree size={14} /> },
    { id: 'protocolo', label: 'Protocolo bandera roja', icon: <Flag size={14} /> },
  ];

  const CANALES: { id: Canal; label: string; icon: React.ReactNode }[] = [
    { id: 'instagram', label: 'Instagram / Facebook', icon: <Instagram size={14} /> },
    { id: 'whatsapp', label: 'WhatsApp difusión', icon: <MessageCircle size={14} /> },
    { id: 'estado', label: 'Estado WhatsApp', icon: <Radio size={14} /> },
    { id: 'ads', label: 'Anuncio Meta Ads', icon: <Target size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-700 flex items-center justify-center">
            <Megaphone size={16} className="text-orange-400" />
          </div>
          <div>
            <h1 className="font-black text-base">Campañas & Anuncios</h1>
            <p className="text-[10px] text-gray-500">Copies prediseñados · 80% cultura / 20% oferta · #LaivStieg</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* Bandera del día */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flag size={11} /> Bandera del día (reporte Capitanía / DIMAR)
          </p>
          <div className="flex gap-2">
            {([
              { id: 'verde', label: '🟢 Verde', cls: 'border-emerald-600 bg-emerald-950/50 text-emerald-300' },
              { id: 'amarilla', label: '🟡 Amarilla', cls: 'border-yellow-600 bg-yellow-950/50 text-yellow-300' },
              { id: 'roja', label: '🔴 Roja', cls: 'border-red-600 bg-red-950/50 text-red-300' },
            ] as const).map(b => (
              <button
                key={b.id}
                onClick={() => setBandera(b.id)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  bandera === b.id ? b.cls : 'border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-600'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          {bandera === 'roja' && (
            <p className="text-[10px] text-red-300/80 mt-2">
              🚩 Con bandera roja, las campañas náuticas pivotan automáticamente a plan cultural de tierra, y se habilita el protocolo de reprogramación para reservas pagas.
            </p>
          )}
        </div>

        {/* Configuración de la campaña */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Objetivo de la campaña</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {OBJETIVOS.map(o => (
                <button
                  key={o.id}
                  onClick={() => { setObjetivo(o.id); setServicioId(''); setCopies([]); }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border-2 text-[11px] font-bold transition-all ${
                    objetivo === o.id ? 'border-orange-500 bg-orange-950/40 text-orange-300' : 'border-gray-800 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          {objetivo !== 'protocolo' && (
            <>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Servicio (catálogo Airtable) {loading && <Loader2 size={10} className="inline animate-spin ml-1" />}
                </p>
                <select
                  value={servicioId}
                  onChange={e => setServicioId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="">— Genérico (sin servicio específico) —</option>
                  {serviciosFiltrados.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} · {s.tipo}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Precio a publicar (COP) — editable
                  </p>
                  <input
                    type="number"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                    placeholder="Vacío = sin precio"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"
                  />
                  <p className="text-[9px] text-gray-600 mt-1">⚠️ Verifica antes de publicar: el catálogo puede traer precio neto.</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Urgencia (opcional)</p>
                  <input
                    type="text"
                    value={urgencia}
                    onChange={e => setUrgencia(e.target.value)}
                    placeholder="Ej: Últimos 6 cupos para mañana"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Canal</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CANALES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCanal(c.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border-2 text-[11px] font-bold transition-all ${
                    canal === c.id ? 'border-teal-500 bg-teal-950/40 text-teal-300' : 'border-gray-800 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generar}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-3.5 rounded-xl transition-all"
          >
            <Megaphone size={16} /> Generar copies
          </button>
        </div>

        {/* Resultados */}
        {copies.map((c, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-orange-400">{c.titulo}</p>
              <div className="flex gap-2">
                <button
                  onClick={generar}
                  title="Regenerar variantes"
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                >
                  <RefreshCw size={13} className="text-gray-400" />
                </button>
                <button
                  onClick={() => copiar(c.cuerpo, idx)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-bold transition-all ${
                    copiedIdx === idx ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {copiedIdx === idx ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                </button>
              </div>
            </div>
            <pre className="text-[12px] text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-gray-950/60 border border-gray-800 rounded-xl p-3">
{c.cuerpo}
            </pre>
          </div>
        ))}

        {copies.length === 0 && (
          <p className="text-center text-xs text-gray-600 py-6">
            Configura la campaña y presiona "Generar copies" — obtendrás 3 variantes listas para copiar y publicar.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminCampanas;
