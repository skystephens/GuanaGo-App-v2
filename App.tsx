
import React, { useState, useEffect, useRef } from 'react';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Taxi from './pages/Taxi';
import Marketplace from './pages/Marketplace';
import Wallet from './pages/Wallet';
import AccountDashboard from './pages/AccountDashboard';
import InteractiveMap from './pages/InteractiveMap'; 
import MapboxRestaurants from './components/MapboxRestaurants';
import GroupQuote from './components/GroupQuote';
import MyItinerary from './pages/MyItinerary';
import DynamicItineraryBuilder from './pages/admin/DynamicItineraryBuilder';
import Planner from './pages/Planner';
import PartnerAccess from './pages/PartnerAccess';

// List Pages
import TourList from './pages/TourList';
import HotelList from './pages/HotelList';
import TaxiList from './pages/TaxiList';
import PackageList from './pages/PackageList';

// RIMM Caribbean Night Pages
import RimmCluster from './pages/RimmCluster';
import MusicEventDetail from './pages/MusicEventDetail';
import ArtistDetail from './pages/ArtistDetail';

// Flow Pages
import Reviews from './pages/Reviews';
import Checkout from './pages/Checkout';

// Auth
import AuthGate from './pages/AuthGate';

// Partner Pages
import Login from './pages/Login';
import PartnerRegister from './pages/PartnerRegister';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerOperations from './pages/partner/PartnerOperations';
import PartnerScanner from './pages/partner/PartnerScanner';
import PartnerWallet from './pages/partner/PartnerWallet';
import PartnerReservations from './pages/partner/PartnerReservations';
import PartnerServices from './pages/partner/PartnerServices';
import PartnerServiceForm from './pages/partner/PartnerServiceForm';
import PartnerServiceDetail from './pages/partner/PartnerServiceDetail';
import PartnerAccommodations from './pages/partner/PartnerAccommodations';
import PartnerDashboardPro from './pages/partner/PartnerDashboardPro';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFinance from './pages/admin/AdminFinance';
import AdminServices from './pages/admin/AdminServices';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminBackend from './pages/admin/AdminBackend';
import AdminCaribbeanNight from './pages/admin/AdminCaribbeanNight';
import AdminArtistas from './pages/admin/AdminArtistas';
import AdminCampanas from './pages/admin/AdminCampanas';
import AdminSocios from './pages/admin/AdminSocios';
import AdminNegociosLocales from './pages/admin/AdminNegociosLocales';
import NegocioLocalPerfil from './pages/partner/NegocioLocalPerfil';
import AdminTasks from './pages/admin/AdminTasks';
import AdminQuotes from './pages/admin/AdminQuotes';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminCivitatis from './pages/admin/AdminCivitatis';
import AdminReservations from './pages/admin/AdminReservations';
import AdminStructureMap from './pages/admin/AdminStructureMap';
import AdminTorreControl from './pages/admin/AdminTorreControl';
import AdminProcedimientosRAG from './pages/admin/AdminProcedimientosRAG';
import AdminMapaMental from './pages/admin/AdminMapaMental';
import AdminOperaciones from './pages/admin/AdminOperaciones';
import AdminCerebro from './pages/admin/AdminCerebro';
import AdminControlPanel from './pages/admin/AdminControlPanel';
import AdminSkyPanel from './pages/admin/AdminSkyPanel';
import AdminCowork from './pages/admin/AdminCowork';
import AdminTaxiZoneEditor from './pages/admin/AdminTaxiZoneEditor';
import GuanaGOCommandCenter from './pages/admin/GuanaGOCommandCenter';
import AdminTraduccion from './pages/admin/AdminTraduccion';

// Artista Portal
import ArtistaPortal from './pages/ArtistaPortal';

// Tour Privado B2C
import TourPrivado from './pages/TourPrivado';

// Catálogo Público B2C (cliente directo / promotores)
import CatalogPublico from './pages/CatalogPublico';

// Portal cliente B2C — cotizaciones
import MisCotizaciones from './pages/MisCotizaciones';

// Coco Art Historia
import CocoArtHistoria from './pages/CocoArtHistoria';

// Vincular Comercio
import VincularComercio from './pages/VincularComercio';
import Proveedores from './pages/Proveedores';
import AliadoDiagnostico from './pages/AliadoDiagnostico';

