
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';

// Mock user data (replace with a real API call in a real app)
const MOCK_USERS: User[] = [
    { id: '1', username: 'rh', role: 'rh' },
    { id: '2', username: 'portaria1', role: 'portaria' },
    { id: '3', username: 'portaria2', role: 'portaria' },
];

// Mock password data (in a real app, NEVER store passwords in plaintext)
const MOCK_PASSWORDS: { [key: string]: string } = {
    rh: '250250',
    portaria1: '332030',
    portaria2: '102030',
};


interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
        if(user.role === 'rh') {
            router.push('/');
        } else {
            router.push('/portaria');
        }
    }
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const foundUser = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
            const correctPassword = foundUser ? MOCK_PASSWORDS[foundUser.username] === password : false;
            
            if (foundUser && correctPassword) {
                const userToStore = { id: foundUser.id, username: foundUser.username, role: foundUser.role };
                localStorage.setItem('user', JSON.stringify(userToStore));
                setUser(userToStore);
                resolve(userToStore);
            } else {
                reject(new Error('Usuário ou senha inválidos.'));
            }
        }, 500); // Simulate network delay
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const value = { user, login, logout, loading };

  // Don't render protected routes until loading is finished and user is checked
  if (loading && pathname !== '/login') {
     return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }


  return (
    <AuthContext.Provider value={value}>
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
