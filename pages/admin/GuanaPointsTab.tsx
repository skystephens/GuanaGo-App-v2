import { useState } from 'react'

// ─── Datos ───────────────────────────────────────────────────────────────────

const ITEMS = [
  { name: 'Cóctel en bar aliado',               cop: 20000,  bonus: 15,  cat: 'Gastronomía' },
  { name: 'Almuerzo Bushi Food (corriente)',     cop: 30000,  bonus: 40,  cat: 'Gastronomía' },
  { name: 'Almuerzo Bushi Food (premium)',       cop: 65000,  bonus: 40,  cat: 'Gastronomía' },
  { name: 'Almuerzo restaurante aliado',         cop: 45000,  bonus: 25,  cat: 'Gastronomía' },
  { name: 'Entrada al cine',                     cop: 15000,  bonus: 10,  cat: 'Ocio' },
  { name: 'Taxi carrera mínima',                 cop: 30000,  bonus: 0,   cat: 'Transporte' },
  { name: 'Caribbean Night (vía app)',           cop: 40000,  bonus: 100, cat: 'Tour' },
  { name: 'Acuario de San Andrés (vía app)',     cop: 120000, bonus: 125, cat: 'Tour' },
  { name: 'Alojamiento 1 noche/persona (vía app)', cop: 100000, bonus: 200, cat: 'Alojamiento' },
  { name: 'Camiseta almacén aliado',             cop: 40000,  bonus: 10,  cat: 'Ropa' },
  { name: 'Artesanía Coco ART',                  cop: 35000,  bonus: 25,  cat: 'Cultural' },
] as const

const CANJES = [
  { gp: 200,   label: 'Cóctel de bienvenida' },
  { gp: 350,   label: 'Almuerzo corriente gratis' },
  { gp: 400,   label: 'Entradas al cine ×2' },
  { gp: 500,   label: 'Caribbean Night' },
  { gp: 800,   label: 'Camiseta aliado' },
  { gp: 1000,  label: 'Taxi gratis' },
  { gp: 2000,  label: 'Descuento $20k en tour' },
  { gp: 3500,  label: 'Pieza Coco ART' },
  { gp: 5000,  label: 'Cupo bote (Chamey)' },
  { gp: 6000,  label: '50% descuento Acuario' },
  { gp: 10000, label: 'Noche extra posada' },
]

