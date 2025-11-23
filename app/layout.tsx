import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { McFilterProvider } from '@/lib/contexts/McFilterContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TMS - Transportation Management System',
  description: 'Custom TMS for trucking fleet management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              <McFilterProvider>
                {children}
              </McFilterProvider>
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

