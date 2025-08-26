
'use client'

import { useState, useEffect } from 'react';
import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import type { AccessLog, Car, CarLog, Visitor } from '@/lib/types';
import { VisitorDashboard } from '@/components/visitor-dashboard';
import { CarDashboard } from '@/components/car-dashboard';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CarIcon, Shield } from 'lucide-react';


export default function PortariaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [carLogs, setCarLogs] = useState<CarLog[]>([]);

  useEffect(() => {
    if (user && user.role !== 'portaria') {
        router.push('/');
    }
  }, [user, router]);


  // Load all data from localStorage on initial render
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('accessLogs');
      if (storedLogs) setAccessLogs(JSON.parse(storedLogs));

      const storedVisitors = localStorage.getItem('visitors');
      if (storedVisitors) setVisitors(JSON.parse(storedVisitors));

      const storedCars = localStorage.getItem('cars');
      if (storedCars) setCars(JSON.parse(storedCars));

      const storedCarLogs = localStorage.getItem('carLogs');
      if (storedCarLogs) setCarLogs(JSON.parse(storedCarLogs));

    } catch (error) {
      console.error("Error reading from localStorage", error);
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

  // Save cars to localStorage
  useEffect(() => {
    try {
      if (cars.length > 0) {
        localStorage.setItem('cars', JSON.stringify(cars));
      } else {
        const stored = localStorage.getItem('cars');
        if (stored) localStorage.removeItem('cars');
      }
    } catch (error) {
      console.error("Error writing cars to localStorage", error);
    }
  }, [cars]);

  // Save car logs to localStorage
  useEffect(() => {
    try {
      if (carLogs.length > 0) {
        localStorage.setItem('carLogs', JSON.stringify(carLogs));
        window.dispatchEvent(new Event('storage'));
      } else {
         const stored = localStorage.getItem('carLogs');
         if (stored) localStorage.removeItem('carLogs');
      }
    } catch (error) {
      console.error("Error writing car logs to localStorage", error);
    }
  }, [carLogs]);

  if (!user || user.role !== 'portaria') {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <AccessControlManager 
          onAddEmployeeClick={() => alert('Apenas o RH pode cadastrar funcionários.')}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
        />
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="employees"><Shield className="mr-2 h-4 w-4" />Funcionários</TabsTrigger>
            <TabsTrigger value="visitors"><Users className="mr-2 h-4 w-4" />Visitantes</TabsTrigger>
            <TabsTrigger value="cars"><CarIcon className="mr-2 h-4 w-4" />Frota</TabsTrigger>
          </TabsList>
          <TabsContent value="employees">
            <EmployeeDashboard 
              role="portaria"
              isAddEmployeeDialogOpen={isAddEmployeeDialogOpen} 
              setIsAddEmployeeDialogOpen={setIsAddEmployeeDialogOpen}
              accessLogs={accessLogs}
              setAccessLogs={setAccessLogs}
            />
          </TabsContent>
          <TabsContent value="visitors">
            <VisitorDashboard 
              role="portaria"
              visitors={visitors}
              setVisitors={setVisitors}
              accessLogs={accessLogs}
              setAccessLogs={setAccessLogs}
            />
          </TabsContent>
          <TabsContent value="cars">
            <CarDashboard
              role="portaria"
              cars={cars}
              setCars={setCars}
              carLogs={carLogs}
              setCarLogs={setCarLogs}
              employees={[]}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
