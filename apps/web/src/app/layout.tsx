import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// @ts-ignore
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hotel Team Connect | HR Information System',
  description: 'Sistem Informasi HRD Hotel Team Connect',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}