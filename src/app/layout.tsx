import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blue Lock: Egoist Career Mode | NEL Simulator',
  description:
    'Deep Blue Lock sports management and career simulator. Master Metavision, Chemical Reactions, Flow State, and conquer the Neo Egoist League auction market.',
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
