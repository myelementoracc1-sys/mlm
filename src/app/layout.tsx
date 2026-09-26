import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fast Forward (FF) | MLM & Referral Rewards Platform',
  description: 'Fast Forward manages multi-level referral reward programs, immutable financial ledgers, and compensation plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
