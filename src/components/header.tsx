
'use client'

import { KeyRound, Users, Car, Shield, LogOut, UserCircle } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';


export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { href: '/', label: 'RH', icon: KeyRound, role: 'rh' },
    { href: '/portaria', label: 'Portaria', icon: Shield, role: 'portaria' },
    { href: '/dashboard', label: 'Visitantes', icon: Users, role: 'rh' },
    { href: '/cars', label: 'Carros', icon: Car, role: 'rh' },
  ];

  const availableLinks = navLinks.filter(link => {
    if (user?.role === 'rh') return true;
    if (user?.role === 'portaria' && link.role === 'portaria') return true;
    return false;
  });
  

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card text-card-foreground shadow-sm">
      <Link href="/" className="flex items-center">
        <KeyRound className="h-7 w-7 text-primary" />
        <h1 className="ml-3 text-2xl font-bold tracking-tight text-foreground">
          VIDEIRA
        </h1>
      </Link>
      <nav className="ml-10 flex items-center gap-4 sm:gap-6">
        {user?.role === 'rh' && (
          <>
            <Link href="/">
              <Button variant="ghost" className={cn("text-sm font-medium", pathname === '/' ? "text-primary" : "text-muted-foreground", "hover:text-primary")}>
                <KeyRound className="mr-2 h-4 w-4" /> RH
              </Button>
            </Link>
             <Link href="/dashboard">
              <Button variant="ghost" className={cn("text-sm font-medium", pathname.startsWith('/dashboard') ? "text-primary" : "text-muted-foreground", "hover:text-primary")}>
                <Users className="mr-2 h-4 w-4" /> Visitantes
              </Button>
            </Link>
             <Link href="/cars">
              <Button variant="ghost" className={cn("text-sm font-medium", pathname.startsWith('/cars') ? "text-primary" : "text-muted-foreground", "hover:text-primary")}>
                <Car className="mr-2 h-4 w-4" /> Carros
              </Button>
            </Link>
          </>
        )}
        {user?.role === 'portaria' && (
          <Link href="/portaria">
            <Button variant="ghost" className={cn("text-sm font-medium", pathname.startsWith('/portaria') ? "text-primary" : "text-muted-foreground", "hover:text-primary")}>
              <Shield className="mr-2 h-4 w-4" /> Portaria
            </Button>
          </Link>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserCircle className="h-5 w-5" />
            <span>Olá, {user.username}</span>
          </div>
        )}
        <ThemeToggle />
        {user && (
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        )}
      </div>
    </header>
  );
}
