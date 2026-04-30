import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Plus, Filter, Search, Clock, AlertCircle, CheckCircle2, 
  Circle, Pause, RefreshCw, FileText, Sparkles, ChevronDown, ChevronUp,
  Calendar, User, Link2, Trash2, Edit3, Save, X, Bot, Send, Cloud, CloudOff, Loader2
} from 'lucide-react';
import { 
  AppRoute, ProjectTask, TaskStatus, TaskPriority, TaskCategory,
  TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, TASK_CATEGORY_CONFIG, TaskStats
} from '../../types';
import { airtableService, getTareas, createTarea, updateTarea, deleteTarea } from '../../services/airtableService';

interface AdminTasksProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

// Tareas actualizadas al estado real del proyecto — Mayo 2026
// Fuentes: CLAUDE.md (estado en producción) + guanago_mapa60dias.html (roadmap)
const INITIAL_TASKS: ProjectTask[] = [

  // ════════════════════════════════════════
  // 🔴 CRÍTICO — Foco actual
  // ════════════════════════════════════════

  {
    id: 'task-c01',
    titulo: 'Integrar pasarela Wompi/PayU',
    descripcion: 'Mock actual de pagos debe reemplazarse con integración real. Wompi para COP (tarjeta + PSE), PayU como alternativa. Incluye webhook de confirmación /api/payments/webhook y actualización de estado en Airtable Reservas.',
    status: 'pendiente',
    prioridad: 'critica',
    categoria: 'backend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Pendientes — Pagos',
    estimacionHoras: 20,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-c02',
    titulo: 'Notificación al operador por WhatsApp',
    descripcion: 'Al confirmar una reserva (B2C o B2B), el operador recibe WhatsApp automático con los datos del servicio. Canal primario: WhatsApp Business API. Canal secundario: email vía Make.com webhook.',
    status: 'pendiente',
    prioridad: 'critica',
    categoria: 'backend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Reservas Unificadas — Notificación',
    dependeDe: [],
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-c03',
    titulo: 'Firestore como DB runtime',
    descripcion: 'Migrar lecturas de tiempo real de Airtable a Firestore. Airtable tiene rate limits (5 req/seg). Make.com sincroniza: aprobado en Airtable → push a Firestore. App lee de Firestore, escribe a backend → Airtable.',
    status: 'pendiente',
    prioridad: 'critica',
    categoria: 'infraestructura',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Arquitectura — DB Runtime',
    estimacionHoras: 24,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-c04',
    titulo: 'GuanaGO Cowork — Catálogo B2B con tarifas netas',
    descripcion: 'Portal de acceso controlado para agencias y OTAs. Catálogo web/PDF de tarifas netas 2026 generado desde ServiciosTuristicos_SAI (campo Precio Neto 2026). Control de acceso por token JWT. Sin precios públicos.',
    status: 'pendiente',
    prioridad: 'critica',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'GuanaGO Cowork — Módulo A',
    estimacionHoras: 16,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },

  // ════════════════════════════════════════
  // 🟡 INMEDIATO — Esta semana (mapa60dias)
  // ════════════════════════════════════════

  {
    id: 'task-i01',
    titulo: 'Subir código a GitHub repo skystephens/GuanaGo-App-v2',
    descripcion: 'El código actual en disco local debe subirse al repo. Asegurar que rama master → Render esté limpia y rama dev-2026 tenga los últimos cambios.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'infraestructura',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Técnico',
    estimacionHoras: 1,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-i02',
    titulo: 'Bug cotizador — unificar componente preview y URL pública',
    descripcion: 'El componente de cotización muestra diferente en preview que en URL pública. Crear un único <CotizacionView /> que funcione en ambos contextos. Bug afecta la experiencia de las agencias.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Técnico',
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-i03',
    titulo: 'Items sin imagen — renderizar solo texto',
    descripcion: 'Cuando un ítem de cotización o tour no tiene imagen, el componente muestra un placeholder vacío. Solución: condicional que omite el contenedor de imagen completamente si no hay URL.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Técnico',
    estimacionHoras: 2,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-i04',
    titulo: 'Crear tabla Contenido_Redes en Airtable',
    descripcion: 'Nueva tabla para gestionar parrilla de redes sociales. Campos: Red (IG/TK/FB), Fecha, Tipo, Estado, Caption, Imagen/Video URL, Hashtags, Métricas post-publicación. Vista calendario para la parrilla semanal.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Airtable',
    estimacionHoras: 3,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-i05',
    titulo: 'Filtro por categoría en mapa Mapbox',
    descripcion: 'Agregar botones de filtro por categoría sobre el mapa (Tours, Restaurantes, Hospedaje, Playas, Arte). Filtra los pins visibles sin recargar. Los 40+ POIs de Directorio_Mapa ya tienen campo Categoria.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Mapa',
    estimacionHoras: 6,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-i06',
    titulo: 'Vincular 5 servicios reservables desde pins del mapa',
    descripcion: 'Seleccionar 5 servicios de ServiciosTuristicos_SAI con reserva activa y conectarlos al pin correspondiente en el mapa. Al hacer clic en el pin → ficha con botón "Reservar" funcional.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Mapa',
    dependeDe: ['task-i05'],
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-i07',
    titulo: 'Primeros 3 captions piloto con Claude para redes',
    descripcion: 'Definir tono y formato de captions: uno para tour (conversión), uno cultural (Raizal/viral), uno de comunidad (confianza). Probar respuesta de audiencia antes de escalar la producción de contenido.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'negocio',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Tareas inmediatas — Contenido',
    estimacionHoras: 2,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },

  // ════════════════════════════════════════
  // 🟠 PRÓXIMO — Jun-Jul 2026
  // ════════════════════════════════════════

  {
    id: 'task-p01',
    titulo: 'FCM Push Notifications — configurar',
    descripcion: 'El SDK de Firebase Cloud Messaging está instalado pero sin configurar. Implementar: permisos del usuario, token FCM por sesión, envío desde backend en eventos clave (reserva confirmada, oferta, recordatorio).',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'infraestructura',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Pendientes — Alta prioridad',
    estimacionHoras: 10,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-p02',
    titulo: 'Mapa recomendador contextual con IA',
    descripcion: 'El mapa evoluciona de directorio a recomendador: según hora del día, clima, historial de visitas e intereses del viajero, sugiere los próximos 3 lugares a visitar. Usa datos de Directorio_Mapa + contexto del chatbot.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Roadmap — Jun-Jul 2026',
    dependeDe: ['task-i05'],
    estimacionHoras: 20,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-p03',
    titulo: 'Audio guías para 5 lugares clave del mapa',
    descripcion: 'Narración en español + inglés criollo para: Old Point, Hoyo Soplador, Morgan Cave, Johnny Cay, Playa de San Luis. TTS con ElevenLabs o similar. Archivo MP3 en Firebase Storage, enlazado al pin del mapa.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'diseno',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Roadmap — Jun-Jul 2026',
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-p04',
    titulo: 'GuanaGO Cowork — Cotizador grupos 150+ personas',
    descripcion: 'Formulario especial: destino, fecha, nº personas, tipo de evento. IA calcula paquete optimizado con descuento escalonado: >50 pax -10%, >100 -15%, >150 -20%. Output: propuesta ejecutiva PDF + record en CotizacionesGG.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'GuanaGO Cowork — Módulo C',
    dependeDe: ['task-c04'],
    estimacionHoras: 16,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-p05',
    titulo: 'Agente IA itinerarios personalizados',
    descripcion: 'El turista describe perfil (días, intereses, presupuesto, nº personas) y el agente arma itinerario completo con horarios, lugares del mapa, servicios reservables y estimado de costos. Integrar con Claude API + RAG catálogo.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'backend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Agente IA — Itinerarios',
    dependeDe: ['task-p02'],
    estimacionHoras: 24,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-p06',
    titulo: 'GuanaPoints v1 completo — canje con aliados',
    descripcion: 'El sistema de puntos existe pero necesita el flujo de canje: turista muestra código QR en comercio aliado, aliado valida en su panel, puntos se descuentan. Actualiza tabla GUANA_Transacciones en Airtable.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Gamificación — GuanaPoints',
    dependeDe: ['task-c01'],
    estimacionHoras: 14,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-p07',
    titulo: 'UX Writing en Kriol — micro-copy de la app',
    descripcion: 'Implementar frases culturales en puntos clave: onboarding ("Wan big welkom!"), success ("Evriting gaan rait!"), loading ("Wiet a likl..."), puntos ganados ("Yu get som Guana Points!"). Opcional en ES/EN.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'diseno',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Identidad Cultural Raizal',
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },

  // ════════════════════════════════════════
  // 🟢 LARGO PLAZO — Q4 2026
  // ════════════════════════════════════════

  {
    id: 'task-l01',
    titulo: 'Suscripción Premium para turistas',
    descripcion: 'Plan de pago recurrente: sin ads + IA ilimitada + descuentos exclusivos aliados. Integrar con Wompi suscripciones o Stripe Billing. Campo Premium en tabla Leads.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'negocio',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Monetización — Suscripción',
    dependeDe: ['task-c01'],
    estimacionHoras: 20,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-l02',
    titulo: 'Pauta de aliados destacados en mapa',
    descripcion: 'Restaurantes y hoteles pagan mensualidad por aparecer destacados (pin especial, posición top) en el mapa y recomendador. Panel de gestión en AdminBackend. CRM básico de aliados pagantes.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'negocio',
    archivoReferencia: 'guanago_mapa60dias.html',
    seccionReferencia: 'Monetización — Pauta aliados',
    estimacionHoras: 16,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-l03',
    titulo: 'Firebase Hosting deploy (reemplazar Render frontend)',
    descripcion: 'Migrar el frontend de Render a Firebase Hosting para mejor performance, CDN global y reducción de costos. Mantener Render solo para el backend Express.',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'infraestructura',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Pendientes — Media prioridad',
    estimacionHoras: 6,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },
  {
    id: 'task-l04',
    titulo: 'Caja Registradora Digital para aliados',
    descripcion: 'Turista paga con GuanaPoints o muestra NFT de socio en comercios aliados. Panel simplificado para el aliado: escanea QR → valida → confirma transacción. Actualiza GUANA_Transacciones.',
    status: 'pendiente',
    prioridad: 'baja',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'Usuarios — Backends por Tipo de Socio',
    dependeDe: ['task-p06'],
    estimacionHoras: 16,
    creadoPor: 'admin',
    createdAt: '2026-04-30',
    updatedAt: '2026-04-30'
  },

  // ════════════════════════════════════════
  // ✅ COMPLETADO — En producción (Abril 2026)
  // ════════════════════════════════════════

  {
    id: 'task-done-01',
    titulo: 'Chatbot Groq AI (llama-3.3-70b)',
    descripcion: 'Chatbot con contexto del catálogo en tiempo real usando Groq llama-3.3-70b.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 16,
    horasReales: 20,
    creadoPor: 'admin',
    createdAt: '2026-01-01',
    updatedAt: '2026-03-01',
    completedAt: '2026-03-01'
  },
  {
    id: 'task-done-02',
    titulo: 'Mapa Directorio Mapbox (40+ puntos)',
    descripcion: 'Mapa interactivo con 40+ POIs de Directorio_Mapa. Categorías, info, fotos.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 12,
    horasReales: 14,
    creadoPor: 'admin',
    createdAt: '2026-01-01',
    updatedAt: '2026-02-15',
    completedAt: '2026-02-15'
  },
  {
    id: 'task-done-03',
    titulo: 'Zonas Taxi SVG interactivo (5 zonas)',
    descripcion: 'Mapa SVG con zonas tarifarias del aeropuerto, selección interactiva y precios.',
    status: 'terminado',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 8,
    horasReales: 10,
    creadoPor: 'admin',
    createdAt: '2026-01-15',
    updatedAt: '2026-02-20',
    completedAt: '2026-02-20'
  },
  {
    id: 'task-done-04',
    titulo: 'Caribbean Night — 3 paquetes + reservas + analytics',
    descripcion: 'Sistema completo para Caribbean Night: 3 paquetes, flujo de reserva, panel de analytics con métricas de evento.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 20,
    horasReales: 22,
    creadoPor: 'admin',
    createdAt: '2026-02-01',
    updatedAt: '2026-03-15',
    completedAt: '2026-03-15'
  },
  {
    id: 'task-done-05',
    titulo: 'Centro de Reservas Unificado (B2C + Vouchers)',
    descripcion: 'Tab 1: reservas directas B2C/B2B. Tab 2: Vouchers/Civitatis CRUD completo con diseño tarjeta naranja/teal, búsqueda, sort, stats y modal.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción — Abril 2026',
    estimacionHoras: 24,
    horasReales: 28,
    creadoPor: 'admin',
    createdAt: '2026-03-01',
    updatedAt: '2026-04-20',
    completedAt: '2026-04-20'
  },
  {
    id: 'task-done-06',
    titulo: 'Cotizaciones GuíaSAI — PDF con foto-grid + lightbox',
    descripcion: 'Generador de cotizaciones B2B en PDF con galería de 4 imágenes, lightbox, branding GuíaSAI. Ya en producción y en uso por agencias.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción — Abril 2026',
    estimacionHoras: 20,
    horasReales: 18,
    creadoPor: 'admin',
    createdAt: '2026-03-15',
    updatedAt: '2026-04-15',
    completedAt: '2026-04-15'
  },
  {
    id: 'task-done-07',
    titulo: 'Panel de Datos AdminBackend (Alojamientos, Taxis, Tiquetes)',
    descripcion: 'Panel admin con datos de AlojamientosTuristicos_SAI, tabla de Taxis con zonas, gestión de Tiquetes aéreos.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción — Abril 2026',
    estimacionHoras: 16,
    horasReales: 18,
    creadoPor: 'admin',
    createdAt: '2026-03-20',
    updatedAt: '2026-04-25',
    completedAt: '2026-04-25'
  },
  {
    id: 'task-done-08',
    titulo: 'Firebase Auth (Google + email)',
    descripcion: 'Autenticación con Firebase: login Google, email/password, AuthContext global, roles sincronizados.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 12,
    horasReales: 14,
    creadoPor: 'admin',
    createdAt: '2026-01-20',
    updatedAt: '2026-02-28',
    completedAt: '2026-02-28'
  },
  {
    id: 'task-done-09',
    titulo: 'Guana Wallet — sistema de puntos',
    descripcion: 'Sistema de GuanaPoints: acumulación, historial en GUANA_Transacciones, visualización en perfil.',
    status: 'terminado',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 14,
    horasReales: 12,
    creadoPor: 'admin',
    createdAt: '2026-02-10',
    updatedAt: '2026-03-20',
    completedAt: '2026-03-20'
  },
  {
    id: 'task-done-10',
    titulo: 'Admin Panel 18+ vistas completo',
    descripcion: 'Panel de administración con 18+ vistas: Dashboard, Artistas, Reservas, Vouchers, Cotizaciones, Mapa, Backend Data, Tasks, etc.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 60,
    horasReales: 72,
    creadoPor: 'admin',
    createdAt: '2026-01-01',
    updatedAt: '2026-04-28',
    completedAt: '2026-04-28'
  },
  {
    id: 'task-done-11',
    titulo: 'Cotizador Grupal con margen 20%',
    descripcion: 'Cotizador para grupos con cálculo automático de margen del 20%, PDF de propuesta y registro en Airtable.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 16,
    horasReales: 14,
    creadoPor: 'admin',
    createdAt: '2026-02-15',
    updatedAt: '2026-03-25',
    completedAt: '2026-03-25'
  },
  {
    id: 'task-done-12',
    titulo: 'Tours desde Airtable vía Make.com',
    descripcion: 'Catálogo de tours sincronizado desde ServiciosTuristicos_SAI via Make.com. Actualización automática sin deploy.',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'CLAUDE.md',
    seccionReferencia: 'En producción',
    estimacionHoras: 8,
    horasReales: 6,
    creadoPor: 'admin',
    createdAt: '2026-01-15',
    updatedAt: '2026-02-10',
    completedAt: '2026-02-10'
  }
];

