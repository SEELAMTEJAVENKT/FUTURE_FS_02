import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Sidebar onLogout={signOut} />
      <main className="ml-64">
        <Outlet />
      </main>
    </div>
  );
}
