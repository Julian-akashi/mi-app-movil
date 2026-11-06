import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { initializeDatabase, LocalUser } from '../database';

type AuthContextValue = {
  session: LocalUser | null;
  loading: boolean;
  setSession: (user: LocalUser | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_STORAGE_KEY = '@encuentrafcc/session';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSessionState] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        await initializeDatabase();
        const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          setSessionState(JSON.parse(storedSession) as LocalUser);
        }
      } catch (error) {
        console.error('Error al inicializar la base de datos local:', error);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const setSession = async (user: LocalUser | null) => {
    setSessionState(user);
    if (user) {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  return <AuthContext.Provider value={{ session, loading, setSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
