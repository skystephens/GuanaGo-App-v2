import React, { useState } from 'react';
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

type Lang = 'ES' | 'EN' | 'FR' | 'PT';

const LANGS: { code: Lang; flag: string }[] = [
  { code: 'ES', flag: '🇨🇴' },
  { code: 'EN', flag: '🇬🇧' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'PT', flag: '🇧🇷' },
];

const T = {
  ES: {
    headerLabel: 'Historia',
    headerTitle: 'Coco Art · San Andrés Isla',
    heroTitle1: 'La Historia del',
    heroHighlight: 'Coco',
    heroTitle2: 'en San Andrés',
    heroSub: 'Desde la raíz Raizal hasta el arte vivo',
    timelineTitle: 'Cronología de la Isla',
    timeline: [
      { year: '1527', text: 'Los primeros registros europeos documentan la isla. Durante siglos fue punto estratégico del Caribe, disputada por ingleses, españoles y piratas.' },
      { year: '1630', text: 'Colonos puritanos ingleses llegan a San Andrés y fundan una comunidad agropecuaria. Traen consigo el cultivo masivo del cocotero que moldeará la identidad de la isla para siempre.' },
      { year: '1789', text: 'El coco se convierte en la moneda no oficial de San Andrés. Los isleños comercian con Jamaica y Centroamérica usando cocos secos. La palma es sustento, techo y herramienta.' },
      { year: '1822', text: 'San Andrés pasa a formar parte de la República de Colombia. Los Raizales —pueblo créole descendiente de africanos y europeos— mantienen su lengua (Creole inglés) y tradiciones propias.' },
      { year: '1900–1950', text: 'Auge de la economía cocotera. Miles de palmeras cubren la isla. Las familias Raizales viven del coco: aceite, fibra y exportación de copra.' },
      { year: '1953', text: 'San Andrés se declara puerto libre. El turismo y el comercio transforman la economía. La industrialización desplaza poco a poco la cultura cocotera tradicional.' },
      { year: '2000s', text: 'Los últimos artesanos del coco preservan el oficio ancestral. El tejido y escultura en hojas de palma se convierten en arte de resistencia cultural Raizal.' },
      { year: 'Hoy', text: 'Coco Art nace como expresión contemporánea de esa herencia. Arte funcional, identidad viva y puente entre generaciones.' },
    ],
    palmTitle: 'El Coco: Árbol de la Vida',
    palmIntro: 'Para el pueblo Raizal, la palma de coco no era solo un árbol — era arquitectura, medicina, alimento y economía. Cada parte tenía un uso:',
    palmItems: [
      { part: '🌿 Las hojas (arte)', use: 'Las hojas de la palmera son el material principal: tejidas en cestos, figuras, flores y esculturas decorativas con técnicas ancestrales Raizales.' },
      { part: '🌿 Las hojas (uso diario)', use: 'Sombreros, techos de ranchos, abanicos y decoración ceremonial en festividades de la isla.' },
      { part: '🥥 El fruto', use: 'Aceite de coco para cocinar, jabón artesanal, crema corporal y bebida sagrada.' },
      { part: '🌰 La fibra (estopa)', use: 'Cuerdas, relleno de colchones y tejidos impermeables.' },
      { part: '🫙 La copra', use: 'Exportación. Durante décadas fue el principal producto de comercio exterior de la isla.' },
    ],
    artisanTitle: 'El Artesano · Legado Familiar',
    fatherLabel: 'Breda Sky — El Pionero',
    fatherText: 'Todo comenzó con Breda Sky, artesano pionero de San Andrés Isla con más de 50 años creando hermosos detalles artesanales con hojas de palma. Sus manos aprendieron a leer cada hoja, a doblar sin romper, a tejer sin perder la forma. Durante décadas mantuvo vivo un oficio que pocos dominaban, convirtiéndose en referente de la artesanía Raizal.',
    sonLabel: 'Sky Stephens Jr. — La Nueva Generación',
    sonText: 'Su hijo, Sky Stephens Jr., heredó el oficio desde pequeño y lleva más de 30 años trabajando la palma. Formado directamente por su padre, perfeccionó las técnicas ancestrales y las llevó a nuevos formatos: talleres experienciales para turistas, piezas personalizadas para eventos y un puente vivo entre la tradición Raizal y el mundo contemporáneo.',
    artisanP1: 'Su arte no es decoración — es narración. Cada pieza lleva tejida una historia de la isla. Las hojas de palma son su lienzo y su mensaje.',
    artisanP2: 'Hoy, como co-fundador de GuíaSAI, Sky Stephens Jr. lleva esa misma filosofía al mundo digital: tecnología al servicio de la identidad Raizal, conectando turistas con experiencias auténticas y preservando el legado de su familia.',
    todayTitle: 'Coco Art Hoy',
    todayText: 'Coco Art es el programa cultural de GuíaSAI que preserva y proyecta la tradición artesanal del coco. A través de talleres experienciales, piezas personalizadas y eventos culturales, ofrecemos a turistas y locales una conexión genuina con la herencia Raizal.',
    todayItems: ['Arte personalizado', 'Talleres vivenciales', 'Impacto cultural'],
    footerSub: 'Turismo comunitario y cultural',
  },
  EN: {
    headerLabel: 'History',
    headerTitle: 'Coco Art · San Andrés Island',
    heroTitle1: 'The History of the',
    heroHighlight: 'Coconut',
    heroTitle2: 'in San Andrés',
    heroSub: 'From Raizal roots to living art',
    timelineTitle: 'Island Timeline',
    timeline: [
      { year: '1527', text: 'The first European records document the island. For centuries it was a strategic point in the Caribbean, contested by the English, Spanish and pirates.' },
      { year: '1630', text: 'English Puritan settlers arrive in San Andrés and establish an agricultural community, bringing with them the widespread cultivation of coconut palms that would shape the island\'s identity forever.' },
      { year: '1789', text: 'The coconut becomes the unofficial currency of San Andrés. Islanders trade with Jamaica and Central America using dried coconuts. The palm is sustenance, shelter and tool.' },
      { year: '1822', text: 'San Andrés becomes part of the Republic of Colombia. The Raizal people — a Creole community descended from Africans and Europeans — maintain their language (English Creole) and their own traditions.' },
      { year: '1900–1950', text: 'The coconut economy flourishes. Thousands of palm trees cover the island. Raizal families live off the coconut: oil, fiber and copra exports.' },
      { year: '1953', text: 'San Andrés is declared a free port. Tourism and commerce transform the economy. Industrialization gradually displaces traditional coconut culture.' },
      { year: '2000s', text: 'The last coconut craftspeople preserve the ancestral craft. Weaving and sculpting with palm leaves becomes an art of Raizal cultural resistance.' },
      { year: 'Today', text: 'Coco Art emerges as a contemporary expression of that heritage — functional art, living identity and a bridge between generations.' },
    ],
    palmTitle: 'The Coconut: Tree of Life',
    palmIntro: 'For the Raizal people, the coconut palm was not just a tree — it was architecture, medicine, food and economy. Every part had a use:',
    palmItems: [
      { part: '🌿 Leaves (art)', use: 'Palm leaves are the primary material: woven into baskets, figures, flowers and decorative sculptures using ancestral Raizal techniques.' },
      { part: '🌿 Leaves (daily use)', use: 'Hats, ranch rooftops, fans and ceremonial decoration for island festivities.' },
      { part: '🥥 The fruit', use: 'Coconut oil for cooking, artisan soap, body cream and a sacred drink.' },
      { part: '🌰 The fiber (coir)', use: 'Ropes, mattress filling and waterproof woven materials.' },
      { part: '🫙 Copra', use: 'Export. For decades it was the island\'s main export product.' },
    ],
    artisanTitle: 'The Artisan · Family Legacy',
    fatherLabel: 'Breda Sky — The Pioneer',
    fatherText: 'It all began with Breda Sky, a pioneering artisan from San Andrés Island with over 50 years of creating beautiful handcrafted works with palm leaves. His hands learned to read each leaf, to bend without breaking, to weave without losing shape. For decades he kept alive a craft that few mastered, becoming a reference for Raizal craftsmanship.',
    sonLabel: 'Sky Stephens Jr. — The New Generation',
    sonText: 'His son, Sky Stephens Jr., inherited the craft from an early age and has over 30 years of working with the palm. Trained directly by his father, he refined ancestral techniques and brought them into new formats: experiential workshops for tourists, custom pieces for events and a living bridge between Raizal tradition and the contemporary world.',
    artisanP1: 'His art is not decoration — it is storytelling. Each piece carries a woven story of the island. Palm leaves are his canvas and his message.',
    artisanP2: 'Today, as co-founder of GuíaSAI, Sky Stephens Jr. brings that same philosophy to the digital world: technology in service of Raizal identity, connecting tourists with authentic experiences and preserving his family\'s legacy.',
    todayTitle: 'Coco Art Today',
    todayText: 'Coco Art is GuíaSAI\'s cultural program that preserves and projects the coconut artisan tradition. Through experiential workshops, custom pieces and cultural events, we offer tourists and locals a genuine connection to the Raizal heritage.',
    todayItems: ['Custom artwork', 'Hands-on workshops', 'Cultural impact'],
    footerSub: 'Community & cultural tourism',
  },
  FR: {
    headerLabel: 'Histoire',
    headerTitle: 'Coco Art · Île de San Andrés',
    heroTitle1: "L'Histoire de la",
    heroHighlight: 'Noix de Coco',
    heroTitle2: 'à San Andrés',
    heroSub: "Des racines Raizales à l'art vivant",
    timelineTitle: "Chronologie de l'Île",
    timeline: [
      { year: '1527', text: "Les premiers documents européens attestent l'existence de l'île. Pendant des siècles, elle fut un point stratégique des Caraïbes, disputée par les Anglais, les Espagnols et les pirates." },
      { year: '1630', text: "Des colons puritains anglais s'installent à San Andrés et fondent une communauté agricole. Ils apportent avec eux la culture intensive du cocotier, qui façonnera pour toujours l'identité de l'île." },
      { year: '1789', text: "La noix de coco devient la monnaie non officielle de San Andrés. Les insulaires commercent avec la Jamaïque et l'Amérique centrale en utilisant des noix de coco séchées. Le palmier est nourriture, toit et outil." },
      { year: '1822', text: "San Andrés intègre la République de Colombie. Les Raizales — peuple créole descendant d'Africains et d'Européens — maintiennent leur langue (créole anglais) et leurs propres traditions." },
      { year: '1900–1950', text: "Essor de l'économie cocotière. Des milliers de palmiers couvrent l'île. Les familles Raizales vivent du coco : huile, fibre et exportation de coprah." },
      { year: '1953', text: "San Andrés est déclarée port franc. Le tourisme et le commerce transforment l'économie. L'industrialisation supplante progressivement la culture cocotière traditionnelle." },
      { year: '2000s', text: "Les derniers artisans du coco préservent le savoir-faire ancestral. Le tressage et la sculpture à partir de feuilles de palmier deviennent un art de résistance culturelle Raizale." },
      { year: "Aujourd'hui", text: "Coco Art naît comme expression contemporaine de cet héritage — art fonctionnel, identité vivante et pont entre les générations." },
    ],
    palmTitle: 'Le Cocotier : Arbre de Vie',
    palmIntro: "Pour le peuple Raizal, le cocotier n'était pas qu'un arbre — c'était architecture, médecine, nourriture et économie. Chaque partie avait son usage :",
    palmItems: [
      { part: '🌿 Les feuilles (art)', use: "Les feuilles de palmier sont le matériau principal : tressées en paniers, figurines, fleurs et sculptures décoratives selon des techniques ancestrales Raizales." },
      { part: '🌿 Les feuilles (usage quotidien)', use: "Chapeaux, toits de cases, éventails et décoration cérémonielle lors des festivités de l'île." },
      { part: '🥥 Le fruit', use: "Huile de coco pour la cuisine, savon artisanal, crème corporelle et boisson sacrée." },
      { part: '🌰 La fibre (bourre)', use: "Cordes, rembourrage de matelas et tissus imperméables." },
      { part: '🫙 Le coprah', use: "Exportation. Pendant des décennies, ce fut le principal produit d'exportation de l'île." },
    ],
    artisanTitle: 'L\'Artisan · Héritage Familial',
    fatherLabel: 'Breda Sky — Le Pionnier',
    fatherText: "Tout a commencé avec Breda Sky, artisan pionnier de l'île de San Andrés, fort de plus de 50 ans de création de magnifiques objets artisanaux à partir de feuilles de palmier. Ses mains ont appris à lire chaque feuille, à plier sans rompre, à tisser sans perdre la forme. Pendant des décennies, il a maintenu vivant un métier que peu maîtrisaient, devenant une référence de l'artisanat Raizal.",
    sonLabel: 'Sky Stephens Jr. — La Nouvelle Génération',
    sonText: "Son fils, Sky Stephens Jr., a hérité du métier dès son plus jeune âge et travaille le palmier depuis plus de 30 ans. Formé directement par son père, il a perfectionné les techniques ancestrales et les a adaptées à de nouveaux formats : ateliers expérientiels pour les touristes, pièces personnalisées pour les événements et un pont vivant entre la tradition Raizale et le monde contemporain.",
    artisanP1: "Son art n'est pas décoration — c'est narration. Chaque pièce porte tissée une histoire de l'île. Les feuilles de palmier sont sa toile et son message.",
    artisanP2: "Aujourd'hui, en tant que co-fondateur de GuíaSAI, Sky Stephens Jr. porte cette même philosophie dans le monde numérique : technologie au service de l'identité Raizale, connectant les touristes à des expériences authentiques et préservant l'héritage familial.",
    todayTitle: "Coco Art Aujourd'hui",
    todayText: "Coco Art est le programme culturel de GuíaSAI qui préserve et valorise la tradition artisanale du coco. À travers des ateliers expérientiels, des pièces sur-mesure et des événements culturels, nous offrons aux touristes et aux locaux un lien authentique avec l'héritage Raizal.",
    todayItems: ['Art personnalisé', 'Ateliers vivants', 'Impact culturel'],
    footerSub: 'Tourisme communautaire & culturel',
  },
  PT: {
    headerLabel: 'História',
    headerTitle: 'Coco Art · Ilha de San Andrés',
    heroTitle1: 'A História do',
    heroHighlight: 'Coco',
    heroTitle2: 'em San Andrés',
    heroSub: 'Das raízes Raizales à arte viva',
    timelineTitle: 'Cronologia da Ilha',
    timeline: [
      { year: '1527', text: 'Os primeiros registros europeus documentam a ilha. Por séculos, foi um ponto estratégico do Caribe, disputada por ingleses, espanhóis e piratas.' },
      { year: '1630', text: 'Colonos puritanos ingleses chegam a San Andrés e fundam uma comunidade agrícola. Trazem consigo o cultivo massivo do coqueiro, que moldará a identidade da ilha para sempre.' },
      { year: '1789', text: 'O coco se torna a moeda não oficial de San Andrés. Os ilhéus comercializam com a Jamaica e a América Central usando cocos secos. A palmeira é sustento, telhado e ferramenta.' },
      { year: '1822', text: 'San Andrés passa a fazer parte da República da Colômbia. Os Raizales — povo crioulo descendente de africanos e europeus — mantêm sua língua (crioulo inglês) e suas próprias tradições.' },
      { year: '1900–1950', text: 'Auge da economia coqueira. Milhares de palmeiras cobrem a ilha. As famílias Raizales vivem do coco: óleo, fibra e exportação de copra.' },
      { year: '1953', text: 'San Andrés é declarada porto livre. O turismo e o comércio transformam a economia. A industrialização desloca gradualmente a cultura coqueira tradicional.' },
      { year: '2000s', text: 'Os últimos artesãos do coco preservam o ofício ancestral. A tecelagem e a escultura com folhas de palmeira tornam-se arte de resistência cultural Raizal.' },
      { year: 'Hoje', text: 'O Coco Art nasce como expressão contemporânea dessa herança — arte funcional, identidade viva e ponte entre gerações.' },
    ],
    palmTitle: 'O Coco: Árvore da Vida',
    palmIntro: 'Para o povo Raizal, a palmeira coqueira não era apenas uma árvore — era arquitetura, medicina, alimento e economia. Cada parte tinha um uso:',
    palmItems: [
      { part: '🌿 As folhas (arte)', use: 'As folhas da palmeira são o principal material: trançadas em cestos, figuras, flores e esculturas decorativas com técnicas ancestrais Raizales.' },
      { part: '🌿 As folhas (uso diário)', use: 'Chapéus, telhados de ranchos, leques e decoração cerimonial nas festas da ilha.' },
      { part: '🥥 O fruto', use: 'Óleo de coco para cozinhar, sabão artesanal, creme corporal e bebida sagrada.' },
      { part: '🌰 A fibra (estopa)', use: 'Cordas, enchimento de colchões e tecidos impermeáveis.' },
      { part: '🫙 A copra', use: 'Exportação. Por décadas foi o principal produto de exportação da ilha.' },
    ],
    artisanTitle: 'O Artesão · Legado Familiar',
    fatherLabel: 'Breda Sky — O Pioneiro',
    fatherText: 'Tudo começou com Breda Sky, artesão pioneiro da Ilha de San Andrés com mais de 50 anos criando lindos detalhes artesanais com folhas de palmeira. Suas mãos aprenderam a ler cada folha, a dobrar sem quebrar, a trançar sem perder a forma. Por décadas manteve vivo um ofício que poucos dominavam, tornando-se referência do artesanato Raizal.',
    sonLabel: 'Sky Stephens Jr. — A Nova Geração',
    sonText: 'Seu filho, Sky Stephens Jr., herdou o ofício desde pequeno e tem mais de 30 anos trabalhando com a palmeira. Formado diretamente por seu pai, aperfeiçoou as técnicas ancestrais e as levou a novos formatos: oficinas experienciais para turistas, peças personalizadas para eventos e uma ponte viva entre a tradição Raizal e o mundo contemporâneo.',
    artisanP1: 'Sua arte não é decoração — é narração. Cada peça carrega trançada uma história da ilha. As folhas de palmeira são sua tela e sua mensagem.',
    artisanP2: 'Hoje, como co-fundador do GuíaSAI, Sky Stephens Jr. leva essa mesma filosofia para o mundo digital: tecnologia a serviço da identidade Raizal, conectando turistas a experiências autênticas e preservando o legado de sua família.',
    todayTitle: 'Coco Art Hoje',
    todayText: 'O Coco Art é o programa cultural do GuíaSAI que preserva e projeta a tradição artesanal do coco. Por meio de oficinas experienciais, peças personalizadas e eventos culturais, oferecemos a turistas e moradores locais uma conexão genuína com a herança Raizal.',
    todayItems: ['Arte personalizada', 'Oficinas vivenciais', 'Impacto cultural'],
    footerSub: 'Turismo comunitário e cultural',
  },
} as const;

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
  const [lang, setLang] = useState<Lang>('ES');
  const t = T[lang];

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, ${PALM_DARK} 0%, ${PALM_MID} 60%, ${PALM_GREEN} 100%)` }}>

      {/* Header fijo */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: `${PALM_DARK}f0`, backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: PALM_ACCENT }}>{t.headerLabel}</p>
          <h1 className="text-sm font-black text-white leading-none truncate">Coco Art · San Andrés</h1>
        </div>

        {/* Selector de idioma */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {LANGS.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-black transition-all"
              style={{
                background: lang === code ? PALM_GOLD : 'rgba(255,255,255,0.06)',
                color: lang === code ? PALM_DARK : 'rgba(255,255,255,0.5)',
                border: `1px solid ${lang === code ? PALM_GOLD : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <span>{flag}</span>
              <span>{code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-5 py-6 max-w-lg mx-auto">

        {/* Hero */}
        <div className="mb-8 text-center">
          <p className="text-4xl mb-3">🥥</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-2">
            {t.heroTitle1} <span style={{ color: PALM_GOLD }}>{t.heroHighlight}</span><br />{t.heroTitle2}
          </h2>
          <p className="text-xs" style={{ color: 'rgba(200,230,200,0.55)' }}>{t.heroSub}</p>
        </div>

        {/* Línea de tiempo */}
        <Section title={t.timelineTitle} icon={<Crown size={14} />}>
          <div className="mt-1">
            {t.timeline.map(({ year, text }) => (
              <Timeline key={year} year={year} text={text} />
            ))}
          </div>
        </Section>

        {/* El coco en la cultura */}
        <Section title={t.palmTitle} icon={<Leaf size={14} />}>
          <p>{t.palmIntro}</p>
          <div className="mt-2 space-y-2">
            {t.palmItems.map(({ part, use }) => (
              <div key={part} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-black mb-0.5" style={{ color: PALM_GOLD }}>{part}</p>
                <p className="text-xs" style={{ color: 'rgba(200,230,200,0.72)' }}>{use}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* El artesano */}
        <Section title={t.artisanTitle} icon={<Heart size={14} />}>
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(200,168,75,0.08)', border: `1px solid ${PALM_GOLD}30` }}>
            <p className="text-xs font-black mb-2" style={{ color: PALM_GOLD }}>{t.fatherLabel}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,230,200,0.82)' }}>
              {t.fatherText}
            </p>
          </div>
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)' }}>
            <p className="text-xs font-black mb-2" style={{ color: PALM_ACCENT }}>{t.sonLabel}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,230,200,0.82)' }}>
              {t.sonText}
            </p>
          </div>
          <p>{t.artisanP1}</p>
          <p>{t.artisanP2}</p>
        </Section>

        {/* Coco Art hoy */}
        <Section title={t.todayTitle} icon={<Crown size={14} />}>
          <p>{t.todayText}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {t.todayItems.map((label, i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl mb-1">{['🎨', '🧑‍🏫', '🌍'][i]}</p>
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
            Raizal-owned · {t.footerSub}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocoArtHistoria;