// Admin — Aliados & Arquitectura
import AdminAliados from './pages/admin/AdminAliados';
import AdminRedAliados from './pages/admin/AdminRedAliados';
import AdminAppArquitectura from './pages/admin/AdminAppArquitectura';
import AdminPreviewRoles from './pages/admin/AdminPreviewRoles';
import AdminEstrategia from './pages/admin/AdminEstrategia';
import AdminHerramientas from './pages/admin/AdminHerramientas';
import AdminChatsAtencion from './pages/admin/AdminChatsAtencion';
import DashboardAvance from './pages/admin/DashboardAvance';
import AdminDinamicas from './pages/admin/AdminDinamicas';

// Páginas B2C nuevas (Turista + Residente)
import ConcursosResidente from './pages/ConcursosResidente';
import EmbajadorPanel from './pages/EmbajadorPanel';
import GamificacionTurista from './pages/GamificacionTurista';

// Unified Panel
import UnifiedPanel from './components/UnifiedPanel';
import UserProfileButton from './components/UserProfileButton';

import Navigation from './components/Navigation';
import LanguageSelector from './components/LanguageSelector';
import GuanaChatbot from './components/GuanaChatbot';
import CotizadorB2C, { CotizadorB2CHandle } from './components/CotizadorB2C';
import CartFloatingBar from './components/CartFloatingBar';
import DirectoryMapbox from './components/DirectoryMapbox';
import PublicQuotePage from './pages/PublicQuotePage';
import { AppRoute, UserRole, QuoteDisplayConfig, DEFAULT_QUOTE_DISPLAY_CONFIG } from './types';
import { useAuth } from './context/AuthContext';
import { GUANA_LOGO } from './constants';

// Sistema de caché local
import { initializeCachedApi } from './services/cachedApi';

