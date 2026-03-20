'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

const navItems = [
  { href: '/', label: 'ホーム', icon: '📊', mobileIcon: '📊' },
  { href: '/quiz', label: '模擬試験', icon: '📝', mobileIcon: '📝' },
  { href: '/flashcards', label: '暗記カード', icon: '🃏', mobileIcon: '🃏' },
  { href: '/topics', label: 'トピック', icon: '📖', mobileIcon: '📖' },
  { href: '/drill', label: '過去問', icon: '🎯', mobileIcon: '🎯' },
  { href: '/doomscroll', label: '用語集', icon: '📜', mobileIcon: '📜' },
  { href: '/games', label: 'ゲーム', icon: '🎮', mobileIcon: '🎮' },
  { href: '/mistakes', label: '間違いノート', icon: '📓', mobileIcon: '📓' },
  { href: '/settings', label: '設定', icon: '⚙️', mobileIcon: '⚙️' },
];

const mobileNavItems = navItems.filter((item) => !['/mistakes', '/settings'].includes(item.href));

export default function NavBar() {
  const pathname = usePathname();
  const { mode, toggleMode } = useTheme();

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col w-56 min-h-screen theme-nav border-r fixed left-0 top-0 z-50"
        role="navigation"
        aria-label="メインナビゲーション"
      >
        {/* Logo area */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">知</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-t-primary">知財ドリル</h1>
              <p className="text-[10px] text-t-muted tracking-wide">ChizaiDrill</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-border/50" />

        {/* Nav items */}
        <ul className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-t-secondary hover:bg-surface-alt hover:text-t-primary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="text-base w-5 text-center" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2">
          <div className="mx-1 border-t border-border/50 mb-3" />
          <button
            onClick={toggleMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-t-secondary hover:bg-surface-alt transition-all"
            aria-label={mode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
          >
            <span className="text-base w-5 text-center" aria-hidden="true">{mode === 'light' ? '🌙' : '☀️'}</span>
            {mode === 'light' ? 'ダークモード' : 'ライトモード'}
          </button>
          <div className="px-3 py-2">
            <p className="text-[10px] text-t-muted text-center">
              第54回 2026年7月12日
            </p>
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 theme-nav border-t z-50"
        role="navigation"
        aria-label="モバイルナビゲーション"
      >
        <ul className="flex justify-around py-1.5 px-1">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] transition-all ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-t-muted'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}
                    aria-hidden="true"
                  >
                    {item.mobileIcon}
                  </span>
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
