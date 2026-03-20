'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/storage';
import { QuizResult, SUBJECT_LABELS, SubjectSlug } from '@/types/question';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    const progress = getProgress();
    setHistory(progress.quizHistory);
  }, []);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return [prev[1], index];
      return [...prev, index];
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  const comparing = selected.length === 2;
  const a = comparing ? history[selected[0]] : null;
  const b = comparing ? history[selected[1]] : null;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">試験履歴・比較</h1>
      <p className="text-sm text-t-secondary">
        2つの試験結果を選択して比較できます
      </p>

      {comparing && a && b && (
        <div className="theme-card border-primary p-4 space-y-4">
          <h2 className="font-bold text-primary">比較結果</h2>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="font-medium text-t-muted">項目</div>
            <div className="font-bold text-primary">{a.date}</div>
            <div className="font-bold text-accent">{b.date}</div>

            <div className="text-t-secondary">スコア</div>
            <div className={a.score / a.total >= 0.7 ? 'text-success font-bold' : 'text-error font-bold'}>
              {a.score}/{a.total} ({Math.round((a.score / a.total) * 100)}%)
            </div>
            <div className={b.score / b.total >= 0.7 ? 'text-success font-bold' : 'text-error font-bold'}>
              {b.score}/{b.total} ({Math.round((b.score / b.total) * 100)}%)
            </div>

            <div className="text-t-secondary">種別</div>
            <div className="text-t-primary">{a.type === 'gakka' ? '学科' : '実技'}</div>
            <div className="text-t-primary">{b.type === 'gakka' ? '学科' : '実技'}</div>

            <div className="text-t-secondary">時間</div>
            <div className="text-t-primary">{formatTime(a.timeSpent)}</div>
            <div className="text-t-primary">{formatTime(b.timeSpent)}</div>

            <div className="text-t-secondary">間違い数</div>
            <div className="text-error">{a.wrongQuestionIds.length}</div>
            <div className="text-error">{b.wrongQuestionIds.length}</div>

            <div className="col-span-3 pt-2 border-t border-border">
              {(() => {
                const pctA = Math.round((a.score / a.total) * 100);
                const pctB = Math.round((b.score / b.total) * 100);
                const diff = pctB - pctA;
                return (
                  <p className={`font-bold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-t-muted'}`}>
                    {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '±0%'} 変化
                    {diff > 0 ? ' 📈' : diff < 0 ? ' 📉' : ''}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-8 text-t-muted">
          試験履歴がありません
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((quiz, i) => {
            const pct = Math.round((quiz.score / quiz.total) * 100);
            const isSelected = selected.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleSelect(i)}
                className={`w-full text-left theme-card p-4 transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'theme-card-hover'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-t-primary">{quiz.date}</span>
                    <span className="text-xs text-t-muted ml-2">
                      {quiz.type === 'gakka' ? '学科' : '実技'}
                    </span>
                    {quiz.subject && quiz.subject !== 'all' && (
                      <span className="text-xs text-t-muted ml-2">
                        {SUBJECT_LABELS[quiz.subject as SubjectSlug]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${pct >= 70 ? 'text-success' : 'text-error'}`}>
                      {quiz.score}/{quiz.total} ({pct}%)
                    </span>
                    <span className="text-xs text-t-muted">{formatTime(quiz.timeSpent)}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {selected.indexOf(i) + 1}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => router.push('/')}
        className="w-full py-3 bg-surface-alt text-t-secondary rounded-xl font-medium hover:bg-surface-hover transition-colors"
      >
        ダッシュボードへ
      </button>
    </div>
  );
}
