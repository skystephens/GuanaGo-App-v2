import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { AppRoute, UserRole } from '../types';

interface UserProfileButtonProps {
  isAuthenticated: boolean;
  userName?: string;
  userRole?: UserRole;
  userImage?: string;
  onNavigate?: (route: AppRoute) => void;
  onLogout?: () => void;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  isAuthenticated,
  userName = 'Usuario',
  userRole = 'tourist',
  userImage,
  onNavigate,
  onLogout,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (role: UserRole) => {
    const colors: Record<string, string> = {
      'Turista': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'tourist': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'Socio': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      'Aliado': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      'Operador': 'bg-gradient-to-br from-purple-500 to-purple-600',
      'Artista': 'bg-gradient-to-br from-pink-500 to-pink-600',
      'SuperAdmin': 'bg-gradient-to-br from-red-500 to-red-600',
      'admin': 'bg-gradient-to-br from-red-500 to-red-600',
    };
    return colors[role] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const avatarColor = getAvatarColor(userRole);
  const initials = getInitials(userName || 'User');

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95"
        title={`${userName} (${userRole})`}
      >
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className={`${avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
            {initials}
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-xs font-black text-gray-900 leading-none">{userName}</p>
          <p className="text-[9px] text-gray-500 font-medium">{userRole}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className={`${avatarColor} px-4 py-4 text-white`}>
            <p className="text-sm font-black mb-1">{userName}</p>
            <p className="text-xs opacity-90">{userRole}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {userRole === 'SuperAdmin' ? (
              <>
                <button
                  onClick={() => {
                    onNavigate?.(AppRoute.PROFILE);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-purple-700 text-sm font-medium"
                >
                  <Settings size={16} className="text-purple-600" />
                  Controles Admin
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={() => {
                    onLogout?.();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 text-sm font-bold"
                >
                  <LogOut size={16} />
                  ⚠️ CERRAR SESIÓN ADMIN
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onNavigate?.(AppRoute.PROFILE);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-sm font-medium"
                >
                  <User size={16} className="text-emerald-600" />
                  Mi Perfil
                </button>

                <button
                  onClick={() => {
                    onNavigate?.(AppRoute.PROFILE);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-sm font-medium"
                >
                  <Settings size={16} className="text-blue-600" />
                  Configuración
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={() => {
                    onLogout?.();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 text-sm font-medium"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default UserProfileButton;
