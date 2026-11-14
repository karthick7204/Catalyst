import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Catalyst | Autonomous AI Engineering Agent',
  description: 'Production AI coding agent triggered by Linear with Human-in-the-loop review',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

