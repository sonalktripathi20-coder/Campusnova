import React from 'react';
import '@/styles/globals.css';
import { PortalProvider } from '@/context/PortalContext';

export const metadata = {
  title: 'Smart Grievance Portal - Futuristic Dashboard',
  description: 'Enterprise level Next.js portal UI with glassmorphic cards and automated routing engines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Modern font typography stylesheet */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#020617] text-slate-100 min-h-screen bg-cyber-grid bg-radial-glow overflow-x-hidden antialiased">
        <PortalProvider>
          {children}
        </PortalProvider>
      </body>
    </html>
  );
}
