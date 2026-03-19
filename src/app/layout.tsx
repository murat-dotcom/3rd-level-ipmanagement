import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import ThemeProvider from '@/components/ThemeProvider';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: '知財ドリル — 知的財産管理技能検定3級',
  description: '知的財産管理技能検定3級の学習アプリ',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1E40AF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="知財ドリル" />
      </head>
      <body className="bg-bg text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <NavBar />
          <main className="md:ml-56 pb-20 md:pb-8 min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
