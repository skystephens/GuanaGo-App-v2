import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, Star, Zap, Crown, Check, X,
  MessageCircle, ChevronDown, ChevronUp, Users, TrendingUp, QrCode, Shield,
} from 'lucide-react';
import { AppRoute } from '../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const PLANES = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 0,
    label: 'Gratis',
    color: 'teal',
    icon: QrCode,
    descripcion: 'Empieza a ser visible en GuanaGO',
    features: [
      { texto: 'Ficha en directorio GuanaGO', ok: true },
      { texto: 'Código QR personalizado', ok: true },
      { texto: 'Visibilidad digital básica', ok: true },
      { texto: 'Panel de negocio básico', ok: true },
      { texto: 'Pin en mapa interactivo', ok: false },
      { texto: 'GuanaPoints para clientes', ok: false },
      { texto: 'Prioridad en búsquedas', ok: false },
      { texto: 'Creación de contenido', ok: false },
    ],
  },
  {
    id: 'activo',
    nombre: 'Aliado Activo',
    precio: 49900,
    label: '$49.900/mes',
    color: 'orange',
    icon: Zap,
    descripcion: 'Con pin en el mapa para turistas que caminan la isla',
    popular: true,
    features: [
      { texto: 'Todo lo del plan Básico', ok: true },
      { texto: 'Pin de ubicación en el mapa', ok: true },
      { texto: 'GuanaPoints para tus clientes', ok: true },
      { texto: 'Prioridad en búsquedas', ok: true },
      { texto: 'Insignia "Aliado Verificado"', ok: true },
      { texto: 'Notificaciones en tiempo real', ok: true },
      { texto: 'Soporte prioritario WhatsApp', ok: true },
      { texto: 'Creación de contenido mensual', ok: false },
    ],
  },
  {
    id: 'premium',
    nombre: 'Aliado Premium',
    precio: 129900,
    label: '$129.900/mes',
    color: 'indigo',
    icon: Crown,
    descripcion: 'El paquete completo para crecer de verdad',
    features: [
      { texto: 'Todo lo del plan Activo', ok: true },
      { texto: 'Posición destacada (aparece primero)', ok: true },
      { texto: 'Creación de contenido mensual', ok: true },
      { texto: 'Analytics de visitas e interacciones', ok: true },
      { texto: 'Gestor de cuenta dedicado', ok: true },
      { texto: 'Badge verificado Premium', ok: true },
      { texto: 'Descuento en tours GuanaGO', ok: true },
      { texto: 'Material impreso QR + sticker', ok: true },
    ],
  },
];

const PASOS = [
  {
    num: '01',
    titulo: 'Regístrate gratis',
    desc: 'Crea tu cuenta en GuanaGO. Tu ficha básica queda activa en menos de 24 horas.',
  },
  {
    num: '02',
    titulo: 'Configura tu perfil',
    desc: 'Sube fotos, describe tu negocio y agrega horarios. Nosotros te ayudamos.',
  },
  {
    num: '03',
    titulo: 'Crece con la isla',
    desc: 'Turistas descubren tu negocio, acumulan GuanaPoints y regresan.',
  },
];

const VALORES = [
  { icon: Users, titulo: 'Red de turistas activos', desc: 'Miles de viajeros usan GuanaGO para descubrir San Andrés cada mes.' },
  { icon: MapPin, titulo: 'Pin en el mapa', desc: 'Tu negocio aparece visible en el mapa interactivo que los turistas consultan en la isla.' },
  { icon: Star, titulo: 'GuanaPoints', desc: 'Tus clientes acumulan puntos contigo. La lealtad se convierte en ventas repetidas.' },
  { icon: TrendingUp, titulo: 'Más visibilidad, más ventas', desc: 'Negocios aliados reportan hasta 3x más consultas digitales en el primer mes.' },
  { icon: Shield, titulo: 'Raizal y orgulloso', desc: 'GuanaGO es un proyecto de soberanía económica. Apoyamos los negocios locales primero.' },
  { icon: QrCode, titulo: 'QR en tu negocio', desc: 'Recibe un sticker QR para tu vitrina. Los turistas escanean y llegan directamente a tu ficha.' },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; btn: string }> = {
  teal: {
    bg: 'bg-teal-950/40',
    border: 'border-teal-700/50',
    text: 'text-teal-400',
    badge: 'bg-teal-900/60 text-teal-300',
    btn: 'bg-teal-600 hover:bg-teal-500',
  },
  orange: {
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/70',
    text: 'text-orange-400',
    badge: 'bg-orange-900/60 text-orange-300',
    btn: 'bg-orange-500 hover:bg-orange-400',
  },
  indigo: {
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-700/50',
    text: 'text-indigo-400',
    badge: 'bg-indigo-900/60 text-indigo-300',
    btn: 'bg-indigo-600 hover:bg-indigo-500',
  },
};

