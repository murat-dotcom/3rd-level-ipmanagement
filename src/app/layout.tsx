import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: '知財ドリル — 知的財産管理技能検定3級',
  description: '知的財産管理技能検定3級の学習アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-bg text-slate-900">
        <NavBar />
        <main className="md:ml-56 pb-20 md:pb-8 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
