
'use client'

import { useState, useEffect } from 'react';
import { CarDashboard } from '@/components/car-dashboard';
import { Header } from '@/components/header';
import type { Car, CarLog } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { addOrUpdateCarInFirestore, deleteCarFromFirestore, addOrUpdateCarLogInFirestore, listenToCarsFromFirestore, listenToCarLogsFromFirestore } from '@/lib/firestoreService';

export default function CarsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [carLogs, setCarLogs] = useState<CarLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'rh') {
      router.push('/portaria');
    }
  }, [user, router]);
  
  useEffect(() => {
    if (user?.role === 'rh') {
      setIsLoading(true);

      const unsubscribeCars = listenToCarsFromFirestore((carsData) => {
        setCars(carsData);
        setIsLoading(false);
      });

      const unsubscribeCarLogs = listenToCarLogsFromFirestore((carLogsData) => {
        setCarLogs(carLogsData);
      }, 100);

      return () => {
        unsubscribeCars();
        unsubscribeCarLogs();
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
        <CarDashboard 
          cars={cars}
          setCars={setCars}
          carLogs={carLogs}
          setCarLogs={setCarLogs}
          isLoading={isLoading}
          addOrUpdateCar={addOrUpdateCarInFirestore}
          deleteCar={deleteCarFromFirestore}
          addOrUpdateCarLog={addOrUpdateCarLogInFirestore}
        />
      </main>
    </div>
  );
}