const VincularComercio: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [openPlan, setOpenPlan] = useState<string | null>('activo');

  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/573153836043?text=Hola%20GuanaGO%2C%20quiero%20vincular%20mi%20negocio%20a%20la%20plataforma',
      '_blank',
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-1 hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-black text-sm leading-tight">Vincular tu negocio</h1>
          <p className="text-[10px] text-gray-500">Sé parte de GuanaGO</p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-10 pb-12 bg-gradient-to-b from-teal-950 to-gray-950">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #00A8A0 0%, transparent 60%)' }} />
        <div className="relative">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-900/60 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            GuanaGO Aliados
          </span>
          <h2 className="text-3xl font-black leading-tight mb-3">
            Tu negocio en el mapa<br />
            <span className="text-teal-400">de San Andrés</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
            Únete a la red de negocios locales que conectan con miles de turistas que visitan la isla cada mes.
            Gratis para empezar, potente para crecer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate(AppRoute.AUTH_GATE)}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-sm transition-colors active:scale-95"
            >
              Registrarme gratis
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors active:scale-95 flex items-center gap-2"
            >
              <MessageCircle size={16} className="text-green-400" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-10 mt-8">

        {/* Valor */}
        <section>
          <h3 className="text-lg font-black mb-5">¿Por qué unirte?</h3>
          <div className="grid grid-cols-2 gap-3">
            {VALORES.map((v) => (
              <div key={v.titulo} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <v.icon size={20} className="text-teal-400 mb-2" />
                <p className="text-xs font-black text-white mb-1">{v.titulo}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section>
          <h3 className="text-lg font-black mb-5">Cómo funciona</h3>
          <div className="space-y-4">
            {PASOS.map((p, i) => (
              <div key={p.num} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-2xl bg-teal-900/50 border border-teal-700/40 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-teal-400">{p.num}</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-black text-sm text-white mb-0.5">{p.titulo}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
                {i < PASOS.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Planes */}
        <section>
          <h3 className="text-lg font-black mb-1">Elige tu plan</h3>
          <p className="text-xs text-gray-500 mb-5">Sin contratos. Cancela cuando quieras.</p>

          <div className="space-y-3">
            {PLANES.map((plan) => {
              const c = colorMap[plan.color];
              const isOpen = openPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden transition-all`}
                >
                  {/* Plan header - always visible, tap to expand */}
                  <button
                    className="w-full px-5 py-4 flex items-center gap-3 text-left"
                    onClick={() => setOpenPlan(isOpen ? null : plan.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.badge}`}>
                      <plan.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white">{plan.nombre}</span>
                        {plan.popular && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold ${c.text}`}>{plan.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-500 shrink-0" />
                    )}
                  </button>

                  {/* Plan detail - expandable */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-white/5">
                      <p className="text-xs text-gray-400 mt-3 mb-4">{plan.descripcion}</p>
                      <ul className="space-y-2.5 mb-5">
                        {plan.features.map((f) => (
                          <li key={f.texto} className="flex items-start gap-2.5 text-xs">
                            {f.ok ? (
                              <Check size={14} className={`${c.text} shrink-0 mt-0.5`} />
                            ) : (
                              <X size={14} className="text-gray-700 shrink-0 mt-0.5" />
                            )}
                            <span className={f.ok ? 'text-gray-300' : 'text-gray-600'}>{f.texto}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={plan.precio === 0 ? () => onNavigate(AppRoute.AUTH_GATE) : handleWhatsApp}
                        className={`w-full py-3 rounded-xl ${c.btn} text-white font-bold text-sm transition-colors active:scale-95`}
                      >
                        {plan.precio === 0 ? 'Empezar gratis' : `Contratar ${plan.nombre}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-br from-teal-950 to-gray-900 border border-teal-800/40 rounded-3xl p-6 text-center">
          <MapPin size={32} className="mx-auto mb-3 text-teal-400" />
          <h3 className="text-base font-black mb-2">¿Listo para aparecer en el mapa?</h3>
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">
            El equipo de GuanaGO te ayuda a configurar tu ficha. Somos locales, entendemos tu negocio.
          </p>
          <button
            onClick={handleWhatsApp}
            className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            Hablar con el equipo GuanaGO
          </button>
          <p className="text-[10px] text-gray-600 mt-3">Respondemos en menos de 2 horas en horario de isla</p>
        </section>

      </div>
    </div>
  );
};

export default VincularComercio;
