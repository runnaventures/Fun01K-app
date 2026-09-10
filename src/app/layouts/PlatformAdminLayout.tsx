// src/app/layouts/PlatformAdminLayout.tsx

import { Outlet } from 'react-router-dom';
import { AdminNavigation } from '@/components/layout/AdminNavigation';
import { Footer } from '@/components/layout/Footer';

export default function PlatformAdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavigation type="platform" />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}