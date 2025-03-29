import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Startup DAO',
  description: 'Decentralized funding for innovative startups',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
