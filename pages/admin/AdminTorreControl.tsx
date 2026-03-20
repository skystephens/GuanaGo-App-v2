import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TowerControl, CheckSquare, Square, ChevronDown, ChevronRight,
  Shield, CreditCard, FileText, Users, Megaphone, Bell,
  Rocket, Activity, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Clock, Filter, Download, BarChart2,
  ArrowLeft, Plus, Trash2, Edit3, X, Calendar, Save,
  Smartphone, Database, FolderPlus, GripVertical, StickyNote,
  ChevronUp, MoreVertical, Cpu,
  Globe, TrendingUp, Coins, Link2, Target, Layers, Zap, BookOpen
} from 'lucide-react';
import PanelEstadoSistema from './PanelEstadoSistema';
import PanelIAAsistente from './PanelIAAsistente';
import { AppRoute } from '../../types';

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completado' | 'bloqueado';
export type Prioridad   = 'critica' | 'alta' | 'media' | 'baja';

export interface TareaControl {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  diagnosticoUrl?: string;
  estado: EstadoTarea;
  fechaVencimiento?: string; // YYYY-MM-DD
  notas?: string;
  creadaEn: string; // ISO
}

export interface SeccionControl {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;   // nombre del ícono como string
  color: string;
  gradiente: string;
  tareas: TareaControl[];
  creadaEn: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'guanago_torre_v3';

// ─── Seed data (primera carga) ───────────────────────────────────────────────
const SEED_SECCIONES: SeccionControl[] = [
  {
    id: 'aliados', titulo: 'Módulo Aliados (Beta Launch)',
    subtitulo: 'Negocios que suministran productos/servicios sin pago inicial',
    icono: 'Users', color: 'text-emerald-400', gradiente: 'from-emerald-900 to-emerald-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'ali-01', titulo: 'Formulario registro Aliado', descripcion: 'Form: nombre negocio, tipo, contacto, "¿Qué ofrecen a usuarios?"', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ali-02', titulo: 'Tabla Airtable: Aliados_Beta', descripcion: 'Campos: nombre, tipo, oferta, QR_url, activo, fecha_registro', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ali-03', titulo: 'Vista "Beneficios & Cupones" en Home', descripcion: 'Sección en pantalla principal mostrando ofertas de aliados con QR', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ali-04', titulo: 'Generación automática de QR por Aliado', descripcion: 'Usar qrcode npm para generar QR único por negocio aliado', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ali-05', titulo: 'Panel Aliado en PartnerDashboard', descripcion: 'Aliados ven sus estadísticas: cuántos QR escaneados, canjes', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'pwa', titulo: 'PWA & Push Notifications',
    subtitulo: 'App instalable, offline y con notificaciones push',
    icono: 'Smartphone', color: 'text-blue-400', gradiente: 'from-blue-900 to-blue-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'pwa-01', titulo: 'Service Worker activo (cache imágenes)', descripcion: 'Implementar SW que cachea imágenes de Airtable. Meta: 95% mejora en 2ª carga', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'pwa-02', titulo: 'manifest.json completo', descripcion: 'Verificar name, short_name, icons (512x512), display: standalone', prioridad: 'critica', estado: 'pendiente', diagnosticoUrl: '/manifest.json', creadaEn: new Date().toISOString() },
      { id: 'pwa-03', titulo: 'Firebase Cloud Messaging (FCM)', descripcion: 'SDK Firebase ya instalado. Activar FCM para push notifications', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'pwa-04', titulo: 'Push: "Nueva oferta de Aliado"', descripcion: 'Notificar usuarios cuando un Aliado carga una oferta nueva', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'ads', titulo: 'Publicidad & Monetización',
    subtitulo: 'AdSense + pauta local directa de aliados',
    icono: 'Megaphone', color: 'text-yellow-400', gradiente: 'from-yellow-900 to-yellow-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'ads-01', titulo: 'Registrar dominio en Google AdSense', descripcion: 'Crear cuenta AdSense, verificar dominio, esperar aprobación 1-3 días', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ads-02', titulo: 'Componente <AdSlot /> reutilizable', descripcion: 'Wrapper de ins.adsbygoogle con props: slot_id y size', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ads-03', titulo: 'Insertar ads en HomeScreen', descripcion: 'Banner 320x50 entre sección Tours y Hoteles', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ads-04', titulo: 'Módulo "Pauta Local" para Aliados', descripcion: 'Aliados pagan por banner destacado. Paquetes: básico / premium', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'seguridad', titulo: 'Seguridad & Autenticación',
    subtitulo: 'JWT robusto, rate limiting, OAuth',
    icono: 'Shield', color: 'text-red-400', gradiente: 'from-red-900 to-red-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'seg-01', titulo: 'JWT: access token (15min) + refresh (7d)', descripcion: 'Crear jwtService.js con blacklist de tokens revocados', prioridad: 'critica', estado: 'pendiente', diagnosticoUrl: '/api/health', creadaEn: new Date().toISOString() },
      { id: 'seg-02', titulo: 'Rate limiting en endpoints críticos', descripcion: 'Login: 5 intentos/15min | API general: 100 req/15min', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'seg-03', titulo: 'Helmet + CORS configurado en producción', descripcion: 'Headers de seguridad, CSP, X-Frame-Options', prioridad: 'alta', estado: 'pendiente', diagnosticoUrl: '/api/config-check', creadaEn: new Date().toISOString() },
      { id: 'seg-04', titulo: 'Google Sign-In (OAuth)', descripcion: 'Integrar @react-oauth/google para simplificar registro', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'pagos', titulo: 'Pasarela de Pagos',
    subtitulo: 'Wompi/PayU Colombia + Stripe internacional',
    icono: 'CreditCard', color: 'text-purple-400', gradiente: 'from-purple-900 to-purple-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'pag-01', titulo: 'Activar cuenta Wompi (Bancolombia)', descripcion: 'Más rápido que PayU para Colombia. Obtener API key + webhook', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'pag-02', titulo: 'backend/services/paymentService.js', descripcion: 'createWompiSession(), verifySignature(), handleWebhook()', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'pag-03', titulo: 'Componente PaymentCheckout.tsx', descripcion: 'Flujo: carrito → pre-orden Airtable → URL Wompi → confirmación', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'pag-04', titulo: 'Split de comisiones (70/15/15)', descripcion: 'Al webhook de pago exitoso: calcular y registrar split', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'lanzamiento', titulo: 'Lanzamiento Beta',
    subtitulo: 'Checklist pre-lanzamiento y campaña inicial',
    icono: 'Rocket', color: 'text-pink-400', gradiente: 'from-pink-900 to-pink-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'lan-01', titulo: 'Backend estable en Render', descripcion: 'Verificar uptime >99%, alertas de caída', prioridad: 'critica', estado: 'pendiente', diagnosticoUrl: '/api/health', creadaEn: new Date().toISOString() },
      { id: 'lan-02', titulo: '10+ Aliados registrados con oferta activa', descripcion: 'Mínimo para que el home tenga contenido real', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lan-03', titulo: 'Sentry instalado (error tracking)', descripcion: 'npm install @sentry/react. Capturar errores en producción', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lan-04', titulo: 'Google Analytics 4 activo', descripcion: 'Medir DAU, pageviews, funnel de reservas', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lan-05', titulo: 'Beta cerrada: 50-100 usuarios piloto', descripcion: 'Invitar vía WhatsApp (20k). Grupo de feedback + incentivos', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'firebase', titulo: 'Firebase & Infraestructura',
    subtitulo: 'Firestore como DB runtime + sync desde Airtable',
    icono: 'Database', color: 'text-orange-400', gradiente: 'from-orange-900 to-orange-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'fir-01', titulo: 'Activar Firestore en Firebase Console', descripcion: 'Crear base en modo producción. Colecciones: servicios, aliados, eventos, directorio, reservas', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-02', titulo: 'Reglas de seguridad Firestore', descripcion: 'Solo admin puede escribir. Lectura pública para catálogo. Auth requerida para reservas', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-03', titulo: 'Sync Airtable → Firestore (Make.com)', descripcion: 'Webhook: cuando registro se aprueba en Airtable → push a Firestore. Airtable = captura, Firestore = runtime', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-04', titulo: 'Firebase Storage para imágenes', descripcion: 'Subir imágenes de servicios/aliados a Storage. Migrar de URLs Airtable a Firebase Storage URLs', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-05', titulo: 'Firebase Hosting: deploy PWA', descripcion: 'firebase deploy --only hosting. Dominio personalizado guanago.app o similar', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-06', titulo: 'FCM Push Notifications activo', descripcion: 'SDK ya instalado. Activar service worker FCM, solicitar permiso al usuario, enviar desde Admin', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-07', titulo: 'Firebase Analytics + Crashlytics', descripcion: 'Reemplazar/complementar GA4 con Firebase Analytics. Crashlytics para errores nativos', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'fir-08', titulo: 'Agregar localhost a dominios OAuth autorizados', descripcion: 'Firebase Console > Authentication > Settings > Authorized Domains > + localhost + 192.168.x.x', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'ia', titulo: 'IA & Asistente Inteligente',
    subtitulo: 'Capa de IA sobre el catálogo + asistente GuanaGO',
    icono: 'Cpu', color: 'text-violet-400', gradiente: 'from-violet-900 to-violet-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'ia-01', titulo: 'Asistente GuanaGO (Claude API)', descripcion: 'Chat flotante en la app. Responde sobre tours, hoteles, eventos con RAG del catálogo Firestore', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ia-02', titulo: 'RAG: indexar catálogo de servicios', descripcion: 'Exportar servicios/hoteles/eventos de Firestore → embeddings. Usar para respuestas del asistente', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ia-03', titulo: 'Generador de CLAUDE.md desde SOPs', descripcion: 'Ya implementado en AdminProcedimientosRAG. Mantener actualizado con cada sesión de desarrollo', prioridad: 'alta', estado: 'en_progreso', creadaEn: new Date().toISOString() },
      { id: 'ia-04', titulo: 'Recomendador personalizado de tours/hoteles', descripcion: 'Basado en historial del usuario (Firestore) + contexto de la conversación', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ia-05', titulo: 'Auto-generación de descripciones de servicios', descripcion: 'Admin sube datos básicos → IA genera descripción SEO-friendly para el catálogo', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ia-06', titulo: 'Análisis de reseñas con IA (sentiment)', descripcion: 'Clasificar reseñas automáticamente: positivo/negativo/sugerencia. Dashboard en AdminPanel', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ia-07', titulo: 'Monetizar IA: plan Premium con asistente ilimitado', descripcion: 'Free: 5 consultas/día al asistente. Premium: ilimitado + recomendaciones personalizadas', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'comercial', titulo: 'Oportunidades Comerciales',
    subtitulo: 'ANATO, portafolio, tarifas, GuiaSAI B2B integrado',
    icono: 'BarChart2', color: 'text-teal-400', gradiente: 'from-teal-900 to-teal-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'com-01', titulo: 'Portafolio GuanaGO listo para envío', descripcion: 'Doc/página con servicios, tarifas actualizadas, casos de uso B2B y B2C. PDF + URL pública', prioridad: 'critica', estado: 'en_progreso', creadaEn: new Date().toISOString() },
      { id: 'com-02', titulo: 'Contacto ANATO — turismo organizado', descripcion: 'Preparar pitch para agencias ANATO: GuanaGO como plataforma de destino en San Andrés y Providencia', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'com-03', titulo: 'Tarifas actualizadas de todos los servicios', descripcion: 'Revisar y actualizar en Airtable. Incluir tours, hoteles, traslados, Caribbean Night, paquetes combo', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'com-04', titulo: 'Integrar GuiaSAI Business + GuanaGO', descripcion: 'Una sola plataforma: panel B2B (GuiaSAI Business) + app turista (GuanaGO). Mismo login, misma data', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'com-05', titulo: 'Modelo publicidad tipo CamScanner', descripcion: 'Usuarios free ven 1 video/banner por acción premium (reservar, descargar voucher). Premium sin ads', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'com-06', titulo: 'Página web pública funcionando', descripcion: 'Landing page GuanaGO.app o guanago.com.co. Con catálogo, registro aliados, descarga app', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'b2c', titulo: 'Experiencia B2C — Turista',
    subtitulo: 'Flujo del usuario turista desde búsqueda hasta reserva',
    icono: 'Users', color: 'text-sky-400', gradiente: 'from-sky-900 to-sky-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'b2c-01', titulo: 'Búsqueda y filtros de destinos/actividades', descripcion: 'Buscador en Home: por categoría, precio, fecha, disponibilidad. Resultados en lista y mapa.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2c-02', titulo: 'Reserva integrada: alojamientos + tours', descripcion: 'Flujo completo: selección → carrito → pago Wompi → voucher automático. Sin salir de la app.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2c-03', titulo: 'Sistema de recomendaciones personalizadas', descripcion: 'Basado en historial del usuario + contexto IA. "Porque visitaste X, te puede interesar Y".', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2c-04', titulo: 'Sección "Beneficios & Cupones" en Home', descripcion: 'Vitrina de ofertas de Aliados con QR, descuentos exclusivos y fecha de vigencia.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2c-05', titulo: 'Push notifications: ofertas y recordatorios', descripcion: 'Notificar al turista: oferta nueva de aliado, recordatorio de reserva, check-in próximo.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2c-06', titulo: 'Sistema de feedback y calificaciones', descripcion: 'Turista califica tour/hotel después del servicio. Alimenta ranking de aliados.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'b2b', titulo: 'Panel Aliado B2B',
    subtitulo: 'Herramientas para negocios aliados: registro, catálogo, marketing',
    icono: 'Megaphone', color: 'text-amber-400', gradiente: 'from-amber-900 to-amber-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'b2b-01', titulo: 'Registro y validación de aliados', descripcion: 'Form de registro + validación manual por admin antes de activar. Email de confirmación automático.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2b-02', titulo: 'Carga de productos y servicios del aliado', descripcion: 'Dashboard aliado: subir fotos, descripción, precio, disponibilidad. Sincroniza a Airtable + Firestore.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2b-03', titulo: 'Gestión de inventario y precios', descripcion: 'Aliado actualiza stock y tarifas en tiempo real. Admin puede overridear precios si aplica comisión.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2b-04', titulo: 'Herramientas de marketing para aliados', descripcion: 'Crear campañas de descuento, definir vigencia, segmentar por tipo de usuario (turista/local).', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2b-05', titulo: 'Analytics para aliados: QR, canjes, visitas', descripcion: 'Dashboard aliado: cuántos escanearon su QR, cuántos canjearon, tráfico generado, conversión.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'b2b-06', titulo: 'Sistema de comisiones y pagos al aliado', descripcion: 'Reporte mensual de ventas generadas + transferencia automática del 70% al aliado via Wompi.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'ceo', titulo: 'CEO Dashboard & Control',
    subtitulo: 'Visibilidad total: métricas, alertas, usuarios, incidencias',
    icono: 'Activity', color: 'text-rose-400', gradiente: 'from-rose-900 to-rose-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'ceo-01', titulo: 'Dashboard analytics global', descripcion: 'DAU, MAU, revenue, conversión de reservas, aliados activos. Gráficas en tiempo real desde Firestore.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ceo-02', titulo: 'Sistema de alertas automáticas', descripcion: 'Alertar por email/push cuando: caída del backend, tasa de error >5%, pago fallido, aliado sin actividad 7 días.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ceo-03', titulo: 'Gestión de usuarios y roles desde admin', descripcion: 'Panel para ver todos los usuarios, cambiar rol, suspender cuenta, ver actividad. Con búsqueda y filtros.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ceo-04', titulo: 'Sistema de permisos granulares', descripcion: 'Roles: SuperAdmin, AdminOperativo, Aliado, Turista, Artista. Cada rol con permisos específicos en backend.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ceo-05', titulo: 'Seguimiento de incidencias en tiempo real', descripcion: 'Integrar Sentry + panel interno. Ver errores, frecuencia, usuarios afectados. Marcar como resuelto.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'ceo-06', titulo: 'Reporte ejecutivo semanal automático', descripcion: 'Email automático (Resend.com) cada lunes con KPIs: reservas, ingresos, aliados nuevos, errores top.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'marca', titulo: 'Marca, Legal & Estrategia',
    subtitulo: 'Registro de marca, MVP, redes, gamificación',
    icono: 'FileText', color: 'text-cyan-400', gradiente: 'from-cyan-900 to-cyan-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'mar-01', titulo: 'Organizar papeles registro marca GuanaGO', descripcion: 'SIC Colombia: registro de marca mixta GuanaGO. Revisar clases de Nice aplicables (turismo, software)', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mar-02', titulo: 'Definir y documentar el MVP final', descripcion: 'Lista cerrada de features para v1.0. Lo que NO entra al MVP queda en backlog. Evitar scope creep', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mar-03', titulo: 'Redes sociales: perfiles y estrategia', descripcion: 'Crear/optimizar IG, TikTok, FB. Calendario de contenido 30 días. Reels de destinos + ofertas aliados', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mar-04', titulo: 'Gamificación: puntos y badges', descripcion: 'Usuarios ganan GuanaPoints por reservas, reseñas, referidos. Canjeables por descuentos con aliados', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mar-05', titulo: 'Tokenización y loyalty tokens', descripcion: 'GuanaToken como loyalty token (blockchain ligero o centralizado). Holders = acceso premium', prioridad: 'baja', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mar-06', titulo: 'Plan lanzamiento oficial de la app', descripcion: 'Fecha objetivo, evento de lanzamiento, aliados confirmados, press release, campaña digital', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'guiasai_agencias', titulo: 'GuiaSAI Agencias — Cotizador B2B',
    subtitulo: 'Mapa del trabajo desarrollado en guiasanandresislas.com/agencias y su integración',
    icono: 'Globe', color: 'text-orange-400', gradiente: 'from-orange-900 to-orange-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'gsa-01', titulo: 'ServiceCard con fechas y huéspedes', descripcion: 'Componente ServiceBookingCard adaptado de GuiaSAI Business. Imagen, tipo, check-in/out, adultos/niños/bebés, total estimado, Agregar al Carrito.', prioridad: 'critica', estado: 'completado', creadaEn: new Date().toISOString() },
      { id: 'gsa-02', titulo: 'extractImageUrl: soporte URLs WordPress', descripcion: 'airtableService.ts maneja campo Imagenurl como string directo (WordPress) o attachment array. Soluciona imágenes 410 Gone.', prioridad: 'critica', estado: 'completado', creadaEn: new Date().toISOString() },
      { id: 'gsa-03', titulo: 'Cotizador instantáneo B2B (GuiaSAI Business)', descripcion: 'guiasanandresislas.com/agencias: panel de agencias con filtros globales, carrito de cotización, PDF descargable, Airtable sync. Fuente de verdad: ServiciosTuristicos_SAI.', prioridad: 'alta', estado: 'completado', creadaEn: new Date().toISOString() },
      { id: 'gsa-04', titulo: 'Pricing dinámico por huéspedes en alojamientos', descripcion: 'calculateAccommodationPrice(): precio varía según número de huéspedes (precio1Huesped, precio2Huespedes, etc.). Implementar en GuanaGO B2C.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'gsa-05', titulo: 'Horarios de tours (schedules)', descripcion: 'Tours tienen slots horarios en Airtable. GuiaSAI Business los muestra por dropdown. Implementar selector de horario en ServiceBookingCard de GuanaGO.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'gsa-06', titulo: 'PDF de cotización desde GuanaGO B2C', descripcion: 'Adaptar pdfService.ts de GuiaSAI Business para generar voucher/cotización descargable desde el carrito de GuanaGO.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'gsa-07', titulo: 'Login unificado: mismas credenciales B2B y B2C', descripcion: 'Usuario de agencia (GuiaSAI) y turista (GuanaGO) con el mismo Firebase Auth. Rol determina vista: agencia → cotizador, turista → home, admin → torre control.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'gsa-08', titulo: 'Mis cotizaciones: historial en Airtable + Firestore', descripcion: 'Guardar cotizaciones del B2C en tabla Cotizaciones_GG (Airtable). Visor en AccountDashboard con estado: borrador, enviada, confirmada.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'gsa-09', titulo: 'Paquetes combo: alojamiento + tour + traslado', descripcion: 'Igual que GuiaSAI Business. El usuario arma un paquete seleccionando 1 hotel + N tours + traslado. Precio total con descuento por combo.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'gsa-10', titulo: 'Micro-sitio de cada servicio (/servicio/:slug)', descripcion: 'Página de detalle con galería, descripción larga, mapa, reseñas, disponibilidad y botón reservar. Igual al /servicio/:slug de GuiaSAI Business.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'lean_canvas', titulo: 'Lean Canvas — Modelo de Negocio',
    subtitulo: 'Propuesta de valor, segmentos, canales, ingresos, costos y ventaja competitiva',
    icono: 'Layers', color: 'text-indigo-400', gradiente: 'from-indigo-900 to-indigo-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'lc-01', titulo: 'Propuesta de valor B2C definida y documentada', descripcion: '"GuanaGO es la guía turística inteligente de San Andrés: descubre, reserva y vive el Caribe en un solo lugar." Diferencial: contenido raizal + IA local + GuanaPoints.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-02', titulo: 'Propuesta de valor B2B (agencias + aliados)', descripcion: '"Conecta tu negocio turístico con miles de turistas. Gestiona reservas, pagos y marketing desde un solo panel." Diferencial: cotizador instantáneo + comisiones automáticas.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-03', titulo: 'Segmentos de clientes priorizados', descripcion: 'Primario: turista nacional 25-45 años planificando viaje. Secundario: agencias ANATO. Terciario: negocios locales aliados. Documentar en Notion/CLAUDE.md.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-04', titulo: 'Canales de adquisición por segmento', descripcion: 'B2C: Instagram + TikTok + Google Ads + SEO. B2B: LinkedIn + ANATO + contacto directo. Aliados: WhatsApp masivo + ferias de turismo SAI.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-05', titulo: 'Flujos de ingresos documentados', descripcion: '1. Comisión por reserva (10-15%). 2. Suscripción aliados premium. 3. Pauta directa (banners). 4. GuanaPass (suscripción turista premium). 5. GuanaToken utilidad.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-06', titulo: 'Estructura de costos principal', descripcion: 'Render (backend), Airtable Pro, Firebase Blaze, APIs (Mapbox/Groq/Gemini), Make.com, Wompi fees. Proyectar costos para 1k, 10k y 100k usuarios.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-07', titulo: 'Métricas clave del negocio (KPIs)', descripcion: 'DAU/MAU, CAC, LTV, tasa conversión reservas, NPS, aliados activos, GMV (Gross Merchandise Value). Dashboard CEO en AdminTorreControl.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'lc-08', titulo: 'Ventaja injusta (Unfair Advantage)', descripcion: 'Contenido curado raizal auténtico + red de aliados comunitarios + IA contextual entrenada en destino SAI. Barreras: relaciones locales + data propietaria.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'marketing', titulo: 'Marketing & Crecimiento',
    subtitulo: 'Estrategia digital, contenido, SEO, paid y viralidad',
    icono: 'TrendingUp', color: 'text-pink-400', gradiente: 'from-pink-900 to-pink-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'mkt-01', titulo: 'Presencia IG + TikTok operativa', descripcion: 'Perfiles optimizados, bio con link a app, highlights. Calendario de contenido: 3 posts/sem. Reels de destinos, raizal, food, adventures.', prioridad: 'critica', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-02', titulo: 'SEO: landing page guanago.travel', descripcion: 'Meta title/desc, OG tags, structured data (turismo), sitemap. Keywords: "qué hacer San Andrés", "hoteles San Andrés", "tours San Andrés Colombia".', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-03', titulo: 'Estrategia de referidos (viral loop)', descripcion: 'Usuario refiere amigo → ambos ganan GuanaPoints. Implementar código referido en registro. Meta: reducir CAC 30%.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-04', titulo: 'Google Ads: campañas de intención de viaje', descripcion: 'Campañas search para "hoteles San Andrés", "tours caribe colombiano". ROI objetivo: 3x. Presupuesto inicial sugerido: $500k COP/mes para prueba.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-05', titulo: 'WhatsApp Business + broadcast a red local', descripcion: 'Base de 20k contactos identificados. Broadcasts segmentados: turistas vs aliados. Integrar CRM básico con Airtable Leads table.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-06', titulo: 'Alianzas con creadores de contenido SAI', descripcion: 'Identificar 5-10 micro-influencers locales (5k-50k followers). Barter: experiencias gratis a cambio de contenido autenticado.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-07', titulo: 'Email marketing: onboarding + reactivación', descripcion: 'Resend.com para secuencia de bienvenida (3 emails). Reactivar usuarios inactivos 30d con oferta personalizada. Segmentar por tipo de visita (playa, aventura, gastronomía).', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'mkt-08', titulo: 'Programa "Embajadores Raizales"', descripcion: 'Negocios y guías raizales certificados con badge especial en la app. Marketing auténtico: ellos promueven, GuanaGO amplifica. Diferenciador cultural.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
  {
    id: 'tokens_blockchain', titulo: 'Utility Tokens & Blockchain',
    subtitulo: 'GuanaToken, tokenización de reservas, NFT vouchers y DeFi turístico',
    icono: 'Coins', color: 'text-yellow-400', gradiente: 'from-yellow-900 to-yellow-800',
    creadaEn: new Date().toISOString(),
    tareas: [
      { id: 'tok-01', titulo: 'Definir modelo GuanaToken (utility token)', descripcion: 'GuanaToken = loyalty token no especulativo. Usos: descuentos, acceso premium, votación de destinos, rewards por reseñas. Modelo ERC-20 o Hedera HTS.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-02', titulo: 'Smart contract GuanaToken en testnet', descripcion: 'Deploy en Polygon testnet (bajo costo/gas) o Hedera Hashgraph (ya integrado en tipos.ts). Supply inicial, mint por reserva, burn por canje.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-03', titulo: 'GuanaPoints → GuanaToken: bridge', descripcion: 'X GuanaPoints acumulados = 1 GuanaToken convertible. Implementar función de conversión en Wallet. Transparencia: cada conversión registrada on-chain.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-04', titulo: 'NFT Vouchers: reservas como NFT', descripcion: 'Cada reserva confirmada genera un NFT-voucher único (Hedera HTS o Polygon). El socio escanea QR del NFT para confirmar check-in. Transferible = resale market.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-05', titulo: 'Auditoria blockchain de transacciones (Hedera)', descripcion: 'Ya implementado: BlockchainAudit interface en types.ts con hederaTransactionId + consensusTimestamp. Activar en pagos reales Wompi → log en Hedera Consensus Service.', prioridad: 'alta', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-06', titulo: 'Dashboard blockchain en AdminDashboard', descripcion: 'Panel que muestra: tokens emitidos, transacciones auditadas, NFT vouchers activos, holders de GuanaToken. Conectar a Hedera Mirror Node API.', prioridad: 'media', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-07', titulo: 'Whitepaper GuanaToken (para aliados e inversores)', descripcion: 'Documento: tokenomics, distribución, utilidad, roadmap blockchain, caso de uso turístico. Publicar en guanago.travel/token.', prioridad: 'baja', estado: 'pendiente', creadaEn: new Date().toISOString() },
      { id: 'tok-08', titulo: 'Integración wallet externa (MetaMask / Hbar Wallet)', descripcion: 'Permitir a usuarios conectar wallet externa para recibir GuanaTokens. ethers.js o @hashgraph/sdk. Opcional: custodial wallet para usuarios no-cripto.', prioridad: 'baja', estado: 'pendiente', creadaEn: new Date().toISOString() },
    ],
  },
];

// ─── Helpers de persistencia ─────────────────────────────────────────────────
const loadData = (): SeccionControl[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: SeccionControl[] = JSON.parse(raw);
      // Merge: agregar secciones seed nuevas que no existan en el guardado
      const savedIds = new Set(saved.map(s => s.id));
      const nuevas = SEED_SECCIONES.filter(s => !savedIds.has(s.id));
      if (nuevas.length > 0) {
        const merged = [...saved, ...nuevas];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return saved;
    }
  } catch { /* ignore */ }
  return SEED_SECCIONES;
};

const saveData = (data: SeccionControl[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const genId = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Config visual ───────────────────────────────────────────────────────────
const PRIORIDAD_CFG: Record<Prioridad, { label: string; color: string; dot: string; badge: string }> = {
  critica: { label: 'CRÍTICA', color: 'text-red-400',    dot: 'bg-red-500',    badge: 'bg-red-900/60 text-red-300 border-red-700' },
  alta:    { label: 'ALTA',    color: 'text-orange-400', dot: 'bg-orange-500', badge: 'bg-orange-900/60 text-orange-300 border-orange-700' },
  media:   { label: 'MEDIA',   color: 'text-yellow-400', dot: 'bg-yellow-500', badge: 'bg-yellow-900/60 text-yellow-300 border-yellow-700' },
  baja:    { label: 'BAJA',    color: 'text-gray-400',   dot: 'bg-gray-500',   badge: 'bg-gray-800 text-gray-400 border-gray-700' },
};

const ESTADO_CFG: Record<EstadoTarea, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'text-gray-400', bg: 'bg-gray-800' },
  en_progreso: { label: 'En progreso', color: 'text-blue-400', bg: 'bg-blue-900/40' },
  completado:  { label: 'Completado',  color: 'text-green-400', bg: 'bg-green-900/30' },
  bloqueado:   { label: 'Bloqueado',   color: 'text-red-400',  bg: 'bg-red-900/30' },
};

const ICONO_MAP: Record<string, React.ReactNode> = {
  Users: <Users size={16} />, Shield: <Shield size={16} />, CreditCard: <CreditCard size={16} />,
  FileText: <FileText size={16} />, Megaphone: <Megaphone size={16} />, Bell: <Bell size={16} />,
  Rocket: <Rocket size={16} />, Database: <Database size={16} />, Smartphone: <Smartphone size={16} />,
  Activity: <Activity size={16} />, TowerControl: <TowerControl size={16} />, FolderPlus: <FolderPlus size={16} />,
  Globe: <Globe size={16} />, TrendingUp: <TrendingUp size={16} />, Coins: <Coins size={16} />,
  Link2: <Link2 size={16} />, Target: <Target size={16} />, Layers: <Layers size={16} />,
  Zap: <Zap size={16} />, BookOpen: <BookOpen size={16} />, BarChart2: <BarChart2 size={16} />, Cpu: <Cpu size={16} />,
};

const COLOR_OPTIONS = [
  'text-emerald-400', 'text-blue-400', 'text-yellow-400', 'text-red-400',
  'text-purple-400', 'text-pink-400', 'text-cyan-400', 'text-orange-400',
];

// ─── Modal de tarea ──────────────────────────────────────────────────────────
interface ModalTareaProps {
  seccionId: string;
  tarea?: TareaControl;
  onSave: (seccionId: string, tarea: TareaControl) => void;
  onClose: () => void;
}

const ModalTarea: React.FC<ModalTareaProps> = ({ seccionId, tarea, onSave, onClose }) => {
  const [titulo, setTitulo]     = useState(tarea?.titulo || '');
  const [desc, setDesc]         = useState(tarea?.descripcion || '');
  const [prioridad, setPrioridad] = useState<Prioridad>(tarea?.prioridad || 'media');
  const [estado, setEstado]     = useState<EstadoTarea>(tarea?.estado || 'pendiente');
  const [fecha, setFecha]       = useState(tarea?.fechaVencimiento || '');
  const [notas, setNotas]       = useState(tarea?.notas || '');
  const [diagUrl, setDiagUrl]   = useState(tarea?.diagnosticoUrl || '');

  const handleSave = () => {
    if (!titulo.trim()) return;
    const t: TareaControl = {
      id: tarea?.id || genId(),
      titulo: titulo.trim(),
      descripcion: desc.trim(),
      prioridad, estado,
      fechaVencimiento: fecha || undefined,
      notas: notas.trim() || undefined,
      diagnosticoUrl: diagUrl.trim() || undefined,
      creadaEn: tarea?.creadaEn || new Date().toISOString(),
    };
    onSave(seccionId, t);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">{tarea ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Título *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600"
              placeholder="Nombre de la tarea..."
              value={titulo} onChange={e => setTitulo(e.target.value)}
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Descripción</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600 resize-none"
              placeholder="Detalle de la tarea..."
              rows={3} value={desc} onChange={e => setDesc(e.target.value)}
            />
          </div>

          {/* Prioridad + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Prioridad</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600"
                value={prioridad} onChange={e => setPrioridad(e.target.value as Prioridad)}
              >
                <option value="critica">🔴 Crítica</option>
                <option value="alta">🟠 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">⚪ Baja</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Estado</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600"
                value={estado} onChange={e => setEstado(e.target.value as EstadoTarea)}
              >
                <option value="pendiente">⬜ Pendiente</option>
                <option value="en_progreso">🔵 En progreso</option>
                <option value="completado">✅ Completado</option>
                <option value="bloqueado">🚫 Bloqueado</option>
              </select>
            </div>
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Fecha de vencimiento</label>
            <input
              type="date"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600"
              value={fecha} onChange={e => setFecha(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Notas internas</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600 resize-none"
              placeholder="Notas, links, referencias..."
              rows={2} value={notas} onChange={e => setNotas(e.target.value)}
            />
          </div>

          {/* URL Diagnóstico */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">URL Diagnóstico (opcional)</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600 font-mono"
              placeholder="/api/health"
              value={diagUrl} onChange={e => setDiagUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!titulo.trim()}
            className="flex-1 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Save size={14} /> {tarea ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de sección ────────────────────────────────────────────────────────
interface ModalSeccionProps {
  seccion?: SeccionControl;
  onSave: (s: SeccionControl) => void;
  onClose: () => void;
}

const ModalSeccion: React.FC<ModalSeccionProps> = ({ seccion, onSave, onClose }) => {
  const [titulo, setTitulo]     = useState(seccion?.titulo || '');
  const [subtitulo, setSubtitulo] = useState(seccion?.subtitulo || '');
  const [icono, setIcono]       = useState(seccion?.icono || 'FolderPlus');
  const [color, setColor]       = useState(seccion?.color || 'text-cyan-400');

  const handleSave = () => {
    if (!titulo.trim()) return;
    onSave({
      id: seccion?.id || genId(),
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      icono, color,
      gradiente: 'from-gray-800 to-gray-900',
      tareas: seccion?.tareas || [],
      creadaEn: seccion?.creadaEn || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">{seccion ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Nombre del proyecto *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600"
              placeholder="Ej: Integración WhatsApp"
              value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Descripción corta</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600"
              placeholder="Ej: Chatbot y notificaciones por WA"
              value={subtitulo} onChange={e => setSubtitulo(e.target.value)}
            />
          </div>

          {/* Ícono */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Ícono</label>
            <div className="grid grid-cols-6 gap-2">
              {Object.keys(ICONO_MAP).map(key => (
                <button
                  key={key}
                  onClick={() => setIcono(key)}
                  className={`p-2.5 rounded-lg border flex items-center justify-center transition-colors
                    ${icono === key ? 'bg-cyan-800 border-cyan-600 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                >
                  {ICONO_MAP[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${c.replace('text-', 'bg-').replace('-400', '-500')}
                    ${color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!titulo.trim()}
            className="flex-1 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Save size={14} /> {seccion ? 'Guardar' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate: (route: any) => void;
}

const AdminTorreControl: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [secciones, setSecciones]   = useState<SeccionControl[]>(loadData);
  const [abiertas, setAbiertas]     = useState<Record<string, boolean>>({ aliados: true });
  const [filtro, setFiltro]         = useState<EstadoTarea | 'todos'>('todos');
  const [diagResults, setDiagResults] = useState<Record<string, { ok: boolean; msg: string; checking: boolean }>>({});
  const [diagSeccion, setDiagSeccion] = useState<string | null>(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [vistaActual, setVistaActual] = useState<'tareas' | 'ia'>('tareas');

  // Modales
  const [modalTarea, setModalTarea]     = useState<{ seccionId: string; tarea?: TareaControl } | null>(null);
  const [modalSeccion, setModalSeccion] = useState<{ seccion?: SeccionControl } | null>(null);
  const [menuTarea, setMenuTarea]       = useState<{ tareaId: string; seccionId: string } | null>(null);
  const [menuSeccion, setMenuSeccion]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ tipo: 'tarea' | 'seccion'; id: string; seccionId?: string } | null>(null);

  // Persistir
  useEffect(() => { saveData(secciones); }, [secciones]);

  // Cerrar menus al click afuera
  useEffect(() => {
    const close = () => { setMenuTarea(null); setMenuSeccion(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── CRUD secciones ─────────────────────────────────────────────────────────
  const saveSeccion = (s: SeccionControl) => {
    setSecciones(prev => {
      const idx = prev.findIndex(x => x.id === s.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n; }
      return [...prev, s];
    });
  };

  const deleteSeccion = (id: string) => {
    setSecciones(prev => prev.filter(s => s.id !== id));
    setConfirmDelete(null);
  };

  // ── CRUD tareas ────────────────────────────────────────────────────────────
  const saveTarea = (seccionId: string, tarea: TareaControl) => {
    setSecciones(prev => prev.map(s => {
      if (s.id !== seccionId) return s;
      const idx = s.tareas.findIndex(t => t.id === tarea.id);
      const tareas = idx >= 0
        ? s.tareas.map(t => t.id === tarea.id ? tarea : t)
        : [...s.tareas, tarea];
      return { ...s, tareas };
    }));
  };

  const deleteTarea = (seccionId: string, tareaId: string) => {
    setSecciones(prev => prev.map(s =>
      s.id === seccionId ? { ...s, tareas: s.tareas.filter(t => t.id !== tareaId) } : s
    ));
    setConfirmDelete(null);
  };

  const setEstadoTarea = (seccionId: string, tareaId: string, estado: EstadoTarea) => {
    setSecciones(prev => prev.map(s =>
      s.id === seccionId
        ? { ...s, tareas: s.tareas.map(t => t.id === tareaId ? { ...t, estado } : t) }
        : s
    ));
  };

  // ── Diagnóstico ────────────────────────────────────────────────────────────
  const diagnosticarSeccion = useCallback(async (seccion: SeccionControl) => {
    setDiagSeccion(seccion.id);
    const urls = [...new Set(seccion.tareas.filter(t => t.diagnosticoUrl).map(t => t.diagnosticoUrl!))];
    for (const url of urls) {
      setDiagResults(prev => ({ ...prev, [url]: { ok: false, msg: 'Verificando...', checking: true } }));
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        setDiagResults(prev => ({ ...prev, [url]: { ok: res.ok, msg: res.ok ? `OK ${res.status}` : `Error ${res.status}`, checking: false } }));
      } catch (e: any) {
        setDiagResults(prev => ({ ...prev, [url]: { ok: false, msg: e?.message?.includes('timeout') ? 'Timeout' : 'Sin respuesta', checking: false } }));
      }
    }
    setDiagSeccion(null);
  }, []);

  // ── Stats globales ─────────────────────────────────────────────────────────
  const allTareas = secciones.flatMap(s => s.tareas);
  const total      = allTareas.length;
  const completadas = allTareas.filter(t => t.estado === 'completado').length;
  const enProgreso  = allTareas.filter(t => t.estado === 'en_progreso').length;
  const bloqueadas  = allTareas.filter(t => t.estado === 'bloqueado').length;
  const criticas    = allTareas.filter(t => t.prioridad === 'critica' && t.estado !== 'completado').length;
  const progresoPct = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const progSeccion = (s: SeccionControl) => {
    const tot = s.tareas.length;
    if (tot === 0) return { tot: 0, done: 0, pct: 0 };
    const done = s.tareas.filter(t => t.estado === 'completado').length;
    return { tot, done, pct: Math.round((done / tot) * 100) };
  };

  // Exportar JSON
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ fecha: new Date().toISOString(), progreso: `${completadas}/${total}`, secciones }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `torre_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };

  // Exportar CLAUDE.md — contexto completo para Claude Code
  const exportarClaude = () => {
    const fecha = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });
    const secLines = secciones.map(sec => {
      const done = sec.tareas.filter(t => t.estado === 'completado').length;
      const pct = sec.tareas.length > 0 ? Math.round((done / sec.tareas.length) * 100) : 0;
      const tareaLines = sec.tareas.map(t => {
        const estado = { pendiente: '[ ]', en_progreso: '[~]', completado: '[x]', bloqueado: '[!]' }[t.estado] ?? '[ ]';
        const prio = t.prioridad === 'critica' ? ' ⚡CRÍTICA' : '';
        return `  ${estado}${prio} ${t.titulo}${t.notas ? `\n      Nota: ${t.notas}` : ''}`;
      }).join('\n');
      return `### ${sec.titulo} (${pct}% · ${done}/${sec.tareas.length})\n${tareaLines}`;
    }).join('\n\n');

    const md = `# CLAUDE.md — GuanaGO Proyecto Context
> Generado automáticamente desde la Torre de Control · ${fecha}
> Este archivo da contexto a Claude Code sobre el estado real del proyecto.

## Stack Técnico
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS (PWA)
- **Backend:** Node.js + Express en Render (puerto 5000)
- **DB captura:** Airtable (base \`appiReH55Qhrbv4Lk\`)
- **DB runtime:** Firebase Firestore (en implementación)
- **Auth:** Firebase Auth (Google + email)
- **IA en app:** Groq API (Llama 3.3 70B) vía \`/api/ai/chat\`
- **Deploy:** Render (backend) + Firebase Hosting (frontend)
- **Automatización:** Make.com (Airtable → Firestore sync)

## Estado Global del Proyecto
- Proyectos activos: **${secciones.length}**
- Total tareas: **${total}**
- Completadas: **${completadas} (${progresoPct}%)**
- En progreso: **${enProgreso}**
- Bloqueadas: **${bloqueadas}**
- Críticas pendientes: **${criticas}**

## Proyectos y Tareas
> [ ] pendiente · [~] en progreso · [x] completado · [!] bloqueado

${secLines}

## Instrucciones para Claude Code
- Al iniciar sesión, leer este archivo para tener contexto del proyecto
- Priorizar tareas marcadas como ⚡CRÍTICA
- El directorio principal es \`GuanaGo-App-Enero-main/\`
- El backend Express está en \`server.js\` + \`backend/\`
- Las páginas admin están en \`pages/admin/\`
- Los tipos globales están en \`types.ts\`
- Las rutas de navegación están en el enum \`AppRoute\`
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'CLAUDE.md'; a.click();
    URL.revokeObjectURL(a.href);
  };

  const tareasFiltradas = (tareas: TareaControl[]) =>
    filtro === 'todos' ? tareas : tareas.filter(t => t.estado === filtro);

  const hoyStr = new Date().toISOString().slice(0, 10);
  const isVencida = (t: TareaControl) =>
    t.fechaVencimiento && t.fechaVencimiento < hoyStr && t.estado !== 'completado';

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-950 min-h-screen text-white pb-28 font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-700">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            <ArrowLeft size={18} />
          </button>
          <TowerControl size={20} className="text-cyan-400" />
          <div className="flex-1">
            <h1 className="text-sm font-bold leading-none">Torre de Control</h1>
            <p className="text-gray-500 text-xs">{secciones.length} proyectos · {total} tareas · {progresoPct}% avance</p>
          </div>
          <button onClick={exportarClaude} className="p-2 rounded-lg bg-gray-800 hover:bg-violet-900 hover:border-violet-700 border border-transparent" title="Exportar CLAUDE.md para Claude Code">
            <FileText size={15} className="text-gray-400 hover:text-violet-300" />
          </button>
          <button onClick={exportar} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" title="Exportar JSON">
            <Download size={15} className="text-gray-400" />
          </button>
          <button onClick={() => setMostrarResumen(p => !p)} className="px-3 py-1.5 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-cyan-300 text-xs font-bold flex items-center gap-1">
            <BarChart2 size={13} /> Resumen
          </button>
        </div>
        {/* ── Tabs ── */}
        <div className="flex border-t border-gray-800">
          <button
            onClick={() => setVistaActual('tareas')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
              ${vistaActual === 'tareas' ? 'text-cyan-300 border-b-2 border-cyan-500 bg-cyan-950/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <CheckSquare size={13} /> Proyectos & Tareas
          </button>
          <button
            onClick={() => setVistaActual('ia')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
              ${vistaActual === 'ia' ? 'text-violet-300 border-b-2 border-violet-500 bg-violet-950/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Cpu size={13} /> Asistente IA
          </button>
        </div>
      </header>

      {/* ── Vista: Asistente IA ── */}
      {vistaActual === 'ia' && (
        <div style={{ height: 'calc(100vh - 89px)' }}>
          <PanelIAAsistente secciones={secciones} onAddTarea={saveTarea} />
        </div>
      )}

      {/* ── Vista: Proyectos & Tareas ── */}
      {vistaActual === 'tareas' && <>

      {/* ── Progreso global ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-white font-bold text-xl">{progresoPct}%</span>
              <p className="text-gray-500 text-xs mt-0.5">{completadas}/{total} tareas · {criticas} críticas pendientes</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 text-sm font-bold
              ${progresoPct >= 80 ? 'border-green-500 text-green-400' : progresoPct >= 40 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'}`}>
              {progresoPct}%
            </div>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700
              ${progresoPct >= 80 ? 'bg-green-500' : progresoPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${progresoPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Resumen por sección ── */}
      {mostrarResumen && (
        <div className="px-4 pb-2">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-3 space-y-2">
            {secciones.map(s => {
              const { done, tot, pct } = progSeccion(s);
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className={`${s.color}`}>{ICONO_MAP[s.icono] || <Activity size={14} />}</span>
                  <span className="text-xs text-gray-300 flex-1 truncate">{s.titulo}</span>
                  <span className="text-xs text-gray-500">{done}/{tot}</span>
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Panel Estado del Sistema ── */}
      <div className="px-4 pb-2 pt-1">
        <PanelEstadoSistema />
      </div>

      {/* ── Acceso rápido: botones superiores ── */}
      <div className="px-4 pb-2 flex gap-2">
        <button onClick={() => onNavigate(AppRoute.ADMIN_MAPA_MENTAL)}
          className="flex-1 flex items-center gap-3 bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-800 hover:border-cyan-500 rounded-xl px-4 py-3 transition-colors">
          <BarChart2 size={18} className="text-cyan-400 flex-shrink-0" />
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-cyan-300">Mapa Mental</p>
            <p className="text-xs text-cyan-700">Visualizar proyectos y tareas</p>
          </div>
          <ChevronRight size={15} className="text-cyan-800 flex-shrink-0" />
        </button>
        <button onClick={() => onNavigate(AppRoute.ADMIN_PROCEDIMIENTOS_RAG)}
          className="flex-1 flex items-center gap-3 bg-gradient-to-r from-purple-950 to-blue-950 border border-purple-800 hover:border-purple-600 rounded-xl px-4 py-3 transition-colors">
          <Cpu size={18} className="text-purple-400 flex-shrink-0" />
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-purple-300">RAG & SOPs</p>
            <p className="text-xs text-purple-600">Documentos · CLAUDE.md</p>
          </div>
          <ChevronRight size={15} className="text-purple-700 flex-shrink-0" />
        </button>
      </div>

      {/* ── Divisor ── */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600 font-bold uppercase whitespace-nowrap">Proyectos & Tareas</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="px-4 pb-3 pt-1 flex gap-2 overflow-x-auto">
        {(['todos','pendiente','en_progreso','completado','bloqueado'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors
              ${filtro === f ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            {f === 'todos' ? `Todos (${total})` :
             f === 'pendiente' ? `Pendientes (${allTareas.filter(t=>t.estado==='pendiente').length})` :
             f === 'en_progreso' ? `En progreso (${enProgreso})` :
             f === 'completado' ? `Completados (${completadas})` : `Bloqueados (${bloqueadas})`}
          </button>
        ))}
      </div>

      {/* ── Secciones ── */}
      <div className="px-4 space-y-3">
        {secciones.map(seccion => {
          const { done, tot, pct } = progSeccion(seccion);
          const abierta = abiertas[seccion.id] ?? false;
          const tareasMostradas = tareasFiltradas(seccion.tareas);
          const diagnosticando = diagSeccion === seccion.id;

          return (
            <div key={seccion.id} className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">

              {/* Header sección */}
              <div className="flex items-center">
                <button className="flex-1 p-4 flex items-center gap-3 text-left hover:bg-gray-800 transition-colors"
                  onClick={() => setAbiertas(p => ({ ...p, [seccion.id]: !p[seccion.id] }))}>
                  <div className={`p-2 rounded-lg bg-gray-800 ${seccion.color} flex-shrink-0`}>
                    {ICONO_MAP[seccion.icono] || <Activity size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{seccion.titulo}</span>
                      {done === tot && tot > 0 && <span className="bg-green-900 text-green-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">✓ Completo</span>}
                    </div>
                    <p className="text-gray-500 text-xs truncate">{seccion.subtitulo}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 font-mono flex-shrink-0">{done}/{tot}</span>
                    </div>
                  </div>
                  {abierta ? <ChevronDown size={15} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-500 flex-shrink-0" />}
                </button>

                {/* Menú sección */}
                <div className="relative px-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setMenuSeccion(menuSeccion === seccion.id ? null : seccion.id)}
                    className="p-2 rounded-lg hover:bg-gray-800 text-gray-500">
                    <MoreVertical size={15} />
                  </button>
                  {menuSeccion === seccion.id && (
                    <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-20 min-w-40">
                      <button onClick={() => { setModalTarea({ seccionId: seccion.id }); setMenuSeccion(null); }}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-200 hover:bg-gray-700 w-full">
                        <Plus size={13} className="text-cyan-400" /> Agregar tarea
                      </button>
                      <button onClick={() => { setModalSeccion({ seccion }); setMenuSeccion(null); }}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-200 hover:bg-gray-700 w-full">
                        <Edit3 size={13} className="text-yellow-400" /> Editar proyecto
                      </button>
                      {seccion.tareas.some(t => t.diagnosticoUrl) && (
                        <button onClick={() => { diagnosticarSeccion(seccion); setMenuSeccion(null); }}
                          className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-200 hover:bg-gray-700 w-full">
                          <RefreshCw size={13} className="text-blue-400" /> Diagnosticar
                        </button>
                      )}
                      <button onClick={() => { setConfirmDelete({ tipo: 'seccion', id: seccion.id }); setMenuSeccion(null); }}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-gray-700 w-full border-t border-gray-700">
                        <Trash2 size={13} /> Eliminar proyecto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de tareas */}
              {abierta && (
                <div className="border-t border-gray-800">
                  {diagnosticando && (
                    <div className="px-4 py-2 text-xs text-blue-400 flex items-center gap-2 border-b border-gray-800 bg-blue-950/20">
                      <RefreshCw size={12} className="animate-spin" /> Diagnosticando endpoints...
                    </div>
                  )}

                  {tareasMostradas.length === 0 ? (
                    <div className="py-6 text-center text-gray-600 text-sm">
                      {filtro === 'todos'
                        ? <span>Sin tareas. <button className="text-cyan-500 hover:underline" onClick={() => setModalTarea({ seccionId: seccion.id })}>+ Agregar una</button></span>
                        : 'Sin tareas con este filtro'
                      }
                    </div>
                  ) : (
                    tareasMostradas.map(tarea => {
                      const diag = tarea.diagnosticoUrl ? diagResults[tarea.diagnosticoUrl] : undefined;
                      const vencida = isVencida(tarea);

                      return (
                        <div key={tarea.id}
                          className={`px-4 py-3 border-b border-gray-800 last:border-b-0 transition-colors
                            ${tarea.estado === 'completado' ? 'opacity-55' : ''}
                            ${tarea.estado === 'bloqueado' ? 'bg-red-950/10' : ''}
                            ${tarea.estado === 'en_progreso' ? 'bg-blue-950/10' : ''}
                            ${vencida ? 'bg-orange-950/10' : ''}`}>
                          <div className="flex items-start gap-3">

                            {/* Selector de estado rápido */}
                            <div className="relative group flex-shrink-0 mt-0.5">
                              <button
                                onClick={() => {
                                  const ciclo: EstadoTarea[] = ['pendiente','en_progreso','completado','bloqueado'];
                                  const idx = ciclo.indexOf(tarea.estado);
                                  setEstadoTarea(seccion.id, tarea.id, ciclo[(idx + 1) % ciclo.length]);
                                }}
                                className={`transition-all ${ESTADO_CFG[tarea.estado].color} hover:scale-110`}
                                title="Click para cambiar estado"
                              >
                                {tarea.estado === 'completado' ? <CheckSquare size={17} /> :
                                 tarea.estado === 'en_progreso' ? <Clock size={17} /> :
                                 tarea.estado === 'bloqueado' ? <AlertTriangle size={17} /> :
                                 <Square size={17} />}
                              </button>
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 flex-wrap">
                                <span className={`font-semibold text-sm leading-tight
                                  ${tarea.estado === 'completado' ? 'line-through text-gray-500' : 'text-white'}`}>
                                  {tarea.titulo}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${PRIORIDAD_CFG[tarea.prioridad].badge}`}>
                                  {PRIORIDAD_CFG[tarea.prioridad].label}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${ESTADO_CFG[tarea.estado].bg} ${ESTADO_CFG[tarea.estado].color}`}>
                                  {ESTADO_CFG[tarea.estado].label}
                                </span>
                              </div>

                              {tarea.descripcion && (
                                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{tarea.descripcion}</p>
                              )}

                              {/* Meta info */}
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {tarea.fechaVencimiento && (
                                  <span className={`flex items-center gap-1 text-xs ${vencida ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                                    <Calendar size={10} />
                                    {vencida ? '⚠ ' : ''}{new Date(tarea.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                                {tarea.notas && (
                                  <span className="flex items-center gap-1 text-xs text-gray-600" title={tarea.notas}>
                                    <StickyNote size={10} /> Tiene notas
                                  </span>
                                )}
                              </div>

                              {/* Notas visibles si existen */}
                              {tarea.notas && (
                                <div className="mt-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 italic">
                                  {tarea.notas}
                                </div>
                              )}

                              {/* Resultado diagnóstico */}
                              {diag && !diag.checking && (
                                <div className={`mt-1.5 flex items-center gap-1.5 text-xs rounded-lg px-2 py-1
                                  ${diag.ok ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                                  {diag.ok ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                  <span className="font-mono">{tarea.diagnosticoUrl}</span>
                                  <span className="ml-auto">{diag.msg}</span>
                                </div>
                              )}
                            </div>

                            {/* Menú tarea */}
                            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setMenuTarea(menuTarea?.tareaId === tarea.id ? null : { tareaId: tarea.id, seccionId: seccion.id })}
                                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-gray-400">
                                <MoreVertical size={14} />
                              </button>
                              {menuTarea?.tareaId === tarea.id && (
                                <div className="absolute right-0 top-7 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-20 min-w-36">
                                  <button onClick={() => { setModalTarea({ seccionId: seccion.id, tarea }); setMenuTarea(null); }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 w-full">
                                    <Edit3 size={12} className="text-yellow-400" /> Editar
                                  </button>
                                  {(['pendiente','en_progreso','completado','bloqueado'] as EstadoTarea[]).map(est => (
                                    <button key={est} onClick={() => { setEstadoTarea(seccion.id, tarea.id, est); setMenuTarea(null); }}
                                      className={`flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 w-full ${ESTADO_CFG[est].color} ${tarea.estado === est ? 'bg-gray-700' : ''}`}>
                                      {est === 'completado' ? <CheckSquare size={12} /> : est === 'en_progreso' ? <Clock size={12} /> : est === 'bloqueado' ? <AlertTriangle size={12} /> : <Square size={12} />}
                                      {ESTADO_CFG[est].label}
                                    </button>
                                  ))}
                                  <button onClick={() => { setConfirmDelete({ tipo: 'tarea', id: tarea.id, seccionId: seccion.id }); setMenuTarea(null); }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-700 w-full border-t border-gray-700">
                                    <Trash2 size={12} /> Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Botón agregar tarea al final */}
                  <button onClick={() => setModalTarea({ seccionId: seccion.id })}
                    className="w-full px-4 py-3 flex items-center gap-2 text-xs text-gray-600 hover:text-cyan-400 hover:bg-gray-800 transition-colors">
                    <Plus size={14} /> Agregar tarea a este proyecto
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Botón nuevo proyecto */}
        <button onClick={() => setModalSeccion({})}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 hover:border-cyan-700 text-gray-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
          <FolderPlus size={18} /> Nuevo proyecto
        </button>
      </div>

      {/* ── Stats footer ── */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: total, color: 'text-white' },
            { label: 'Completadas', value: completadas, color: 'text-green-400' },
            { label: 'En progreso', value: enProgreso, color: 'text-blue-400' },
            { label: 'Bloqueadas', value: bloqueadas, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-600 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      </> /* fin vistaActual === 'tareas' */}

      {/* ── Modales ── */}
      {modalTarea && (
        <ModalTarea
          seccionId={modalTarea.seccionId}
          tarea={modalTarea.tarea}
          onSave={saveTarea}
          onClose={() => setModalTarea(null)}
        />
      )}

      {modalSeccion !== null && (
        <ModalSeccion
          seccion={modalSeccion.seccion}
          onSave={saveSeccion}
          onClose={() => setModalSeccion(null)}
        />
      )}

      {/* ── Confirmación de eliminación ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">
              ¿Eliminar {confirmDelete.tipo === 'tarea' ? 'tarea' : 'proyecto'}?
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              {confirmDelete.tipo === 'seccion'
                ? 'Se eliminarán el proyecto y todas sus tareas. Esta acción no se puede deshacer.'
                : 'Esta tarea se eliminará permanentemente.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-bold hover:bg-gray-700">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.tipo === 'tarea' && confirmDelete.seccionId) deleteTarea(confirmDelete.seccionId, confirmDelete.id);
                  else if (confirmDelete.tipo === 'seccion') deleteSeccion(confirmDelete.id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTorreControl;
