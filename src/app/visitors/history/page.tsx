
'use client'

import { Header } from '@/components/header';
import { VisitorAccessLogTable } from '@/components/visitor-access-log-table';

export default function VisitorHistoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <VisitorAccessLogTable />
      </main>
    </div>
  );
}
