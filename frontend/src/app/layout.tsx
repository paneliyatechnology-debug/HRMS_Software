import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SocketProvider } from '../context/SocketContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Paneliya HRMS — Enterprise Workforce & Talent Management System',
  description: 'Production-ready Human Resource Management System with complete employee lifecycle management, biometric attendance, payroll calculation, ATS recruitment, and compliance reporting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full light`}>
      <body className="min-h-screen bg-[#eceff3] text-slate-900 selection:bg-slate-900 selection:text-white p-2 sm:p-4 lg:p-6 flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
