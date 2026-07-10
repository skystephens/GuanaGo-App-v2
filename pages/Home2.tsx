/**
 * Home2 — Nuevo Home GuiaSAI (rediseño jul-2026, inspirado en portales de viaje)
 *
 * Contenido editable: lee /api/home-config (tabla Airtable Home_Config vía backend).
 * Sky edita textos, imágenes del hero, bandera del día y experiencias desde
 * AdminEditorHome (o directamente en Airtable) — sin tocar código.
 *
 * Preview: https://app.guiasanandresislas.com/?p=home2
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AppRoute } from '../types';
import { GUANA_LOGO } from '../constants';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface HomeConfig { [k: string]: string }
interface Experiencia { nombre: string; precio: number; unidad: string; tag: string; meta: string; img: string }

interface Props { onNavigate: (route: AppRoute) => void; onCotizar?: () => void }

const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

const BANDERAS: Record<string, { dot: string; label: string }> = {
  verde:    { dot: 'bg-emerald-400', label: 'Mar habilitado hoy' },
  amarilla: { dot: 'bg-yellow-400',  label: 'Mar con precaución hoy' },
  roja:     { dot: 'bg-red-500',     label: 'Hoy sin salidas al mar — plan cultural activo' },
};

const Home2: React.FC<Props> = ({ onNavigate, onCotizar }) => {
  const [cfg, setCfg] = useState<HomeConfig>({});
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/home-config`).then(r => r.json()).then(setCfg).catch(() => {});
  }, []);

  const heroImgs = useMemo(
    () => (cfg.hero_imagenes || '').split(',').map(s => s.trim()).filter(Boolean),
    [cfg.hero_imagenes]
  );

  // Carrusel de paisajes: crossfade cada 6s
  useEffect(() => {
    if (heroImgs.length < 2) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImgs.length), 6000);
    return () => clearInterval(t);
  }, [heroImgs.length]);

  const experiencias: Experiencia[] = useMemo(() => {
    try { return JSON.parse(cfg.experiencias || '[]'); } catch { return []; }
  }, [cfg.experiencias]);

  const bandera = BANDERAS[cfg.bandera || 'verde'] || BANDERAS.verde;
  const tituloPartes = (cfg.hero_titulo || '').split('|');
  const wa = `https://wa.me/${cfg.whatsapp || '573153836043'}`;

  if (!cfg.hero_titulo) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F3FAFB]"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F3FAFB] text-[#12232B]" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* ══ NAV ══ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-teal-50">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate(AppRoute.HOME)} className="flex items-center gap-2.5">
            <img src={GUANA_LOGO} alt="GuiaSAI" className="w-9 h-9 object-contain" />
            <div className="text-left">
              <p className="font-black text-lg leading-none text-[#003D5C]">Guía<span className="text-orange-500">SAI</span></p>
              <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">RNT 48674 · Turismo Raizal</p>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#experiencias" className="hover:text-teal-600">Experiencias</a>
            <a href="#raizal" className="hover:text-teal-600">Ruta Raizal</a>
            <a href="#grupos" className="hover:text-teal-600">Grupos</a>
            <button onClick={() => onNavigate(AppRoute.MIS_COTIZACIONES)} className="hover:text-teal-600">Mis cotizaciones</button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(AppRoute.AUTH_GATE)}
              className="px-4 py-2 rounded-xl border-2 border-[#003D5C] text-[#003D5C] font-bold text-sm hover:bg-[#003D5C] hover:text-white transition-colors"
            >
              Iniciar sesión
            </button>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden sm:block px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* ══ HERO — carrusel de paisajes ══ */}
      <header className="relative min-h-[620px] flex items-center text-white overflow-hidden">
        {heroImgs.map((img, i) => (
          <div
            key={img}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms]"
            style={{ backgroundImage: `url('${img}')`, opacity: i === heroIdx ? 1 : 0 }}
          />
        ))}
        {/* velo suave solo para legibilidad — el paisaje protagoniza */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/25" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 w-full pt-32 pb-20">
          <p className="text-xs font-semibold tracking-[.18em] uppercase text-cyan-200 mb-3 drop-shadow">{cfg.hero_kriol}</p>
          <h1 className="font-black leading-[1.05] drop-shadow-lg" style={{ fontSize: 'clamp(36px,5.2vw,60px)' }}>
            {tituloPartes[0]}{tituloPartes[1] && <><br /><span className="text-orange-300">{tituloPartes[1]}</span></>}
          </h1>
          <p className="mt-4 mb-8 max-w-lg text-[15px] font-light text-white/90 leading-relaxed drop-shadow">{cfg.hero_sub}</p>

          {/* Buscador → cotizador */}
          <div className="bg-white rounded-2xl shadow-2xl p-3 grid grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_.9fr] gap-2 max-w-3xl text-[#12232B]">
            {[
              ['Destino', 'San Andrés Islas'],
              ['Fechas', 'Elige tus fechas'],
              ['Viajeros', '2 adultos'],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2 md:border-r border-gray-100 last:border-0">
                <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400">{l}</p>
                <p className="text-sm font-semibold">{v}</p>
              </div>
            ))}
            <button
              onClick={() => onCotizar?.()}
              className="col-span-2 md:col-span-1 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl py-3 md:py-0 transition-colors"
            >
              Cotizar gratis
            </button>
          </div>

          {/* indicadores del carrusel */}
          {heroImgs.length > 1 && (
            <div className="flex gap-1.5 mt-6">
              {heroImgs.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} className={`h-1.5 rounded-full transition-all ${i === heroIdx ? 'w-6 bg-white' : 'w-2.5 bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══ BANDERA DEL DÍA ══ */}
      <div className="bg-[#003D5C] text-white">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center gap-3 flex-wrap">
          <span className={`w-3 h-3 rounded-full ${bandera.dot} animate-pulse shrink-0`} />
          <b className="text-sm">{bandera.label}</b>
          <span className="text-xs text-cyan-100/80 font-light">{cfg.bandera_texto}</span>
        </div>
      </div>

      {/* ══ EXPERIENCIAS ══ */}
      <section id="experiencias" className="py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
            <div>
              <p className="text-[11px] font-bold tracking-[.14em] uppercase text-teal-600">Con cupo confirmado al pagar</p>
              <h2 className="text-3xl font-black text-[#003D5C] mt-1">Experiencias destacadas</h2>
            </div>
            <button onClick={() => onNavigate(AppRoute.CATALOG_PUBLICO)} className="text-sm font-bold text-orange-500 hover:text-orange-600">
              Todas las experiencias →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {experiencias.map(e => (
              <button
                key={e.nombre}
                onClick={() => onCotizar?.()}
                className="text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="h-44 bg-cover bg-center relative" style={{ backgroundImage: `url('${e.img}')` }}>
                  <span className={`absolute top-3 left-3 text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur ${e.tag === 'Ruta Raizal' ? 'bg-orange-500/90' : 'bg-[#003D5C]/85'}`}>
                    {e.tag}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[15px] text-gray-800">{e.nombre}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-3">{e.meta}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Desde · {e.unidad}</p>
                      <p className="font-black text-[#003D5C]">{fmtCOP(e.precio)}</p>
                    </div>
                    <span className="text-xs font-bold text-orange-500">Reservar →</span>
                  </div>
                </div>
              </button>
            ))}

            <button
              onClick={() => onNavigate(AppRoute.CATALOG_PUBLICO)}
              className="bg-[#003D5C] rounded-2xl text-white flex flex-col items-center justify-center p-8 hover:bg-[#004d73] transition-colors min-h-[280px]"
            >
              <p className="font-black text-xl mb-1">+70 experiencias más</p>
              <p className="text-xs text-cyan-100/80 font-light mb-5 text-center">Tours, traslados, gastronomía y cultura — todo el catálogo GuiaSAI</p>
              <span className="bg-orange-500 font-bold text-sm px-5 py-2.5 rounded-xl">Explorar catálogo</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══ RUTA RAIZAL ══ */}
      <section id="raizal" className="py-16 bg-[#FFF6EC]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[.14em] uppercase text-orange-500">Sello Ruta Raizal</p>
            <p className="text-xl font-bold text-orange-600 mt-2 mb-4" style={{ fontFamily: "'Poppins'" }}>{cfg.raizal_kriol}</p>
            <p className="text-[15px] leading-relaxed text-[#5a4a3a] font-light mb-3">{cfg.raizal_texto_1}</p>
            <p className="text-[15px] leading-relaxed text-[#5a4a3a] font-light mb-4">{cfg.raizal_texto_2}</p>
            <p className="font-black text-[#003D5C]">#LaivStieg</p>
          </div>
          <img src={cfg.raizal_imagen} alt="Cultura Raizal" className="rounded-2xl shadow-2xl w-full object-cover max-h-[380px]" />
        </div>
      </section>

      {/* ══ POR QUÉ GUIASAI ══ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-black text-[#003D5C] mb-8">Viaja con respaldo local</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['🛡️', 'Agencia registrada', 'GuíaSAI S.A.S. · RNT 48674 · 8+ años operando en el archipiélago.', 'border-teal-400'],
              ['🔒', 'Pago seguro Wompi', 'Nequi, tarjetas, PSE y Bancolombia. Tu cupo queda confirmado al pagar.', 'border-orange-400'],
              ['🌦️', 'Garantía de clima', 'Si la Capitanía suspende salidas, reprogramas gratis o cambias a plan cultural.', 'border-teal-400'],
              ['🥥', 'Empresa Raizal', 'Operadores locales, guías isleños y experiencias que fortalecen la comunidad.', 'border-orange-400'],
            ].map(([ico, t, d, b]) => (
              <div key={t} className={`bg-white rounded-2xl p-5 border-t-4 ${b} shadow-sm`}>
                <p className="text-2xl mb-2">{ico}</p>
                <h4 className="font-bold text-sm text-[#003D5C] mb-1">{t}</h4>
                <p className="text-[12px] text-slate-500 font-light leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GRUPOS ══ */}
      <section id="grupos" className="pb-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="rounded-3xl p-10 md:p-12 text-white flex items-center justify-between gap-8 flex-wrap" style={{ background: 'linear-gradient(115deg,#003D5C,#0a6a86)' }}>
            <div className="max-w-xl">
              <p className="text-[11px] font-bold tracking-[.14em] uppercase text-cyan-200">Equipos deportivos · Familias · Empresas</p>
              <h2 className="text-3xl font-black mt-2">{cfg.grupos_titulo}</h2>
              <p className="text-cyan-100/85 font-light text-sm mt-3 leading-relaxed">{cfg.grupos_texto}</p>
            </div>
            <a href={`${wa}?text=${encodeURIComponent('Hola GuiaSAI 🌴 quiero cotizar para mi grupo')}`} target="_blank" rel="noopener noreferrer"
               className="bg-orange-500 hover:bg-orange-600 font-black px-7 py-4 rounded-2xl transition-colors shadow-lg">
              Cotizar para mi grupo
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#001C2B] text-[#7fa4b0] pt-14 pb-8 text-sm">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src={GUANA_LOGO} alt="GuiaSAI" className="w-9 h-9 object-contain" />
                <p className="font-black text-lg text-white">Guía<span className="text-orange-500">SAI</span></p>
              </div>
              <p className="font-light leading-relaxed text-[13px]">GuíaSAI S.A.S. · NIT 901013739-9 · RNT 48674<br />Turismo Raizal · San Andrés Islas, Colombia</p>
            </div>
            <div>
              <h5 className="text-white font-bold mb-3 text-sm">Explora</h5>
              <ul className="space-y-2 font-light text-[13px]">
                <li><button onClick={() => onNavigate(AppRoute.CATALOG_PUBLICO)}>Experiencias</button></li>
                <li><button onClick={() => onCotizar?.()}>Cotiza tu viaje</button></li>
                <li><button onClick={() => onNavigate(AppRoute.MIS_COTIZACIONES)}>Mis cotizaciones</button></li>
                <li><button onClick={() => onNavigate(AppRoute.PROVEEDORES)}>Soy proveedor</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-3 text-sm">Contacto</h5>
              <ul className="space-y-2 font-light text-[13px]">
                <li>💬 WhatsApp +57 315 383 6043</li>
                <li>✉️ info@guiasai.com</li>
                <li>📍 San Andrés Isla, Colombia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#0e3547] pt-5 flex justify-between flex-wrap gap-2 text-[11px]">
            <span>© 2026 GuíaSAI S.A.S. — Todos los derechos reservados</span>
            <span>#LaivStieg 🌴</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home2;
