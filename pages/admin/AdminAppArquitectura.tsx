import React, { useState } from 'react';
import {
  ArrowLeft, ChevronRight, ChevronDown, Home, Map, ShoppingCart,
  User, Shield, Briefcase, Music, Star, Settings, Layers,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

// ─── Data model ──────────────────────────────────────────────────────────────

interface RouteNode {
  label: string;
  route?: AppRoute;
  emoji?: string;
  tag?: string;          // "Nuevo", "IA", etc.
  children?: RouteNode[];
}

interface RoleTree {
  id: string;
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  routes: RouteNode[];
}

// ─── Definición del árbol por rol ────────────────────────────────────────────

const TREES: RoleTree[] = [
  {
    id: 'turista',
    label: 'Turista / Local',
    sublabel: 'Usuario visitante de la isla o residente',
    emoji: '🏄',
    color: '#00A8A0',
    bgColor: '#00A8A015',
    borderColor: '#00A8A040',
    routes: [
      {
        label: 'Home', emoji: '🏠', route: AppRoute.HOME,
        children: [
          { label: 'Tours', emoji: '🤿', route: AppRoute.TOUR_LIST,
            children: [{ label: 'Detalle Tour', route: AppRoute.TOUR_DETAIL }] },
          { label: 'Hoteles', emoji: '🏨', route: AppRoute.HOTEL_LIST,
            children: [{ label: 'Detalle Hotel', route: AppRoute.HOTEL_DETAIL }] },
          { label: 'Paquetes', emoji: '🎁', route: AppRoute.PACKAGE_LIST,
            children: [{ label: 'Detalle Paquete', route: AppRoute.PACKAGE_DETAIL }] },
          { label: 'Taxis', emoji: '🚖', route: AppRoute.TAXI_LIST,
            children: [{ label: 'Detalle Taxi', route: AppRoute.TAXI_DETAIL }] },
          { label: 'Marketplace', emoji: '🛍️', route: AppRoute.MARKETPLACE },
        ],
      },
      {
        label: 'Explorar isla', emoji: '🗺️',
        children: [
          { label: 'Mapa Interactivo', route: AppRoute.INTERACTIVE_MAP },
          { label: 'Directorio Negocios', route: AppRoute.DIRECTORY },
          { label: 'Mapa Restaurantes', route: AppRoute.RESTAURANT_MAP },
          { label: 'Coco Art Historia', route: AppRoute.COCO_ART_HISTORIA, tag: 'Nuevo' },
        ],
      },
      {
        label: 'Caribbean Night', emoji: '🎶', route: AppRoute.RIMM_CLUSTER,
        children: [
          { label: 'Detalle Evento', route: AppRoute.MUSIC_EVENT_DETAIL },
          { label: 'Perfil Artista', route: AppRoute.ARTIST_DETAIL },
        ],
      },
      {
        label: 'Planificar viaje', emoji: '📋',
        children: [
          { label: 'Mi Itinerario', route: AppRoute.MY_ITINERARY },
          { label: 'Planificador Dinámico', route: AppRoute.DYNAMIC_ITINERARY },
          { label: 'Tour Privado', route: AppRoute.TOUR_PRIVADO },
          { label: 'Cotizador Grupal', route: AppRoute.GROUP_QUOTE },
          { label: 'Catálogo Público', route: AppRoute.CATALOG_PUBLICO },
        ],
      },
      {
        label: 'Mi cuenta', emoji: '👤',
        children: [
          { label: 'Dashboard Cuenta', route: AppRoute.PROFILE },
          { label: 'GuanaWallet', route: AppRoute.WALLET },
          { label: 'Checkout', route: AppRoute.CHECKOUT },
          { label: 'Reseñas', route: AppRoute.REVIEWS },
        ],
      },
      {
        label: 'Negocios aliados', emoji: '🤝',
        children: [
          { label: 'Vincular Comercio', route: AppRoute.VINCULAR_COMERCIO, tag: 'Nuevo' },
        ],
      },
    ],
  },

  {
    id: 'aliado',
    label: 'Aliado / Socio / Operador',
    sublabel: 'Negocio local registrado como partner',
    emoji: '🏪',
    color: '#F5831F',
    bgColor: '#F5831F15',
    borderColor: '#F5831F40',
    routes: [
      {
        label: 'Perfil del Negocio', emoji: '🏪', route: AppRoute.PROFILE,
        children: [
          { label: 'Mi Plan (Básico/Activo/Premium)', tag: 'Nuevo' },
          { label: 'Vincular Comercio', route: AppRoute.VINCULAR_COMERCIO },
        ],
      },
      {
        label: 'Panel Pro (GuiaSAI)', emoji: '📊', route: AppRoute.PARTNER_DASHBOARD_PRO,
        children: [
          { label: 'Gestión Alojamientos' },
          { label: 'Gestión Restaurante' },
          { label: 'Gestión Tours' },
          { label: 'Gestión Traslados' },
          { label: 'Mi Perfil Partner' },
        ],
      },
      {
        label: 'Mis Servicios', emoji: '📦', route: AppRoute.PARTNER_MY_SERVICES,
        children: [
          { label: 'Crear Servicio', route: AppRoute.PARTNER_CREATE_SERVICE },
          { label: 'Detalle Servicio', route: AppRoute.PARTNER_SERVICE_DETAIL },
          { label: 'Alojamientos', route: AppRoute.PARTNER_ACCOMMODATIONS },
        ],
      },
      {
        label: 'Operaciones', emoji: '⚙️',
        children: [
          { label: 'Reservaciones Partner', route: AppRoute.PARTNER_RESERVATIONS },
          { label: 'Scanner QR', route: AppRoute.PARTNER_SCANNER },
          { label: 'Operaciones', route: AppRoute.PARTNER_OPERATIONS },
          { label: 'Wallet Partner', route: AppRoute.PARTNER_WALLET },
        ],
      },
    ],
  },

  {
    id: 'artista',
    label: 'Artista',
    sublabel: 'Músico o artista del ecosistema Caribbean Night',
    emoji: '🎵',
    color: '#a78bfa',
    bgColor: '#a78bfa15',
    borderColor: '#a78bfa40',
    routes: [
      {
        label: 'Portal Artista', emoji: '🎤', route: AppRoute.ARTISTA_PORTAL,
        children: [
          { label: 'Mi Perfil Artístico' },
          { label: 'Mis Eventos Programados' },
          { label: 'Métricas de Reproducciones' },
          { label: 'Contacto con Organizadores' },
        ],
      },
      {
        label: 'Secciones públicas', emoji: '🌐',
        children: [
          { label: 'Página pública del artista', route: AppRoute.ARTIST_DETAIL },
          { label: 'Caribbean Night', route: AppRoute.RIMM_CLUSTER },
        ],
      },
    ],
  },

  {
    id: 'superadmin',
    label: 'Super Admin',
    sublabel: 'Acceso completo al sistema GuanaGO',
    emoji: '🔐',
    color: '#6366f1',
    bgColor: '#6366f115',
    borderColor: '#6366f140',
    routes: [
      {
        label: 'Dashboard Admin', emoji: '📊', route: AppRoute.ADMIN_DASHBOARD,
        children: [
          { label: 'Agente IA Briefing', tag: 'IA' },
          { label: 'Métricas rápidas' },
          { label: 'Tareas críticas' },
        ],
      },
      {
        label: 'Gestión usuarios', emoji: '👥',
        children: [
          { label: 'Usuarios', route: AppRoute.ADMIN_USERS },
          { label: 'Aprobaciones', route: AppRoute.ADMIN_APPROVALS },
          { label: 'Socios Admin', route: AppRoute.ADMIN_SOCIOS },
          { label: 'Negocios Locales', route: AppRoute.ADMIN_NEGOCIOS_LOCALES },
          { label: 'Artistas', route: AppRoute.ADMIN_ARTISTAS },
        ],
      },
      {
        label: 'Operaciones', emoji: '⚙️',
        children: [
          { label: 'Reservaciones', route: AppRoute.ADMIN_RESERVATIONS },
          { label: 'Servicios / Catálogo', route: AppRoute.ADMIN_SERVICES },
          { label: 'Operaciones Admin', route: AppRoute.ADMIN_OPERACIONES },
          { label: 'Tareas', route: AppRoute.ADMIN_TASKS },
          { label: 'Aprobaciones', route: AppRoute.ADMIN_APPROVALS },
        ],
      },
      {
        label: 'Financiero', emoji: '💰',
        children: [
          { label: 'Finanzas', route: AppRoute.ADMIN_FINANCE },
          { label: 'Cotizaciones', route: AppRoute.ADMIN_QUOTES },
          { label: 'Vouchers', route: AppRoute.ADMIN_VOUCHERS },
          { label: 'Civitatis / OTAs', route: AppRoute.ADMIN_CIVITATIS },
        ],
      },
      {
        label: 'Caribbean Night', emoji: '🎶',
        children: [
          { label: 'Gestión Caribbean Night', route: AppRoute.ADMIN_CARIBBEAN },
          { label: 'Artistas (admin)', route: AppRoute.ADMIN_ARTISTAS },
        ],
      },
      {
        label: 'Aliados', emoji: '🤝',
        children: [
          { label: 'Estrategia Aliados', route: AppRoute.ADMIN_ALIADOS, tag: 'Nuevo' },
          { label: 'Vincular Comercio (pública)', route: AppRoute.VINCULAR_COMERCIO, tag: 'Nuevo' },
          { label: 'Socios Admin', route: AppRoute.ADMIN_SOCIOS },
          { label: 'Negocios Locales', route: AppRoute.ADMIN_NEGOCIOS_LOCALES },
        ],
      },
      {
        label: 'Inteligencia / IA', emoji: '🧠',
        children: [
          { label: 'Cerebro IA', route: AppRoute.ADMIN_CEREBRO, tag: 'IA' },
          { label: 'Procedimientos RAG', route: AppRoute.ADMIN_PROCEDIMIENTOS_RAG, tag: 'IA' },
          { label: 'Cowork IA', route: AppRoute.ADMIN_COWORK, tag: 'IA' },
          { label: 'Torre de Control', route: AppRoute.ADMIN_TORRE_CONTROL },
        ],
      },
      {
        label: 'Infraestructura / Dev', emoji: '🔧',
        children: [
          { label: 'Panel de Control', route: AppRoute.ADMIN_CONTROL_PANEL },
          { label: 'Estructura Backend', route: AppRoute.ADMIN_STRUCTURE },
          { label: 'Backend / Datos', route: AppRoute.ADMIN_BACKEND },
          { label: 'Sky Panel', route: AppRoute.ADMIN_SKY_PANEL },
          { label: 'Mapa Mental', route: AppRoute.ADMIN_MAPA_MENTAL },
          { label: 'App Arquitectura', route: AppRoute.ADMIN_APP_ARQUITECTURA, tag: 'Nuevo' },
        ],
      },
    ],
  },
];

// ─── Node recursivo del árbol ────────────────────────────────────────────────

interface TreeNodeProps {
  node: RouteNode;
  level: number;
  roleColor: string;
  onNavigate: (route: AppRoute) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, roleColor, onNavigate }) => {
  const [open, setOpen] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;

  const indent = level * 16;

  return (
    <div>
      <button
        className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-left transition-colors group
          ${hasChildren ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
          ${level === 0 ? 'py-2' : ''}`}
        style={{ paddingLeft: `${12 + indent}px` }}
        onClick={() => {
          if (node.route) onNavigate(node.route);
          else if (hasChildren) setOpen(!open);
        }}
      >
        {/* Línea de conexión */}
        {level > 0 && (
          <span className="text-gray-700 select-none">
            {level === 1 ? '├─' : '└─'}
          </span>
        )}

        {/* Chevron si tiene hijos */}
        {hasChildren && (
          <span className="shrink-0">
            {open
              ? <ChevronDown size={12} className="text-gray-500" />
              : <ChevronRight size={12} className="text-gray-500" />
            }
          </span>
        )}

        {/* Emoji */}
        {node.emoji && <span className="text-sm">{node.emoji}</span>}

        {/* Label */}
        <span
          className={`text-xs flex-1 ${
            level === 0 ? 'font-black text-white' :
            level === 1 ? 'font-bold text-gray-300' :
            'text-gray-500'
          } ${node.route ? 'group-hover:underline' : ''}`}
          style={node.route && level > 0 ? { color: roleColor + 'cc' } : undefined}
        >
          {node.label}
        </span>

        {/* Tag badge */}
        {node.tag && (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black text-white"
            style={{ backgroundColor: node.tag === 'IA' ? '#7c3aed' : node.tag === 'Nuevo' ? '#059669' : '#374151' }}>
            {node.tag}
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && open && (
        <div className={level === 0 ? 'ml-2' : 'ml-4'}>
          {node.children!.map((child, i) => (
            <TreeNode
              key={`${child.label}-${i}`}
              node={child}
              level={level + 1}
              roleColor={roleColor}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Vista "Todo junto" (swimlanes por rol) ───────────────────────────────────

const VistaGeneral: React.FC<{ onNavigate: (r: AppRoute) => void }> = ({ onNavigate }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {TREES.map((tree) => (
      <div
        key={tree.id}
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: tree.borderColor, backgroundColor: tree.bgColor }}
      >
        {/* Role header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: tree.borderColor }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{tree.emoji}</span>
            <div>
              <p className="font-black text-sm text-white">{tree.label}</p>
              <p className="text-[10px] text-gray-500">{tree.sublabel}</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: tree.color, backgroundColor: tree.color + '22' }}>
              {tree.routes.reduce((acc, r) => acc + 1 + (r.children?.length || 0), 0)} pantallas
            </span>
          </div>
        </div>

        {/* Tree */}
        <div className="px-2 py-3">
          {tree.routes.map((node, i) => (
            <TreeNode
              key={`${node.label}-${i}`}
              node={node}
              level={0}
              roleColor={tree.color}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Component principal ──────────────────────────────────────────────────────

type Vista = 'general' | 'turista' | 'aliado' | 'artista' | 'superadmin';

const AdminAppArquitectura: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [vista, setVista] = useState<Vista>('general');

  const activeTree = TREES.find((t) => t.id === vista);

  const TABS: { id: Vista; label: string; emoji: string }[] = [
    { id: 'general', label: 'Todo', emoji: '🌐' },
    { id: 'turista', label: 'Turista', emoji: '🏄' },
    { id: 'aliado', label: 'Aliado', emoji: '🏪' },
    { id: 'artista', label: 'Artista', emoji: '🎵' },
    { id: 'superadmin', label: 'Admin', emoji: '🔐' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-5 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-black text-base flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              Arquitectura de la App
            </h1>
            <p className="text-[10px] text-gray-500">Qué ve cada rol · Árbol de rutas</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {TABS.map((t) => {
            const tree = TREES.find((r) => r.id === t.id);
            const isActive = vista === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setVista(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                  isActive ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
                style={isActive && tree ? { backgroundColor: tree.color + 'cc' } : undefined}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4">

        {/* Vista general — todos los roles */}
        {vista === 'general' && (
          <>
            {/* Leyenda rápida */}
            <div className="flex flex-wrap gap-2 mb-4">
              {TREES.map((t) => (
                <span key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: t.color + '22', color: t.color }}>
                  {t.emoji} {t.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-900/30 text-emerald-400">
                🟢 Nuevo
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-900/30 text-violet-400">
                🤖 IA
              </span>
            </div>
            <VistaGeneral onNavigate={onNavigate} />
          </>
        )}

        {/* Vista por rol individual */}
        {vista !== 'general' && activeTree && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: activeTree.borderColor, backgroundColor: activeTree.bgColor }}
          >
            {/* Header del rol */}
            <div className="px-5 py-4 border-b" style={{ borderColor: activeTree.borderColor }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeTree.emoji}</span>
                <div>
                  <h2 className="font-black text-lg text-white">{activeTree.label}</h2>
                  <p className="text-xs text-gray-500">{activeTree.sublabel}</p>
                </div>
              </div>
              {/* Stats */}
              <div className="flex gap-4 mt-3 text-xs">
                <span style={{ color: activeTree.color }}>
                  <strong>{activeTree.routes.length}</strong> secciones principales
                </span>
                <span className="text-gray-600">
                  <strong className="text-gray-400">
                    {activeTree.routes.reduce((acc, r) =>
                      acc + (r.children?.reduce((a2, c) => a2 + 1 + (c.children?.length || 0), 0) || 0), 0
                    )}
                  </strong> sub-rutas
                </span>
              </div>
            </div>

            {/* Árbol completo */}
            <div className="px-3 py-4 space-y-1">
              {activeTree.routes.map((node, i) => (
                <TreeNode
                  key={`${node.label}-${i}`}
                  node={node}
                  level={0}
                  roleColor={activeTree.color}
                  onNavigate={onNavigate}
                />
              ))}
            </div>

            {/* Nota para Artista */}
            {vista === 'artista' && (
              <div className="mx-4 mb-4 p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-500">
                El rol Artista también accede a todas las secciones de Turista (exploración de la isla, mapa, etc.)
              </div>
            )}
          </div>
        )}

        {/* Nota al pie */}
        <div className="mt-6 p-4 rounded-2xl bg-gray-900 border border-gray-800 text-xs text-gray-500 leading-relaxed">
          <p className="font-bold text-gray-400 mb-1">Notas de arquitectura</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Los nodos con <span className="text-green-400">🟢 Nuevo</span> fueron agregados recientemente (mayo 2026)</li>
            <li>Los nodos con <span className="text-violet-400">🤖 IA</span> usan Claude API o Groq para funciones inteligentes</li>
            <li>Las rutas clickeables te llevan directamente a esa pantalla</li>
            <li>Super Admin tiene acceso completo a todas las rutas de todos los roles</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminAppArquitectura;
