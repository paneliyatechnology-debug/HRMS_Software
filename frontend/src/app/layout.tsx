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
      <body className="min-h-full flex flex-col font-sans bg-[#f4f6fa] text-slate-900 selection:bg-blue-600 selection:text-white">
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
