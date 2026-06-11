import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Gym',
  description: 'Premium Fitness Experience',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Fixed Background Layer */}
        <div className="fixed-background" />
        <div className="fixed-overlay" />

        <AuthProvider>
          <UIProvider>
            <Suspense fallback={null}>
              <Sidebar />
              <Navbar />
            </Suspense>
            {/* Main Content moved down to account for fixed header */}
            <div className="pt-[var(--header-height)]">
              {children}
            </div>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
