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
const PALM_CORAL = '#d4541a';
const PALM_OCEAN = '#1a6b7a';

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
    heroEyebrow: 'Coco ART · Ruta Raizal',
    heroTitle: 'La Historia\nde Nuestra Isla',
    heroSub: 'Cada pieza que tejemos hoy lleva siglos de historia. Conoce quiénes somos, de dónde venimos y por qué el coco lo cambió todo.',
    timelineTitle: 'Cronología',
    eras: [
      {
        label: 'Siglos XVI – XVII · Los primeros registros',
        events: [
          { year: '1527', title: 'En el mapa del mundo', emoji: '🗺️', text: 'El archipiélago aparece en cartas náuticas españolas, confirmando que nuestras islas eran punto de referencia obligado para los grandes navegantes del Caribe.', tag: 'Navegación' },
          { year: '1629', title: 'Los ingleses puritanos', emoji: '⚓', text: 'Llegaron huyendo de las guerras religiosas en Europa, buscando tierra nueva. Traían su fe, su idioma inglés… y la semilla de lo que hoy llamamos cultura Raizal.', tag: 'Fundación' },
          { year: '1631', title: 'El SeaFlower llega', emoji: '🚢', text: 'La primera embarcación oficial toca tierra en Providencia y Santa Catalina. A bordo, puritanos protestantes que abrirían el camino al cristianismo en estas islas.', tag: 'Providencia' },
        ],
      },
      {
        label: 'Siglos XVII – XVIII · Raíces africanas',
        events: [
          { year: 'S. XVII', title: 'África llega al Caribe', emoji: '🌍', text: 'Los ingleses trajeron esclavos africanos para trabajar algodón, tabaco, yuca y auyama. De esa mezcla de culturas nació algo único: el pueblo Raizal.', tag: 'Identidad' },
          { year: 'S. XVIII', title: 'El coco lo cambia todo', emoji: '🥥', text: 'El coco reemplazó a todos los cultivos anteriores. Era alimento, material de construcción, moneda de trueque y fuente de trabajo. Las palmas cubrían los cocos para exportarlos — de ahí nace Coco ART.', tag: 'El Coco · Cultura' },
        ],
      },
      {
        label: 'Siglos XIX – XX · Parte de Colombia',
        events: [
          { year: '1822', title: 'Decisión voluntaria', emoji: '🇨🇴', text: 'El 23 de junio, el Concejo de Providencia y Santa Catalina decidió adherirse libremente a la Constitución de Cúcuta. No fue conquista: fue elección.', tag: 'Soberanía' },
          { year: '1953', title: 'Puerto libre', emoji: '🏝️', text: 'San Andrés se convierte en puerto libre. Llegan migrantes del continente y el mundo. La vida insular cambia para siempre, pero el alma Raizal persiste.', tag: 'Transformación' },
        ],
      },
      {
        label: 'Siglo XXI · Reserva de la Biosfera',
        events: [
          { year: '2000', title: 'Seaflower — UNESCO', emoji: '🌊', text: 'La UNESCO reconoció al archipiélago como Reserva Mundial de la Biosfera "Seaflower". El mismo nombre del barco que trajo los primeros pobladores, ahora símbolo de conservación planetaria.', tag: 'Patrimonio mundial' },
          { year: '2012', title: 'El fallo de La Haya', emoji: '⚖️', text: 'La Corte Internacional de Justicia resolvió el litigio entre Colombia y Nicaragua. Los límites cambiaron y la industria pesquera Raizal quedó devastada. Hoy, la cultura y el turismo son nuestra economía.', tag: 'Historia reciente' },
        ],
      },
    ],
    creoleTitle: 'El lenguaje del Creole',
    creoleSub: 'La voz del pueblo Raizal',
    creoleText: 'El Creole es el idioma de las islas. Nació de la fusión del inglés puritano con el dialecto africano de los esclavos — una lengua que lleva en cada sílaba la historia completa de nuestro pueblo.',
    creoleWord: '"Laiv Stieg" — escenario de vida',
    cocoTitle: 'El Coco en nuestra vida',
    cocoSub: 'Múltiples usos, una sola palma',
    cocoCards: [
      { icon: '🧺', name: 'Artesanía', desc: 'Las hojas tejidas son el arte ancestral que hoy practicamos en Coco ART' },
      { icon: '🍽️', name: 'Alimento', desc: 'Base del Rondon, dulces y bebidas tradicionales Raizal' },
      { icon: '💰', name: 'Moneda', desc: 'El coco fue método de trueque e intercambio durante siglos' },
      { icon: '🏠', name: 'Construcción', desc: 'Hojas y fibras usadas en arquitectura isleña tradicional' },
    ],
    todayEyebrow: 'Hoy · Coco ART by Breda Sky',
    todayTitle: 'La tradición\nsigue viva',
    todayIntro: 'Cada palma que tejemos hoy es el mismo gesto que hacían nuestros ancestros. Breda Sky y Sky Stephens Jr. mantienen ese hilo vivo — y te invitan a ser parte de él.',
    modalities: [
      {
        num: '01', icon: '🌿', color: 'palm',
        title: 'Souvenir Tejido',
        sub: 'El recuerdo Kriol más auténtico de San Andrés',
        desc: 'Con un pequeño pedazo de palma, Breda Sky o tú mismo crean una figura única — tejida a mano, cargada de historia — que se lleva a casa como un pedazo del alma de la isla.',
        items: ['🐦 Pájaro', '🌹 Rosa', '🐟 Pescado', '👑 Corona', '💚 Corazón'],
      },
      {
        num: '02', icon: '🎨', color: 'coral',
        title: 'Coco ART Live',
        sub: 'La experiencia interactiva Creole',
        desc: 'El maestro narra la historia del coco mientras teje en vivo. Aprendes, participas y te llevas tu propio souvenir hecho a mano — experiencia perfecta para grupos, eventos y celebraciones.',
        items: ['⏱️ 2 horas', '📍 Playa o hotel', '👥 Grupos y familias', '🎉 Eventos corporativos'],
      },
      {
        num: '03', icon: '🏮', color: 'ocean',
        title: 'Ambientación Kriol Vibe',
        sub: 'Viste tu celebración con historia',
        desc: 'Transformamos cualquier espacio con palma de coco — piezas únicas que respiran la auténtica atmósfera Kriol del Caribe. Desde souvenirs pequeños hasta instalaciones de alto impacto visual.',
        items: ['🧺 Canastos', '💡 Lámparas', '🎩 Sombreros', '🌿 Centros de mesa', '🖼️ Piezas a medida'],
      },
    ],
    quote: '"Ven a San Andrés y conoce el Laiv Stieg — nuestro escenario de vida. Cada hoja tiene una historia, cada nudo tiene un nombre."',
    quoteAuthor: '— Breda Sky, artesano Raizal',
    ctaEyebrow: 'Breda Sky · Sky Stephens Jr. · GuíaSAI',
    ctaTitle: 'Ven a tejer\ncon nosotros',
    ctaText: 'Cada figura que creas en Coco ART lleva dentro 500 años de historia Raizal. Aprende el tejido, escucha las historias, llévate un pedazo del alma de San Andrés.',
    ctaBtn: '🥥 Ver experiencia completa',
    ctaWa: '📱 Reservar por WhatsApp',
    footerSub: 'Turismo comunitario y cultural',
  },
  EN: {
    headerLabel: 'History',
    heroEyebrow: 'Coco ART · Raizal Route',
    heroTitle: 'The History\nof Our Island',
    heroSub: 'Every piece we weave today carries centuries of history. Learn who we are, where we come from and why the coconut changed everything.',
    timelineTitle: 'Timeline',
    eras: [
      {
        label: 'XVI – XVII Century · First Records',
        events: [
          { year: '1527', title: 'On the world map', emoji: '🗺️', text: 'The archipelago appears on Spanish nautical charts, confirming that our islands were a mandatory reference point for the great Caribbean navigators.', tag: 'Navigation' },
          { year: '1629', title: 'The English Puritans', emoji: '⚓', text: 'They arrived fleeing religious wars in Europe, seeking new land. They brought their faith, their English language… and the seed of what we now call Raizal culture.', tag: 'Foundation' },
          { year: '1631', title: 'The SeaFlower arrives', emoji: '🚢', text: 'The first official vessel lands in Providencia and Santa Catalina. On board, Protestant Puritans who would open the path to Christianity on these islands.', tag: 'Providencia' },
        ],
      },
      {
        label: 'XVII – XVIII Century · African Roots',
        events: [
          { year: '17th C.', title: 'Africa arrives in the Caribbean', emoji: '🌍', text: 'The English brought enslaved Africans to work cotton, tobacco, cassava and squash. From that mix of cultures something unique was born: the Raizal people.', tag: 'Identity' },
          { year: '18th C.', title: 'The coconut changes everything', emoji: '🥥', text: 'The coconut replaced all previous crops. It was food, building material, barter currency and a source of work. The palms covered the coconuts for export — that is where Coco ART is born.', tag: 'Coconut · Culture' },
        ],
      },
      {
        label: 'XIX – XX Century · Part of Colombia',
        events: [
          { year: '1822', title: 'A voluntary decision', emoji: '🇨🇴', text: 'On June 23rd, the Council of Providencia and Santa Catalina freely chose to join the Constitution of Cúcuta. It was not conquest: it was choice.', tag: 'Sovereignty' },
          { year: '1953', title: 'Free port', emoji: '🏝️', text: 'San Andrés becomes a free port. Migrants arrive from the mainland and the world. Island life changes forever, but the Raizal soul persists.', tag: 'Transformation' },
        ],
      },
      {
        label: 'XXI Century · Biosphere Reserve',
        events: [
          { year: '2000', title: 'Seaflower — UNESCO', emoji: '🌊', text: 'UNESCO recognized the archipelago as the "Seaflower" World Biosphere Reserve. The same name as the ship that brought the first settlers, now a symbol of planetary conservation.', tag: 'World Heritage' },
          { year: '2012', title: 'The Hague ruling', emoji: '⚖️', text: 'The International Court of Justice resolved the dispute between Colombia and Nicaragua. The maritime limits changed and the Raizal fishing industry was devastated. Today, culture and tourism are our economy.', tag: 'Recent history' },
        ],
      },
    ],
    creoleTitle: 'The Creole Language',
    creoleSub: 'The voice of the Raizal people',
    creoleText: 'Creole is the language of the islands. It was born from the fusion of Puritan English with the African dialect of enslaved people — a language that carries the complete history of our people in every syllable.',
    creoleWord: '"Laiv Stieg" — stage of life',
    cocoTitle: 'The Coconut in Our Life',
    cocoSub: 'Many uses, one palm tree',
    cocoCards: [
      { icon: '🧺', name: 'Crafts', desc: 'Woven leaves are the ancestral art we practice today in Coco ART' },
      { icon: '🍽️', name: 'Food', desc: 'Base of Rondon stew, sweets and traditional Raizal drinks' },
      { icon: '💰', name: 'Currency', desc: 'The coconut was a method of barter and exchange for centuries' },
      { icon: '🏠', name: 'Construction', desc: 'Leaves and fibers used in traditional island architecture' },
    ],
    todayEyebrow: 'Today · Coco ART by Breda Sky',
    todayTitle: 'The tradition\nlives on',
    todayIntro: 'Every palm we weave today is the same gesture our ancestors made. Breda Sky and Sky Stephens Jr. keep that thread alive — and invite you to be part of it.',
    modalities: [
      {
        num: '01', icon: '🌿', color: 'palm',
        title: 'Woven Souvenir',
        sub: 'The most authentic Kriol keepsake from San Andrés',
        desc: 'With a small piece of palm, Breda Sky or you yourself create a unique figure — handwoven, full of history — to take home as a piece of the island\'s soul.',
        items: ['🐦 Bird', '🌹 Rose', '🐟 Fish', '👑 Crown', '💚 Heart'],
      },
      {
        num: '02', icon: '🎨', color: 'coral',
        title: 'Coco ART Live',
        sub: 'The interactive Creole experience',
        desc: 'The master narrates the history of the coconut while weaving live. You learn, participate and take home your own handmade souvenir — perfect for groups, events and island celebrations.',
        items: ['⏱️ 2 hours', '📍 Beach or hotel', '👥 Groups & families', '🎉 Corporate events'],
      },
      {
        num: '03', icon: '🏮', color: 'ocean',
        title: 'Kriol Vibe Decoration',
        sub: 'Dress your celebration with history',
        desc: 'We transform any space with coconut palm — unique pieces that breathe the authentic Kriol atmosphere of the Caribbean. From small souvenirs to high-visual-impact installations.',
        items: ['🧺 Baskets', '💡 Lamps', '🎩 Hats', '🌿 Centerpieces', '🖼️ Custom pieces'],
      },
    ],
    quote: '"Come to San Andrés and experience the Laiv Stieg — our stage of life. Every leaf has a story, every knot has a name."',
    quoteAuthor: '— Breda Sky, Raizal artisan',
    ctaEyebrow: 'Breda Sky · Sky Stephens Jr. · GuíaSAI',
    ctaTitle: 'Come weave\nwith us',
    ctaText: 'Every figure you create in Coco ART carries 500 years of Raizal history inside it. Learn the weave, hear the stories, take a piece of San Andrés\'s soul home.',
    ctaBtn: '🥥 See the full experience',
    ctaWa: '📱 Book via WhatsApp',
    footerSub: 'Community & cultural tourism',
  },
  FR: {
    headerLabel: 'Histoire',
    heroEyebrow: 'Coco ART · Route Raizale',
    heroTitle: "L'Histoire\nde Notre Île",
    heroSub: "Chaque pièce que nous tissons aujourd'hui porte des siècles d'histoire. Découvrez qui nous sommes, d'où nous venons et pourquoi la noix de coco a tout changé.",
    timelineTitle: 'Chronologie',
    eras: [
      {
        label: 'XVIe – XVIIe siècle · Premiers registres',
        events: [
          { year: '1527', title: 'Sur la carte du monde', emoji: '🗺️', text: "L'archipel apparaît sur des cartes nautiques espagnoles, confirmant que nos îles étaient un repère incontournable pour les grands navigateurs des Caraïbes.", tag: 'Navigation' },
          { year: '1629', title: 'Les puritains anglais', emoji: '⚓', text: "Ils arrivèrent fuyant les guerres religieuses en Europe, cherchant une nouvelle terre. Ils apportèrent leur foi, leur langue anglaise… et la graine de ce que nous appelons aujourd'hui la culture Raizale.", tag: 'Fondation' },
          { year: '1631', title: 'Le SeaFlower arrive', emoji: '🚢', text: "Le premier navire officiel touche terre à Providencia et Santa Catalina. À bord, des puritains protestants qui ouvrirent la voie au christianisme sur ces îles.", tag: 'Providencia' },
        ],
      },
      {
        label: 'XVIIe – XVIIIe siècle · Racines africaines',
        events: [
          { year: 'XVIIe s.', title: "L'Afrique arrive aux Caraïbes", emoji: '🌍', text: "Les Anglais amenèrent des esclaves africains pour travailler le coton, le tabac, le manioc et le potiron. De ce mélange de cultures naquit quelque chose d'unique : le peuple Raizal.", tag: 'Identité' },
          { year: 'XVIIIe s.', title: 'La noix de coco change tout', emoji: '🥥', text: "La noix de coco remplaça toutes les cultures précédentes. Elle était nourriture, matériau de construction, monnaie d'échange et source de travail. Les palmes couvraient les noix pour l'exportation — c'est là que Coco ART est né.", tag: 'Le Coco · Culture' },
        ],
      },
      {
        label: 'XIXe – XXe siècle · Partie de la Colombie',
        events: [
          { year: '1822', title: 'Une décision volontaire', emoji: '🇨🇴', text: "Le 23 juin, le Conseil de Providencia et Santa Catalina choisit librement d'adhérer à la Constitution de Cúcuta. Ce n'était pas une conquête : c'était un choix.", tag: 'Souveraineté' },
          { year: '1953', title: 'Port franc', emoji: '🏝️', text: "San Andrés devient port franc. Des migrants arrivent du continent et du monde entier. La vie insulaire change à jamais, mais l'âme Raizale persiste.", tag: 'Transformation' },
        ],
      },
      {
        label: 'XXIe siècle · Réserve de la biosphère',
        events: [
          { year: '2000', title: 'Seaflower — UNESCO', emoji: '🌊', text: "L'UNESCO a reconnu l'archipel comme Réserve mondiale de la biosphère « Seaflower ». Le même nom que le navire qui amena les premiers habitants, désormais symbole de conservation planétaire.", tag: 'Patrimoine mondial' },
          { year: '2012', title: 'L\'arrêt de La Haye', emoji: '⚖️', text: "La Cour internationale de justice trancha le litige entre la Colombie et le Nicaragua. Les limites maritimes changèrent et l'industrie de la pêche Raizale fut dévastée. Aujourd'hui, la culture et le tourisme sont notre économie.", tag: 'Histoire récente' },
        ],
      },
    ],
    creoleTitle: 'La langue Créole',
    creoleSub: 'La voix du peuple Raizal',
    creoleText: "Le Créole est la langue des îles. Il est né de la fusion de l'anglais puritain avec le dialecte africain des esclaves — une langue qui porte dans chaque syllabe l'histoire complète de notre peuple.",
    creoleWord: '"Laiv Stieg" — scène de vie',
    cocoTitle: 'Le Coco dans notre vie',
    cocoSub: 'De multiples usages, un seul palmier',
    cocoCards: [
      { icon: '🧺', name: 'Artisanat', desc: "Les feuilles tressées sont l'art ancestral que nous pratiquons aujourd'hui dans Coco ART" },
      { icon: '🍽️', name: 'Alimentation', desc: 'Base du Rondon, des sucreries et des boissons traditionnelles Raizales' },
      { icon: '💰', name: 'Monnaie', desc: "La noix de coco fut un moyen de troc et d'échange pendant des siècles" },
      { icon: '🏠', name: 'Construction', desc: 'Feuilles et fibres utilisées dans l\'architecture insulaire traditionnelle' },
    ],
    todayEyebrow: "Aujourd'hui · Coco ART by Breda Sky",
    todayTitle: 'La tradition\nest vivante',
    todayIntro: "Chaque palme que nous tissons aujourd'hui est le même geste que faisaient nos ancêtres. Breda Sky et Sky Stephens Jr. maintiennent ce fil vivant — et vous invitent à en faire partie.",
    modalities: [
      {
        num: '01', icon: '🌿', color: 'palm',
        title: 'Souvenir Tressé',
        sub: "Le souvenir Kriol le plus authentique de San Andrés",
        desc: "Avec un petit morceau de palmier, Breda Sky ou vous-même créez une figure unique — tissée à la main, chargée d'histoire — à rapporter comme un morceau de l'âme de l'île.",
        items: ['🐦 Oiseau', '🌹 Rose', '🐟 Poisson', '👑 Couronne', '💚 Cœur'],
      },
      {
        num: '02', icon: '🎨', color: 'coral',
        title: 'Coco ART Live',
        sub: "L'expérience interactive Créole",
        desc: "Le maître raconte l'histoire du coco tout en tissant en direct. Vous apprenez, participez et repartez avec votre propre souvenir fait main — parfait pour les groupes, événements et célébrations.",
        items: ['⏱️ 2 heures', '📍 Plage ou hôtel', '👥 Groupes & familles', '🎉 Événements d\'entreprise'],
      },
      {
        num: '03', icon: '🏮', color: 'ocean',
        title: 'Décoration Kriol Vibe',
        sub: 'Habille ta célébration d\'histoire',
        desc: "Nous transformons n'importe quel espace avec le palmier — des pièces uniques qui respirent l'atmosphère Kriol authentique des Caraïbes. Des petits souvenirs aux installations à fort impact visuel.",
        items: ['🧺 Paniers', '💡 Lampes', '🎩 Chapeaux', '🌿 Centres de table', '🖼️ Pièces sur mesure'],
      },
    ],
    quote: '"Venez à San Andrés et découvrez le Laiv Stieg — notre scène de vie. Chaque feuille a une histoire, chaque nœud a un nom."',
    quoteAuthor: '— Breda Sky, artisan Raizal',
    ctaEyebrow: 'Breda Sky · Sky Stephens Jr. · GuíaSAI',
    ctaTitle: 'Venez tisser\navec nous',
    ctaText: "Chaque figure que vous créez dans Coco ART porte en elle 500 ans d'histoire Raizale. Apprenez le tissage, écoutez les histoires, repartez avec un morceau de l'âme de San Andrés.",
    ctaBtn: "🥥 Voir l'expérience complète",
    ctaWa: '📱 Réserver via WhatsApp',
    footerSub: 'Tourisme communautaire & culturel',
  },
  PT: {
    headerLabel: 'História',
    heroEyebrow: 'Coco ART · Rota Raizal',
    heroTitle: 'A História\nda Nossa Ilha',
    heroSub: 'Cada peça que tecemos hoje carrega séculos de história. Conheça quem somos, de onde viemos e por que o coco mudou tudo.',
    timelineTitle: 'Cronologia',
    eras: [
      {
        label: 'Séculos XVI – XVII · Primeiros registros',
        events: [
          { year: '1527', title: 'No mapa do mundo', emoji: '🗺️', text: 'O arquipélago aparece em cartas náuticas espanholas, confirmando que nossas ilhas eram ponto de referência obrigatório para os grandes navegadores do Caribe.', tag: 'Navegação' },
          { year: '1629', title: 'Os puritanos ingleses', emoji: '⚓', text: 'Chegaram fugindo das guerras religiosas na Europa, buscando novas terras. Trouxeram sua fé, sua língua inglesa… e a semente do que hoje chamamos cultura Raizal.', tag: 'Fundação' },
          { year: '1631', title: 'O SeaFlower chega', emoji: '🚢', text: 'A primeira embarcação oficial toca terra em Providencia e Santa Catalina. A bordo, puritanos protestantes que abriram o caminho do cristianismo nessas ilhas.', tag: 'Providencia' },
        ],
      },
      {
        label: 'Séculos XVII – XVIII · Raízes africanas',
        events: [
          { year: 'Séc. XVII', title: 'A África chega ao Caribe', emoji: '🌍', text: 'Os ingleses trouxeram escravos africanos para trabalhar algodão, tabaco, mandioca e abóbora. Dessa mistura de culturas nasceu algo único: o povo Raizal.', tag: 'Identidade' },
          { year: 'Séc. XVIII', title: 'O coco muda tudo', emoji: '🥥', text: 'O coco substituiu todas as culturas anteriores. Era alimento, material de construção, moeda de troca e fonte de trabalho. As palmeiras cobriam os cocos para exportação — é daí que nasce o Coco ART.', tag: 'O Coco · Cultura' },
        ],
      },
      {
        label: 'Séculos XIX – XX · Parte da Colômbia',
        events: [
          { year: '1822', title: 'Uma decisão voluntária', emoji: '🇨🇴', text: 'Em 23 de junho, o Conselho de Providencia e Santa Catalina decidiu livremente aderir à Constituição de Cúcuta. Não foi conquista: foi escolha.', tag: 'Soberania' },
          { year: '1953', title: 'Porto livre', emoji: '🏝️', text: 'San Andrés torna-se porto livre. Chegam migrantes do continente e do mundo. A vida insular muda para sempre, mas a alma Raizal persiste.', tag: 'Transformação' },
        ],
      },
      {
        label: 'Século XXI · Reserva da Biosfera',
        events: [
          { year: '2000', title: 'Seaflower — UNESCO', emoji: '🌊', text: 'A UNESCO reconheceu o arquipélago como Reserva Mundial da Biosfera "Seaflower". O mesmo nome do barco que trouxe os primeiros habitantes, agora símbolo de conservação planetária.', tag: 'Patrimônio mundial' },
          { year: '2012', title: 'O julgamento de Haia', emoji: '⚖️', text: 'O Tribunal Internacional de Justiça resolveu o litígio entre a Colômbia e a Nicarágua. Os limites marítimos mudaram e a indústria pesqueira Raizal foi devastada. Hoje, cultura e turismo são nossa economia.', tag: 'História recente' },
        ],
      },
    ],
    creoleTitle: 'A língua Creole',
    creoleSub: 'A voz do povo Raizal',
    creoleText: 'O Creole é a língua das ilhas. Nasceu da fusão do inglês puritano com o dialeto africano dos escravizados — uma língua que carrega em cada sílaba a história completa do nosso povo.',
    creoleWord: '"Laiv Stieg" — palco de vida',
    cocoTitle: 'O Coco na nossa vida',
    cocoSub: 'Múltiplos usos, uma só palmeira',
    cocoCards: [
      { icon: '🧺', name: 'Artesanato', desc: 'As folhas trançadas são a arte ancestral que praticamos hoje no Coco ART' },
      { icon: '🍽️', name: 'Alimento', desc: 'Base do Rondon, doces e bebidas tradicionais Raizales' },
      { icon: '💰', name: 'Moeda', desc: 'O coco foi método de troca e intercâmbio durante séculos' },
      { icon: '🏠', name: 'Construção', desc: 'Folhas e fibras usadas na arquitetura insular tradicional' },
    ],
    todayEyebrow: 'Hoje · Coco ART by Breda Sky',
    todayTitle: 'A tradição\ncontinua viva',
    todayIntro: 'Cada palma que tecemos hoje é o mesmo gesto que nossos ancestrais faziam. Breda Sky e Sky Stephens Jr. mantêm esse fio vivo — e convidam você a fazer parte dele.',
    modalities: [
      {
        num: '01', icon: '🌿', color: 'palm',
        title: 'Souvenir Trançado',
        sub: 'A lembrança Kriol mais autêntica de San Andrés',
        desc: 'Com um pequeno pedaço de palmeira, Breda Sky ou você mesmo cria uma figura única — trançada à mão, carregada de história — para levar como um pedaço da alma da ilha.',
        items: ['🐦 Pássaro', '🌹 Rosa', '🐟 Peixe', '👑 Coroa', '💚 Coração'],
      },
      {
        num: '02', icon: '🎨', color: 'coral',
        title: 'Coco ART Live',
        sub: 'A experiência interativa Creole',
        desc: 'O mestre narra a história do coco enquanto tece ao vivo. Você aprende, participa e leva seu próprio souvenir feito à mão — perfeito para grupos, eventos e celebrações na ilha.',
        items: ['⏱️ 2 horas', '📍 Praia ou hotel', '👥 Grupos e famílias', '🎉 Eventos corporativos'],
      },
      {
        num: '03', icon: '🏮', color: 'ocean',
        title: 'Decoração Kriol Vibe',
        sub: 'Vista sua celebração com história',
        desc: 'Transformamos qualquer espaço com palmeira de coco — peças únicas que respiram a autêntica atmosfera Kriol do Caribe. De pequenos souvenirs a instalações de alto impacto visual.',
        items: ['🧺 Cestos', '💡 Luminárias', '🎩 Chapéus', '🌿 Centros de mesa', '🖼️ Peças sob medida'],
      },
    ],
    quote: '"Venha a San Andrés e conheça o Laiv Stieg — nosso palco de vida. Cada folha tem uma história, cada nó tem um nome."',
    quoteAuthor: '— Breda Sky, artesão Raizal',
    ctaEyebrow: 'Breda Sky · Sky Stephens Jr. · GuíaSAI',
    ctaTitle: 'Venha tecer\nconosco',
    ctaText: 'Cada figura que você cria no Coco ART carrega 500 anos de história Raizal. Aprenda o trançado, ouça as histórias, leve um pedaço da alma de San Andrés.',
    ctaBtn: '🥥 Ver a experiência completa',
    ctaWa: '📱 Reservar pelo WhatsApp',
    footerSub: 'Turismo comunitário e cultural',
  },
} as const;