const ROADMAP = [
  {
    mes: 'Junio 2026', color: '#00C5A3', estado: 'En curso',
    titulo: 'Soft launch 20 jun · Público 30 jun',
    tareas: [
      'PWA con perfiles Turista y Residente activos',
      '15–20 aliados en el mapa con plan asignado',
      'Flujo PayU en producción (confirmado ✓)',
      'GP en Firestore solo manual — sin interfaz aún',
    ],
  },
  {
    mes: 'Julio 2026', color: '#378ADD', estado: '4 semanas',
    titulo: 'Motor GP — las 4 piezas críticas',
    tareas: [
      'Sem 1: Schema Firestore wallets + transactions + canjes',
      'Sem 1: Tabla GuanaPoints_Ledger en Airtable',
      'Sem 2: QR de emisión en panel del aliado',
      'Sem 2: Modal confirmación en app del turista',
      'Sem 3: Wallet visible en app con historial',
      'Sem 3: Vitrina de canjes en panel del aliado',
      'Sem 4: Escenario Make.com completo + push FCM',
    ],
  },
  {
    mes: 'Agosto 2026', color: '#F5A623', estado: 'Meta',
    titulo: 'Lanzamiento GP público',
    tareas: [
      'GP activos para todos los turistas en la red',
      'Campaña lanzamiento: 2× GP primera semana de agosto',
      'Dashboard aliado: GP emitidos · canjes · turistas con saldo',
      'Primer canje real documentado como caso de éxito',
      'Onboarding de 5 aliados nuevos motivados por GP',
    ],
  },
  {
    mes: 'Sep – Oct 2026', color: '#888780', estado: 'Q4',
    titulo: 'Consolidación y datos reales',
    tareas: [
      'Análisis primer mes: tasa uso, canjes populares, top emisores',
      'Ajuste de umbrales según comportamiento real',
      'Cuotas de emisión por plan (Fase 2)',
      'Preparar campaña Navidad / Temporada alta diciembre',
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtCOP = (n: number) => '$' + Math.round(n).toLocaleString('es-CO')

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

type SubTab = 'pitch' | 'simulador' | 'proyeccion' | 'roadmap' | 'token'

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'pitch',      label: '🏪 Pitch aliado' },
  { id: 'simulador',  label: '🧮 Simulador viaje' },
  { id: 'proyeccion', label: '📈 Proyección GP' },
  { id: 'roadmap',    label: '🛠 Roadmap técnico' },
  { id: 'token',      label: '🪙 Utility token' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GuanaPointsTab() {
  const [sub, setSub] = useState<SubTab>('pitch')

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-gray-700/60 overflow-x-auto mb-4 -mx-1">
        {SUBTABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
              sub === t.id
                ? 'border-[#00C5A3] text-[#00C5A3]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {sub === 'pitch'      && <PitchAliado />}
      {sub === 'simulador'  && <SimuladorViaje />}
      {sub === 'proyeccion' && <ProyeccionGP />}
      {sub === 'roadmap'    && <RoadmapTecnico />}
      {sub === 'token'      && <UtilityToken />}
    </div>
  )
}

// ─── PITCH ALIADO ─────────────────────────────────────────────────────────────

function PitchAliado() {
  return (
    <div className="space-y-4">
      {/* Argumento aerolínea */}
      <div className="bg-gray-800/60 border border-[#00C5A3]/20 rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#00C5A3] font-bold mb-2">
          El argumento en lenguaje de aerolínea
        </p>
        <p className="text-sm text-gray-300 leading-relaxed italic">
          "¿Usted sabe cómo funciona LifeMiles de Avianca? Cada vez que uno vuela, le dan puntos
          que puede usar en hoteles, tiquetes, cosas. GuanaPoints funciona igual — pero para tu
          negocio en San Andrés. Cada vez que un turista te compra, le das puntos GuanaGO que
          puede usar aquí en la isla. Tú no pones plata. Pones una bandeja, un cupo vacío, una
          camiseta. Y el turista tiene una razón para volver."
        </p>
      </div>

      {/* 3 formas de participar */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
          3 formas de participar — sin invertir efectivo
        </p>
        <div className="space-y-2">
          {[
            {
              icon: '%', color: '#00C5A3', bg: 'rgba(0,197,163,0.1)',
              title: '1 — Emitir GP por consumo',
              desc: 'Cada $1.000 que el turista gasta = 1 GP. El aliado no pone plata.',
              badge: '$1.000 = 1 GP',
            },
            {
              icon: '🎁', color: '#378ADD', bg: 'rgba(55,138,221,0.1)',
              title: '2 — Ofrecer un canje propio',
              desc: 'El aliado carga su beneficio desde el panel. La app lo muestra cuando el turista tiene saldo cerca.',
              badge: 'Vitrina digital',
            },
            {
              icon: '👥', color: '#F5A623', bg: 'rgba(245,166,35,0.1)',
              title: '3 — Referir otro negocio',
              desc: 'Si convence a otro negocio de activar plan Activo o Premium, recibe 500 GP canjeables.',
              badge: '500 GP por referido',
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start bg-gray-800/50 rounded-xl p-3 border border-gray-700/60">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: item.bg, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-100 mb-0.5">{item.title}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                style={{ background: item.bg, color: item.color }}
              >
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de costos reales */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
          Costo real del canje para el aliado
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-700/60">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-800/80">
                {['Aliado', 'Canje', 'GP req.', 'Costo real', 'Valor percibido'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Restaurante / bar',   'Cóctel bienvenida',   '200 GP',    '~$5.000',   '$20.000'],
                ['Restaurante Raizal',  'Almuerzo corriente',  '350 GP',    '~$8.000',   '$28–$35k'],
                ['Operador náutico',    'Cupo bote vacío',     '5.000 GP',  '$0',        '$50–$80k'],
                ['Artesano Raizal',     'Pieza Coco ART',      '3.500 GP',  '~$5.000',   '$35.000'],
                ['Posada Raizal',       'Noche extra',         '10.000 GP', '~$12.000',  '$100.000'],
                ['Almacén de ropa',     'Camiseta básica',     '800 GP',    '~$15.000',  '$40.000'],
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'}>
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3 py-2 ${
                      j === 2 ? 'text-[#00C5A3] font-semibold' :
                      j === 4 ? 'text-blue-300' :
                      'text-gray-400'
                    }`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SIMULADOR DE VIAJE ───────────────────────────────────────────────────────

function SimuladorViaje() {
  const [qtys, setQtys] = useState<number[]>(ITEMS.map(() => 0))

  const adj = (i: number, d: number) => {
    const next = [...qtys]
    next[i] = Math.max(0, next[i] + d)
    setQtys(next)
  }

  const totalCOP   = ITEMS.reduce((s, it, i) => s + it.cop * qtys[i], 0)
  const totalGP    = ITEMS.reduce((s, it, i) => s + Math.round(it.cop / 1000) * qtys[i], 0)
  const totalBonus = 50 + ITEMS.reduce((s, it, i) => s + (qtys[i] > 0 ? it.bonus : 0), 0)
  const totalFinal = totalGP + totalBonus

  const canjeables   = CANJES.filter(c => c.gp <= totalFinal)
  const noCanjeables = CANJES.filter(c => c.gp > totalFinal).slice(0, 4)

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {ITEMS.map((item, i) => {
          const gpBase  = Math.round(item.cop / 1000)
          const gpTotal = gpBase * qtys[i] + (qtys[i] > 0 ? item.bonus : 0)
          return (
            <div key={i} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="flex-1">
                <p className="text-[11px] text-gray-200 font-medium">{item.name}</p>
                <p className="text-[10px] text-gray-600">{item.cat} · {gpBase} GP base + {item.bonus} bonus</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => adj(i, -1)} className="w-5 h-5 rounded-full border border-gray-700 text-gray-500 hover:text-white text-xs flex items-center justify-center">−</button>
                <span className="text-xs font-bold text-white w-3 text-center">{qtys[i]}</span>
                <button onClick={() => adj(i, +1)} className="w-5 h-5 rounded-full border border-gray-700 text-gray-500 hover:text-white text-xs flex items-center justify-center">+</button>
              </div>
              <span className="text-[11px] font-semibold text-[#00C5A3] w-14 text-right">{gpTotal > 0 ? gpTotal + ' GP' : '—'}</span>
            </div>
          )
        })}
      </div>

      {/* Totales */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Gasto total', val: fmtCOP(totalCOP),                                        color: 'text-white' },
          { label: 'GP consumo',  val: totalGP + ' GP',                                          color: 'text-[#00C5A3]' },
          { label: 'GP bonus',    val: '+' + totalBonus,                                         color: 'text-blue-400' },
          { label: 'GP totales',  val: totalFinal.toLocaleString('es-CO') + ' GP',              color: 'text-amber-400' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-2 text-center">
            <p className={`text-sm font-bold ${m.color}`}>{m.val}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Canjes desbloqueados */}
      {totalFinal > 50 && (
        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/60">
          <p className="text-[11px] font-semibold text-gray-200 mb-2">
            Con {totalFinal.toLocaleString('es-CO')} GP puedes canjear:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {canjeables.map(c => (
              <span key={c.gp} className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#00C5A3]/15 text-[#00C5A3]">
                ✓ {c.label} ({c.gp.toLocaleString()} GP)
              </span>
            ))}
            {noCanjeables.map(c => (
              <span key={c.gp} className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-800/60 text-gray-600 line-through">
                {c.label} ({c.gp.toLocaleString()} GP)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PROYECCIÓN GP ────────────────────────────────────────────────────────────

function ProyeccionGP() {
  const [aliados,   setAliados]   = useState(20)
  const [actPct,    setActPct]    = useState(60)
  const [reservas,  setReservas]  = useState(30)
  const [ticket,    setTicket]    = useState(120000)

  const premPct    = (100 - actPct) / 100
  const memIngreso = Math.round(aliados * (actPct / 100 * 49900 + premPct * 129900))
  const comIngreso = Math.round(reservas * ticket * 0.15)
  const total      = memIngreso + comIngreso

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/60 border border-amber-800/30 rounded-xl p-3">
        <p className="text-[11px] font-semibold text-amber-400 mb-1">GuanaGO gana aunque el turista no canjee</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Los GP emitidos son pasivo diferido. Históricamente los programas de loyalty tienen
          25–35% de "breakage" (puntos que nunca se canjean). Ese margen queda para GuanaGO.
          El costo del canje lo absorbe el aliado en especie — GuanaGO no desembolsa nada.
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        {[
          { label: 'Aliados activos', val: aliados, min: 5,     max: 100,    step: 5,     set: setAliados,  fmt: (v: number) => String(v) },
          { label: '% en plan Activo ($49.900)', val: actPct, min: 10, max: 90, step: 10, set: setActPct,   fmt: (v: number) => v + '%' },
          { label: 'Reservas mensuales vía app', val: reservas, min: 5, max: 200, step: 5, set: setReservas, fmt: (v: number) => String(v) },
          { label: 'Ticket promedio por reserva', val: ticket, min: 40000, max: 500000, step: 10000, set: setTicket, fmt: fmtCOP },
        ].map((s, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-gray-500">{s.label}</span>
              <span className="text-[11px] font-semibold text-gray-200">{s.fmt(s.val)}</span>
            </div>
            <input
              type="range" min={s.min} max={s.max} step={s.step} value={s.val}
              onChange={e => s.set(Number(e.target.value))}
              className="w-full accent-[#00C5A3] h-1"
            />
          </div>
        ))}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Membresías / mes', val: fmtCOP(memIngreso), color: 'text-[#00C5A3]' },
          { label: 'Comisiones / mes', val: fmtCOP(comIngreso), color: 'text-blue-400' },
          { label: 'Total estimado',   val: fmtCOP(total),      color: 'text-amber-400' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 text-center">
            <p className={`text-base font-bold ${m.color}`}>{m.val}</p>
            <p className="text-[9px] text-gray-600 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Barras */}
      <div className="space-y-2">
        {[
          { label: 'Membresías', val: memIngreso, color: '#00C5A3' },
          { label: 'Comisiones', val: comIngreso, color: '#378ADD' },
        ].map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">{b.label}</span>
              <span className="font-semibold text-gray-300">{fmtCOP(b.val)}</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${Math.round(b.val / total * 100)}%` : '0%', background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ROADMAP TÉCNICO ──────────────────────────────────────────────────────────

function RoadmapTecnico() {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        Las 4 piezas críticas para agosto
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          {
            color: '#00C5A3', title: '1 — Firestore schema',
            code: `wallets/{userId}\n  balance: number\n  totalEarned: number\n  expiresAt: timestamp\n\ntransactions/{txId}\n  userId, aliasId, type\n  amount, copAmount, source\n\ncanjes/{canjeId}\n  aliasId, title\n  gpCost, active, stock`,
          },
          {
            color: '#378ADD', title: '2 — Airtable GuanaPoints_Ledger',
            code: `TxID · UserId · AliasId\nTipo: emision/canje/bonus\nMonto_GP · Monto_COP\nFuente: compra/reserva/foto\nEstado: activo/canjeado/expirado\nFechaCreacion · FechaExpiracion`,
          },
          {
            color: '#F5A623', title: '3 — QR emisión en panel aliado',
            code: `Flujo:\n1. Turista escanea QR del aliado\n2. App abre modal con monto\n3. Turista confirma consumo\n4. GP acreditados en wallet\n5. Push al turista y al aliado\n\nAlt: código de 6 dígitos`,
          },
          {
            color: '#888780', title: '4 — Escenario Make.com',
            code: `Trigger: webhook POST desde Render\n→ Crear registro Airtable Ledger\n→ Actualizar Firestore wallet\n→ Si balance ≥ umbral:\n    → Push FCM al turista\n→ Si primer GP:\n    → Email bienvenida programa`,
          },
        ].map((p, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl p-3 border-l-4" style={{ borderLeftColor: p.color }}>
            <p className="text-[11px] font-bold mb-2" style={{ color: p.color }}>{p.title}</p>
            <pre className="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap font-mono">{p.code}</pre>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold pt-1">
        Semana a semana
      </p>
      <div className="space-y-0">
        {ROADMAP.map((fase, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: fase.color }} />
              {i < ROADMAP.length - 1 && <div className="w-px flex-1 bg-gray-700 my-1" />}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: fase.color }}>
                  {fase.mes}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: fase.color + '20', color: fase.color }}
                >
                  {fase.estado}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-200 mb-1">{fase.titulo}</p>
              <ul className="space-y-0.5">
                {fase.tareas.map((t, j) => (
                  <li key={j} className="text-[11px] text-gray-500 flex gap-1.5">
                    <span className="text-gray-700 flex-shrink-0">·</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/60 border border-amber-800/30 rounded-xl p-3">
        <p className="text-[11px] font-bold text-amber-400 mb-1">⚠ Prioridad antes del 1 de julio</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Schema Firestore + tabla Airtable GuanaPoints_Ledger. Son 2 horas en Claude Code.
          Sin eso julio se retrasa y agosto no se cumple. El QR y Make.com vienen después.
        </p>
      </div>
    </div>
  )
}

// ─── UTILITY TOKEN ────────────────────────────────────────────────────────────

function UtilityToken() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        Evolución — de cupón a utility token
      </p>
      {[
        {
          color: '#00C5A3', icon: '🎫',
          titulo: 'Fase 1 — Cupones digitales (junio 2026)',
          badge: 'Activa', badgeBg: 'rgba(0,197,163,0.15)',
          desc: 'GP como registro en Firestore + Airtable. GuanaGO es el único emisor. El aliado lo entiende como "puntos de mi negocio operados por GuanaGO". Sin blockchain, sin fricción.',
          reglas: [
            '1 GP = $1 COP redeemable solo dentro del ecosistema',
            'No se convierte en efectivo fuera de la plataforma',
            'Expiran a los 18 meses sin movimiento',
            'Costo para GuanaGO: $0 — el canje lo absorbe el aliado',
          ],
        },
        {
          color: '#F5A623', icon: '⭐',
          titulo: 'Fase 2 — Cuotas por plan (Q4 2026)',
          badge: 'Planificada', badgeBg: 'rgba(245,166,35,0.15)',
          desc: 'Los aliados emiten GP directamente desde su panel — con cuota mensual según plan. Crea escasez controlada y convierte los GP en razón de upgrade.',
          reglas: [
            'Plan Básico: 0 GP / mes — no puede emitir',
            'Plan Activo ($49.900): cuota 5.000 GP / mes',
            'Plan Premium ($129.900): cuota 20.000 GP / mes',
            'GP adicionales a la cuota: $1 COP c/u — ingreso GuanaGO',
          ],
        },
        {
          color: '#378ADD', icon: '🔷',
          titulo: 'Fase 3 — GuanaToken en Hedera (2027+)',
          badge: 'Largo plazo', badgeBg: 'rgba(55,138,221,0.15)',
          desc: 'Migración a token fungible en Hedera HTS. Registrado ante SIC como programa de fidelización — no como criptomoneda. GuíaSAI S.A.S. como entidad respaldante.',
          reglas: [
            'Intercambiable entre usuarios del ecosistema (P2P)',
            'No clasifica como criptomoneda — respaldo en servicios',
            'Evita regulación SFC y no requiere licencia Banco República',
            'El "breakage" es ingreso real diferido para GuanaGO',
          ],
        },
      ].map((fase, i) => (
        <div
          key={i}
          className="bg-gray-800/60 rounded-xl p-3 border-l-4"
          style={{ borderLeftColor: fase.color }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{fase.icon}</span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-gray-100">{fase.titulo}</p>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: fase.badgeBg, color: fase.color }}
            >
              {fase.badge}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{fase.desc}</p>
          <ul className="space-y-0.5">
            {fase.reglas.map((r, j) => (
              <li key={j} className="text-[11px] text-gray-500 flex gap-1.5">
                <span className="flex-shrink-0" style={{ color: fase.color }}>—</span>{r}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
