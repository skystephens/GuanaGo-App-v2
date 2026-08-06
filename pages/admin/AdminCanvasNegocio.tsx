/**
 * AdminCanvasNegocio — Canvas del modelo de negocio GuiaSAI/GuanaGO, con datos en vivo
 * de Airtable en las tarjetas donde aplica (Servicios, Otros Destinos, Aliados, Clientes).
 *
 * Distinto de AdminMapaMental (Proyectos/Arquitectura técnica, ya existente y enlazado
 * desde Torre de Control) — este es el canvas de propuesta de valor / modelo de negocio.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AppRoute } from '../../types';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

async function contarRapido(tabla: string, filtro?: string): Promise<string> {
  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(tabla)}?pageSize=100${filtro ? `&filterByFormula=${encodeURIComponent(filtro)}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!r.ok) return '—';
    const data = await r.json();
    const n = data.records?.length || 0;
    return data.offset ? `${n}+` : String(n);
  } catch {
    return '—';
  }
}

interface Branch {
  id: string;
  emoji: string;
  titulo: string;
  color: string;
  stat?: string;
  items: string[];
}

export default function AdminCanvasNegocio({ onBack }: Props) {
  const [stats, setStats] = useState<Record<string, string>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    (async () => {
      const [servicios, alojamientos, aliados, leads, paquetesIntl, cotizaciones] = await Promise.all([
        contarRapido('ServiciosTuristicos_SAI', '{Publicado}=1'),
        contarRapido('AlojamientosTuristicos_SAI', '{Publicado}=1'),
        contarRapido('Directorio_Mapa', '{Es_Aliado_GuanaGO}=1'),
        contarRapido('Leads'),
        contarRapido('Paquetes_Internacionales', '{Estado}="Activo"'),
        contarRapido('CotizacionesGG'),
      ]);
      setStats({ servicios, alojamientos, aliados, leads, paquetesIntl, cotizaciones });
      setLoadingStats(false);
    })();
  }, []);

  const branches: Branch[] = [
    {
      id: 'valor', emoji: '💎', titulo: 'Propuesta de Valor', color: 'from-orange-900/50 to-red-900/50 border-orange-800',
      items: [
        'Autenticidad Raizal/Kriol — frente al modelo all-inclusive genérico',
        'Sello Ruta Raizal — certificación cultural por niveles',
        'Coco Art — palma de coco, artesano ancla Breda Sky',
        'Caribbean Night — música en vivo, cluster RIMM',
        'Regla 80/20: cultura y emoción antes que precio',
      ],
    },
    {
      id: 'servicios', emoji: '🧳', titulo: 'Servicios', color: 'from-teal-900/50 to-emerald-900/50 border-teal-800',
      stat: loadingStats ? '…' : `${stats.servicios} tours · ${stats.alojamientos} alojamientos`,
      items: [
        'Tours y experiencias culturales',
        'Alojamientos — catálogo individual y grupos grandes',
        'Traslados / taxis',
        'Tiquetes aéreos y paquetes internacionales',
        'Artesanías (marketplace Coco Art)',
        'Logística de eventos — Copa de la Isla, Seven Colors SAI',
      ],
    },
    {
      id: 'destinos', emoji: '🌍', titulo: 'Otros Destinos', color: 'from-indigo-900/50 to-blue-900/50 border-indigo-800',
      stat: loadingStats ? '…' : `${stats.paquetesIntl} paquetes activos`,
      items: [
        'Paquetes internacionales de mayoristas aliados (Turistea y otros)',
        'Europa, Asia, África, América, Medio Oriente, Colombia',
        'Ficha tipo producto: galería, itinerario, tabla de precios',
      ],
    },
    {
      id: 'clientes', emoji: '👥', titulo: 'Clientes', color: 'from-cyan-900/50 to-sky-900/50 border-cyan-800',
      stat: loadingStats ? '…' : `${stats.leads} leads · ${stats.cotizaciones} cotizaciones`,
      items: [
        'Turistas — reserva directa (B2C)',
        'Agencias aliadas (B2B, comisión)',
        'Grupos/eventos deportivos — clubes de voleibol Copa de la Isla',
        'Residentes locales — programa GuanaPoints',
      ],
    },
    {
      id: 'herramienta', emoji: '⚙️', titulo: 'Herramienta — GuanaGO', color: 'from-slate-800/60 to-gray-900/60 border-slate-700',
      items: [
        'Cotizador — individual y por grupo (habitaciones × pasajeros)',
        'CRM Torre Comercial — pipeline, WhatsApp, seguimientos',
        'Finanzas — cuentas por cobrar/pagar, comisiones de referidos',
        'Vouchers y portal de delegaciones (Copa de la Isla)',
        'Stack: React/TS + Airtable + Firebase + Make.com',
      ],
    },
    {
      id: 'aliados', emoji: '🤝', titulo: 'Red de Aliados', color: 'from-amber-900/50 to-yellow-900/50 border-amber-800',
      stat: loadingStats ? '…' : `${stats.aliados} aliados activos`,
      items: [
        'RABR — aliados locales (hoteles, comercios)',
        'Embajadores / taxistas referidores',
        'Organizadores externos — comisión por equipo referido',
        'Instituciones — Secretaría de Turismo, Secretaría de Deportes',
      ],
    },
    {
      id: 'proceso', emoji: '🔄', titulo: 'Proceso Operativo', color: 'from-rose-900/50 to-pink-900/50 border-rose-800',
      items: [
        'Lead → Cotización → Envío por WhatsApp',
        'Aceptación → Abono (Bre-B / Wompi)',
        'Reserva confirmada → Voucher',
        'Entrega del servicio → Pago a proveedor',
        'Seguimiento de saldo cliente/operador en Finanzas',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-bold text-lg">Canvas del Negocio</h1>
          <p className="text-[11px] text-gray-500">GuiaSAI · GuanaGO — ecosistema turístico Raizal</p>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 border border-teal-700 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold tracking-widest text-teal-300 uppercase">Empresa</p>
          <p className="text-xl font-black mt-1">GuiaSAI S.A.S.</p>
          <p className="text-[11px] text-teal-200 mt-1">Agencia de turismo Raizal (RNT 48674) + GuanaGO, su plataforma digital</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {branches.map(b => (
          <div key={b.id} className={`bg-gradient-to-br ${b.color} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="text-lg">{b.emoji}</span> {b.titulo}
              </h3>
              {b.stat !== undefined && (
                <span className="text-[10px] font-bold bg-black/30 px-2 py-1 rounded-full flex items-center gap-1">
                  {loadingStats && <Loader2 size={10} className="animate-spin" />}
                  {b.stat}
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {b.items.map((it, i) => (
                <li key={i} className="text-[12.5px] text-gray-200 leading-snug flex items-start gap-1.5">
                  <span className="text-white/40 mt-0.5">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-600 text-center mt-6 px-4">
        Los números marcados con "+" indican que hay más de 100 registros — se muestra el conteo rápido, no el total exacto.
      </p>
    </div>
  );
}
