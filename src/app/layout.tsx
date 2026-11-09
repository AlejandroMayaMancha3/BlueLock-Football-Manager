import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blue Lock: European Leagues Career Mode | Manager & Simulator',
  description:
    'Deep Blue Lock sports management and career simulator. Master Metavision, Chemical Reactions, Flow State, and conquer the European Leagues pyramid across 5 nations.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-bl-dark text-slate-100 antialiased selection:bg-bl-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
