import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';

/**
 * AppLayout Container
 * Main application layout for authenticated/subscriber views (Archive & Library).
 */
export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink font-sans">
      <Navbar />
      <main className="flex-1 w-full bg-white">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
