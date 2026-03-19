'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

const navItems = [
  { href: '/', label: 'ホーム', icon: '📊' },
  { href: '/quiz', label: '模擬試験', icon: '📝' },
  { href: '/flashcards', label: '暗記カード', icon: '🃏' },
  { href: '/topics', label: 'トピック', icon: '📖' },
  { href: '/drill', label: '過去問', icon: '🎯' },
  { href: '/doomscroll', label: '用語集', icon: '📜' },
  { href: '/mistakes', label: '間違いノート', icon: '📓' },
  { href: '/settings', label: '設定', icon: '⚙️' },
];

const mobileNavItems = navItems.slice(0, 6);

export default function NavBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col w-56 min-h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 fixed left-0 top-0"
        role="navigation"
        aria-label="メインナビゲーション"
      >
        <div className="mb-8">
          <h1 className="text-xl font-bold text-primary">知財ドリル</h1>
          <p className="text-xs text-slate-500 mt-1">ChizaiDrill</p>
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="text-lg" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
          >
            <span className="text-lg" aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? 'ダークモード' : 'ライトモード'}
          </button>
          <p className="text-xs text-slate-400 text-center">
            第54回 2026年7月12日
          </p>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50"
        role="navigation"
        aria-label="モバイルナビゲーション"
      >
        <ul className="flex justify-around py-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                    isActive ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="text-lg" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
