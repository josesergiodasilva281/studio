
'use client'

import { useState, useEffect } from 'react';
import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import type { AccessLog } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getAccessLogsFromFirestore, addOrUpdateAccessLogInFirestore } from '@/lib/firestoreService';

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

  const fetchAccessLogs = async () => {
    try {
      const logs = await getAccessLogsFromFirestore(100); // Fetch last 100 logs
      setAccessLogs(logs);
    } catch (error) {
      console.error("Error fetching access logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'rh') {
        fetchAccessLogs();
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
