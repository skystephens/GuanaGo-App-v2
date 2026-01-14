
import React, { useState, useEffect } from 'react';
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

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFinance from './pages/admin/AdminFinance';
import AdminServices from './pages/admin/AdminServices';
import AdminBackend from './pages/admin/AdminBackend';
import AdminCaribbeanNight from './pages/admin/AdminCaribbeanNight';
import AdminArtistas from './pages/admin/AdminArtistas';
import AdminSocios from './pages/admin/AdminSocios';
import AdminTasks from './pages/admin/AdminTasks';

// Artista Portal
import ArtistaPortal from './pages/ArtistaPortal';

import Navigation from './components/Navigation';
import GuanaChatbot from './components/GuanaChatbot';
import DirectoryMapbox from './components/DirectoryMapbox';
import { AppRoute, UserRole } from './types';
import { GUANA_LOGO } from './constants';

// Sistema de caché local
import { initializeCachedApi } from './services/cachedApi';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [history, setHistory] = useState<AppRoute[]>([]);
  
  // Auth State
  const [userRole, setUserRole] = useState<UserRole>('tourist');
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [detailData, setDetailData] = useState<any>(null);

  // Inicializar sistema de caché al arrancar la app
  useEffect(() => {
    initializeCachedApi();
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
      if (userRole === 'tourist') setCurrentRoute(AppRoute.HOME);
      else if (userRole === 'partner') setCurrentRoute(AppRoute.PARTNER_DASHBOARD);
      else setCurrentRoute(AppRoute.ADMIN_DASHBOARD);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'tourist') {
       setIsAuthenticated(false);
       setCurrentRoute(AppRoute.HOME);
    } else {
       setIsAuthenticated(true);
       if (newRole === 'partner') setCurrentRoute(AppRoute.PARTNER_DASHBOARD);
       if (newRole === 'admin') setCurrentRoute(AppRoute.ADMIN_DASHBOARD);
    }
    setHistory([]);
    window.scrollTo(0, 0);
  };

  const handleTouristLogin = () => {
     setIsAuthenticated(true);
     setCurrentRoute(AppRoute.PROFILE); // Ir al dashboard después de login
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('tourist');
    setHistory([]);
    setCurrentRoute(AppRoute.HOME);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case AppRoute.HOME: return <Home onNavigate={navigateTo} />;
      case AppRoute.DYNAMIC_ITINERARY: return <Planner onNavigate={navigateTo} initialCategory={detailData?.category} />;
      case AppRoute.MY_ITINERARY: return <MyItinerary onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PROFILE: return (
        <AccountDashboard 
          isAuthenticated={isAuthenticated} 
          onLogin={handleTouristLogin} 
          onLogout={handleLogout} 
          onSwitchRole={switchRole} 
          onNavigate={navigateTo}
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
      case AppRoute.LOGIN: return <Login onBack={() => { setUserRole('tourist'); navigateTo(AppRoute.PROFILE); }} onNavigate={navigateTo} onLoginSuccess={() => { setIsAuthenticated(true); navigateTo(AppRoute.PARTNER_DASHBOARD); }} />;
      case AppRoute.PARTNER_REGISTER: return <PartnerRegister onBack={goBack} onComplete={() => navigateTo(AppRoute.PARTNER_DASHBOARD)} />;
      case AppRoute.PARTNER_DASHBOARD: return <PartnerDashboard onNavigate={navigateTo} />;
      case AppRoute.PARTNER_OPERATIONS: return <PartnerOperations onNavigate={navigateTo} />;
      case AppRoute.PARTNER_SCANNER: return <PartnerScanner onBack={goBack} />;
      case AppRoute.PARTNER_WALLET: return <PartnerWallet />;
      case AppRoute.PARTNER_RESERVATIONS: return <PartnerReservations />;
      case AppRoute.PARTNER_MY_SERVICES: return <PartnerServices onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.PARTNER_CREATE_SERVICE: return <PartnerServiceForm onBack={goBack} />;
      case AppRoute.PARTNER_SERVICE_DETAIL: return <PartnerServiceDetail onBack={goBack} onNavigate={navigateTo} data={detailData} />;
      case AppRoute.ADMIN_DASHBOARD: return <AdminDashboard onNavigate={navigateTo} />;
      case AppRoute.ADMIN_USERS: return <AdminUsers />;
      case AppRoute.ADMIN_FINANCE: return <AdminFinance />;
      case AppRoute.ADMIN_SERVICES: return <AdminServices />;
      case AppRoute.ADMIN_BACKEND: return <AdminBackend />;
      case AppRoute.GROUP_QUOTE: return <GroupQuote />;
      case AppRoute.RIMM_CLUSTER: return <RimmCluster onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.MUSIC_EVENT_DETAIL: return <MusicEventDetail data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ARTIST_DETAIL: return <ArtistDetail data={detailData} onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_CARIBBEAN_NIGHT: return <AdminCaribbeanNight onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_ARTISTAS: return <AdminArtistas onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ARTISTA_PORTAL: return <ArtistaPortal onBack={goBack} onNavigate={navigateTo} artistaId={detailData?.artistaId} />;
      case AppRoute.ADMIN_SOCIOS: return <AdminSocios onBack={goBack} onNavigate={navigateTo} />;
      case AppRoute.ADMIN_TASKS: return <AdminTasks onBack={goBack} onNavigate={navigateTo} />;
      default: return <Home onNavigate={navigateTo} />;
    }
  };

  const isDark = userRole !== 'tourist' && currentRoute !== AppRoute.LOGIN && currentRoute !== AppRoute.PARTNER_REGISTER;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300
      ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* Contenedor principal - responsive: móvil centrado, PC layout completo */}
      <div className={`mx-auto min-h-screen relative
        max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl
        ${isDark ? 'bg-gray-900' : 'bg-gray-50'}
        md:shadow-2xl md:border-x
        ${isDark ? 'md:border-gray-800' : 'md:border-gray-200'}`}>
        
        <main className="min-h-screen pb-20 md:pb-24 relative overflow-auto">
          {renderScreen()}
        </main>
        
        <Navigation currentRoute={currentRoute} onNavigate={navigateTo} role={userRole} isAuthenticated={isAuthenticated} />

        {userRole === 'tourist' && (
          <GuanaChatbot />
        )}
      </div>
    </div>
  );
};

export default App;
