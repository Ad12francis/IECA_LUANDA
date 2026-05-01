import React, { useEffect, useState, createContext, useContext } from 'react';
import { AppUser, UserRole } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => false,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ieca_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const q = query(
        collection(db, 'users'), 
        where('email', '==', email.toLowerCase().trim()),
        where('password', '==', pass)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as AppUser;
        
        if (userData.isActive === false) {
          console.warn("Utilizador desativado.");
          return false;
        }

        // Salva backup local do usuário logado
        localStorage.setItem('ieca_user_backup', JSON.stringify(userData));

        setUser(userData);
        localStorage.setItem('ieca_user', JSON.stringify(userData));
        return true;
      }
      
      // Fallback para backup local se o login falhar por rede/quota
      const backup = localStorage.getItem('ieca_user_backup');
      if (backup) {
        const bUser = JSON.parse(backup) as AppUser;
        if (bUser.email === email.toLowerCase().trim() && bUser.password === pass) {
           setUser(bUser);
           return true;
        }
      }
      // Keep master fallback for first-time setup if needed or remove it
      if (email === 'admin@sinodo.ao' && pass === 'admin123') {
        const adminUser: AppUser = {
          id: 'master_01',
          email: 'admin@sinodo.ao',
          name: 'Administrador Master',
          role: UserRole.MASTER
        };
        setUser(adminUser);
        localStorage.setItem('ieca_user', JSON.stringify(adminUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ieca_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === UserRole.MASTER, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
