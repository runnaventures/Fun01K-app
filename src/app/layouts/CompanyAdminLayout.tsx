import { Outlet } from 'react-router-dom';
import { AdminNavigation } from '@/components/layout/AdminNavigation';

export default function CompanyAdminLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminNavigation type="company" />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}