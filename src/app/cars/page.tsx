
'use client'

import { useState, useEffect } from 'react';
import { CarDashboard } from '@/components/car-dashboard';
import { Header } from '@/components/header';
import type { Car, CarLog } from '@/lib/types';

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [carLogs, setCarLogs] = useState<CarLog[]>([]);
  
  // Load cars from localStorage
  useEffect(() => {
    try {
      const storedCars = localStorage.getItem('cars');
      if (storedCars) {
        setCars(JSON.parse(storedCars));
      }
    } catch (error) {
      console.error("Error reading cars from localStorage", error);
    }
  }, []);

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

  // Load car logs from localStorage
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('carLogs');
      if (storedLogs) {
        setCarLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error("Error reading car logs from localStorage", error);
    }
  }, []);

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


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CarDashboard 
          cars={cars}
          setCars={setCars}
          carLogs={carLogs}
          setCarLogs={setCarLogs}
          employees={[]}
        />
      </main>
    </div>
  );
}
