import React from 'react';
import { ArrowLeft, Leaf, Crown, Heart } from 'lucide-react';
import { AppRoute } from '../types';

interface CocoArtHistoriaProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const PALM_DARK  = '#0a1f0f';
const PALM_MID   = '#132a18';
const PALM_GREEN = '#1a3d1f';
const PALM_ACCENT= '#4caf50';
const PALM_GOLD  = '#c8a84b';

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      {icon && <span style={{ color: PALM_GOLD }}>{icon}</span>}
      <h2 className="text-base font-black uppercase tracking-widest" style={{ color: PALM_GOLD }}>
        {title}
      </h2>
    </div>
    <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(200,230,200,0.82)' }}>
      {children}
    </div>
  </div>
);

const Timeline: React.FC<{ year: string; text: string }> = ({ year, text }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: PALM_GOLD }} />
      <div className="w-px flex-1 mt-1" style={{ background: 'rgba(200,168,75,0.25)' }} />
    </div>
    <div className="pb-4">
      <span className="text-xs font-black" style={{ color: PALM_GOLD }}>{year} · </span>
      <span className="text-sm" style={{ color: 'rgba(200,230,200,0.8)' }}>{text}</span>
    </div>
  </div>
);

const CocoArtHistoria: React.FC<CocoArtHistoriaProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, ${PALM_DARK} 0%, ${PALM_MID} 60%, ${PALM_GREEN} 100%)` }}>

      {/* Header fijo */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4"
        style={{ background: `${PALM_DARK}f0`, backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: PALM_ACCENT }}>Historia</p>
          <h1 className="text-sm font-black text-white leading-none">Coco Art · San Andrés Isla</h1>
        </div>
        <Leaf size={18} className="ml-auto" style={{ color: PALM_ACCENT }} />
      </div>

      {/* Contenido */}
      <div className="px-5 py-6 max-w-lg mx-auto">

        {/* Hero */}
        <div className="mb-8 text-center">
          <p className="text-4xl mb-3">🥥</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-2">
            La Historia del <span style={{ color: PALM_GOLD }}>Coco</span><br />en San Andrés
          </h2>
          <p className="text-xs" style={{ color: 'rgba(200,230,200,0.55)' }}>
            Desde la raíz Raizal hasta el arte vivo
          </p>
        </div>

        {/* Línea de tiempo */}
        <Section title="Cronología de la Isla" icon={<Crown size={14} />}>
          <div className="mt-1">
            <Timeline year="1527" text="Los primeros registros europeos documentan la isla. Durante siglos fue punto estratégico del Caribe, disputada por ingleses, españoles y piratas." />
            <Timeline year="1630" text="Colonos puritanos ingleses llegan a San Andrés y fundan una comunidad agropecuaria. Traen consigo el cultivo masivo del cocotero que moldeará la identidad de la isla para siempre." />
            <Timeline year="1789" text="El coco se convierte en la moneda no oficial de San Andrés. Los isleños comercian con Jamaica y Centroamérica usando cocos secos. La palma es sustento, techo y herramienta." />
            <Timeline year="1822" text="San Andrés pasa a formar parte de la República de Colombia. Los Raizales —pueblo créole descendiente de africanos y europeos— mantienen su lengua (Creole inglés) y tradiciones propias." />
            <Timeline year="1900-1950" text="Auge de la economía cocotera. Miles de palmeras cubren la isla. Las familias Raizales viven del coco: aceite, fibra, madera de palma y exportación de copra." />
            <Timeline year="1953" text="San Andrés se declara puerto libre. El turismo y el comercio transforman la economía. La industrialización desplaza poco a poco la cultura cocotera tradicional." />
            <Timeline year="2000s" text="Los últimos artesanos del coco preservan el oficio ancestral. El tallado, tejido y escultura en palma de coco se convierten en arte de resistencia cultural Raizal." />
            <Timeline year="Hoy" text="Coco Art nace como expresión contemporánea de esa herencia. Arte funcional, identidad viva y puente entre generaciones." />
          </div>
        </Section>

        {/* El coco en la cultura */}
        <Section title="El Coco: Árbol de la Vida" icon={<Leaf size={14} />}>
          <p>
            Para el pueblo Raizal, la palma de coco no era solo un árbol — era arquitectura, medicina, alimento y economía. Cada parte tenía un uso:
          </p>
          <div className="mt-2 space-y-2">
            {[
              { part: '🌿 Las hojas (arte)', use: 'Las hojas de la palmera son el material principal: tejidas en cestos, figuras, flores y esculturas decorativas con técnicas ancestrales Raizales' },
              { part: '🌿 Las hojas (uso diario)', use: 'Sombreros, techos de ranchos, abanicos y decoración ceremonial en festividades de la isla' },
              { part: '🥥 El fruto', use: 'Aceite de coco para cocinar, jabón artesanal, crema corporal y bebida sagrada' },
              { part: '🌰 La fibra (estopa)', use: 'Cuerdas, relleno de colchones, tejidos impermeables' },
              { part: '🫙 La copra', use: 'Exportación. Durante décadas fue el principal producto de comercio exterior de la isla' },
            ].map(({ part, use }) => (
              <div key={part} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-black mb-0.5" style={{ color: PALM_GOLD }}>{part}</p>
                <p className="text-xs" style={{ color: 'rgba(200,230,200,0.72)' }}>{use}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Quién es el artesano */}
        <Section title="El Artesano · Legado Familiar" icon={<Heart size={14} />}>
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(200,168,75,0.08)', border: `1px solid ${PALM_GOLD}30` }}>
            <p className="text-xs font-black mb-2" style={{ color: PALM_GOLD }}>Breda Sky — El Pionero</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,230,200,0.82)' }}>
              Todo comenzó con <strong style={{ color: 'white' }}>Breda Sky</strong>, artesano pionero de San Andrés Isla con más de 50 años creando hermosos detalles artesanales con hojas de palma. Sus manos aprendieron a leer cada hoja, a doblar sin romper, a tejer sin perder la forma. Durante décadas mantuvo vivo un oficio que pocos dominaban, convirtiéndose en referente de la artesanía Raizal.
            </p>
          </div>
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)' }}>
            <p className="text-xs font-black mb-2" style={{ color: PALM_ACCENT }}>Sky Stephens Jr. — La Nueva Generación</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,230,200,0.82)' }}>
              Su hijo, <strong style={{ color: 'white' }}>Sky Stephens Jr.</strong>, heredó el oficio desde pequeño y lleva más de 30 años trabajando la palma. Formado directamente por su padre, perfeccionó las técnicas ancestrales y las llevó a nuevos formatos: talleres experienciales para turistas, piezas personalizadas para eventos y un puente vivo entre la tradición Raizal y el mundo contemporáneo.
            </p>
          </div>
          <p>
            Su arte no es decoración — es narración. Cada pieza lleva tejida una historia de la isla. Las hojas de palma son su lienzo y su mensaje.
          </p>
          <p>
            Hoy, como co-fundador de GuíaSAI, Sky Stephens Jr. lleva esa misma filosofía al mundo digital: tecnología al servicio de la identidad Raizal, conectando turistas con experiencias auténticas y preservando el legado de su familia.
          </p>
        </Section>

        {/* Coco Art hoy */}
        <Section title="Coco Art Hoy" icon={<Crown size={14} />}>
          <p>
            Coco Art es el programa cultural de GuíaSAI que preserva y proyecta la tradición artesanal del coco. A través de talleres experienciales, piezas personalizadas y eventos culturales, ofrecemos a turistas y locales una conexión genuina con la herencia Raizal.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { emoji: '🎨', label: 'Arte personalizado' },
              { emoji: '🧑‍🏫', label: 'Talleres vivenciales' },
              { emoji: '🌍', label: 'Impacto cultural' },
            ].map(({ emoji, label }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl mb-1">{emoji}</p>
                <p className="text-[10px] font-bold text-white leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(200,230,200,0.35)' }}>
            GuíaSAI S.A.S. · RNT 48674 · San Andrés Isla, Colombia
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(200,230,200,0.25)' }}>
            Raizal-owned · Turismo comunitario y cultural
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocoArtHistoria;
