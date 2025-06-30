import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { EmailIntegrationProvider } from '@/contexts/EmailIntegrationContext';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobTracker - Manage Your Job Applications',
  description: 'A modern dashboard for tracking job applications and managing your job search.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <EmailIntegrationProvider>
              {children}
              <Toaster />
            </EmailIntegrationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}