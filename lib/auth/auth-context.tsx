'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserRole } from '@/lib/supabase/types';

interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone: string | null;
  country: string | null;
  locale: string;
  is_demo: boolean;
}

interface Client {
  id: string;
  user_id: string;
  account_type: string;
  account_status: string | null;
  base_currency: string;
  kyc_status: string;
  kyc_documents_approved: boolean | null;
  bank_verified: boolean;
  country_of_residence: string | null;
  tax_residency: string | null;
  risk_profile: string | null;
  payment_reference_code: string | null;
  member_since: string | null;
  assigned_advisor_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  date_of_birth: string | null;
  date_of_birth_holder2: string | null;
  company_incorporation_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  client: Client | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAdvisor: boolean;
  isClient: boolean;
  isAuditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (session?.user) {
            setUser(session.user);
            await loadUserData(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setClient(null);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as any);

        if ((profileData as any).role === 'CLIENT') {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (clientData) {
            const status = (clientData as any).account_status;

            if (status === 'SUSPENDED' || status === 'DELETED') {
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
              setClient(null);

              const statusText = status === 'SUSPENDED' ? 'suspended' : 'closed';
              throw new Error(`Your account has been ${statusText}. Please contact support for assistance.`);
            }

            setClient(clientData as any);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        role: 'CLIENT',
      } as any);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      const { error: clientError } = await supabase.from('clients').insert({
        user_id: data.user.id,
        account_type: 'INDIVIDUAL',
      } as any);

      if (clientError) {
        console.error('Client creation error:', clientError);
      }

      await loadUserData(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setProfile(null);
    setClient(null);
  };

  const isAdmin = profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN' || profile?.role === 'OPS';
  const isAdvisor = profile?.role === 'ADVISOR';
  const isClient = profile?.role === 'CLIENT';
  const isAuditor = profile?.role === 'AUDITOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        client,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isAdvisor,
        isClient,
        isAuditor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
