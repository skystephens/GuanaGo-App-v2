/**
 * WachiLanding — Página pública de la alianza GuíaSAI x Club Wachi (vóley).
 * Sin login, apunta a /?p=wachi2026. Reutilizable para cualquiera de los
 * viajes anuales del club (no atada a un torneo específico).
 *
 * v1 (solo visual): el formulario todavía NO escribe a Airtable. Captura de
 * lead real (Codigo_Club / Codigo_Jugador + persistencia localStorage) queda
 * pendiente para v2, según CLAUDE_CODE_WACHI_LANDING.md.
 */

import React, { useState } from 'react';
import { GUANA_LOGO } from '../constants';
import { createLeadWachi } from '../services/airtableService';

const CODIGO_CLUB = 'WACHI2026';

const normalizarCodigo = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, '');

const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface WachiLandingProps {
  onBack?: () => void;
}

const RUTAS = [
  {
    tag: 'Medio día',
    nombre: 'Ruta Básica',
    puntos: 'Cueva de Morgan + Casa Museo Isleña',
    desde: 190000,
    foto: null as string | null,
    accent: 'from-[#003D5C] to-[#00A8A0]',
  },
  {
    tag: 'Día completo',
    nombre: 'Ruta Intermedia',
    puntos: 'Museo Pirata + Iglesia Bautista + Coco Art*',
    desde: 230000,
    foto: 'https://guiasanandresislas.com/wp-content/uploads/2026/02/Museo-persistence-4.jpg',
    accent: 'from-[#05506F] to-[#F5831F]',
  },
  {
    tag: '2 días',
    nombre: 'Ruta Completa',
    puntos: 'Todos los puntos + Rondón Tour + Museo Miss Trinie',
    desde: 960000,
    foto: 'https://guiasanandresislas.com/wp-content/uploads/2026/02/miss-trinie-2.jpg',
    accent: 'from-[#F5831F] to-[#C24E00]',
  },
  {
    tag: 'Grupos 8+',
    nombre: 'Sopa de Cangrejo Grupal',
    puntos: 'Experiencia gastronómica Raizal — mínimo 8 personas',
    desde: 250000,
    porPersona: true,
    foto: 'https://guiasanandresislas.com/wp-content/uploads/2024/12/crab1.jpg',
    accent: 'from-[#00A8A0] to-[#007A74]',
  },
];

const OTRAS = [
  {
    nombre: 'Caribbean Night',
    desc: 'Cover + transporte + degustación. Una noche de música y cultura isleña.',
    desde: 140000,
    foto: 'https://guiasanandresislas.com/wp-content/uploads/2024/11/a34.jpg',
  },
  {
    nombre: 'Coco Art',
    desc: 'Experiencia de tejido en palma de coco con artesanos Raizales.',
    desde: 120000,
    foto: 'https://guiasanandresislas.com/wp-content/uploads/2026/02/CocoARTL.jpg',
  },
];

