import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserRole } from '../types';

export interface AirtableProfile {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  saldo?: number;
  nivel?: string;
  puntos?: number;
  verificado?: boolean;
  estado?: string;
  tipoCliente?: string | null;
  accesos?: string[];    // módulos admin autorizados
  firebaseUid?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: AirtableProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole;
  userName: string;
  accesos: string[];
  setProfile: (profile: AirtableProfile) => void;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

// El backend usa 'Super_Admin' pero el frontend histórico usa 'SuperAdmin'
function normalizeRole(role: string): UserRole {
  if (role === 'Super_Admin' || role === 'superadmin' || role === 'super_admin') return 'SuperAdmin' as UserRole;
  return role as UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AirtableProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('Turista' as UserRole);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/firebase-auth/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const data = await response.json();
          if (data.success && data.user) {
            const profile: AirtableProfile = {
              ...data.user,
              role: normalizeRole(data.user.role),
            };
            setUserProfile(profile);
            setUserRole(profile.role);
          }
        } catch (err) {
          console.error('Error obteniendo perfil:', err);
        }
      } else {
        setUserProfile(null);
        setUserRole('Turista' as UserRole);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setProfile = useCallback((profile: AirtableProfile) => {
    const normalized: AirtableProfile = {
      ...profile,
      role: normalizeRole(profile.role as string),
    };
    setUserProfile(normalized);
    setUserRole(normalized.role);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    setUserRole('Turista' as UserRole);
    // Limpiar sesiones legacy
    ['admin_session', 'user_session', 'partner_session', 'auth_token',
      'partner_data', 'partnerToken', 'partnerData', 'admin_authenticated'
    ].forEach(k => localStorage.removeItem(k));
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUserRole(role);
  }, []);

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      isAuthenticated: !!firebaseUser && !!userProfile,
      isLoading,
      userRole,
      userName: userProfile?.nombre || firebaseUser?.displayName || 'Usuario',
      accesos: userProfile?.accesos || [],
      setProfile,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
