import { Dashboard } from '@/components/dashboard';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
    </div>
  );
}
