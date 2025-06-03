import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/layout/client-layout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = {
//   title: 'LADDU ZABARDAST', // Updated website name
//   description: 'Authentic Indian Sweets & Pickles',
// };

export const metadata: Metadata = {
  title: 'LADDU ZABARDAST',
  description: 'Authentic Indian Sweets & Pickles',
  icons: {
    icon: '/images/logo.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen relative`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
