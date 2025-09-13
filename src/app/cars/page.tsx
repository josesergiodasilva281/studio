
'use client'

import { useState, useEffect } from 'react';
import { CarDashboard } from '@/components/car-dashboard';
import { Header } from '@/components/header';
import type { Car, CarLog } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getCarsFromFirestore, getCarLogsFromFirestore, addOrUpdateCarInFirestore, deleteCarFromFirestore, addOrUpdateCarLogInFirestore } from '@/lib/firestoreService';

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
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [carsData, carLogsData] = await Promise.all([
            getCarsFromFirestore(),
            getCarLogsFromFirestore(100)
        ]);
        setCars(carsData);
        setCarLogs(carLogsData);
    } catch (error) {
        console.error("Error fetching car data:", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if(user?.role === 'rh') {
        fetchData();
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
