'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getProgress, isDueForReview, getFlashcardState, getDailyProgress, getWeakSubjects } from '@/lib/storage';
import { allFlashcards } from '@/data/flashcards';
import { allTopics } from '@/data/topics';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { UserProgress, SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';
import ProgressChart from '@/components/ProgressChart';
import DailyGoalRing from '@/components/DailyGoalRing';

function getSubjectAccuracy(progress: UserProgress, subject: SubjectSlug): number {
  const relevant = progress.quizHistory.filter((q) => q.subject === subject && q.total > 0);
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

  const topicCounts = useMemo(() => {
    return ALL_SUBJECTS.reduce<Record<SubjectSlug, number>>((acc, subject) => {
      acc[subject] = allTopics.filter((topic) => topic.subject === subject).length;
      return acc;
    }, {} as Record<SubjectSlug, number>);
  }, []);

  if (!progress) {
    return <div className="p-6 text-center text-t-muted" role="status">読み込み中...</div>;
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
  const completedTopics = progress.topicsCompleted.length;
  const totalTopics = allTopics.length;
  const completedTopicsRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const doomscrollReadCount = progress.doomscrollRead?.length || 0;
  const doomscrollCompletion = Math.round((doomscrollReadCount / allDoomscrollTerms.length) * 100);
  const recommendedFocus = weakSubjects[0]?.subject;
  const recommendedTopics = recommendedFocus
    ? allTopics.filter((topic) => topic.subject === recommendedFocus).slice(0, 2)
    : allTopics.slice(0, 2);
  const completedGoalCount = Number(daily.cardsReviewed >= goal.cardsPerDay) + Number(daily.questionsAnswered >= goal.questionsPerDay);
  const motivationalMessage =
    completedGoalCount === 2
      ? '今日の学習目標をすべて達成しました。仕上げに弱点補強へ進みましょう。'
      : completedGoalCount === 1
      ? 'あと1つ目標を達成すれば今日の学習はコンプリートです。'
      : '最初の5分だけでもOK。今日の学習をここから始めましょう。';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">知財ドリル</h1>
          <p className="text-sm text-t-muted mt-1">知的財産管理技能検定 3級 学習アプリ</p>
        </div>
        <div className="theme-card theme-gradient px-4 py-3 text-sm text-t-primary">
          <p className="font-semibold text-primary">今日のナビゲーション</p>
          <p className="mt-1 text-t-secondary">{motivationalMessage}</p>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        {/* Recommended learning route */}
        <div className="theme-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">おすすめ学習ルート</p>
              <h2 className="text-xl font-bold mt-1 text-t-primary">次の一手がすぐ分かるホーム</h2>
            </div>
            <span className="text-3xl" aria-hidden="true">🧭</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link href={dueCards > 0 ? '/flashcards' : '/quiz'} className="rounded-card border border-accent/20 bg-accent/5 p-4 hover:border-accent/40 hover:shadow-sm transition-all">
              <p className="text-xs font-semibold text-accent">STEP 1</p>
              <p className="font-bold mt-1 text-t-primary">復習を片付ける</p>
              <p className="text-sm mt-1 text-t-secondary">期限到来の暗記カード {dueCards} 枚を先に消化。</p>
            </Link>
            <Link href={recommendedFocus ? `/drill?subject=${recommendedFocus}` : '/drill'} className="rounded-card border border-error/20 bg-error/5 p-4 hover:border-error/40 hover:shadow-sm transition-all">
              <p className="text-xs font-semibold text-error">STEP 2</p>
              <p className="font-bold mt-1 text-t-primary">弱点を補強する</p>
              <p className="text-sm mt-1 text-t-secondary">{recommendedFocus ? SUBJECT_LABELS[recommendedFocus] : '苦手分野'} を重点演習。</p>
            </Link>
            <Link href="/doomscroll" className="rounded-card border border-primary/20 bg-primary/5 p-4 hover:border-primary/40 hover:shadow-sm transition-all">
              <p className="text-xs font-semibold text-primary">STEP 3</p>
              <p className="font-bold mt-1 text-t-primary">用語を流し読み</p>
              <p className="text-sm mt-1 text-t-secondary">読了率 {doomscrollCompletion}%。隙間時間の定着に最適。</p>
            </Link>
          </div>
        </div>

        {/* Today's highlights */}
        <div className="theme-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-primary">学習ハイライト</p>
              <h2 className="text-xl font-bold mt-1 text-t-primary">今日の進捗サマリー</h2>
            </div>
            <span className="text-3xl" aria-hidden="true">✨</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-t-muted">トピック完了</p>
              <p className="mt-1 text-2xl font-bold text-primary">{completedTopics}</p>
              <p className="text-xs text-t-muted">全 {totalTopics} レッスン中 {completedTopicsRate}%</p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-t-muted">読了用語</p>
              <p className="mt-1 text-2xl font-bold text-primary">{doomscrollReadCount}</p>
              <p className="text-xs text-t-muted">全 {allDoomscrollTerms.length} 語中 {doomscrollCompletion}%</p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-t-muted">連続学習</p>
              <p className="mt-1 text-2xl font-bold text-accent">{progress.streakDays}日</p>
              <p className="text-xs text-t-muted">毎日5分でも継続が力</p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-t-muted">要復習ミス</p>
              <p className="mt-1 text-2xl font-bold text-error">{mistakeCount}</p>
              <p className="text-xs text-t-muted">解けるまで反復</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily goals */}
      <div className="theme-card p-4">
        <h2 className="text-lg font-bold text-t-primary mb-4">今日の目標</h2>
        <div className="flex justify-center gap-8">
          <DailyGoalRing current={daily.cardsReviewed} goal={goal.cardsPerDay} label="暗記カード" />
          <DailyGoalRing current={daily.questionsAnswered} goal={goal.questionsPerDay} label="問題数" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="theme-card p-4 text-center">
          <p className="text-3xl font-bold text-accent">{progress.streakDays}</p>
          <p className="text-sm text-t-secondary">連続学習日数</p>
        </div>
        <div className="theme-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{dueCards}</p>
          <p className="text-sm text-t-secondary">復習カード</p>
        </div>
        <Link href="/mistakes" className="theme-card theme-card-hover p-4 text-center">
          <p className="text-3xl font-bold text-error">{mistakeCount}</p>
          <p className="text-sm text-t-secondary">間違い問題</p>
        </Link>
        <Link href="/topics" className="theme-card theme-card-hover p-4 text-center">
          <p className="text-3xl font-bold text-success">{completedTopicsRate}%</p>
          <p className="text-sm text-t-secondary">トピック達成率</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-t-primary">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Link href="/quiz" className="bg-primary text-white rounded-card p-4 text-center font-medium hover:bg-primary-hover transition-all shadow-sm hover:shadow-md">
            模擬試験を始める
          </Link>
          <Link href="/flashcards" className="bg-accent text-white rounded-card p-4 text-center font-medium hover:bg-accent-hover transition-all shadow-sm hover:shadow-md">
            今日の暗記カード ({dueCards}枚)
          </Link>
          <Link href={weakSubjects.length > 0 ? `/drill?subject=${weakSubjects[0].subject}` : '/drill'} className="bg-success text-white rounded-card p-4 text-center font-medium hover:opacity-90 transition-all shadow-sm hover:shadow-md">
            {weakSubjects.length > 0 ? `苦手: ${SUBJECT_LABELS[weakSubjects[0].subject]}` : '苦手分野を復習'}
          </Link>
          <Link href="/doomscroll" className="bg-primary/10 text-primary border border-primary/20 rounded-card p-4 text-center font-medium hover:bg-primary/20 transition-all">
            📜 用語をスクロール学習
          </Link>
        </div>
      </div>

      {/* Focus suggestion + Subject progress */}
      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="theme-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-t-primary">フォーカス提案</h2>
            <Link href={recommendedFocus ? `/drill?subject=${recommendedFocus}` : '/drill'} className="text-sm text-primary font-medium hover:underline">演習へ →</Link>
          </div>
          {recommendedFocus ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <p className="text-sm text-t-muted">最優先科目</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-t-primary">{SUBJECT_LABELS[recommendedFocus]}</p>
                    <p className="text-sm text-t-secondary mt-1">理解と得点を同時に上げるなら、関連トピック→ドリル→用語確認の順がおすすめです。</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-t-muted">推定正答率</p>
                    <p className="text-2xl font-bold text-error">{weakSubjects[0].accuracy}%</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendedTopics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.id}`} className="theme-card theme-card-hover p-4">
                    <p className="text-xs font-semibold text-primary">おすすめトピック</p>
                    <p className="font-bold mt-1 text-t-primary">{topic.title}</p>
                    <p className="text-sm text-t-muted mt-1">{topic.sections[0]?.heading}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-surface-alt p-5 text-sm text-t-secondary">
              まだ十分な演習データがありません。まずは模擬試験か分野別ドリルを1回解いて、弱点分析を始めましょう。
            </div>
          )}
        </div>

        <div className="theme-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-t-primary">科目ごとの学習量</h2>
            <Link href="/topics" className="text-sm text-primary font-medium hover:underline">トピック一覧 →</Link>
          </div>
          <div className="space-y-4">
            {ALL_SUBJECTS.map((subject) => {
              const accuracy = getSubjectAccuracy(progress, subject);
              const completedForSubject = progress.topicsCompleted.filter((topicId) => topicId.startsWith(subject)).length;
              const totalForSubject = topicCounts[subject] || 0;
              const completion = totalForSubject > 0 ? Math.round((completedForSubject / totalForSubject) * 100) : 0;
              return (
                <div key={subject} className="rounded-xl bg-surface-alt p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-t-primary">{SUBJECT_LABELS[subject]}</p>
                      <p className="text-xs text-t-muted">トピック {completedForSubject}/{totalForSubject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-t-muted">正答率</p>
                      <p className={`font-bold ${accuracy >= 70 ? 'text-success' : accuracy >= 40 ? 'text-accent' : 'text-error'}`}>{accuracy}%</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t-muted">マスター度</span>
                      <span className="text-t-secondary">{completion}%</span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weak subject alert */}
      {weakSubjects.length > 0 && weakSubjects[0].accuracy < 70 && (
        <div className="theme-card border-error/30 bg-error/5 p-4">
          <h3 className="font-bold text-error mb-2">苦手分野アラート</h3>
          <div className="space-y-1">
            {weakSubjects.filter((s) => s.accuracy < 70).slice(0, 3).map((s) => (
              <div key={s.subject} className="flex justify-between text-sm">
                <span className="text-t-secondary">{SUBJECT_LABELS[s.subject]}</span>
                <span className="text-error font-bold">{s.accuracy}%</span>
              </div>
            ))}
          </div>
          <Link href="/drill" className="text-sm text-primary font-medium hover:underline mt-2 inline-block">
            集中的に復習する →
          </Link>
        </div>
      )}

      {/* Score progress chart */}
      {progress.quizHistory.length >= 2 && (
        <div className="theme-card p-4">
          <h2 className="text-lg font-bold text-t-primary mb-4">成績推移</h2>
          <ProgressChart quizHistory={progress.quizHistory} />
        </div>
      )}

      {/* Recent results */}
      <div className="theme-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-t-primary">最近の試験結果</h2>
          {progress.quizHistory.length > 1 && (
            <Link href="/history" className="text-sm text-primary font-medium hover:underline">
              比較する →
            </Link>
          )}
        </div>
        {recentQuizzes.length === 0 ? (
          <p className="text-sm text-t-muted">まだ試験を受けていません</p>
        ) : (
          <div className="space-y-2">
            {recentQuizzes.map((quiz, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border-light last:border-0">
                <div>
                  <span className="text-sm text-t-primary">{quiz.date}</span>
                  <span className="text-xs text-t-muted ml-2">
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

      {/* Exam info */}
      <div className="theme-card bg-primary/5 border-primary/20 p-4">
        <h3 className="font-bold text-primary mb-2">次回試験情報</h3>
        <p className="text-sm text-t-primary">第54回 知的財産管理技能検定</p>
        <p className="text-sm text-t-primary">2026年7月12日（日）</p>
        <p className="text-sm text-t-secondary mt-1">合格基準: 学科・実技ともに70%以上（30問中21問以上）</p>
      </div>
    </div>
  );
}
