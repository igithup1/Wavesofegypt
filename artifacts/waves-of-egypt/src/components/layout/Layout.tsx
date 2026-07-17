import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieNotice from '@/components/ui/CookieNotice';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
      <CookieNotice />
    </div>
  );
}
