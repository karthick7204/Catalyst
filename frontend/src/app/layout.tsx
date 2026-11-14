import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PatchCraft | Autonomous AI Engineering Agent',
  description: 'Production AI coding agent triggered by Linear with Human-in-the-loop review',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-warm-bg text-warm-text antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
