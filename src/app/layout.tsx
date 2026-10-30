import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/shell/theme';

export const metadata: Metadata = {
  title: 'Ministry Report',
  description: 'Nyamira congregation of Jehovah’s Witnesses Ministry Report Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}