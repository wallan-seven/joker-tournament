'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('jt_token');
    const user = localStorage.getItem('jt_usuario');
    if (token && user) {
      setUsuario(user);
    }
    setLoading(false);
  }, []);

  async function login(usuario, senha) {
    const data = await api.login(usuario, senha);
    localStorage.setItem('jt_token', data.token);
    localStorage.setItem('jt_usuario', data.usuario);
    setUsuario(data.usuario);
    router.push('/');
  }

  function logout() {
    localStorage.removeItem('jt_token');
    localStorage.removeItem('jt_usuario');
    setUsuario(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
