
'use client'

import { VisitorDashboard } from '@/components/visitor-dashboard';
import { Header } from '@/components/header';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <VisitorDashboard />
      </main>
    </div>
  );
}
