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

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

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
      <body className="h-full bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white m-0 p-0 antialiased font-sans">
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
