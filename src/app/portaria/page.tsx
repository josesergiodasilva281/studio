
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
import { 
    getAccessLogsFromFirestore, 
    addOrUpdateAccessLogInFirestore,
    getVisitorsFromFirestore,
    addOrUpdateVisitorInFirestore,
    deleteVisitorFromFirestore,
    getCarsFromFirestore,
    getCarLogsFromFirestore,
    addOrUpdateCarInFirestore,
    deleteCarFromFirestore,
    addOrUpdateCarLogInFirestore
} from '@/lib/firestoreService';


export default function PortariaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  
  // States for all data types
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [carLogs, setCarLogs] = useState<CarLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'portaria') {
        router.push('/');
    }
  }, [user, router]);


  // Load all data from Firestore on initial render
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [
                logsData,
                visitorsData,
                carsData,
                carLogsData
            ] = await Promise.all([
                getAccessLogsFromFirestore(200), // Fetch more logs for a complete view
                getVisitorsFromFirestore(),
                getCarsFromFirestore(),
                getCarLogsFromFirestore(100)
            ]);

            setAccessLogs(logsData);
            setVisitors(visitorsData);
            setCars(carsData);
            setCarLogs(carLogsData);

        } catch (error) {
            console.error("Error reading from Firestore", error);
        } finally {
            setIsLoading(false);
        }
    };
    if (user?.role === 'portaria') {
        fetchData();
    }
  }, [user]);

  if (!user || user.role !== 'portaria') {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-2 sm:p-4 lg:p-8 space-y-8">
        <AccessControlManager 
          onAddEmployeeClick={() => alert('Apenas o RH pode cadastrar funcionários.')}
          accessLogs={accessLogs}
          setAccessLogs={setAccessLogs}
          addOrUpdateLog={addOrUpdateAccessLogInFirestore}
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
              accessLogs={accessLogs.filter(l => l.personType === 'visitor')}
              setAccessLogs={setAccessLogs}
              isLoading={isLoading}
              addOrUpdateVisitor={addOrUpdateVisitorInFirestore}
              deleteVisitor={deleteVisitorFromFirestore}
              addOrUpdateLog={addOrUpdateAccessLogInFirestore}
            />
          </TabsContent>
          <TabsContent value="cars">
            <CarDashboard
              role="portaria"
              cars={cars}
              setCars={setCars}
              carLogs={carLogs}
              setCarLogs={setCarLogs}
              isLoading={isLoading}
              addOrUpdateCar={addOrUpdateCarInFirestore}
              deleteCar={deleteCarFromFirestore}
              addOrUpdateCarLog={addOrUpdateCarLogInFirestore}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
