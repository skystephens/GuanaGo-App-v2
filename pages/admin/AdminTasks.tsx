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

// Tareas iniciales extraídas de los archivos .md del proyecto
const INITIAL_TASKS: ProjectTask[] = [
  // === RIMM_NFT_STRATEGY.md - Fase 2: Contenido ===
  {
    id: 'task-001',
    titulo: 'Crear tablas en Airtable manualmente',
    descripcion: 'Crear las tablas Artistas_Portafolio, Productos_Artista y Ventas_Artista en Airtable según la estructura definida en RIMM_NFT_STRATEGY.md',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 2: Contenido',
    estimacionHoras: 2,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-002',
    titulo: 'Agregar primeros 3-5 artistas de prueba',
    descripcion: 'Onboarding de artistas piloto del RIMM Cluster para validar el flujo completo',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'negocio',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 2: Contenido',
    dependeDe: ['task-001'],
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-003',
    titulo: 'Subir contenido demo a IPFS',
    descripcion: 'Subir canciones y arte de artistas piloto a IPFS usando Pinata para pruebas',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'blockchain',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 2: Contenido',
    dependeDe: ['task-002'],
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-004',
    titulo: 'Diseñar landing pages de artistas',
    descripcion: 'Crear diseño atractivo para perfiles públicos de artistas con NFTs y experiencias',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'diseno',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 2: Contenido',
    estimacionHoras: 6,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  // === RIMM_NFT_STRATEGY.md - Fase 3: Blockchain ===
  {
    id: 'task-005',
    titulo: 'Configurar cuenta Hedera Testnet',
    descripcion: 'Crear cuenta de desarrollo en Hedera Testnet para pruebas de NFT',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'blockchain',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 3: Blockchain',
    estimacionHoras: 2,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-006',
    titulo: 'Integrar Hedera SDK',
    descripcion: 'Implementar SDK de Hedera en el backend para minteo de NFTs',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'blockchain',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 3: Blockchain',
    dependeDe: ['task-005'],
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-007',
    titulo: 'Crear primer NFT de prueba',
    descripcion: 'Mintear NFT de prueba con metadata de artista piloto',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'blockchain',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 3: Blockchain',
    dependeDe: ['task-006', 'task-003'],
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-008',
    titulo: 'Implementar compra con wallet',
    descripcion: 'Flujo de compra de NFT conectando wallet del usuario',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 3: Blockchain',
    dependeDe: ['task-007'],
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  // === RIMM_NFT_STRATEGY.md - Fase 4: Monetización ===
  {
    id: 'task-009',
    titulo: 'Integrar pasarela de pagos (Wompi/ePayco)',
    descripcion: 'Configurar pasarela de pagos para compras con tarjeta/PSE',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'integracion',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 4: Monetización',
    estimacionHoras: 16,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-010',
    titulo: 'Activar compras con GUANA Points',
    descripcion: 'Permitir canjear GUANA Points por NFTs y experiencias',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'backend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 4: Monetización',
    dependeDe: ['task-009'],
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-011',
    titulo: 'Dashboard analytics para artistas',
    descripcion: 'Panel de estadísticas de ventas y métricas para artistas',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 4: Monetización',
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-012',
    titulo: 'Sistema de royalties automáticos',
    descripcion: 'Smart contract para distribución automática 70/15/15',
    status: 'pendiente',
    prioridad: 'baja',
    categoria: 'blockchain',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 4: Monetización',
    dependeDe: ['task-006', 'task-009'],
    estimacionHoras: 20,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  // === ARCHITECTURE_MAP.md - Sistema de Caché ===
  {
    id: 'task-013',
    titulo: 'Optimizar caché para modo offline',
    descripcion: 'Mejorar el sistema de caché local para mejor experiencia offline',
    status: 'en_progreso',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'ARCHITECTURE_MAP.md',
    seccionReferencia: 'Sistema de Caché Local',
    estimacionHoras: 6,
    horasReales: 2,
    creadoPor: 'admin',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-14'
  },
  // === ARQUITECTURA.md - Integraciones ===
  {
    id: 'task-014',
    titulo: 'Documentar API endpoints',
    descripcion: 'Crear documentación completa de todos los endpoints del backend',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'documentacion',
    archivoReferencia: 'ARQUITECTURA.md',
    seccionReferencia: 'Integraciones Principales',
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-015',
    titulo: 'Tests de integración Airtable',
    descripcion: 'Crear suite de tests para validar conexión y operaciones con Airtable',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'testing',
    archivoReferencia: 'ARQUITECTURA.md',
    seccionReferencia: 'Airtable',
    estimacionHoras: 6,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  // === Pagos.md - Sistema de Pagos ===
  {
    id: 'task-019',
    titulo: 'Evaluar pasarelas de pago (PayU, Stripe, Binance)',
    descripcion: 'Comparar opciones: PayU Latam (cuenta existente), Stripe (turistas internacionales), Binance Pay (crypto). Decidir estrategia híbrida.',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'negocio',
    archivoReferencia: 'Pagos.md',
    seccionReferencia: 'Gateway de Pagos',
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-020',
    titulo: 'Crear PaymentProvider component',
    descripcion: 'Componente React que permita al usuario elegir método de pago preferido (tarjeta, PSE, crypto)',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'Pagos.md',
    seccionReferencia: 'Gateway de Pagos',
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-021',
    titulo: 'Implementar flujo Carrito → Checkout seguro',
    descripcion: 'Modelo de Redirect/Hosted Checkout: Pre-orden en Airtable, sesión de pago, redirect a pasarela, webhook de confirmación',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'Pagos.md',
    seccionReferencia: 'Flujo del Carrito',
    dependeDe: ['task-019', 'task-020'],
    estimacionHoras: 16,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-022',
    titulo: 'Endpoint webhook /api/payments/webhook',
    descripcion: 'Crear ruta para recibir notificaciones de pasarelas de pago y actualizar estado en Airtable',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'Pagos.md',
    seccionReferencia: 'Flujo del Carrito',
    estimacionHoras: 6,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-023',
    titulo: 'Integrar software contable (Alegra/Siigo)',
    descripcion: 'Conectar con Make.com para facturación electrónica automática cuando Status=Pagado',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'integracion',
    archivoReferencia: 'Pagos.md',
    seccionReferencia: 'Trazabilidad Contable',
    dependeDe: ['task-021'],
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-024',
    titulo: 'Notarizar facturas en Hedera',
    descripcion: 'Enviar número de factura a Hedera como mensaje de consenso para trazabilidad inmutable',
    status: 'pendiente',
    prioridad: 'baja',
    categoria: 'blockchain',
    archivoReferencia: 'Pagos.md',
    seccionReferencia: 'Conexión con Hedera',
    dependeDe: ['task-023', 'task-006'],
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  // === Kriol Creole.md - Identidad Cultural ===
  {
    id: 'task-025',
    titulo: 'UX Writing en Kriol',
    descripcion: 'Implementar micro-copy en Kriol: "Wan big welkom!", "Evriting gaan rait!", "Wiet a likl...", "Yu get som Guana Points!"',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'diseno',
    archivoReferencia: 'Kriol Creole.md',
    seccionReferencia: 'UX Writing',
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-026',
    titulo: 'Gamificación: Kriol Word of the Day',
    descripcion: 'Sistema de reto diario: turista aprende frase en Kriol, valida con quiz/audio, gana 5 $GUANA extra',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'Kriol Creole.md',
    seccionReferencia: 'Gamificación',
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-027',
    titulo: 'Audio-guías en Kriol para NFTs',
    descripcion: 'Incluir intro en Kriol contada por el artista en cada NFT musical sobre historia de la canción',
    status: 'pendiente',
    prioridad: 'baja',
    categoria: 'frontend',
    archivoReferencia: 'Kriol Creole.md',
    seccionReferencia: 'Audio-Guías Inmersivas',
    dependeDe: ['task-003'],
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-028',
    titulo: 'Glosario Kriol para IA/Chatbot',
    descripcion: 'Entrenar prompt del chatbot con glosario de Kriol para responder consultas culturales',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'integracion',
    archivoReferencia: 'Kriol Creole.md',
    seccionReferencia: 'IA con Contexto Raizal',
    estimacionHoras: 6,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  // === Usuarios de la app - Sistema Multi-Perfiles ===
  {
    id: 'task-029',
    titulo: 'Evolucionar tabla Usuarios en Airtable',
    descripcion: 'Agregar campos: Role (Turista/Operador/Aliado/Socio/SuperAdmin), Establishment_Type, Business_ID vinculado a tabla Empresas',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Estructura de Datos',
    estimacionHoras: 4,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-030',
    titulo: 'Crear tabla Empresas en Airtable',
    descripcion: 'Nueva tabla con: RNT, Cámara de Comercio, Saldo de Puntos empresa, tipo de establecimiento',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Estructura de Datos',
    estimacionHoras: 3,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-031',
    titulo: 'DashboardContainer dinámico por rol',
    descripcion: 'Componente que renderice vista según userRole: MarketplaceView (Turista), InventoryManagement (Operador), RewardValidation (Aliado), GlobalAnalytics (SuperAdmin)',
    status: 'en_progreso',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Frontend Dinámico',
    estimacionHoras: 16,
    horasReales: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-032',
    titulo: 'Panel SuperAdmin: Métricas críticas',
    descripcion: 'Implementar: Liquidez ($GUANA circulando), Adopción (aliados activos vs informales), Transparencia (acceso a Topic IDs Hedera)',
    status: 'pendiente',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Panel Super Admin',
    estimacionHoras: 12,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-033',
    titulo: 'Backend Operador: Calendario disponibilidad',
    descripcion: 'Sistema de disponibilidad en tiempo real para operadores turísticos sincronizado con Make',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'backend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Backends por Tipo de Socio',
    estimacionHoras: 10,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-034',
    titulo: 'Caja Registradora Digital para Aliados',
    descripcion: 'Sistema donde turista paga con puntos o muestra NFT de socio en comercios aliados',
    status: 'pendiente',
    prioridad: 'media',
    categoria: 'frontend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Backends por Tipo de Socio',
    estimacionHoras: 14,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-035',
    titulo: 'Reporte ROI para Socios/Inversionistas',
    descripcion: 'Dashboard de retorno de inversión sobre eventos financiados (Caribbean Nights)',
    status: 'pendiente',
    prioridad: 'baja',
    categoria: 'frontend',
    archivoReferencia: 'Usuarios de la app',
    seccionReferencia: 'Backends por Tipo de Socio',
    estimacionHoras: 10,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14'
  },
  {
    id: 'task-036',
    titulo: 'Escenario Make.com para IA/Tasks',
    descripcion: '⏸️ EN ESPERA - Configurar webhook en Make para análisis automático de tareas con IA',
    status: 'bloqueado',
    prioridad: 'baja',
    categoria: 'integracion',
    archivoReferencia: 'ARQUITECTURA.md',
    seccionReferencia: 'Automatización',
    estimacionHoras: 8,
    creadoPor: 'admin',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14',
    notasIA: 'Pendiente para fase posterior. Priorizar funcionalidad local primero.'
  },
  // === Tareas completadas (ejemplo) ===
  {
    id: 'task-016',
    titulo: 'Estructura de datos Airtable (base)',
    descripcion: 'Definir estructura de tablas principales en Airtable',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'backend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 1: Fundamentos',
    estimacionHoras: 4,
    horasReales: 3,
    creadoPor: 'admin',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-10',
    completedAt: '2026-01-10'
  },
  {
    id: 'task-017',
    titulo: 'Interfaces TypeScript artistas',
    descripcion: 'Crear tipos e interfaces para sistema de artistas y NFTs',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 1: Fundamentos',
    estimacionHoras: 2,
    horasReales: 2,
    creadoPor: 'admin',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-08',
    completedAt: '2026-01-08'
  },
  {
    id: 'task-018',
    titulo: 'Página AdminArtistas con tabs',
    descripcion: 'Panel de administración de artistas con pestañas de gestión',
    status: 'terminado',
    prioridad: 'alta',
    categoria: 'frontend',
    archivoReferencia: 'RIMM_NFT_STRATEGY.md',
    seccionReferencia: 'Fase 1: Fundamentos',
    estimacionHoras: 8,
    horasReales: 10,
    creadoPor: 'admin',
    createdAt: '2026-01-06',
    updatedAt: '2026-01-12',
    completedAt: '2026-01-12'
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
