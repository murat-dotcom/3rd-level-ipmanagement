'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getProgress, isDueForReview, getFlashcardState, getDailyProgress, getWeakSubjects } from '@/lib/storage';
import { allFlashcards } from '@/data/flashcards';
import { allQuestions } from '@/data/questions';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { allTopics } from '@/data/topics';
import { UserProgress, SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';
import ProgressChart from '@/components/ProgressChart';
import DailyGoalRing from '@/components/DailyGoalRing';

function getSubjectAccuracy(progress: UserProgress, subject: SubjectSlug): number {
  const relevant = progress.quizHistory.filter((q) => q.total > 0 && q.subject === subject);
  if (relevant.length === 0) return 0;
  const totalScore = relevant.reduce((sum, q) => sum + q.score, 0);
  const totalQuestions = relevant.reduce((sum, q) => sum + q.total, 0);
  if (totalQuestions === 0) return 0;
  return Math.round((totalScore / totalQuestions) * 100);
}

function getReadinessLabel(score: number): string {
  if (score >= 80) return '仕上げ段階';
  if (score >= 60) return '合格圏まであと少し';
  if (score >= 40) return '基礎固め中';
  return '学習をスタート';
}

export default function Dashboard() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const subjectCoverage = useMemo(
    () =>
      ALL_SUBJECTS.map((subject) => ({
        subject,
        questionTotal: allQuestions.filter((q) => q.subject === subject).length,
        flashcardTotal: allFlashcards.filter((card) => card.subject === subject).length,
        termTotal: allDoomscrollTerms.filter((term) => term.subject === subject).length,
      })),
    []
  );

  if (!progress) {
    return <div className="p-6 text-center text-slate-500" role="status">読み込み中...</div>;
  }

  const dueCards = allFlashcards.filter((fc) => isDueForReview(getFlashcardState(progress, fc.id))).length;
  const recentQuizzes = progress.quizHistory.slice(-5).reverse();
  const daily = getDailyProgress(progress);
  const goal = progress.dailyGoal || { cardsPerDay: 20, questionsPerDay: 10 };
  const weakSubjects = getWeakSubjects(progress);
  const mistakeCount = progress.mistakeNotebook ? Object.values(progress.mistakeNotebook).filter((m) => !m.mastered).length : 0;
  const readCount = progress.doomscrollRead?.length || 0;
  const bookmarkCount = progress.doomscrollBookmarks?.length || 0;
  const topicsDone = progress.topicsCompleted.length;
  const totalTopics = allTopics.length;
  const cardsGoalRate = Math.min(100, Math.round((daily.cardsReviewed / Math.max(goal.cardsPerDay, 1)) * 100));
  const questionGoalRate = Math.min(100, Math.round((daily.questionsAnswered / Math.max(goal.questionsPerDay, 1)) * 100));
  const quizAverage = progress.quizHistory.length > 0
    ? Math.round(progress.quizHistory.reduce((sum, quiz) => sum + (quiz.score / quiz.total) * 100, 0) / progress.quizHistory.length)
    : 0;
  const readinessScore = Math.round((cardsGoalRate * 0.2) + (questionGoalRate * 0.2) + (Math.min(readCount / Math.max(allDoomscrollTerms.length, 1), 1) * 100 * 0.2) + (quizAverage * 0.4));
  const topWeakSubject = weakSubjects[0]?.subject;

  const studyRecommendations = [
    dueCards > 0
      ? {
          title: `復習カードを ${dueCards} 枚片付ける`,
          description: '期限切れカードを先に処理して、暗記の抜け漏れを防ぎましょう。',
          href: '/flashcards',
          cta: '暗記カードへ',
          tone: 'from-amber-500 to-orange-500',
        }
      : null,
    topWeakSubject
      ? {
          title: `${SUBJECT_LABELS[topWeakSubject]}を重点対策`,
          description: '弱点科目のドリルに直行して、得点の底上げを狙えます。',
          href: `/drill?subject=${topWeakSubject}`,
          cta: '弱点ドリルへ',
          tone: 'from-rose-500 to-pink-500',
        }
      : null,
    {
      title: bookmarkCount > 0 ? `保存した ${bookmarkCount} 個の用語を見返す` : '用語ドゥームスクロールで知識を広げる',
      description: bookmarkCount > 0 ? 'ブックマークした重要語を短時間で総復習できます。' : '流し読みだけでも、用語の接触回数を増やせます。',
      href: '/doomscroll',
      cta: bookmarkCount > 0 ? '保存用語を見る' : 'ドゥームスクロールへ',
      tone: 'from-violet-500 to-indigo-500',
    },
  ].filter(Boolean) as { title: string; description: string; href: string; cta: string; tone: string }[];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">知財ドリル</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">知的財産管理技能検定 3級 学習アプリ</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-primary to-blue-500 text-white p-4 min-w-[260px] shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Exam readiness</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold">{readinessScore}</p>
              <p className="text-sm text-blue-50">{getReadinessLabel(readinessScore)}</p>
            </div>
            <div className="text-right text-xs text-blue-100">
              <p>平均正答率 {quizAverage}%</p>
              <p>連続学習 {progress.streakDays} 日</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">今日の目標</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">学習の勢いを可視化</span>
          </div>
          <div className="flex justify-center gap-8">
            <DailyGoalRing current={daily.cardsReviewed} goal={goal.cardsPerDay} label="暗記カード" color="#F59E0B" />
            <DailyGoalRing current={daily.questionsAnswered} goal={goal.questionsPerDay} label="問題数" color="#1E40AF" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">用語既読</p>
              <p className="mt-1 text-xl font-bold">{readCount}<span className="text-sm text-slate-400"> / {allDoomscrollTerms.length}</span></p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">保存用語</p>
              <p className="mt-1 text-xl font-bold">{bookmarkCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">トピック学習</p>
              <p className="mt-1 text-xl font-bold">{topicsDone}<span className="text-sm text-slate-400"> 件</span></p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">今やるべきこと</h2>
            <span className="text-xs text-slate-300">おすすめ順</span>
          </div>
          <div className="space-y-3">
            {studyRecommendations.map((item, index) => (
              <Link key={item.title} href={item.href} className={`block rounded-xl bg-gradient-to-r ${item.tone} p-[1px] hover:scale-[1.01] transition-transform`}>
                <div className="rounded-[calc(0.75rem-1px)] bg-slate-950/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">STEP {index + 1}</p>
                      <h3 className="font-semibold mt-1">{item.title}</h3>
                      <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                    </div>
                    <span className="text-sm text-white/80">→</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-3">{item.cta}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-3xl font-bold text-accent">{progress.streakDays}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">連続学習日数</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-3xl font-bold text-primary">{dueCards}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">復習カード</p>
        </div>
        <Link href="/mistakes" className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center hover:border-primary transition-colors">
          <p className="text-3xl font-bold text-error">{mistakeCount}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">間違い問題</p>
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-3xl font-bold text-emerald-600">{quizAverage}%</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">平均正答率</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/quiz" className="bg-primary text-white rounded-xl p-4 text-center font-medium hover:bg-blue-900 transition-colors">模擬試験を始める</Link>
          <Link href="/flashcards" className="bg-accent text-white rounded-xl p-4 text-center font-medium hover:bg-amber-600 transition-colors">今日の暗記カード ({dueCards}枚)</Link>
          <Link href={weakSubjects.length > 0 ? `/drill?subject=${weakSubjects[0].subject}` : '/drill'} className="bg-emerald-600 text-white rounded-xl p-4 text-center font-medium hover:bg-emerald-700 transition-colors">
            {weakSubjects.length > 0 ? `苦手: ${SUBJECT_LABELS[weakSubjects[0].subject]}` : '苦手分野を復習'}
          </Link>
          <Link href="/doomscroll" className="bg-purple-600 text-white rounded-xl p-4 text-center font-medium hover:bg-purple-700 transition-colors">📜 用語をスクロール学習</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">科目別マスター度</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">問題・カード・用語の配分</span>
          </div>
          <div className="space-y-4">
            {ALL_SUBJECTS.map((subject) => {
              const accuracy = getSubjectAccuracy(progress, subject);
              const coverage = subjectCoverage.find((item) => item.subject === subject)!;
              return (
                <div key={subject} className="rounded-xl border border-slate-100 dark:border-slate-700/80 p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{SUBJECT_LABELS[subject]}</span>
                    <span className={accuracy >= 70 ? 'text-success font-bold' : 'text-slate-500'}>{accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2" role="progressbar" aria-valuenow={accuracy} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-2 rounded-full ${accuracy >= 70 ? 'bg-success' : accuracy >= 40 ? 'bg-accent' : 'bg-slate-400'}`} style={{ width: `${accuracy}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>問題 {coverage.questionTotal}</span>
                    <span>カード {coverage.flashcardTotal}</span>
                    <span>用語 {coverage.termTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
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
              <Link href="/drill" className="text-sm text-primary underline mt-2 inline-block">集中的に復習する →</Link>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4">学習カバレッジ</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3">
                <span className="text-slate-600 dark:text-slate-400">収録問題数</span>
                <strong>{allQuestions.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3">
                <span className="text-slate-600 dark:text-slate-400">暗記カード総数</span>
                <strong>{allFlashcards.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3">
                <span className="text-slate-600 dark:text-slate-400">用語ドゥーム総数</span>
                <strong>{allDoomscrollTerms.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3">
                <span className="text-slate-600 dark:text-slate-400">記録済みトピック数</span>
                <strong>{topicsDone}/{totalTopics}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {progress.quizHistory.length >= 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold mb-4">成績推移</h2>
          <ProgressChart quizHistory={progress.quizHistory} />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">最近の試験結果</h2>
          {progress.quizHistory.length > 1 && <Link href="/history" className="text-sm text-primary underline">比較する →</Link>}
        </div>
        {recentQuizzes.length === 0 ? (
          <p className="text-sm text-slate-500">まだ試験を受けていません</p>
        ) : (
          <div className="space-y-2">
            {recentQuizzes.map((quiz, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div>
                  <span className="text-sm">{quiz.date}</span>
                  <span className="text-xs text-slate-500 ml-2">{quiz.type === 'gakka' ? '学科' : '実技'}</span>
                </div>
                <div className={`font-bold ${quiz.score / quiz.total >= 0.7 ? 'text-success' : 'text-error'}`}>{quiz.score}/{quiz.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-primary mb-2">次回試験情報</h3>
        <p className="text-sm">第54回 知的財産管理技能検定</p>
        <p className="text-sm">2026年7月12日（日）</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">合格基準: 学科・実技ともに70%以上（30問中21問以上）</p>
      </div>
    </div>
  );
}
