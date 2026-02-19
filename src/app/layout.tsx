import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import SitePasswordGate from '@/components/SitePasswordGate';
import './globals.css';

export const metadata: Metadata = {
  title: 'BlinkTest — Thumbnail Testing',
  description: 'Internal thumbnail testing tool for the MrBeast team',
  icons: {
    icon: '/ico.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SitePasswordGate>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SitePasswordGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
