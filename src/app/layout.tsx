import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'SubSense - Recurring Payment & Subscription Leak Detector',
  description:
    'Enterprise-grade threat detection engine for hidden subscriptions, unannounced price hikes, and recurring billing leaks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-black min-h-screen flex flex-col font-sans selection:bg-warning selection:text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
