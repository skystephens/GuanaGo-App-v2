import React, { useState } from 'react';
import {
  ArrowLeft, ChevronRight, CheckCircle, MessageCircle,
  Store, MapPin, Zap, Crown, QrCode, RefreshCw,
} from 'lucide-react';
import { AppRoute } from '../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TIPOS_NEGOCIO = [
  'Restaurante / bar',
  'Hotel / alojamiento',
  'Tour / excursión / buceo',
  'Transporte (taxis, lanchas)',
  'Tienda / artesanías',
  'Experiencia cultural / música',
  'Otro',
];

const CANALES = [
  'Recomendaciones de boca en boca',
  'Redes sociales (Instagram / TikTok)',
  'Agencias / tour operadores',
  'Sin canal digital definido',
];

const INTERESES = [
  { value: 'mapa',      label: 'Solo quiero estar en el mapa' },
  { value: 'referidos', label: 'Me interesa recibir referidos de otros negocios' },
  { value: 'completo',  label: 'Quiero el paquete completo (crecer de verdad)' },
];

const API_BASE = import.meta.env.VITE_API_URL || '';
const WA_NUMERO = '573153836043';

function calcularPlan(canal: string, temporada: boolean, interes: string) {
  let score = 0;
  if (canal === 'Agencias / tour operadores' || canal === 'Sin canal digital definido') score += 2;
  if (temporada) score += 2;
  if (interes === 'completo') score += 2;
  else if (interes === 'referidos') score += 1;

  if (score >= 4) return 'premium';
  if (score >= 2) return 'activo';
  return 'basico';
}

const PLAN_INFO = {
  basico: {
    nombre: 'Básico',
    precio: 'Gratis',
    icon: QrCode,
    color: 'text-teal-400',
    border: 'border-teal-700/50',
    bg: 'bg-teal-950/40',
    resumen: 'Es tu primer paso: visibilidad digital, ficha en el directorio y código QR para tu negocio. Sin costo, sin compromiso.',
  },
  activo: {
    nombre: 'Aliado Activo',
    precio: '$49.900/mes',
    icon: Zap,
    color: 'text-orange-400',
    border: 'border-orange-500/70',
    bg: 'bg-orange-950/40',
    resumen: 'El más elegido. Con pin en el mapa interactivo, GuanaPoints para tus clientes e insignia verificado. Empieza a ser descubierto.',
  },
  premium: {
    nombre: 'Aliado Premium',
    precio: '$129.900/mes',
    icon: Crown,
    color: 'text-indigo-400',
    border: 'border-indigo-700/50',
    bg: 'bg-indigo-950/40',
    resumen: 'Posición destacada, creación de contenido mensual, analytics, gestor dedicado y material impreso QR. Para negocios listos para dar el salto.',
  },
};

