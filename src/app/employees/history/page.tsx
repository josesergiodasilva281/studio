
'use client'

import { Header } from '@/components/header';
import { EmployeeAccessLogTable } from '@/components/employee-access-log-table';

export default function EmployeeHistoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <EmployeeAccessLogTable />
      </main>
    </div>
  );
}
