
'use client'

import { KeyRound, GanttChartSquare, Users } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';


export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Controle de Acesso', icon: KeyRound },
    { href: '/dashboard', label: 'Visitantes', icon: Users },
    { href: '/history', label: 'Histórico', icon: GanttChartSquare },
  ];

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card text-card-foreground shadow-sm">
      <div className="flex items-center">
        <KeyRound className="h-7 w-7 text-primary" />
        <h1 className="ml-3 text-2xl font-bold tracking-tight text-foreground">
          VIDEIRA
        </h1>
      </div>
      <nav className="ml-10 flex items-center gap-4 sm:gap-6">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="ghost"
              className={cn(
                "text-sm font-medium",
                pathname === link.href ? "text-primary" : "text-muted-foreground",
                "hover:text-primary"
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
