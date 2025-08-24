
'use client'

import { useState, useEffect } from 'react';
import { VisitorDashboard } from '@/components/visitor-dashboard';
import { Header } from '@/components/header';
import type { AccessLog, Visitor } from '@/lib/types';

export default function DashboardPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // Load visitors from localStorage on initial render
  useEffect(() => {
    try {
        const storedVisitors = localStorage.getItem('visitors');
        if (storedVisitors) {
            setVisitors(JSON.parse(storedVisitors));
        }
    } catch (error) {
        console.error("Error reading visitors from localStorage", error);
    }
  }, []);

  // Save visitors to localStorage whenever they change
  useEffect(() => {
      try {
          if (visitors && visitors.length > 0) {
                localStorage.setItem('visitors', JSON.stringify(visitors));
          } else if (visitors?.length === 0) {
                const stored = localStorage.getItem('visitors');
                if(stored) localStorage.removeItem('visitors');
          }
      } catch (error) {
          console.error("Error writing visitors to localStorage", error);
      }
  }, [visitors]);


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
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error("Error writing access logs to localStorage", error);
    }
  }, [accessLogs]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <VisitorDashboard 
          visitors={visitors}
          setVisitors={setVisitors}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
        />
      </main>
    </div>
  );
}
