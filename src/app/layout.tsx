import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SocketProvider } from '../context/SocketContext';
import { OfflineScreen } from '../components/common/OfflineScreen';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'My Own HRMS — Enterprise Workforce & Talent Management System',
  description: 'Production-ready Human Resource Management System with complete employee lifecycle management, biometric attendance, payroll calculation, ATS recruitment, and compliance reporting.',
};

import fs from 'fs';
import path from 'path';

function getLiveEnvConfig() {
  let apiUrl = '';
  let socketUrl = '';
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const apiMatch = content.match(/NEXT_PUBLIC_API_URL\s*=\s*([^\r\n]+)/);
      const socketMatch = content.match(/NEXT_PUBLIC_SOCKET_URL\s*=\s*([^\r\n]+)/);
      if (apiMatch) apiUrl = apiMatch[1].trim();
      if (socketMatch) socketUrl = socketMatch[1].trim();
    }
  } catch (err) {
    console.warn('Could not read .env from disk in layout:', err);
  }

  if (!apiUrl) {
    apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
  if (!socketUrl) {
    socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
  }

  return { apiUrl, socketUrl };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const liveEnv = getLiveEnvConfig();

  return (
    <html lang="en" className={`${inter.variable} h-full light`}>
      <head>
        <script
          id="hrms-live-env"
          dangerouslySetInnerHTML={{
            __html: `window.__HRMS_ENV__ = ${JSON.stringify(liveEnv)};`,
          }}
        />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white m-0 p-0 antialiased font-sans">
        <OfflineScreen />
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
