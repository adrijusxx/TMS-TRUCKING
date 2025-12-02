import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { McFilterProvider } from '@/lib/contexts/McFilterContext';
import { Toaster } from 'sonner';
import { ErrorHandler } from '@/components/providers/ErrorHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TMS - Transportation Management System',
  description: 'Custom TMS for trucking fleet management',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('fontSize');
                  if (saved === 'small' || saved === 'medium' || saved === 'large') {
                    document.documentElement.classList.add('font-' + saved);
                    const sizes = { small: '0.875rem', medium: '1rem', large: '1.125rem' };
                    document.documentElement.style.setProperty('--base-font-size', sizes[saved]);
                  } else {
                    document.documentElement.classList.add('font-medium');
                  }
                } catch (e) {
                  document.documentElement.classList.add('font-medium');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              <McFilterProvider>
                <ErrorHandler />
                {children}
              </McFilterProvider>
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
        <Toaster 
          position="bottom-right"
          richColors
          closeButton
          expand={true}
          duration={5000}
        />
      </body>
    </html>
  );
}