const AliadoDiagnostico: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [tipo, setTipo] = useState('');
  const [canal, setCanal] = useState('');
  const [temporada, setTemporada] = useState<boolean | null>(null);
  const [interes, setInteres] = useState('');
  const [nombre, setNombre] = useState('');
  const [negocio, setNegocio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ref, setRef] = useState('');
  const [planResult, setPlanResult] = useState<'basico' | 'activo' | 'premium'>('activo');

  const formCompleto = tipo && canal && temporada !== null && interes && nombre && whatsapp;

  const handleEnviar = async () => {
    if (!formCompleto) return;
    setLoading(true);
    setError('');

    const plan = calcularPlan(canal, temporada!, interes);
    const detalles = [
      `TIPO: ${tipo}`,
      `CANAL: ${canal}`,
      `TEMPORADA_BAJA: ${temporada ? 'Sí' : 'No'}`,
      `INTERES: ${INTERESES.find(i => i.value === interes)?.label}`,
      `NEGOCIO: ${negocio}`,
      `PLAN_RECOMENDADO: ${PLAN_INFO[plan].nombre}`,
    ].join('\n');

    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Nombre: nombre,
          WhatsApp: whatsapp,
          Tipo_Cliente: 'Aliado_Diagnostico',
          Fuente_del_Lead: 'Diagnóstico GuanaGO',
          Detalles_Adicionales: detalles,
        }),
      });
      const data = await res.json();
      setRef(data.ref || '');
      setPlanResult(plan);
      setStep('result');
    } catch {
      setError('Error de conexión. Tus respuestas se guardaron localmente.');
      setPlanResult(plan);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const plan = PLAN_INFO[planResult];
    const msg = encodeURIComponent(
      `Hola GuanaGO! Acabo de hacer el diagnóstico${ref ? ` (ref: ${ref})` : ''} y me recomendaron el plan ${plan.nombre}. Soy ${nombre}${negocio ? `, de ${negocio}` : ''}. ¿Pueden ayudarme a configurarlo?`
    );
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={step === 'result' ? () => setStep('form') : onBack}
          className="p-2 -ml-1 hover:bg-gray-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-black text-sm leading-tight">Diagnóstico para aliados</h1>
          <p className="text-[10px] text-gray-500">
            {step === 'form' ? '3 minutos · Te decimos qué plan conviene' : 'Tu plan recomendado'}
          </p>
        </div>
      </div>

      {step === 'form' ? (
        <div className="px-5 pt-8 space-y-7">

          {/* Intro */}
          <div className="bg-gradient-to-br from-teal-950 to-gray-900 border border-teal-800/40 rounded-2xl p-5">
            <Store size={28} className="text-teal-400 mb-3" />
            <h2 className="font-black text-base mb-1">¿Qué plan conviene para tu negocio?</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Responde 5 preguntas rápidas. Calculamos qué plan se adapta mejor y un asesor
              te contacta para resolver dudas.
            </p>
          </div>

          {/* Q1: Tipo de negocio */}
          <div>
            <p className="text-sm font-bold mb-3">1. ¿Qué tipo de negocio tienes?</p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_NEGOCIO.map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    tipo === t
                      ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Canal actual */}
          <div>
            <p className="text-sm font-bold mb-3">2. ¿Cómo consigues clientes hoy?</p>
            <div className="space-y-2">
              {CANALES.map(c => (
                <button
                  key={c}
                  onClick={() => setCanal(c)}
                  className={`w-full py-3 px-4 rounded-xl border text-xs font-medium text-left transition-all ${
                    canal === c
                      ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Temporada baja */}
          <div>
            <p className="text-sm font-bold mb-3">3. ¿Tu negocio tiene temporada baja?</p>
            <div className="flex gap-3">
              {[
                { val: true, label: 'Sí, me afecta' },
                { val: false, label: 'No, vendo todo el año' },
              ].map(op => (
                <button
                  key={String(op.val)}
                  onClick={() => setTemporada(op.val)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                    temporada === op.val
                      ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q4: Interés */}
          <div>
            <p className="text-sm font-bold mb-3">4. ¿Qué te interesa más de la red GuanaGO?</p>
            <div className="space-y-2">
              {INTERESES.map(i => (
                <button
                  key={i.value}
                  onClick={() => setInteres(i.value)}
                  className={`w-full py-3 px-4 rounded-xl border text-xs font-medium text-left transition-all ${
                    interes === i.value
                      ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q5: Datos de contacto */}
          <div>
            <p className="text-sm font-bold mb-3">5. Datos de contacto</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tu nombre *"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 placeholder-gray-600"
              />
              <input
                type="text"
                placeholder="Nombre de tu negocio (opcional)"
                value={negocio}
                onChange={e => setNegocio(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 placeholder-gray-600"
              />
              <input
                type="tel"
                placeholder="WhatsApp (ej: 3151234567) *"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 placeholder-gray-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleEnviar}
            disabled={!formCompleto || loading}
            className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>Ver mi plan recomendado <ChevronRight size={18} /></>
            )}
          </button>

        </div>
      ) : (
        <div className="px-5 pt-8 space-y-6">

          {/* Result header */}
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-teal-400 mb-3" />
            <h2 className="text-xl font-black mb-1">
              {nombre ? `${nombre.split(' ')[0]}, ` : ''}tu plan recomendado es:
            </h2>
          </div>

          {/* Plan card */}
          {(() => {
            const plan = PLAN_INFO[planResult];
            const PlanIcon = plan.icon;
            return (
              <div className={`rounded-2xl border ${plan.border} ${plan.bg} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-900/50`}>
                    <PlanIcon size={24} className={plan.color} />
                  </div>
                  <div>
                    <p className="font-black text-lg text-white">{plan.nombre}</p>
                    <p className={`text-sm font-bold ${plan.color}`}>{plan.precio}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{plan.resumen}</p>
                {ref && (
                  <p className="text-[10px] text-gray-600 mt-3">Referencia: {ref}</p>
                )}
              </div>
            );
          })()}

          {/* Why this plan */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">Por qué te recomendamos este plan</p>
            <ul className="space-y-1.5">
              {canal === 'Sin canal digital definido' || canal === 'Agencias / tour operadores' ? (
                <li className="text-xs text-gray-300 flex gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  Tu canal actual tiene poca visibilidad digital — GuanaGO te da presencia inmediata
                </li>
              ) : null}
              {temporada && (
                <li className="text-xs text-gray-300 flex gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  La temporada baja se combate con clientes que regresan — GuanaPoints hace eso
                </li>
              )}
              {interes === 'completo' && (
                <li className="text-xs text-gray-300 flex gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  Para crecer de verdad necesitas contenido, analytics y posición destacada
                </li>
              )}
              {interes === 'referidos' && (
                <li className="text-xs text-gray-300 flex gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  La red de referidos funciona mejor con pin en el mapa e insignia verificada
                </li>
              )}
              <li className="text-xs text-gray-300 flex gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                Siempre puedes cambiar de plan sin penalización
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleWhatsApp}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Hablar con el equipo GuanaGO
            </button>
            <button
              onClick={() => onNavigate(AppRoute.VINCULAR_COMERCIO)}
              className="w-full py-3.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <MapPin size={16} />
              Ver todos los planes
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-600">
            GuiaSAI S.A.S. · RNT 48674 · San Andrés Islas, Colombia
          </p>

        </div>
      )}
    </div>
  );
};

export default AliadoDiagnostico;
