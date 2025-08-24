
'use client'

import { Header } from '@/components/header';
import { CarAccessLogTable } from '@/components/car-access-log-table';

export default function CarHistoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CarAccessLogTable />
      </main>
    </div>
  );
}
