import { KeyRound } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-center">
        <KeyRound className="h-7 w-7 text-primary" />
        <h1 className="ml-3 text-2xl font-bold tracking-tight text-foreground">
          AccessKey
        </h1>
      </div>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
