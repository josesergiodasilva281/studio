
'use client'

import { Header } from '@/components/header';
import { EmployeeAccessLogTable } from '@/components/employee-access-log-table';
import { VisitorAccessLogTable } from '@/components/visitor-access-log-table';
import { CarAccessLogTable } from '@/components/car-access-log-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CarIcon, Shield, History } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'supervisor') {
      // Redirect other roles away, or handle as needed
      if (user.role === 'rh') router.push('/');
      else if (user.role === 'portaria') router.push('/portaria');
    }
  }, [user, router]);

  if (!user || user.role !== 'supervisor') {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
         <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center">
                <History className="mr-2 h-6 w-6" />
                Histórico Geral
              </h2>
              <p className="text-muted-foreground">
                Consulte os registros de acesso de funcionários, visitantes e da frota.
              </p>
            </div>
          </div>
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="employees"><Shield className="mr-2 h-4 w-4" />Funcionários</TabsTrigger>
            <TabsTrigger value="visitors"><Users className="mr-2 h-4 w-4" />Visitantes</TabsTrigger>
            <TabsTrigger value="cars"><CarIcon className="mr-2 h-4 w-4" />Frota</TabsTrigger>
          </TabsList>
          <TabsContent value="employees">
            <EmployeeAccessLogTable readOnly />
          </TabsContent>
          <TabsContent value="visitors">
            <VisitorAccessLogTable readOnly />
          </TabsContent>
          <TabsContent value="cars">
            <CarAccessLogTable readOnly />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