const AdminTasks: React.FC<AdminTasksProps> = ({ onBack, onNavigate }) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'todos'>('todos');
  const [filterCategoria, setFilterCategoria] = useState<TaskCategory | 'todas'>('todas');
  const [filterArchivo, setFilterArchivo] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Cargar tareas desde Airtable al montar el componente
  const loadTasks = useCallback(async () => {
    setIsSyncing(true);
    try {
      const airtableTasks = await getTareas();
      if (airtableTasks.length > 0) {
        setTasks(airtableTasks);
        setIsOnline(true);
        setLastSync(new Date());
        console.log(`✅ Sincronizadas ${airtableTasks.length} tareas desde Airtable`);
      } else {
        // Si Airtable está vacío, usar tareas locales como fallback
        setTasks(INITIAL_TASKS);
        console.log('📋 Usando tareas locales (Airtable vacío)');
      }
    } catch (error) {
      console.error('❌ Error cargando tareas:', error);
      setIsOnline(false);
      setTasks(INITIAL_TASKS);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Archivos de referencia únicos
  const archivosReferencia = useMemo(() => {
    const archivos = new Set(tasks.map(t => t.archivoReferencia).filter(Boolean));
    return ['todos', ...Array.from(archivos)] as string[];
  }, [tasks]);

  // Calcular estadísticas
  const stats: TaskStats = useMemo(() => {
    const porCategoria = {} as Record<TaskCategory, number>;
    Object.keys(TASK_CATEGORY_CONFIG).forEach(cat => {
      porCategoria[cat as TaskCategory] = tasks.filter(t => t.categoria === cat).length;
    });

    return {
      total: tasks.length,
      pendientes: tasks.filter(t => t.status === 'pendiente').length,
      enProgreso: tasks.filter(t => t.status === 'en_progreso').length,
      urgentesPendientes: tasks.filter(t => t.status === 'urgente_pendiente').length,
      terminadas: tasks.filter(t => t.status === 'terminado').length,
      bloqueadas: tasks.filter(t => t.status === 'bloqueado').length,
      porCategoria
    };
  }, [tasks]);

  // Filtrar tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'todos' || task.status === filterStatus;
      const matchCategoria = filterCategoria === 'todas' || task.categoria === filterCategoria;
      const matchArchivo = filterArchivo === 'todos' || task.archivoReferencia === filterArchivo;
      return matchSearch && matchStatus && matchCategoria && matchArchivo;
    });
  }, [tasks, searchTerm, filterStatus, filterCategoria, filterArchivo]);

  // Ordenar: urgentes primero, luego por prioridad
  const sortedTasks = useMemo(() => {
    const priorityOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
    const statusOrder = { urgente_pendiente: 0, en_progreso: 1, pendiente: 2, bloqueado: 3, terminado: 4 };
    
    return [...filteredTasks].sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return priorityOrder[a.prioridad] - priorityOrder[b.prioridad];
    });
  }, [filteredTasks]);

  // Cambiar estado de tarea (con sincronización a Airtable)
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const updatedAt = new Date().toISOString().split('T')[0];
    const completedAt = newStatus === 'terminado' ? updatedAt : undefined;
    
    // Actualizar localmente primero (optimistic update)
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
          updatedAt,
          completedAt
        };
      }
      return task;
    }));

    // Sincronizar con Airtable
    try {
      await updateTarea(taskId, { 
        status: newStatus, 
        updatedAt,
        completedAt 
      });
      console.log(`✅ Tarea ${taskId} actualizada en Airtable`);
    } catch (error) {
      console.error('❌ Error sincronizando tarea:', error);
      // No revertimos el cambio local para mejor UX
    }
  };

  // Análisis local inteligente de tareas
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const urgentes = tasks.filter(t => t.status === 'urgente_pendiente' || t.prioridad === 'critica');
    const bloqueadas = tasks.filter(t => t.status === 'bloqueado' && !t.notasIA?.includes('EN ESPERA'));
    const enProgreso = tasks.filter(t => t.status === 'en_progreso');
    const sinDependencias = tasks.filter(t => 
      t.status === 'pendiente' && 
      (!t.dependeDe || t.dependeDe.length === 0 || 
       t.dependeDe.every(depId => tasks.find(dt => dt.id === depId)?.status === 'terminado'))
    );
    
    // Calcular horas totales
    const horasEstimadas = tasks.filter(t => t.status !== 'terminado').reduce((sum, t) => sum + (t.estimacionHoras || 0), 0);
    const horasCompletadas = tasks.filter(t => t.status === 'terminado').reduce((sum, t) => sum + (t.horasReales || t.estimacionHoras || 0), 0);
    
    // Agrupar por archivo
    const porArchivo: Record<string, { total: number, completadas: number }> = {};
    tasks.forEach(t => {
      if (t.archivoReferencia) {
        if (!porArchivo[t.archivoReferencia]) porArchivo[t.archivoReferencia] = { total: 0, completadas: 0 };
        porArchivo[t.archivoReferencia].total++;
        if (t.status === 'terminado') porArchivo[t.archivoReferencia].completadas++;
      }
    });
    
    const analysis = `## 📊 Análisis del Proyecto GuanaGO
**Fecha:** ${new Date().toLocaleDateString('es-CO')}

### 📈 Resumen General
- **Total:** ${stats.total} tareas
- **Completadas:** ${stats.terminadas} (${Math.round(stats.terminadas/stats.total*100)}%)
- **En progreso:** ${stats.enProgreso}
- **Pendientes:** ${stats.pendientes}
- **Horas estimadas restantes:** ~${horasEstimadas}h
- **Horas completadas:** ~${horasCompletadas}h

### 🚨 Requieren Atención
${urgentes.length > 0 ? urgentes.map(t => `- 🔥 **${t.titulo}** (${t.categoria})`).join('\n') : '✅ No hay tareas urgentes'}

${bloqueadas.length > 0 ? `\n### ⏸️ Bloqueadas\n${bloqueadas.map(t => `- ${t.titulo}`).join('\n')}` : ''}

