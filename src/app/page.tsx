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

  const statCards = [
    { label: '連続学習', value: `${progress.streakDays}日`, hint: '短時間でも継続が強みになります', tone: 'text-primary' },
    { label: '復習カード', value: `${dueCards}枚`, hint: '先に片付けると忘却を防ぎやすい', tone: 'text-accent' },
    { label: '要復習ミス', value: `${mistakeCount}件`, hint: '解き直すほど本番で安定', tone: 'text-error' },
    { label: '用語読了', value: `${doomscrollCompletion}%`, hint: 'スキマ時間の定着も順調です', tone: 'text-success' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-5 md:px-8 md:py-8">
      <section className="hero-panel overflow-hidden p-5 md:p-8">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(var(--c-primary),0.22),transparent_46%),radial-gradient(circle_at_top_left,rgba(var(--c-accent),0.18),transparent_38%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-t-secondary shadow-sm backdrop-blur dark:bg-white/10 dark:border-white/10">
              学習ダッシュボード
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-t-primary md:text-4xl">学習エリアを、落ち着いて集中できるコックピットに。</h1>
              <p className="max-w-2xl text-sm leading-7 text-t-secondary md:text-base">
                何を先にやるか、どこが弱いか、今日どれだけ進んだかを一目で把握できるレイアウトへ整理しました。情報量は保ちつつ、色数を絞って視線の流れを素直にしています。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={dueCards > 0 ? '/flashcards' : '/quiz'} className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-hover">
                {dueCards > 0 ? `復習を始める (${dueCards}枚)` : '模擬試験を始める'}
              </Link>
              <Link href={recommendedFocus ? `/drill?subject=${recommendedFocus}` : '/drill'} className="inline-flex items-center justify-center rounded-2xl border border-primary/20 bg-white/80 px-5 py-3 text-sm font-semibold text-primary backdrop-blur transition hover:border-primary/40 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10">
                苦手分野にフォーカス
              </Link>
            </div>
          </div>

          <div className="glass-panel p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Today</p>
                <h2 className="mt-2 text-xl font-bold text-t-primary">今日のナビゲーション</h2>
              </div>
              <span className="text-3xl" aria-hidden="true">🧭</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-t-secondary">{motivationalMessage}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-white/5">
                <p className="text-xs text-t-muted">今日の達成</p>
                <p className="mt-1 text-2xl font-bold text-t-primary">{completedGoalCount}/2</p>
                <p className="mt-1 text-xs text-t-secondary">カードと問題の2つの目標を追跡中</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-white/5">
                <p className="text-xs text-t-muted">最優先テーマ</p>
                <p className="mt-1 text-lg font-bold text-t-primary">{recommendedFocus ? SUBJECT_LABELS[recommendedFocus] : 'バランス学習'}</p>
                <p className="mt-1 text-xs text-t-secondary">今の履歴からおすすめ順を自動で提示</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="soft-panel p-4">
            <p className="text-sm text-t-muted">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-t-secondary">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="soft-panel p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">おすすめ学習ルート</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">次にやることを、迷わず選べる導線</h2>
            </div>
            <span className="text-3xl" aria-hidden="true">✨</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link href={dueCards > 0 ? '/flashcards' : '/quiz'} className="feed-card block p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Step 1</p>
              <p className="mt-2 text-lg font-bold text-t-primary">復習を先に済ませる</p>
              <p className="mt-2 text-sm leading-6 text-t-secondary">期限到来の暗記カード {dueCards} 枚を片付け、忘れかけを先回りで回収します。</p>
            </Link>
            <Link href={recommendedFocus ? `/drill?subject=${recommendedFocus}` : '/drill'} className="feed-card block p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-error">Step 2</p>
              <p className="mt-2 text-lg font-bold text-t-primary">弱点に集中する</p>
              <p className="mt-2 text-sm leading-6 text-t-secondary">{recommendedFocus ? SUBJECT_LABELS[recommendedFocus] : '苦手分野'} を重点演習。得点効率の高い学習順です。</p>
            </Link>
            <Link href="/doomscroll" className="feed-card block p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step 3</p>
              <p className="mt-2 text-lg font-bold text-t-primary">用語を流し読みする</p>
              <p className="mt-2 text-sm leading-6 text-t-secondary">読了率 {doomscrollCompletion}%。SNSのように軽く回しながら知識を積み増せます。</p>
            </Link>
          </div>
        </div>

        <div className="soft-panel p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">今日の進捗</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">ひと目で分かる学習サマリー</h2>
            </div>
            <span className="text-3xl" aria-hidden="true">📈</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[rgb(var(--c-bg))] p-4">
              <p className="text-t-muted">トピック完了</p>
              <p className="mt-2 text-2xl font-bold text-t-primary">{completedTopics}</p>
              <p className="text-xs text-t-secondary">全 {totalTopics} レッスン中 {completedTopicsRate}%</p>
            </div>
            <div className="rounded-2xl bg-[rgb(var(--c-bg))] p-4">
              <p className="text-t-muted">読了用語</p>
              <p className="mt-2 text-2xl font-bold text-t-primary">{doomscrollReadCount}</p>
              <p className="text-xs text-t-secondary">全 {allDoomscrollTerms.length} 語中 {doomscrollCompletion}%</p>
            </div>
            <div className="rounded-2xl bg-[rgb(var(--c-bg))] p-4">
              <p className="text-t-muted">連続学習</p>
              <p className="mt-2 text-2xl font-bold text-accent">{progress.streakDays}日</p>
              <p className="text-xs text-t-secondary">毎日5分でも継続が力</p>
            </div>
            <div className="rounded-2xl bg-[rgb(var(--c-bg))] p-4">
              <p className="text-t-muted">要復習ミス</p>
              <p className="mt-2 text-2xl font-bold text-error">{mistakeCount}</p>
              <p className="text-xs text-t-secondary">解けるまで反復</p>
            </div>
          </div>
        </div>
      </section>

      <section className="soft-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-t-primary">今日の目標</h2>
            <p className="mt-1 text-sm text-t-secondary">やることを数値で見える化し、達成感を積み上げやすくしました。</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            ゴール達成 {completedGoalCount}/2
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-8">
          <DailyGoalRing current={daily.cardsReviewed} goal={goal.cardsPerDay} label="暗記カード" />
          <DailyGoalRing current={daily.questionsAnswered} goal={goal.questionsPerDay} label="問題数" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="soft-panel p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-t-primary">フォーカス提案</h2>
              <p className="text-sm text-t-secondary">弱点と次の一歩をセットで表示します。</p>
            </div>
            <Link href={recommendedFocus ? `/drill?subject=${recommendedFocus}` : '/drill'} className="text-sm font-medium text-primary hover:underline">演習へ →</Link>
          </div>
          {recommendedFocus ? (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">最優先科目</p>
                    <p className="mt-2 text-2xl font-bold text-t-primary">{SUBJECT_LABELS[recommendedFocus]}</p>
                    <p className="mt-2 text-sm leading-6 text-t-secondary">関連トピックを読んでからドリルへ進み、最後に doomscroll で用語を流す流れがおすすめです。</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-right shadow-sm dark:bg-white/5">
                    <p className="text-xs text-t-muted">推定正答率</p>
                    <p className="text-3xl font-bold text-error">{weakSubjects[0].accuracy}%</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendedTopics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.id}`} className="feed-card block p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">おすすめトピック</p>
                    <p className="mt-2 font-bold text-t-primary">{topic.title}</p>
                    <p className="mt-2 text-sm text-t-secondary">{topic.sections[0]?.heading}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[rgb(var(--c-bg))] p-5 text-sm leading-6 text-t-secondary">
              まだ十分な演習データがありません。まずは模擬試験か分野別ドリルを1回解いて、弱点分析を始めましょう。
            </div>
          )}
        </div>

        <div className="soft-panel p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-t-primary">科目ごとの学習量</h2>
              <p className="text-sm text-t-secondary">トピック消化と正答率を同時に確認できます。</p>
            </div>
            <Link href="/topics" className="text-sm font-medium text-primary hover:underline">トピック一覧 →</Link>
          </div>
          <div className="space-y-3">
            {ALL_SUBJECTS.map((subject) => {
              const accuracy = getSubjectAccuracy(progress, subject);
              const completedForSubject = progress.topicsCompleted.filter((topicId) => topicId.startsWith(subject)).length;
              const totalForSubject = topicCounts[subject] || 0;
              const completion = totalForSubject > 0 ? Math.round((completedForSubject / totalForSubject) * 100) : 0;
              return (
                <div key={subject} className="rounded-[1.4rem] border border-border/70 bg-[rgb(var(--c-bg))] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-t-primary">{SUBJECT_LABELS[subject]}</p>
                      <p className="text-xs text-t-muted">トピック {completedForSubject}/{totalForSubject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-t-muted">正答率</p>
                      <p className={`font-bold ${accuracy >= 70 ? 'text-success' : accuracy >= 40 ? 'text-accent' : 'text-error'}`}>{accuracy}%</p>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-alt">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-success" style={{ width: `${completion}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-t-secondary">
                    <span>マスター度</span>
                    <span>{completion}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="soft-panel p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-t-primary">クイックアクション</h2>
              <p className="text-sm text-t-secondary">気分や時間に合わせて、すぐ始められる導線です。</p>
            </div>
            <span className="text-2xl" aria-hidden="true">⚡</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/quiz" className="feed-card block p-4">
              <p className="text-base font-bold text-t-primary">模擬試験を始める</p>
              <p className="mt-2 text-sm text-t-secondary">本番感覚で総合力をチェック。</p>
            </Link>
            <Link href="/flashcards" className="feed-card block p-4">
              <p className="text-base font-bold text-t-primary">今日の暗記カード</p>
              <p className="mt-2 text-sm text-t-secondary">{dueCards}枚をテンポよく処理。</p>
            </Link>
            <Link href={weakSubjects.length > 0 ? `/drill?subject=${weakSubjects[0].subject}` : '/drill'} className="feed-card block p-4">
              <p className="text-base font-bold text-t-primary">苦手分野を復習</p>
              <p className="mt-2 text-sm text-t-secondary">{weakSubjects.length > 0 ? SUBJECT_LABELS[weakSubjects[0].subject] : '苦手分野'} に集中。</p>
            </Link>
            <Link href="/doomscroll" className="feed-card block p-4">
              <p className="text-base font-bold text-t-primary">doomscrollで定着</p>
              <p className="mt-2 text-sm text-t-secondary">SNS感覚で知識を積み増す。</p>
            </Link>
          </div>
        </div>

        <div className="soft-panel p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-t-primary">最近の模擬試験</h2>
              <p className="text-sm text-t-secondary">直近の推移を見ながら学習ペースを調整できます。</p>
            </div>
            <Link href="/history" className="text-sm font-medium text-primary hover:underline">履歴を見る →</Link>
          </div>
          {recentQuizzes.length === 0 ? (
            <div className="rounded-2xl bg-[rgb(var(--c-bg))] p-5 text-sm leading-6 text-t-secondary">
              まだ模擬試験の履歴がありません。最初の1回を解くと、ここに成績推移と弱点分析が表示されます。
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-[rgb(var(--c-bg))] p-4">
                <ProgressChart quizHistory={progress.quizHistory} />
              </div>
              <div className="space-y-2">
                {recentQuizzes.map((quiz) => (
                  <div key={`${quiz.date}-${quiz.type}-${quiz.score}-${quiz.total}`} className="flex items-center justify-between rounded-2xl bg-[rgb(var(--c-bg))] px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-t-primary">{quiz.date}</p>
                      <p className="text-xs text-t-secondary">{quiz.subject && quiz.subject !== 'all' ? SUBJECT_LABELS[quiz.subject] : '総合'} / {quiz.total}問</p>
                    </div>
                    <div className={`text-lg font-bold ${quiz.score / quiz.total >= 0.7 ? 'text-success' : 'text-error'}`}>
                      {quiz.score}/{quiz.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="soft-panel border-primary/15 bg-primary/5 p-5 md:p-6">
        <h3 className="text-lg font-bold text-primary">次回試験情報</h3>
        <p className="mt-2 text-sm text-t-primary">第54回 知的財産管理技能検定</p>
        <p className="text-sm text-t-primary">2026年7月12日（日）</p>
        <p className="mt-2 text-sm text-t-secondary">合格基準: 学科・実技ともに70%以上（30問中21問以上）</p>
      </section>
    </div>
  );
}
