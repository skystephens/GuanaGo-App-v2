import React from 'react';
import type { UserRole } from '../types';

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
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
        <div className="text-xs font-black uppercase tracking-widest text-purple-500 mb-2">Perfil Artista</div>
        <div className="text-gray-900 font-bold text-lg">Tu vitrina en GuanaGO</div>
        <p className="text-sm text-gray-600 mt-1">
          Presenta tu portafolio: músicos, artesanos, pintores, creadores digitales y makers. Centraliza biografía,
          redes, tarifas y disponibilidad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-1">Productos y Servicios</div>
          <div className="text-sm font-bold text-gray-900">Marketplace & Reservas</div>
          <p className="text-xs text-gray-500 mt-1">
            Publica obras, mercancía, presentaciones privadas y talleres. Recibe pagos y gestiona entregas o agendas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">Subir obra/track</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Sincronizar catálogo</span>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">Configurar envíos</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-1">Ingresos</div>
          <div className="text-sm font-bold text-gray-900">Finanzas rápidas</div>
          <p className="text-xs text-gray-500 mt-1">
            Visualiza ventas, reservas, comisiones y retiros pendientes. Soporta cuentas de artista y de colectivo.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <div className="text-[10px] uppercase">Disponible</div>
              <div className="text-lg">$ 1.250.000</div>
            </div>
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-700">
              <div className="text-[10px] uppercase">Pendiente</div>
              <div className="text-lg">$ 540.000</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-1">Agenda</div>
          <div className="text-sm font-bold text-gray-900">Shows y pedidos</div>
          <p className="text-xs text-gray-500 mt-1">
            Administra horarios de presentaciones, ferias de artesanía, entregas y clases personalizadas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">Disponibilidad</span>
            <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700">Solicitudes</span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">Contratos</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-1">Comunidad</div>
          <div className="text-sm font-bold text-gray-900">Colaboraciones</div>
          <p className="text-xs text-gray-500 mt-1">
            Conecta con músicos, artesanos y venues; lanza colecciones colaborativas y experiencias mixtas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">Lanzar colaboración</span>
            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700">Networking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function SuperAdminDashboard() {
  return <div className="p-4">Panel SuperAdmin 🛡️<br />Acceso total a la administración de la plataforma.</div>;
}

// Componente principal
interface DashboardContainerProps {
  user: any;
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