const WachiLanding: React.FC<WachiLandingProps> = ({ onBack }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToForm = () => {
    document.getElementById('wachi-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return;

    setEnviando(true);
    setError(null);

    const codigoNormalizado = codigo ? normalizarCodigo(codigo) : undefined;

    try {
      await createLeadWachi({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        codigoClub: CODIGO_CLUB,
        codigoJugador: codigoNormalizado,
      });

      // Persistir atribución para que otras secciones del sitio (tours,
      // alojamientos, traslados) puedan adjuntarla si el usuario navega
      // fuera de esta landing y cotiza después. Ver CLAUDE_CODE_WACHI_LANDING.md §7.
      try {
        localStorage.setItem('guiasai_ref_club', CODIGO_CLUB);
        if (codigoNormalizado) {
          localStorage.setItem('guiasai_ref_jugador', codigoNormalizado);
        }
      } catch {
        // localStorage puede fallar en navegación privada — no bloquea el envío
      }

      setEnviado(true);
    } catch (err) {
      console.error('Error enviando formulario Wachi:', err);
      setError('No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos directo por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] text-[#10242C]">
      {/* HERO */}
      <header className="relative overflow-hidden bg-[#003D5C] text-[#F6F1E7] pt-10 pb-16">
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 opacity-10"
          fill="none"
        >
          <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="2" />
          <path d="M50 2C50 2 30 25 50 50C70 75 50 98 50 98" stroke="white" strokeWidth="2" />
          <path d="M2 50C2 50 25 30 50 50C75 70 98 50 98 50" stroke="white" strokeWidth="2" />
          <path d="M14 20C14 20 35 35 50 50C65 65 86 80 86 80" stroke="white" strokeWidth="2" />
        </svg>

        <div className="max-w-3xl mx-auto px-6">
          {onBack && (
            <button onClick={onBack} className="text-xs text-[#C9DCE4] mb-4 hover:text-white">
              ← Volver
            </button>
          )}

          <div className="flex items-center justify-between mb-9">
            <img src={GUANA_LOGO} alt="GuíaSAI" className="h-8 object-contain" />
            <div className="flex items-center gap-2">
              <div className="text-right leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-[#C9DCE4]">Alianza con</div>
                <div className="text-[13px] font-bold text-white tracking-wide">Club Wachi</div>
              </div>
              <img
                src="/logo-wachi.jpg"
                alt="Club Deportivo Wachi"
                className="w-11 h-11 rounded-full border-2 border-white/40 object-cover"
              />
            </div>
          </div>

          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-mono bg-[#00A8A0]/20 border border-[#00A8A0]/50 text-[#8FE3DC] rounded-full px-3 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5831F]" />
            Alianza GuíaSAI · Club Wachi
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-[1.08] max-w-[11ch] text-white">
            Cada reserva es un <em className="italic text-[#F5831F] font-medium not-italic">pase</em> para que la isla juegue.
          </h1>

          <p className="mt-4 max-w-[46ch] text-[17px] text-[#C9DCE4]">
            El Club Wachi de vóley viaja varias veces al año a representar a San Andrés en torneos por Colombia.
            Reserva tu tour, traslado o alojamiento aquí y un % va directo al viaje de un deportista isleño.
          </p>

          <div className="mt-9 inline-flex rounded-xl border border-white/20 bg-white/5 overflow-hidden w-fit">
            {[
              ['WACHI', 'Club de vóley'],
              ['SAN ANDRÉS', 'Islas'],
              ['2+ / año', 'Viajes a torneos'],
            ].map(([num, lbl], i) => (
              <div key={i} className="px-5 py-3.5 border-r border-white/15 last:border-r-0">
                <div className="font-mono text-lg font-bold text-[#F5831F]">{num}</div>
                <div className="text-[11px] uppercase tracking-wide text-[#9FBAC5] mt-0.5">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div
        className="h-3.5 opacity-55"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #00A8A0 0 2px, transparent 2px 22px)',
          backgroundPosition: 'center',
        }}
      />

      {/* PHOTO STRIP — placeholder hasta subir fotos reales del equipo */}
      <section className="py-6 bg-[#F6F1E7]">
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-3 gap-3">
          {['Foto del equipo', 'Jugadores en entrenamiento', 'Torneo anterior'].map((label, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg border border-dashed border-[#003D5C]/30 flex flex-col items-center justify-center gap-1.5 text-[#003D5C] text-center p-3"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, rgba(0,61,92,0.05) 0 10px, rgba(0,61,92,0.09) 10px 20px)',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 opacity-55" fill="none" stroke="currentColor" strokeWidth={1.6}>
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M8 6l1.5-2h5L16 6" />
              </svg>
              <span className="text-[11px] font-mono opacity-70 leading-tight">{label}<br />próximamente</span>
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section id="wachi-form" className="bg-white py-12 border-b border-[#003D5C]/10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-[#003D5C]">Reserva y apoya el viaje</h2>
          <p className="mt-2 max-w-[52ch] text-[15px] text-[#3E5A66]">
            Déjanos tus datos, un asesor te contacta para armar tu plan. Si un jugador te compartió esta
            página, anota su código: así el club sabe a quién reconocer el esfuerzo.
          </p>

          {enviado ? (
            <div className="mt-6 rounded-lg bg-[#00A8A0]/10 border border-[#00A8A0]/40 p-5 text-[#00695F]">
              ¡Gracias{nombre ? `, ${nombre}` : ''}! Un asesor de GuíaSAI te va a contactar pronto
              {telefono ? ` al ${telefono}` : ''}.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 max-w-lg">
              <div>
                <label className="block text-[13px] font-semibold text-[#003D5C] mb-1.5">Nombre completo</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-lg border border-[#003D5C]/15 bg-[#F6F1E7] text-[15px] focus:outline-none focus:border-[#00A8A0]"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#003D5C] mb-1.5">Teléfono / WhatsApp</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  type="tel"
                  className="w-full px-3.5 py-3 rounded-lg border border-[#003D5C]/15 bg-[#F6F1E7] text-[15px] focus:outline-none focus:border-[#00A8A0]"
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div className="rounded-lg border border-dashed border-[#F5831F]/40 bg-[#F5831F]/[0.07] p-3.5">
                <label className="block text-[13px] font-semibold text-[#003D5C] mb-1.5">
                  Código del jugador que te recomendó (opcional)
                </label>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-lg border border-[#003D5C]/15 bg-white text-[15px] focus:outline-none focus:border-[#00A8A0]"
                  placeholder="Ej: A201"
                />
                <p className="text-[13px] text-[#7A4A17] mt-2 leading-snug">
                  <strong className="text-[#F5831F]">Tu compra aporta un % directo</strong> al viaje de este
                  deportista isleño — por eso es importante registrar su código. Si no tienes uno, el aporte
                  queda para el fondo general del club.
                </p>
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="justify-self-start mt-1 bg-[#F5831F] hover:bg-[#DE7112] text-white font-semibold text-[15px] px-7 py-3.5 rounded-lg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {enviando ? 'Enviando...' : 'Enviar y ver disponibilidad'}
              </button>
              {error && (
                <p className="text-[13px] text-red-600 -mt-2">{error}</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* CATALOGO */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-[22px] font-bold text-[#003D5C] mb-1.5">Elige cómo apoyar</h2>
          <p className="text-[14px] text-[#3E5A66] mb-7">Cada reserva confirmada suma al fondo de viaje del club.</p>

          <h3 className="text-[15px] font-bold uppercase tracking-wide text-[#003D5C] mb-4">Rutas Raizal con guía</h3>
          <div className="grid grid-cols-2 gap-4">
            {RUTAS.map((r) => (
              <div key={r.nombre} className="bg-white border border-[#003D5C]/10 rounded-xl overflow-hidden flex flex-col">
                <div
                  className="h-[100px] relative bg-cover bg-center"
                  style={
                    r.foto
                      ? {
                          backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05)), url('${r.foto}')`,
                        }
                      : undefined
                  }
                >
                  {!r.foto && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${r.accent}`}
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(255,255,255,0.13) 0 3px, transparent 3px 26px)',
                      }}
                    />
                  )}
                  <span className="absolute top-2.5 left-2.5 bg-black/30 text-white text-[10px] uppercase tracking-wide font-mono px-2.5 py-1 rounded-full">
                    {r.tag}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <h4 className="text-[16px] font-bold">{r.nombre}</h4>
                  <p className="text-[12px] text-[#5A6E76]">{r.puntos}</p>
                  <p className="mt-auto font-mono text-[13px] font-bold text-[#003D5C] pt-1.5">
                    {r.porPersona ? `${cop(r.desde)} por persona` : `Desde ${cop(r.desde)} (2 pax)`}
                  </p>
                  <button
                    onClick={scrollToForm}
                    className="mt-2 border border-[#00A8A0] text-[#00A8A0] hover:bg-[#00A8A0] hover:text-white text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-colors"
                  >
                    Cotizar este servicio
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#7A8E95] mt-2.5">
            *Coco Art incluido sin costo adicional solo cuando el guía es Sky. Transporte se cotiza aparte según modalidad.
          </p>

          <h3 className="text-[15px] font-bold uppercase tracking-wide text-[#003D5C] mt-9 mb-4">Otras experiencias</h3>
          <div className="grid grid-cols-2 gap-4">
            {OTRAS.map((o) => (
              <div key={o.nombre} className="bg-white border border-[#003D5C]/10 rounded-xl overflow-hidden flex flex-col">
                <div
                  className="h-[110px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${o.foto}')` }}
                />
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <h4 className="text-[16px] font-bold">{o.nombre}</h4>
                  <p className="text-[13px] text-[#5A6E76] flex-1">{o.desc}</p>
                  <p className="font-mono text-[13px] font-bold text-[#003D5C]">Desde {cop(o.desde)}</p>
                  <button
                    onClick={scrollToForm}
                    className="mt-2 border border-[#00A8A0] text-[#00A8A0] hover:bg-[#00A8A0] hover:text-white text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-colors"
                  >
                    Cotizar este servicio
                  </button>
                </div>
              </div>
            ))}

            <div className="col-span-2 bg-white border border-[#003D5C]/10 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="text-[16px] font-bold">Traslados en taxi</h4>
                <p className="text-[13px] text-[#5A6E76] mt-0.5">Aeropuerto ↔ hotel, y movilidad dentro de la isla.</p>
              </div>
              <button className="bg-[#003D5C] text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg">
                Ver catálogo de traslados
              </button>
            </div>

            <div className="col-span-2 bg-white border border-[#003D5C]/10 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="text-[16px] font-bold">Alojamiento</h4>
                <p className="text-[13px] text-[#5A6E76] mt-0.5">
                  Hoteles y posadas aliadas, para toda la familia del jugador o su hinchada.
                </p>
              </div>
              <button className="bg-[#003D5C] text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg">
                Ver catálogo de alojamiento
              </button>
            </div>
          </div>
        </div>
      </section>

      <div
        className="h-3.5 opacity-55"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #00A8A0 0 2px, transparent 2px 22px)',
          backgroundPosition: 'center',
        }}
      />

      <footer className="bg-[#003D5C] text-[#9FBAC5] text-center py-6 text-[12px]">
        <strong className="text-[#F6F1E7]">GuíaSAI</strong> — Alianza con Club Wachi · San Andrés Islas
        <br />
        Prototipo v1 — el formulario aún no guarda datos en el sistema
      </footer>
    </div>
  );
};

export default WachiLanding;
