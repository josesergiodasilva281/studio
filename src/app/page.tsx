
'use client'

import { useState, useEffect } from 'react';
import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import type { AccessLog } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { addOrUpdateAccessLogInFirestore, listenToAccessLogsFromFirestore } from '@/lib/firestoreService';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'rh') {
      router.push('/portaria');
    }
  }, [user, router]);


  useEffect(() => {
    if (user?.role === 'rh') {
      setIsLoading(true);
      const unsubscribe = listenToAccessLogsFromFirestore((logs) => {
        setAccessLogs(logs);
        setIsLoading(false);
      }, 100);

      return () => unsubscribe();
    }
  }, [user]);


  if (!user || user.role !== 'rh') {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-2 sm:p-4 lg:p-8 space-y-8">
        <AccessControlManager 
          onAddEmployeeClick={() => setIsAddEmployeeDialogOpen(true)}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
          addOrUpdateLog={addOrUpdateAccessLogInFirestore}
        />
        <EmployeeDashboard 
          role="rh"
          isAddEmployeeDialogOpen={isAddEmployeeDialogOpen} 
          setIsAddEmployeeDialogOpen={setIsAddEmployeeDialogOpen}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
        />
      </main>
    </div>
  );
}