const modBg: Record<string, string> = {
  palm:  'rgba(58,107,42,0.12)',
  coral: 'rgba(212,84,26,0.10)',
  ocean: 'rgba(26,107,122,0.12)',
};
const modBorder: Record<string, string> = {
  palm:  'rgba(90,155,58,0.25)',
  coral: 'rgba(212,84,26,0.25)',
  ocean: 'rgba(42,155,168,0.25)',
};

const CocoArtHistoria: React.FC<CocoArtHistoriaProps> = ({ onBack }) => {
  const [lang, setLang] = useState<Lang>('ES');
  const t = T[lang];

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, ${PALM_DARK} 0%, ${PALM_MID} 60%, ${PALM_GREEN} 100%)` }}>

      {/* ── Header fijo ── */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-3"
        style={{ background: `${PALM_DARK}f0`, backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: PALM_ACCENT }}>{t.headerLabel}</p>
          <h1 className="text-xs font-black text-white leading-none truncate">Coco Art · San Andrés</h1>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {LANGS.map(({ code, flag }) => (
            <button key={code} onClick={() => setLang(code)}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-black transition-all"
              style={{
                background: lang === code ? PALM_GOLD : 'rgba(255,255,255,0.06)',
                color: lang === code ? PALM_DARK : 'rgba(255,255,255,0.45)',
                border: `1px solid ${lang === code ? PALM_GOLD : 'rgba(255,255,255,0.1)'}`,
              }}>
              <span>{flag}</span><span>{code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="px-5 pt-8 pb-6 text-center relative">
        <div className="absolute top-4 left-4 text-6xl opacity-5 pointer-events-none select-none" style={{ transform: 'rotate(-20deg)' }}>🌴</div>
        <div className="absolute top-4 right-4 text-6xl opacity-5 pointer-events-none select-none" style={{ transform: 'rotate(20deg)' }}>🥥</div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: PALM_GOLD }}>{t.heroEyebrow}</p>
        <h2 className="text-2xl font-black text-white leading-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          {t.heroTitle.split('\n').map((line, i) => (
            <span key={i}>{i === 1 ? <em style={{ color: PALM_GOLD, fontStyle: 'italic' }}>{line}</em> : line}<br /></span>
          ))}
        </h2>
        <p className="text-xs font-light leading-relaxed max-w-xs mx-auto" style={{ color: 'rgba(245,237,216,0.75)' }}>{t.heroSub}</p>
      </div>

      <div className="px-4 max-w-lg mx-auto pb-10">

        {/* ── TIMELINE ── */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={13} style={{ color: PALM_GOLD }} />
            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: PALM_GOLD }}>{t.timelineTitle}</h3>
          </div>

          {t.eras.map((era, ei) => (
            <div key={ei} className="mb-4">
              <div className="text-center mb-3">
                <span className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background: 'rgba(139,110,74,0.3)', color: 'rgba(245,237,216,0.7)', border: '1px solid rgba(139,110,74,0.3)' }}>
                  {era.label}
                </span>
              </div>
              <div className="space-y-2">
                {era.events.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 16 }}>
                      <div className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0" style={{ background: PALM_GOLD, border: `2px solid ${PALM_DARK}`, boxShadow: `0 0 0 1.5px ${PALM_GOLD}60` }} />
                      {i < era.events.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(200,168,75,0.2)' }} />}
                    </div>
                    <div className="pb-3 flex-1 rounded-xl p-3 mb-1"
                      style={{ background: 'rgba(200,169,122,0.06)', border: '1px solid rgba(200,169,122,0.12)' }}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-base">{ev.emoji}</span>
                        <div>
                          <span className="text-xs font-black" style={{ color: PALM_GOLD }}>{ev.year}</span>
                          <span className="text-[10px] font-bold text-white ml-2">{ev.title}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,237,216,0.75)' }}>{ev.text}</p>
                      <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full"
                        style={{ border: '1px solid rgba(200,169,122,0.3)', color: 'rgba(200,169,122,0.8)' }}>{ev.tag}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Creole interlude after era index 1 */}
              {ei === 1 && (
                <div className="my-4 rounded-2xl p-4 text-center"
                  style={{ background: `${PALM_OCEAN}20`, border: '1px solid rgba(42,155,168,0.2)' }}>
                  <h4 className="text-sm font-black mb-0.5" style={{ color: 'rgba(200,230,200,0.9)' }}>{t.creoleTitle}</h4>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(200,230,200,0.45)' }}>{t.creoleSub}</p>
                  <p className="text-xs font-light leading-relaxed mb-2" style={{ color: 'rgba(245,237,216,0.72)' }}>{t.creoleText}</p>
                  <p className="text-sm font-bold" style={{ color: PALM_GOLD, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{t.creoleWord}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── USOS DEL COCO ── */}
        <div className="mb-6 rounded-2xl p-4" style={{ background: `${PALM_OCEAN}15`, border: '1px solid rgba(42,155,168,0.15)' }}>
          <div className="text-center mb-3">
            <h3 className="text-sm font-black text-white mb-0.5">{t.cocoTitle}</h3>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(200,230,200,0.45)' }}>{t.cocoSub}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {t.cocoCards.map(({ icon, name, desc }) => (
              <div key={name} className="rounded-xl p-3"
                style={{ background: 'rgba(200,169,122,0.07)', border: '1px solid rgba(200,169,122,0.15)' }}>
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-xs font-bold mb-0.5" style={{ color: 'rgba(245,237,216,0.85)' }}>{name}</p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(245,237,216,0.55)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOY: COCO ART ── */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: PALM_ACCENT }}>{t.todayEyebrow}</p>
          <h3 className="text-xl font-black text-white leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {t.todayTitle.split('\n').map((line, i) => (
              <span key={i}>{i === 1 ? <em style={{ color: PALM_GOLD, fontStyle: 'italic' }}>{line}</em> : line}<br /></span>
            ))}
          </h3>
          <p className="text-xs font-light leading-relaxed mb-4" style={{ color: 'rgba(245,237,216,0.72)' }}>{t.todayIntro}</p>

          <div className="space-y-3 mb-5">
            {t.modalities.map((mod) => (
              <div key={mod.num} className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: modBg[mod.color], border: `1px solid ${modBorder[mod.color]}` }}>
                <div className="absolute top-2 right-3 font-black opacity-10 text-white"
                  style={{ fontFamily: 'Georgia, serif', fontSize: 48, lineHeight: 1 }}>{mod.num}</div>
                <p className="text-2xl mb-1">{mod.icon}</p>
                <h4 className="text-base font-black text-white mb-0.5">{mod.title}</h4>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: PALM_GOLD }}>{mod.sub}</p>
                <p className="text-xs font-light leading-relaxed mb-3" style={{ color: 'rgba(245,237,216,0.78)' }}>{mod.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mod.items.map(item => (
                    <span key={item} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(200,169,122,0.1)', border: '1px solid rgba(200,169,122,0.2)', color: 'rgba(245,237,216,0.75)' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="text-center py-4">
            <div className="w-10 h-px mx-auto mb-3" style={{ background: `linear-gradient(to right, transparent, ${PALM_GOLD}60, transparent)` }} />
            <p className="text-sm leading-relaxed mb-2 px-2" style={{ color: 'rgba(245,237,216,0.88)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{t.quote}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(200,169,122,0.6)' }}>{t.quoteAuthor}</p>
            <div className="w-10 h-px mx-auto mt-3" style={{ background: `linear-gradient(to right, transparent, ${PALM_GOLD}60, transparent)` }} />
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-2xl p-5 text-center mb-6"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${PALM_CORAL}20 0%, transparent 60%), rgba(200,169,122,0.05)`, border: '1px solid rgba(200,169,122,0.12)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: PALM_CORAL }}>{t.ctaEyebrow}</p>
          <h3 className="text-xl font-black text-white leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {t.ctaTitle.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
          </h3>
          <p className="text-xs font-light leading-relaxed mb-4" style={{ color: 'rgba(245,237,216,0.7)' }}>{t.ctaText}</p>
          <a href="https://wa.me/573153836043" target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl font-bold text-sm text-white mb-2"
            style={{ background: `linear-gradient(135deg, ${PALM_CORAL}, #b83e0e)` }}>
            {t.ctaBtn}
          </a>
          <a href="https://wa.me/573153836043" target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl font-bold text-sm"
            style={{ background: 'transparent', border: `1px solid rgba(200,169,122,0.3)`, color: PALM_GOLD }}>
            {t.ctaWa}
          </a>
        </div>

        {/* Footer */}
        <div className="text-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(200,230,200,0.3)' }}>
            GuíaSAI S.A.S. · RNT 48674 · San Andrés Isla, Colombia
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(200,230,200,0.2)' }}>
            Raizal-owned · {t.footerSub}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocoArtHistoria;
