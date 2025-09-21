
'use client'

import { useState, useEffect } from 'react';
import { VisitorDashboard } from '@/components/visitor-dashboard';
import { Header } from '@/components/header';
import type { AccessLog, Visitor } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { addOrUpdateVisitorInFirestore, addOrUpdateAccessLogInFirestore, deleteVisitorFromFirestore, listenToVisitorsFromFirestore, listenToAccessLogsFromFirestore } from '@/lib/firestoreService';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
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

      const unsubscribeVisitors = listenToVisitorsFromFirestore((visitorsData) => {
        setVisitors(visitorsData);
        setIsLoading(false);
      });
      
      const unsubscribeLogs = listenToAccessLogsFromFirestore((logsData) => {
        setAccessLogs(logsData.filter(log => log.personType === 'visitor'));
      }, 100);
      
      return () => {
        unsubscribeVisitors();
        unsubscribeLogs();
      };
    }
  }, [user]);


  if (!user || user.role !== 'rh') {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-2 sm:p-4 lg:p-8">
        <VisitorDashboard 
          visitors={visitors}
          setVisitors={setVisitors}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
          isLoading={isLoading}
          addOrUpdateVisitor={addOrUpdateVisitorInFirestore}
          deleteVisitor={deleteVisitorFromFirestore}
          addOrUpdateLog={addOrUpdateAccessLogInFirestore}
        />
      </main>
    </div>
  );
}
