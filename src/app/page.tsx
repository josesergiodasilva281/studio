
'use client'

import { useState } from 'react';
import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';

export default function Home() {
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <AccessControlManager onAddEmployeeClick={() => setIsAddEmployeeDialogOpen(true)} />
        <EmployeeDashboard isAddEmployeeDialogOpen={isAddEmployeeDialogOpen} setIsAddEmployeeDialogOpen={setIsAddEmployeeDialogOpen} />
      </main>
    </div>
  );
}
