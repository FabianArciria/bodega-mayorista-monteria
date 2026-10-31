'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, UserRole } from '@/types/database';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    companyName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Perfil Demo para cuando Supabase no está conectado
const DEMO_PROFILES: Record<UserRole, Profile> = {
  admin: {
    id: 'demo-admin-id',
    email: 'admin@bodegamonteria.com',
    full_name: 'Don Carlos Mendoza (Administrador)',
    phone: '3001234567',
    company_name: 'Bodega Mayorista Montería Principal',
    city: 'Montería',
    department: 'Córdoba',
    role: 'admin',
    is_active: true,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
  worker: {
    id: 'demo-worker-id',
    email: 'encargado@bodegamonteria.com',
    full_name: 'Andrés López (Encargado de Bodega)',
    phone: '3217147358',
    company_name: 'Bodega Mayorista Montería',
    city: 'Montería',
    department: 'Córdoba',
    role: 'worker',
    assigned_zone_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
  client: {
    id: 'demo-client-id',
    email: 'cliente@variedadeselcentro.com',
    full_name: 'María Eugenia Gómez',
    phone: '3115551234',
    company_name: 'Variedades & Cosméticos El Centro',
    nit_rut: '900.123.456-1',
    city: 'Cereté',
    department: 'Córdoba',
    role: 'client',
    is_active: true,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(DEMO_PROFILES.client);
  const [role, setRole] = useState<UserRole>('client');
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      // Modo Demo Local: Leer rol demo guardado o usar 'client'
      const savedDemoRole = (localStorage.getItem('demo_selected_role') as UserRole) || 'client';
      setRole(savedDemoRole);
      setProfile(DEMO_PROFILES[savedDemoRole]);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Obtener sesión activa
    async function loadUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Consultar perfil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData as Profile);
            setRole(profileData.role as UserRole);
          }
        }
      } catch (err) {
        console.error('Error cargando usuario de Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserSession();

    // Listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
          setRole(profileData.role as UserRole);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole('client');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    if (!isConfigured) {
      // Simular login demo según email
      let simulatedRole: UserRole = 'client';
      if (email.includes('admin')) simulatedRole = 'admin';
      else if (email.includes('worker') || email.includes('encargado')) simulatedRole = 'worker';

      setRole(simulatedRole);
      setProfile(DEMO_PROFILES[simulatedRole]);
      localStorage.setItem('demo_selected_role', simulatedRole);
      setIsLoading(false);
      return { success: true, role: simulatedRole };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (prof) {
        const userRole = (prof.role as UserRole) || 'client';
        setProfile(prof as Profile);
        setRole(userRole);
        setIsLoading(false);
        return { success: true, role: userRole };
      }
    }

    setIsLoading(false);
    return { success: true, role: 'client' as UserRole };
  };

  const signup = async ({
    email,
    password,
    fullName,
    phone,
    companyName,
  }: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    companyName?: string;
  }) => {
    setIsLoading(true);
    if (!isConfigured) {
      const newProf: Profile = {
        ...DEMO_PROFILES.client,
        email,
        full_name: fullName,
        phone: phone || '',
        company_name: companyName || '',
      };
      setProfile(newProf);
      setRole('client');
      setIsLoading(false);
      return { success: true };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          company_name: companyName,
          role: 'client',
        },
      },
    });

    setIsLoading(false);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setRole('client');
    localStorage.removeItem('demo_selected_role');
  };

  const switchDemoRole = (newRole: UserRole) => {
    setRole(newRole);
    setProfile(DEMO_PROFILES[newRole]);
    localStorage.setItem('demo_selected_role', newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isConfigured,
        login,
        signup,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
