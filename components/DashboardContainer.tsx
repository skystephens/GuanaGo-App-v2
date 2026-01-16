import React from 'react';
import type { GuanaUser, UserRole } from '../types';

// Placeholder dashboards para cada rol
function TuristaDashboard() {
  return <div className="p-4">Bienvenido Turista 👋<br />Aquí verás tus puntos, retos y recomendaciones.</div>;
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