### ✅ Listas para Empezar (sin dependencias)
${sinDependencias.slice(0, 5).map(t => `- ${TASK_CATEGORY_CONFIG[t.categoria].icon} **${t.titulo}** (~${t.estimacionHoras || '?'}h)`).join('\n')}

### 🔄 En Progreso Ahora
${enProgreso.length > 0 ? enProgreso.map(t => `- ${t.titulo} (${t.horasReales || 0}/${t.estimacionHoras || '?'}h)`).join('\n') : '- Ninguna tarea en progreso'}

### 📁 Progreso por Documento
${Object.entries(porArchivo).map(([archivo, data]) => {
  const pct = Math.round(data.completadas/data.total*100);
  const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10));
  return `- **${archivo}:** ${bar} ${pct}% (${data.completadas}/${data.total})`;
}).join('\n')}

### 💡 Recomendación
${sinDependencias[0] ? `Enfocarse en: **"${sinDependencias[0].titulo}"** - es la tarea pendiente con más impacto que no tiene bloqueos.` : 'Revisar tareas bloqueadas para desbloquear el flujo.'}
    `;
    
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // Guardar datos para futuro uso con Make.com (copiado al clipboard)
  const exportForMake = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      proyecto: 'GuanaGO',
      stats,
      tareasPorEstado: {
        pendientes: tasks.filter(t => t.status === 'pendiente').map(t => t.titulo),
        enProgreso: tasks.filter(t => t.status === 'en_progreso').map(t => t.titulo),
        urgentes: tasks.filter(t => t.status === 'urgente_pendiente').map(t => t.titulo),
        terminadas: tasks.filter(t => t.status === 'terminado').map(t => t.titulo),
        bloqueadas: tasks.filter(t => t.status === 'bloqueado').map(t => t.titulo)
      },
      tareasPorArchivo: tasks.reduce((acc, t) => {
        if (t.archivoReferencia) {
          if (!acc[t.archivoReferencia]) acc[t.archivoReferencia] = [];
          acc[t.archivoReferencia].push({ titulo: t.titulo, status: t.status });
        }
        return acc;
      }, {} as Record<string, any[]>),
      tareasCompletas: tasks
    };
    
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('📋 Datos copiados al clipboard.\n\nGuárdalos para cuando configures el escenario de Make.com');
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch(status) {
      case 'terminado': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'en_progreso': return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
      case 'urgente_pendiente': return <AlertCircle size={16} className="text-red-400" />;
      case 'bloqueado': return <Pause size={16} className="text-gray-400" />;
      default: return <Circle size={16} className="text-yellow-400" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400 mb-4" />
        <p className="text-gray-400">Cargando tareas desde Airtable...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-4 pt-10 pb-4 bg-gradient-to-b from-gray-800 to-gray-900 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-700 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">📋 Panel de Tareas</h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-xs">Roadmap & To-Do del Proyecto</p>
              {isOnline ? (
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <Cloud size={12} /> Sincronizado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <CloudOff size={12} /> Offline
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={loadTasks}
            disabled={isSyncing}
            className={`p-2 rounded-lg flex items-center gap-1 ${isSyncing ? 'bg-gray-700' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            title="Sincronizar con Airtable"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-1"
          >
            <Bot size={18} />
            <span className="text-xs font-bold hidden sm:inline">IA</span>
          </button>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Sync Status */}
        {lastSync && (
          <p className="text-[10px] text-gray-500 mb-2">
            Última sincronización: {lastSync.toLocaleTimeString()}
          </p>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700">
            <span className="text-lg font-bold text-yellow-400">{stats.pendientes}</span>
            <p className="text-[10px] text-gray-400">Pendientes</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700">
            <span className="text-lg font-bold text-blue-400">{stats.enProgreso}</span>
            <p className="text-[10px] text-gray-400">En Progreso</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center border border-red-900/50 border-gray-700">
            <span className="text-lg font-bold text-red-400">{stats.urgentesPendientes}</span>
            <p className="text-[10px] text-gray-400">Urgentes</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700">
            <span className="text-lg font-bold text-green-400">{stats.terminadas}</span>
            <p className="text-[10px] text-gray-400">Terminadas</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700">
            <span className="text-lg font-bold text-gray-400">{stats.bloqueadas}</span>
            <p className="text-[10px] text-gray-400">Bloqueadas</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border ${showFilters ? 'bg-cyan-600 border-cyan-500' : 'bg-gray-800 border-gray-700'}`}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Estado</label>
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => setFilterStatus('todos')}
                  className={`px-2 py-1 rounded text-xs ${filterStatus === 'todos' ? 'bg-cyan-600' : 'bg-gray-700'}`}
                >
                  Todos
                </button>
                {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                  <button 
                    key={key}
                    onClick={() => setFilterStatus(key as TaskStatus)}
                    className={`px-2 py-1 rounded text-xs ${filterStatus === key ? config.bgColor + ' ' + config.color : 'bg-gray-700'}`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Categoría</label>
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => setFilterCategoria('todas')}
                  className={`px-2 py-1 rounded text-xs ${filterCategoria === 'todas' ? 'bg-cyan-600' : 'bg-gray-700'}`}
                >
                  Todas
                </button>
                {Object.entries(TASK_CATEGORY_CONFIG).map(([key, config]) => (
                  <button 
                    key={key}
                    onClick={() => setFilterCategoria(key as TaskCategory)}
                    className={`px-2 py-1 rounded text-xs ${filterCategoria === key ? 'bg-gray-600 ' + config.color : 'bg-gray-700'}`}
                  >
                    {config.icon} {config.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Archivo .md</label>
              <select 
                value={filterArchivo}
                onChange={(e) => setFilterArchivo(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                {archivosReferencia.map(archivo => (
                  <option key={archivo} value={archivo}>
                    {archivo === 'todos' ? '📁 Todos los archivos' : `📄 ${archivo}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* AI Analysis Panel */}
      {showAIPanel && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} />
              <h3 className="font-bold text-sm">Análisis del Proyecto</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportForMake}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1"
                title="Guardar para Make.com (pendiente)"
              >
                <Send size={12} />
                Exportar JSON
              </button>
              <button
                onClick={runAIAnalysis}
                disabled={isAnalyzing}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs flex items-center gap-1 disabled:opacity-50"
              >
                {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Bot size={12} />}
                {isAnalyzing ? 'Analizando...' : 'Analizar'}
              </button>
            </div>
          </div>
          
          {aiAnalysis ? (
            <div className="bg-gray-900/50 rounded-lg p-3 text-xs prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{aiAnalysis}</div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Haz clic en <strong>"Analizar"</strong> para ver un resumen del estado del proyecto con recomendaciones.
              <br /><br />
              <span className="text-gray-500">💡 La integración con Make.com + IA está pendiente. Por ahora usa "Exportar JSON" para guardar los datos.</span>
            </p>
          )}
        </div>
      )}

      {/* Tasks List */}
      <div className="px-4 space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>No se encontraron tareas</p>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div 
              key={task.id}
              className={`bg-gray-800 rounded-xl border ${
                task.status === 'urgente_pendiente' ? 'border-red-600 shadow-red-900/20 shadow-lg' :
                task.status === 'en_progreso' ? 'border-blue-600' :
                task.status === 'terminado' ? 'border-green-900/50' :
                'border-gray-700'
              } overflow-hidden`}
            >
              {/* Task Header */}
              <div 
                className="p-3 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                <div className="mt-1">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium text-sm ${task.status === 'terminado' ? 'line-through text-gray-500' : ''}`}>
                      {task.titulo}
                    </h4>
                    <span className={`text-xs ${TASK_PRIORITY_CONFIG[task.prioridad].color}`}>
                      {TASK_PRIORITY_CONFIG[task.prioridad].icon}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${TASK_CATEGORY_CONFIG[task.categoria].color} bg-gray-700`}>
                      {TASK_CATEGORY_CONFIG[task.categoria].icon} {TASK_CATEGORY_CONFIG[task.categoria].label}
                    </span>
                    {task.archivoReferencia && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <FileText size={10} />
                        {task.archivoReferencia}
                      </span>
                    )}
                    {task.estimacionHoras && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {task.horasReales ? `${task.horasReales}/${task.estimacionHoras}h` : `${task.estimacionHoras}h`}
                      </span>
                    )}
                  </div>
                </div>
                {expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {/* Expanded Details */}
              {expandedTask === task.id && (
                <div className="px-3 pb-3 border-t border-gray-700 pt-3 space-y-3">
                  <p className="text-xs text-gray-400">{task.descripcion}</p>
                  
                  {task.seccionReferencia && (
                    <div className="flex items-center gap-2 text-xs">
                      <Link2 size={12} className="text-cyan-400" />
                      <span className="text-gray-400">Sección:</span>
                      <span className="text-cyan-400">{task.seccionReferencia}</span>
                    </div>
                  )}
                  
                  {task.dependeDe && task.dependeDe.length > 0 && (
                    <div className="text-xs">
                      <span className="text-gray-400">Depende de:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.dependeDe.map(depId => {
                          const depTask = tasks.find(t => t.id === depId);
                          return (
                            <span 
                              key={depId} 
                              className={`px-2 py-0.5 rounded ${
                                depTask?.status === 'terminado' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                              }`}
                            >
                              {depTask?.titulo || depId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => updateTaskStatus(task.id, key as TaskStatus)}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          task.status === key 
                            ? `${config.bgColor} ${config.color} ring-1 ring-current` 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress Bar by Archive */}
      <div className="mx-4 mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
        <h3 className="font-bold text-sm mb-3">📁 Progreso por Archivo</h3>
        {archivosReferencia.filter(a => a !== 'todos').map(archivo => {
          const archivoTasks = tasks.filter(t => t.archivoReferencia === archivo);
          const completadas = archivoTasks.filter(t => t.status === 'terminado').length;
          const porcentaje = archivoTasks.length > 0 ? Math.round(completadas / archivoTasks.length * 100) : 0;
          
          return (
            <div key={archivo} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{archivo}</span>
                <span className="text-gray-500">{completadas}/{archivoTasks.length} ({porcentaje}%)</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Webhook Info - Pendiente */}
      <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <Bot size={16} className="text-gray-500" />
          🔜 Próximamente: Make.com + IA
        </h3>
        <p className="text-xs text-gray-500">
          La integración con Make.com para análisis automático con IA está en la lista de tareas pendientes.
          Por ahora puedes usar el botón "Exportar JSON" para guardar el estado del proyecto.
        </p>
        <div className="mt-2 px-2 py-1 bg-yellow-900/20 border border-yellow-800/30 rounded text-[10px] text-yellow-500">
          ⏸️ Tarea bloqueada: "Escenario Make.com para IA/Tasks"
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal 
          onClose={() => setShowNewTaskModal(false)}
          onSave={(newTask) => {
            setTasks(prev => [...prev, { ...newTask, id: `task-${Date.now()}` }]);
            setShowNewTaskModal(false);
          }}
          archivosReferencia={archivosReferencia.filter(a => a !== 'todos')}
        />
      )}
    </div>
  );
};

// Modal para crear nueva tarea
interface NewTaskModalProps {
  onClose: () => void;
  onSave: (task: Omit<ProjectTask, 'id'>) => void;
  archivosReferencia: string[];
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ onClose, onSave, archivosReferencia }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<TaskPriority>('media');
  const [categoria, setCategoria] = useState<TaskCategory>('frontend');
  const [archivoRef, setArchivoRef] = useState('');
  const [seccionRef, setSeccionRef] = useState('');
  const [estimacion, setEstimacion] = useState('');

  const handleSave = () => {
    if (!titulo.trim()) return;
    
    onSave({
      titulo,
      descripcion,
      status: 'pendiente',
      prioridad,
      categoria,
      archivoReferencia: archivoRef || undefined,
      seccionReferencia: seccionRef || undefined,
      estimacionHoras: estimacion ? parseInt(estimacion) : undefined,
      creadoPor: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-bold">➕ Nueva Tarea</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre de la tarea..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe la tarea..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as TaskPriority)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as TaskCategory)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(TASK_CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Archivo de referencia</label>
            <select
              value={archivoRef}
              onChange={(e) => setArchivoRef(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Sin archivo</option>
              {archivosReferencia.map(archivo => (
                <option key={archivo} value={archivo}>{archivo}</option>
              ))}
              <option value="nuevo">+ Agregar nuevo...</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Sección de referencia</label>
            <input
              type="text"
              value={seccionRef}
              onChange={(e) => setSeccionRef(e.target.value)}
              placeholder="Ej: Fase 2: Contenido"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Estimación (horas)</label>
            <input
              type="number"
              value={estimacion}
              onChange={(e) => setEstimacion(e.target.value)}
              placeholder="8"
              min="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!titulo.trim()}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear Tarea
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTasks;
