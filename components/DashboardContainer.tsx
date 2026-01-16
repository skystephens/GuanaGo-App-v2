import React from 'react';
import type { GuanaUser, UserRole } from '../types';

// Placeholder dashboards para cada rol
function TuristaDashboard() {
  return <div className="p-4">Bienvenido Turista 👋<br />Aquí verás tus puntos, retos y recomendaciones.</div>;
}
function LocalDashboard() {
  return (
    <div className="p-4 rounded-2xl bg-black text-yellow-400 border border-yellow-500 shadow-lg">
      <div className="text-sm uppercase tracking-widest font-black text-yellow-500 mb-1">Residente Local</div>
      <div className="text-white font-bold">Bienvenido 👋</div>
      <p className="mt-2 text-yellow-200 text-sm">
        Tus beneficios locales, puntos y retos se mantienen igual que Turista, con estilo propio.
      </p>
      <div className="mt-3 flex gap-2">
        <span className="px-3 py-1 text-xs rounded-full bg-yellow-600 text-black font-black">Puntos</span>
        <span className="px-3 py-1 text-xs rounded-full bg-green-600 text-white font-black">Retos</span>
        <span className="px-3 py-1 text-xs rounded-full bg-red-600 text-white font-black">Premios</span>
      </div>
    </div>
  );
}
function OperadorDashboard() {
  return <div className="p-4">Panel Operador 🏨<br />Gestiona tus establecimientos, reservas y ventas.</div>;
}
function AliadoDashboard() {
  return <div className="p-4">Panel Aliado 🤝<br />Accede a reportes, comisiones y soporte.</div>;
}
function SocioDashboard() {
  return <div className="p-4">Panel Socio 💼<br />Estadísticas, pagos y gestión de socios.</div>;
}
function ArtistaDashboard() {
  return <div className="p-4">Panel Artista 🎤<br />Tus eventos, pagos y perfil artístico.</div>;
}
function SuperAdminDashboard() {
  return <div className="p-4">Panel SuperAdmin 🛡️<br />Acceso total a la administración de la plataforma.</div>;
}

// Componente principal
interface DashboardContainerProps {
  user: GuanaUser | null;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ user }) => {
  if (!user) {
    return <div className="p-4 text-red-500">No hay usuario autenticado.</div>;
  }

  switch (user.role) {
    case 'Turista':
      return <TuristaDashboard />;
    case 'Local':
      return <LocalDashboard />;
    case 'Operador':
      return <OperadorDashboard />;
    case 'Aliado':
      return <AliadoDashboard />;
    case 'Socio':
      return <SocioDashboard />;
    case 'Artista':
      return <ArtistaDashboard />;
    case 'SuperAdmin':
      return <SuperAdminDashboard />;
    default:
      return <div className="p-4">Rol no reconocido: {user.role}</div>;
  }
};

export default DashboardContainer;
