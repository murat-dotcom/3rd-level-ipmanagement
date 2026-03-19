'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress, isDueForReview, getFlashcardState } from '@/lib/storage';
import { allFlashcards } from '@/data/flashcards';
import { UserProgress, SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';

function getSubjectAccuracy(progress: UserProgress, subject: SubjectSlug): number {
  const relevant = progress.quizHistory.filter((q) => q.total > 0);
  if (relevant.length === 0) return 0;
  // Simple approximation: overall score as percentage
  const totalScore = relevant.reduce((sum, q) => sum + q.score, 0);
  const totalQuestions = relevant.reduce((sum, q) => sum + q.total, 0);
  if (totalQuestions === 0) return 0;
  return Math.round((totalScore / totalQuestions) * 100);
}

export default function Dashboard() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  if (!progress) {
    return <div className="p-6 text-center text-slate-500">読み込み中...</div>;
  }

  const dueCards = allFlashcards.filter((fc) =>
    isDueForReview(getFlashcardState(progress, fc.id))
  ).length;

  const recentQuizzes = progress.quizHistory.slice(-5).reverse();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">知財ドリル</h1>
        <p className="text-sm text-slate-500 mt-1">知的財産管理技能検定 3級 学習アプリ</p>
      </div>

      {/* Streak & Due Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-accent">{progress.streakDays}</p>
          <p className="text-sm text-slate-600">連続学習日数</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-primary">{dueCards}</p>
          <p className="text-sm text-slate-600">復習カード</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/quiz"
            className="bg-primary text-white rounded-xl p-4 text-center font-medium hover:bg-blue-900 transition-colors"
          >
            模擬試験を始める
          </Link>
          <Link
            href="/flashcards"
            className="bg-accent text-white rounded-xl p-4 text-center font-medium hover:bg-amber-600 transition-colors"
          >
            今日の暗記カード ({dueCards}枚)
          </Link>
          <Link
            href="/drill"
            className="bg-emerald-600 text-white rounded-xl p-4 text-center font-medium hover:bg-emerald-700 transition-colors"
          >
            苦手分野を復習
          </Link>
        </div>
      </div>

      {/* Subject Mastery */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h2 className="text-lg font-bold mb-4">科目別マスター度</h2>
        <div className="space-y-3">
          {ALL_SUBJECTS.map((subject) => {
            const accuracy = getSubjectAccuracy(progress, subject);
            return (
              <div key={subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{SUBJECT_LABELS[subject]}</span>
                  <span className={accuracy >= 70 ? 'text-success font-bold' : 'text-slate-500'}>
                    {accuracy}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${accuracy >= 70 ? 'bg-success' : accuracy >= 40 ? 'bg-accent' : 'bg-slate-400'}`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Quiz Results */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h2 className="text-lg font-bold mb-4">最近の試験結果</h2>
        {recentQuizzes.length === 0 ? (
          <p className="text-sm text-slate-500">まだ試験を受けていません</p>
        ) : (
          <div className="space-y-2">
            {recentQuizzes.map((quiz, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-sm">{quiz.date}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    {quiz.type === 'gakka' ? '学科' : '実技'}
                  </span>
                </div>
                <div className={`font-bold ${quiz.score / quiz.total >= 0.7 ? 'text-success' : 'text-error'}`}>
                  {quiz.score}/{quiz.total}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-bold text-primary mb-2">次回試験情報</h3>
        <p className="text-sm">第54回 知的財産管理技能検定</p>
        <p className="text-sm">2026年7月12日（日）</p>
        <p className="text-sm text-slate-600 mt-1">合格基準: 学科・実技ともに70%以上（30問中21問以上）</p>
      </div>
    </div>
  );
}
