import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getMe, completeProfileApi } from '../api/auth';
import { supabase } from '../api/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (token) => {
    try {
      const { data } = await getMe();
      setUser(data);
      setNeedsProfile(false);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      if (error.response?.status === 403) {
         // Profile not found! Edge-case for new Google OAuth sign-ins.
         setNeedsProfile(true);
      } else {
         localStorage.removeItem('flowguard_token');
         setUser(null);
         setNeedsProfile(false);
      }
    }
  };

  useEffect(() => {
    // 1. Setup Supabase Auth Listener for OAuth Flow
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        // Only set and fetch if it's an initial sign-in or a new token
        if (localStorage.getItem('flowguard_token') !== session.access_token) {
          localStorage.setItem('flowguard_token', session.access_token);
        }
        
        // Let's ensure we fetch user data (which triggers 403 if no profile)
        // We delay slightly to allow localstorage to settle if needed
        setTimeout(async () => {
          if (!user) {
            await fetchUser(session.access_token);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('flowguard_token');
        setUser(null);
        setNeedsProfile(false);
      }
    });

    // 2. Initial Fetch from localStorage
    const initFetch = async () => {
      const token = localStorage.getItem('flowguard_token');
      if (token) {
        await fetchUser(token);
      }
      setLoading(false);
    };

    initFetch();

    // Listen for unauthorized events to automatically log out
    const handleUnauthorized = () => {
      setUser(null);
      setNeedsProfile(false);
      supabase.auth.signOut();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser(email, password);
    localStorage.setItem('flowguard_token', data.access_token);
    setUser(data.user || data.profile);
    setNeedsProfile(false);
    return data;
  };

  const register = async (userData) => {
    const { data } = await registerUser(userData);
    return data;
  };

  const completeProfile = async (phoneNumber, role, fullName) => {
    const { data } = await completeProfileApi(phoneNumber, role, fullName);
    setUser(data);
    setNeedsProfile(false);
    return data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      await supabase.auth.signOut();
      localStorage.removeItem('flowguard_token');
      setUser(null);
      setNeedsProfile(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, needsProfile, login, register, completeProfile, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
