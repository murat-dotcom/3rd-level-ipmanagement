'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress, getGameHighScore } from '@/lib/storage';
import { UserProgress, GameType } from '@/types/question';

const games: { id: GameType; href: string; title: string; description: string; icon: string; color: string }[] = [
  {
    id: 'matching',
    href: '/games/matching',
    title: '用語マッチング',
    description: '5つの用語と定義を正しくペアにしよう。速く正確にマッチするほど高得点！',
    icon: '🔗',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'speed',
    href: '/games/speed',
    title: 'タイムアタック',
    description: '60秒間で何問正解できるか挑戦！知識のスピードを試そう。',
    icon: '⚡',
    color: 'from-orange-500 to-yellow-400',
  },
  {
    id: 'truefalse',
    href: '/games/truefalse',
    title: '○×ブリッツ',
    description: '用語と定義の組み合わせが正しいか瞬時に判断！連続正解でコンボボーナス。',
    icon: '⭕',
    color: 'from-emerald-500 to-teal-400',
  },
];

export default function GamesHub() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">ゲームセンター</h1>
        <p className="text-sm text-t-muted mt-1">楽しみながら知財用語をマスターしよう</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const highScore = progress ? getGameHighScore(progress, game.id) : 0;
          return (
            <Link key={game.id} href={game.href} className="block group">
              <div className="theme-card p-5 h-full flex flex-col gap-3 theme-card-hover transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl shadow-sm`}>
                  {game.icon}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-t-primary text-lg">{game.title}</h2>
                  <p className="text-sm text-t-secondary mt-1 leading-relaxed">{game.description}</p>
                </div>
                {highScore > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-t-muted">
                      ハイスコア: <span className="font-bold text-primary">{highScore.toLocaleString()}</span>点
                    </p>
                  </div>
                )}
                <div className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                  プレイする →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tips */}
      <div className="theme-card theme-gradient p-4">
        <p className="font-semibold text-primary text-sm">ゲームのコツ</p>
        <ul className="text-sm text-t-secondary mt-2 space-y-1">
          <li>・マッチングは素早くペアを見つけると時間ボーナスが加算されます</li>
          <li>・タイムアタックは連続正解でスコア倍率がアップします</li>
          <li>・○×ブリッツはコンボを途切れさせないのがハイスコアの鍵です</li>
        </ul>
      </div>
    </div>
  );
}
