
'use client'

import { AccessControlManager } from '@/components/access-control-manager';
import { Header } from '@/components/header';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import { AccessLogTable } from '@/components/access-log-table';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <AccessControlManager />
        <AccessLogTable />
        <EmployeeDashboard />
      </main>
    </div>
  );
}
