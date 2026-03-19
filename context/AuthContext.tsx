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
  firebaseUid?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: AirtableProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole;
  userName: string;
  setProfile: (profile: AirtableProfile) => void;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AirtableProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('Turista' as UserRole);

  // Escuchar cambios de autenticacion Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        // Usuario autenticado → obtener perfil de Airtable
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/firebase-auth/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const data = await response.json();
          if (data.success && data.user) {
            setUserProfile(data.user);
            setUserRole(data.user.role as UserRole);
          }
        } catch (err) {
          console.error('Error obteniendo perfil:', err);
        }
      } else {
        // No autenticado
        setUserProfile(null);
        setUserRole('Turista' as UserRole);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setProfile = useCallback((profile: AirtableProfile) => {
    setUserProfile(profile);
    setUserRole(profile.role as UserRole);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    setUserRole('Turista' as UserRole);
    // Limpiar localStorage legacy
    localStorage.removeItem('admin_session');
    localStorage.removeItem('user_session');
    localStorage.removeItem('partner_session');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('partner_data');
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerData');
    localStorage.removeItem('admin_authenticated');
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