const App: React.FC = () => {
  const cotizadorRef = useRef<CotizadorB2CHandle>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [history, setHistory] = useState<AppRoute[]>([]);

  // Auth State (from Firebase AuthContext)
  const { isAuthenticated, userRole, userName, logout, switchRole: authSwitchRole } = useAuth();
  const [detailData, setDetailData] = useState<any>(null);

  // Preview mode — admin simulates another role without logging out
  const [previewMode, setPreviewMode] = useState(false);
  const [previewOriginalRole, setPreviewOriginalRole] = useState<UserRole | null>(null);

  // Cotización pública via URL params ?cot=ID&showTotal=0&showMap=0&pdf=1
  const [publicCotId,     setPublicCotId]     = useState<string | null>(null);
  const [publicQuoteCfg,  setPublicQuoteCfg]  = useState<QuoteDisplayConfig>(DEFAULT_QUOTE_DISPLAY_CONFIG);
  const [publicPrintMode, setPublicPrintMode] = useState(false);

  // Inicializar sistema de caché al arrancar la app + detectar link público
  useEffect(() => {
    initializeCachedApi();
    const params = new URLSearchParams(window.location.search);
    const cotId  = params.get('cot');
    if (cotId) {
      setPublicCotId(cotId);
      setPublicQuoteCfg({
        showTotal:        params.get('showTotal')        !== '0',
        showOptionTotals: params.get('showOptionTotals') !== '0',
        showMap:          params.get('showMap')           !== '0',
      });
      setPublicPrintMode(params.get('pdf') === '1');
      setCurrentRoute(AppRoute.PUBLIC_QUOTE);
    }
    if (params.get('p') === 'proveedores') {
      setCurrentRoute(AppRoute.PROVEEDORES);
    }
    const miscotTel = params.get('miscot');
    if (miscotTel) {
      setDetailData({ telefono: decodeURIComponent(miscotTel) });
      setCurrentRoute(AppRoute.MIS_COTIZACIONES);
    }
  }, []);

  const navigateTo = (route: AppRoute, data?: any) => {
    if (data) setDetailData(data);
    setHistory((prev) => [...prev, currentRoute]);
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    const prevRoute = history[history.length - 1];
    if (prevRoute) {
      setCurrentRoute(prevRoute);
      setHistory((prev) => prev.slice(0, -1));
    } else {
      if (userRole === 'Turista' || userRole === 'Residente') setCurrentRoute(AppRoute.HOME);
      else if (['Socio', 'Aliado', 'Operador', 'Artista'].includes(userRole as string)) setCurrentRoute(AppRoute.PROFILE);
      else setCurrentRoute(AppRoute.ADMIN_DASHBOARD);
    }
  };

  const switchRole = (newRole: UserRole) => {
    authSwitchRole(newRole);
    if (newRole === 'Turista' || newRole === 'Residente' || newRole === 'Local') {
      setCurrentRoute(AppRoute.HOME);
    } else if (['Socio', 'Aliado', 'Operador', 'Artista'].includes(newRole as string)) {
      setCurrentRoute(AppRoute.PROFILE);
    } else if (newRole === 'SuperAdmin') {
      setCurrentRoute(AppRoute.ADMIN_DASHBOARD);
    }
    setHistory([]);
    window.scrollTo(0, 0);
  };

  const startPreview = (role: UserRole, route?: AppRoute) => {
    setPreviewOriginalRole(userRole as UserRole);
    setPreviewMode(true);
    authSwitchRole(role);
    setCurrentRoute(route ?? AppRoute.PROFILE);
    setHistory([]);
    window.scrollTo(0, 0);
  };

  const exitPreview = () => {
    setPreviewMode(false);
    if (previewOriginalRole) authSwitchRole(previewOriginalRole);
    setCurrentRoute(AppRoute.ADMIN_DASHBOARD);
    setHistory([]);
    setPreviewOriginalRole(null);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await logout();
    setHistory([]);
    setCurrentRoute(AppRoute.HOME);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case AppRoute.HOME: return <Home onNavigate={navigateTo} />;
      case AppRoute.UNIFIED_PANEL: return <UnifiedPanel userRole={userRole} onNavigate={navigateTo} onBack={goBack} isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
      case AppRoute.DYNAMIC_ITINERARY: return <Planner onNavigate={navigateTo} onBack={goBack} initialCategory={detailData?.category} />;
      case AppRoute.MY_ITINERARY: return <MyItinerary onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PROFILE:
        if (['Socio', 'Aliado', 'Operador'].includes(userRole as string)) {
          return <NegocioLocalPerfil onLogout={handleLogout} onBack={goBack} onNavigate={navigateTo} />;
        }
        return (
          <AccountDashboard
            onLogout={handleLogout}
            onSwitchRole={switchRole}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );
      case AppRoute.CHECKOUT: return <Checkout onBack={goBack} onNavigate={navigateTo} isAuthenticated={isAuthenticated} />;
      case AppRoute.WALLET: return <Wallet onNavigate={navigateTo} isAuthenticated={isAuthenticated} onLogin={() => navigateTo(AppRoute.PROFILE)} />;
      case AppRoute.INTERACTIVE_MAP: return <InteractiveMap onBack={goBack} />;
      case AppRoute.DIRECTORY: return <DirectoryMapbox />;
      case AppRoute.RESTAURANT_MAP: return <MapboxRestaurants onBack={goBack} />;
      case AppRoute.TOUR_LIST: return <TourList onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.HOTEL_LIST: return <HotelList onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.TAXI_LIST: return <TaxiList onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PACKAGE_LIST: return <PackageList onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.MARKETPLACE: return <Marketplace />;
      case AppRoute.TOUR_DETAIL: return <Detail type="tour" data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.HOTEL_DETAIL: return <Detail type="hotel" data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PACKAGE_DETAIL: return <Detail type="package" data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.TAXI_DETAIL: return <Taxi onBack={goBack} />;
      case AppRoute.REVIEWS: return <Reviews onBack={goBack} />;
      case AppRoute.AUTH_GATE: return (
        <AuthGate
          onAuthenticated={(role) => {
            if (role === 'SuperAdmin' || role === ('Super_Admin' as any)) {
              navigateTo(AppRoute.ADMIN_DASHBOARD);
            } else if (['Socio', 'Aliado', 'Operador', 'Artista'].includes(role)) {
              navigateTo(AppRoute.PROFILE);
            } else {
              navigateTo(AppRoute.HOME);
            }
          }}
          onNavigate={navigateTo}
        />
      );
      case AppRoute.LOGIN: return <Login onBack={() => { authSwitchRole('Turista' as UserRole); navigateTo(AppRoute.PROFILE); }} onNavigate={navigateTo} onLoginSuccess={() => { navigateTo(AppRoute.PARTNER_DASHBOARD_PRO); }} />;
      case AppRoute.PARTNER_ACCESS: return <PartnerAccess onNavigate={navigateTo} />;
      case AppRoute.PARTNER_REGISTER: return <PartnerRegister onBack={goBack} onComplete={() => navigateTo(AppRoute.PARTNER_DASHBOARD_PRO)} />;
        case AppRoute.PARTNER_DASHBOARD: return <PartnerDashboard onNavigate={navigateTo} />;
        case AppRoute.PARTNER_DASHBOARD_PRO: return <PartnerDashboardPro onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppRoute.PARTNER_OPERATIONS: return <PartnerOperations onNavigate={navigateTo} />;
      case AppRoute.PARTNER_SCANNER: return <PartnerScanner onBack={goBack} />;
      case AppRoute.PARTNER_WALLET: return <PartnerWallet />;
      case AppRoute.PARTNER_RESERVATIONS: return <PartnerReservations />;
      case AppRoute.PARTNER_MY_SERVICES: return <PartnerServices onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PARTNER_CREATE_SERVICE: return <PartnerServiceForm onBack={goBack} />;
      case AppRoute.PARTNER_SERVICE_DETAIL: return <PartnerServiceDetail onBack={goBack} onNavigate={navigateTo} data={detailData} />;
      case AppRoute.PARTNER_ACCOMMODATIONS: return <PartnerAccommodations onBack={goBack} />;
      case AppRoute.ADMIN_DASHBOARD: return <AdminDashboard onNavigate={navigateTo} onPreview={startPreview} />;
      case AppRoute.ADMIN_USERS: return <AdminUsers onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_APPROVALS: return <AdminApprovals onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_RESERVATIONS: return <AdminReservations onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_STRUCTURE: return <AdminStructureMap onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_FINANCE: return <AdminFinance />;
      case AppRoute.ADMIN_SERVICES: return <AdminServices onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_BACKEND: return <AdminBackend onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.GROUP_QUOTE: return <GroupQuote />;
      case AppRoute.RIMM_CLUSTER: return <RimmCluster onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.MUSIC_EVENT_DETAIL: return <MusicEventDetail data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ARTIST_DETAIL: return <ArtistDetail data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CARIBBEAN: return <AdminCaribbeanNight onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_ARTISTAS: return <AdminArtistas onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CAMPANAS: return <AdminCampanas onBack={goBack} />;
      case AppRoute.ARTISTA_PORTAL: return <ArtistaPortal onBack={goBack} onNavigate={navigateTo} artistaId={detailData?.artistaId} />;
      case AppRoute.ADMIN_SOCIOS: return <AdminSocios onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_NEGOCIOS_LOCALES: return <AdminNegociosLocales onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_TASKS: return <AdminTasks onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_QUOTES: return <AdminQuotes onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_VOUCHERS: return <AdminVouchers onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CIVITATIS: return <AdminCivitatis onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_TORRE_CONTROL: return <AdminTorreControl onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_PROCEDIMIENTOS_RAG: return <AdminProcedimientosRAG onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_MAPA_MENTAL: return <AdminMapaMental onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_OPERACIONES: return <AdminOperaciones onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CEREBRO: return <AdminCerebro onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CONTROL_PANEL: return <AdminControlPanel onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.TOUR_PRIVADO: return <TourPrivado onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_SKY_PANEL: return <AdminSkyPanel onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_COWORK: return <AdminCowork onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.CATALOG_PUBLICO: return <CatalogPublico onNavigate={navigateTo} onBack={goBack} />;
      case AppRoute.COCO_ART_HISTORIA: return <CocoArtHistoria onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.VINCULAR_COMERCIO: return <VincularComercio onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PROVEEDORES: return <Proveedores onBack={goBack} />;
      case AppRoute.ALIADO_DIAGNOSTICO: return <AliadoDiagnostico onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_ALIADOS: return <AdminAliados onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_RED_ALIADOS: return <AdminRedAliados onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_APP_ARQUITECTURA: return <AdminAppArquitectura onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_PREVIEW_ROLES: return <AdminPreviewRoles onBack={goBack} onNavigate={navigateTo} onPreview={startPreview} />;
      case AppRoute.ADMIN_ESTRATEGIA: return <AdminEstrategia onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_HERRAMIENTAS: return <AdminHerramientas onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CHATS_ATENCION: return <AdminChatsAtencion onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_TAXI_ZONE_EDITOR: return <AdminTaxiZoneEditor onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_DASHBOARD_AVANCE: return <DashboardAvance onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_DINAMICAS: return <AdminDinamicas onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_TRADUCCION: return <AdminTraduccion onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.COMMAND_CENTER: return <GuanaGOCommandCenter onBack={goBack} onNavigate={navigateTo} />;
      // ── Rutas B2C nuevas ────────────────────────────────────────────────────
      case AppRoute.CONCURSOS:        return <ConcursosResidente onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.EMBAJADOR:        return <EmbajadorPanel onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.RETOS:            return <GamificacionTurista onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.MI_VIAJE:         return <MyItinerary onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.MIS_COTIZACIONES: return <MisCotizaciones onBack={goBack} onNavigate={navigateTo} initialTelefono={detailData?.telefono} />;
      case AppRoute.PUBLIC_QUOTE: {
        const cotId = publicCotId || detailData?.cotId;
        const cfg   = detailData?.config ?? publicQuoteCfg;
        return cotId ? <PublicQuotePage cotId={cotId} config={cfg} onBack={goBack} printOnLoad={publicPrintMode} /> : <Home onNavigate={navigateTo} />;
      }
      default: return <Home onNavigate={navigateTo} />;
    }
  };

  const isDark = !['tourist', 'Turista', 'Residente', 'Local'].includes(userRole) && currentRoute !== AppRoute.LOGIN && currentRoute !== AppRoute.PARTNER_REGISTER;

  // Rutas full-screen que no deben tener el shell normal (padding, nav, scroll, etc.)
  const isFullScreenRoute = currentRoute === AppRoute.ADMIN_TAXI_ZONE_EDITOR;

  // Cotización pública vía URL: renderizar sin shell de app (sin nav, sin header admin)
  if (currentRoute === AppRoute.PUBLIC_QUOTE && publicCotId) {
    const cfg = publicQuoteCfg;
    return (
      <PublicQuotePage
        cotId={publicCotId}
        config={cfg}
        printOnLoad={publicPrintMode}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300
      ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* Contenedor principal - responsive: móvil centrado, PC layout completo */}
      <div className={`mx-auto min-h-screen relative
        max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl
        ${isDark ? 'bg-gray-900' : 'bg-gray-50'}
        md:shadow-2xl md:border-x
        ${isDark ? 'md:border-gray-800' : 'md:border-gray-200'}`}>
        
        {/* Header global — selector de idioma siempre visible en todas las pantallas */}
        {!isFullScreenRoute && (
          <header className={`sticky top-0 z-40 px-4 py-2 border-b
            ${isDark ? 'bg-gray-800/95 backdrop-blur border-gray-700' : 'bg-white/95 backdrop-blur border-gray-200'}
            flex items-center justify-between`}>
            <LanguageSelector variant="pills" />
            {isAuthenticated && (
              <UserProfileButton
                isAuthenticated={isAuthenticated}
                userName={userName}
                userRole={userRole}
                onNavigate={navigateTo}
                onLogout={handleLogout}
              />
            )}
          </header>
        )}

        {/* Main content: rutas full-screen toman el 100% sin padding ni scroll */}
        <main className={isFullScreenRoute
          ? 'h-screen overflow-hidden'
          : 'min-h-screen pb-20 md:pb-24 relative overflow-auto'}>
          {renderScreen()}
        </main>

        {/* Navigation: oculto en rutas full-screen que ya tienen su propio header/back */}
        {!isFullScreenRoute && (
          <Navigation currentRoute={currentRoute} onNavigate={navigateTo} role={userRole} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        )}

        {['tourist', 'Turista', 'Local'].includes(userRole) && (
          <CartFloatingBar onNavigate={navigateTo} isAuthenticated={isAuthenticated} />
        )}

        {/* Cotizador B2C + Chat Atención — visible para visitantes anónimos y turistas */}
        {(!isAuthenticated || ['tourist', 'Turista', 'Local', 'Residente'].includes(userRole as string)) &&
          !['partner', 'admin', 'superadmin', 'SuperAdmin', 'Socio', 'Aliado', 'Operador', 'Artista'].includes(userRole as string) && (
          <>
            <GuanaChatbot onCotizar={() => cotizadorRef.current?.open()} />
            <CotizadorB2C ref={cotizadorRef} onNavigate={navigateTo} />
          </>
        )}

        {/* Preview mode floating bar */}
        {previewMode && (
          <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto mx-4 max-w-sm w-full">
              <div className="flex items-center gap-3 bg-indigo-900 border border-indigo-500 rounded-2xl shadow-2xl px-4 py-3">
                <span className="text-xs font-medium text-indigo-200 flex-1">
                  Vista previa: <span className="text-white font-bold">{userRole}</span>
                </span>
                <button
                  onClick={exitPreview}
                  className="text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Volver al Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
