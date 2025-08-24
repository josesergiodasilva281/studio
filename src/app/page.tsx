
'use client'

import { useState, useEffect } from 'react';
import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import type { AccessLog } from '@/lib/types';

export default function Home() {
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

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
      if (accessLogs.length > 0) {
        localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
        // Dispatch a custom event to notify other components like the history page
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error("Error writing access logs to localStorage", error);
    }
  }, [accessLogs]);


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
          isAddEmployeeDialogOpen={isAddEmployeeDialogOpen} 
          setIsAddEmployeeDialogOpen={setIsAddEmployeeDialogOpen}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
        />
      </main>
    </div>
  );
}
