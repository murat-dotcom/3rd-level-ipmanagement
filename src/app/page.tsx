'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress, isDueForReview, getFlashcardState, getDailyProgress, getWeakSubjects } from '@/lib/storage';
import { allFlashcards } from '@/data/flashcards';
import { UserProgress, SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';
import ProgressChart from '@/components/ProgressChart';
import DailyGoalRing from '@/components/DailyGoalRing';

function getSubjectAccuracy(progress: UserProgress, subject: SubjectSlug): number {
  const relevant = progress.quizHistory.filter((q) => q.total > 0);
  if (relevant.length === 0) return 0;
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
    return <div className="p-6 text-center text-slate-500" role="status">読み込み中...</div>;
  }

  const dueCards = allFlashcards.filter((fc) =>
    isDueForReview(getFlashcardState(progress, fc.id))
  ).length;

  const recentQuizzes = progress.quizHistory.slice(-5).reverse();
  const daily = getDailyProgress(progress);
  const goal = progress.dailyGoal || { cardsPerDay: 20, questionsPerDay: 10 };
  const weakSubjects = getWeakSubjects(progress);
  const mistakeCount = progress.mistakeNotebook
    ? Object.values(progress.mistakeNotebook).filter((m) => !m.mastered).length
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">知財ドリル</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">知的財産管理技能検定 3級 学習アプリ</p>
      </div>

      {/* Daily Goals */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold mb-4">今日の目標</h2>
        <div className="flex justify-center gap-8">
          <DailyGoalRing
            current={daily.cardsReviewed}
            goal={goal.cardsPerDay}
            label="暗記カード"
            color="#F59E0B"
          />
          <DailyGoalRing
            current={daily.questionsAnswered}
            goal={goal.questionsPerDay}
            label="問題数"
            color="#1E40AF"
          />
        </div>
      </div>

      {/* Streak & Due Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-3xl font-bold text-accent">{progress.streakDays}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">連続学習日数</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-3xl font-bold text-primary">{dueCards}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">復習カード</p>
        </div>
        <Link
          href="/mistakes"
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center hover:border-primary transition-colors"
        >
          <p className="text-3xl font-bold text-error">{mistakeCount}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">間違い問題</p>
        </Link>
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
            href={weakSubjects.length > 0 ? `/drill?subject=${weakSubjects[0].subject}` : '/drill'}
            className="bg-emerald-600 text-white rounded-xl p-4 text-center font-medium hover:bg-emerald-700 transition-colors"
          >
            {weakSubjects.length > 0
              ? `苦手: ${SUBJECT_LABELS[weakSubjects[0].subject]}`
              : '苦手分野を復習'}
          </Link>
          <Link
            href="/doomscroll"
            className="bg-purple-600 text-white rounded-xl p-4 text-center font-medium hover:bg-purple-700 transition-colors"
          >
            📜 用語をスクロール学習
          </Link>
        </div>
      </div>

      {/* Weak Area Alert */}
      {weakSubjects.length > 0 && weakSubjects[0].accuracy < 70 && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 border border-error/30">
          <h3 className="font-bold text-error mb-2">苦手分野アラート</h3>
          <div className="space-y-1">
            {weakSubjects.filter((s) => s.accuracy < 70).slice(0, 3).map((s) => (
              <div key={s.subject} className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{SUBJECT_LABELS[s.subject]}</span>
                <span className="text-error font-bold">{s.accuracy}%</span>
              </div>
            ))}
          </div>
          <Link href="/drill" className="text-sm text-primary underline mt-2 inline-block">
            集中的に復習する →
          </Link>
        </div>
      )}

      {/* Progress Chart */}
      {progress.quizHistory.length >= 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold mb-4">成績推移</h2>
          <ProgressChart quizHistory={progress.quizHistory} />
        </div>
      )}

      {/* Subject Mastery */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
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
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2" role="progressbar" aria-valuenow={accuracy} aria-valuemin={0} aria-valuemax={100}>
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
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">最近の試験結果</h2>
          {progress.quizHistory.length > 1 && (
            <Link href="/history" className="text-sm text-primary underline">
              比較する →
            </Link>
          )}
        </div>
        {recentQuizzes.length === 0 ? (
          <p className="text-sm text-slate-500">まだ試験を受けていません</p>
        ) : (
          <div className="space-y-2">
            {recentQuizzes.map((quiz, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
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
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-primary mb-2">次回試験情報</h3>
        <p className="text-sm">第54回 知的財産管理技能検定</p>
        <p className="text-sm">2026年7月12日（日）</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">合格基準: 学科・実技ともに70%以上（30問中21問以上）</p>
      </div>
    </div>
  );
}
