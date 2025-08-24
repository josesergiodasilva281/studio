
'use client'

import { useState, useEffect } from 'react';
import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import type { AccessLog } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    if (user && user.role !== 'rh') {
      router.push('/portaria');
    }
  }, [user, router]);


  // Load access logs from localStorage on initial render
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('accessLogs');
      if (storedLogs) {
        setAccessLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error("Error reading access logs from localStorage", error);
    }
  }, []);

  // Save access logs to localStorage whenever they change
  useEffect(() => {
    try {
      // Only write to localStorage if accessLogs has been initialized and has items.
      // This prevents overwriting existing logs with an empty array on initial load.
      if (accessLogs.length > 0) {
        localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
        // Dispatch a custom event to notify other components like the history page
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error("Error writing access logs to localStorage", error);
    }
  }, [accessLogs]);

  if (!user || user.role !== 'rh') {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <AccessControlManager 
          onAddEmployeeClick={() => setIsAddEmployeeDialogOpen(true)}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
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
