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

const SUBJECT_EMOJI: Record<SubjectSlug, string> = {
  patent: '💡',
  copyright: '🎼',
  trademark: '🏷️',
  design: '🎨',
  treaties: '🌍',
  other: '🧠',
};

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

  const dueCards = allFlashcards.filter((fc) => isDueForReview(getFlashcardState(progress, fc.id))).length;
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
      ? '今日はかなり良い流れです。仕上げに軽い確認だけして終了できます。'
      : completedGoalCount === 1
        ? 'あとひと押しで今日の学習が締まります。短いメニューで達成しましょう。'
        : '重たい画面はやめて、まずは1つだけ終わらせる学習動線に変えました。';
  const learningMomentum = Math.min(100, Math.round(((daily.cardsReviewed + daily.questionsAnswered) / (goal.cardsPerDay + goal.questionsPerDay)) * 100));
  const subjectSnapshots = ALL_SUBJECTS.map((subject) => {
    const accuracy = getSubjectAccuracy(progress, subject);
    const completedForSubject = progress.topicsCompleted.filter((topicId) => topicId.startsWith(subject)).length;
    const totalForSubject = topicCounts[subject] || 0;
    const completion = totalForSubject > 0 ? Math.round((completedForSubject / totalForSubject) * 100) : 0;
    return { subject, accuracy, completedForSubject, totalForSubject, completion };
  }).sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(var(--c-primary),0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(var(--c-accent),0.18),transparent_28%),linear-gradient(135deg,rgba(var(--c-surface),0.98),rgba(var(--c-surface-alt),0.92))] p-6 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden="true">
          <div className="absolute -top-12 right-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">学習ホームを再設計</span>
              <span className="rounded-full bg-surface/90 px-3 py-1 text-t-secondary border border-border">集中しやすい配色</span>
              <span className="rounded-full bg-surface/90 px-3 py-1 text-t-secondary border border-border">迷わない導線</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-t-muted uppercase">Study cockpit</p>
              <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-t-primary">学習の「次にやること」が、
                <span className="block text-primary">一目で決まるホーム。</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm md:text-base leading-7 text-t-secondary">{motivationalMessage} 学習エリア全体を、柔らかいレイヤー感・強弱のあるカード・短い行動ラベルで整理しました。重たさを減らして、開始しやすい雰囲気に寄せています。</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Link href={dueCards > 0 ? '/flashcards' : '/quiz'} className="group rounded-[1.5rem] border border-primary/15 bg-surface/85 p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Warm up</p>
                <p className="mt-2 text-lg font-bold text-t-primary">復習カードを開く</p>
                <p className="mt-1 text-sm text-t-secondary">期限到来 {dueCards} 枚を先に片付ける。</p>
                <p className="mt-4 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">始める →</p>
              </Link>
              <Link href={recommendedFocus ? `/drill?subject=${recommendedFocus}` : '/drill'} className="group rounded-[1.5rem] border border-accent/15 bg-surface/85 p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/35 hover:shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Deep work</p>
                <p className="mt-2 text-lg font-bold text-t-primary">弱点を補強する</p>
                <p className="mt-1 text-sm text-t-secondary">{recommendedFocus ? SUBJECT_LABELS[recommendedFocus] : '苦手分野'} を優先表示。</p>
                <p className="mt-4 text-sm font-semibold text-accent group-hover:translate-x-1 transition-transform">演習へ →</p>
              </Link>
              <Link href="/doomscroll" className="group rounded-[1.5rem] border border-success/15 bg-surface/85 p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-success/35 hover:shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-success">Light review</p>
                <p className="mt-2 text-lg font-bold text-t-primary">用語フィードを見る</p>
                <p className="mt-1 text-sm text-t-secondary">読了率 {doomscrollCompletion}%。SNSっぽく流し読みで定着。</p>
                <p className="mt-4 text-sm font-semibold text-success group-hover:translate-x-1 transition-transform">フィードへ →</p>
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/60 bg-surface/85 p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">Today</p>
                <h2 className="mt-1 text-2xl font-bold text-t-primary">今日の学習テンポ</h2>
              </div>
              <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Momentum</p>
                <p className="text-2xl font-black text-primary">{learningMomentum}%</p>
              </div>
            </div>
            <div className="mt-5 h-3 rounded-full bg-surface-alt overflow-hidden">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(var(--c-primary),1),rgba(var(--c-accent),0.95))] transition-all duration-500" style={{ width: `${learningMomentum}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-surface-alt p-4">
                <p className="text-t-muted">連続学習</p>
                <p className="mt-1 text-3xl font-bold text-t-primary">{progress.streakDays}<span className="ml-1 text-base text-t-muted">日</span></p>
              </div>
              <div className="rounded-2xl bg-surface-alt p-4">
                <p className="text-t-muted">未解決ミス</p>
                <p className="mt-1 text-3xl font-bold text-error">{mistakeCount}</p>
              </div>
              <div className="rounded-2xl bg-surface-alt p-4">
                <p className="text-t-muted">トピック進捗</p>
                <p className="mt-1 text-3xl font-bold text-primary">{completedTopicsRate}%</p>
              </div>
              <div className="rounded-2xl bg-surface-alt p-4">
                <p className="text-t-muted">用語読了</p>
                <p className="mt-1 text-3xl font-bold text-success">{doomscrollReadCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="theme-card p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">今日の目標</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">ノルマより、進み方が分かる見た目に。</h2>
              <p className="mt-2 text-sm leading-6 text-t-secondary">リングの左右に行動ボタンを置いて、眺めるだけで終わらない目標カードに変えました。</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <DailyGoalRing current={daily.cardsReviewed} goal={goal.cardsPerDay} label="暗記カード" />
              <DailyGoalRing current={daily.questionsAnswered} goal={goal.questionsPerDay} label="問題数" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link href="/flashcards" className="rounded-2xl border border-border bg-surface-alt p-4 hover:border-primary/30 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-t-muted">Action 01</p>
              <p className="mt-2 font-bold text-t-primary">カードで肩慣らし</p>
              <p className="mt-1 text-sm text-t-secondary">今日の復習枚数をそのまま消化。</p>
            </Link>
            <Link href="/quiz" className="rounded-2xl border border-border bg-surface-alt p-4 hover:border-primary/30 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-t-muted">Action 02</p>
              <p className="mt-2 font-bold text-t-primary">模試で現在地確認</p>
              <p className="mt-1 text-sm text-t-secondary">迷ったら本番形式でひと回し。</p>
            </Link>
            <Link href="/mistakes" className="rounded-2xl border border-border bg-surface-alt p-4 hover:border-primary/30 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-t-muted">Action 03</p>
              <p className="mt-2 font-bold text-t-primary">間違いノートで締める</p>
              <p className="mt-1 text-sm text-t-secondary">取りこぼしだけを短く復習。</p>
            </Link>
          </div>
        </div>

        <div className="theme-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Focus</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">今やる価値が高い内容</h2>
            </div>
            <span className="text-3xl" aria-hidden="true">🎯</span>
          </div>
          {recommendedFocus ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Recommended subject</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-t-primary">{SUBJECT_LABELS[recommendedFocus]}</p>
                    <p className="mt-1 text-sm leading-6 text-t-secondary">トピックで理解 → ドリルで確認 → 用語フィードで再接触、の順で回すと負荷が低めです。</p>
                  </div>
                  <div className="rounded-2xl bg-surface px-3 py-2 text-right shadow-sm">
                    <p className="text-xs text-t-muted">正答率</p>
                    <p className="text-2xl font-black text-error">{weakSubjects[0].accuracy}%</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {recommendedTopics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.id}`} className="group rounded-2xl border border-border bg-surface-alt p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Topic pick</p>
                        <p className="mt-1 font-bold text-t-primary">{topic.title}</p>
                        <p className="mt-1 text-sm text-t-muted">{topic.sections[0]?.heading}</p>
                      </div>
                      <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-surface-alt p-5 text-sm text-t-secondary">まだ十分な演習データがありません。まずは模擬試験か分野別ドリルを1回解いて、弱点分析を始めましょう。</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="theme-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-primary">Subject balance</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">科目ごとの温度感</h2>
            </div>
            <Link href="/topics" className="text-sm font-semibold text-primary hover:underline">トピック一覧 →</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {subjectSnapshots.map(({ subject, accuracy, completedForSubject, totalForSubject, completion }) => (
              <div key={subject} className="rounded-[1.5rem] border border-border bg-surface-alt p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl" aria-hidden="true">{SUBJECT_EMOJI[subject]}</p>
                    <p className="mt-2 font-bold text-t-primary">{SUBJECT_LABELS[subject]}</p>
                    <p className="text-xs text-t-muted mt-1">トピック {completedForSubject}/{totalForSubject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-t-muted">正答率</p>
                    <p className={`text-2xl font-black ${accuracy >= 70 ? 'text-success' : accuracy >= 40 ? 'text-accent' : 'text-error'}`}>{accuracy}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-t-muted">理解の積み上がり</span>
                    <span className="text-t-secondary">{completion}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface hover:bg-surface transition-colors">
                    <div className="h-2.5 rounded-full bg-[linear-gradient(90deg,rgba(var(--c-primary),1),rgba(var(--c-accent),0.85))]" style={{ width: `${completion}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="theme-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-t-primary">最近の試験結果</h2>
              {progress.quizHistory.length > 1 && (
                <Link href="/history" className="text-sm font-semibold text-primary hover:underline">比較する →</Link>
              )}
            </div>
            {recentQuizzes.length === 0 ? (
              <p className="text-sm text-t-muted">まだ試験を受けていません</p>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-surface-alt p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-t-primary">{quiz.date}</p>
                        <p className="text-xs text-t-muted mt-1">{quiz.type === 'gakka' ? '学科' : '実技'}</p>
                      </div>
                      <div className={`text-2xl font-black ${quiz.score / quiz.total >= 0.7 ? 'text-success' : 'text-error'}`}>{quiz.score}/{quiz.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {weakSubjects.length > 0 && weakSubjects[0].accuracy < 70 && (
            <div className="rounded-[1.75rem] border border-error/25 bg-[linear-gradient(135deg,rgba(var(--c-error),0.09),rgba(var(--c-surface),0.9))] p-5">
              <p className="text-sm font-semibold text-error">苦手分野アラート</p>
              <div className="mt-3 space-y-2">
                {weakSubjects.filter((s) => s.accuracy < 70).slice(0, 3).map((s) => (
                  <div key={s.subject} className="flex items-center justify-between rounded-xl bg-surface/80 px-3 py-2 text-sm">
                    <span className="text-t-secondary">{SUBJECT_LABELS[s.subject]}</span>
                    <span className="font-bold text-error">{s.accuracy}%</span>
                  </div>
                ))}
              </div>
              <Link href="/drill" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">集中的に復習する →</Link>
            </div>
          )}

          <div className="rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(135deg,rgba(var(--c-primary),0.08),rgba(var(--c-surface),0.96))] p-5">
            <p className="text-sm font-semibold text-primary">次回試験情報</p>
            <h3 className="mt-2 text-xl font-bold text-t-primary">第54回 知的財産管理技能検定</h3>
            <p className="mt-1 text-sm text-t-primary">2026年7月12日（日）</p>
            <p className="mt-2 text-sm leading-6 text-t-secondary">合格基準: 学科・実技ともに70%以上（30問中21問以上）</p>
          </div>
        </div>
      </section>

      {progress.quizHistory.length >= 2 && (
        <section className="theme-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Trend</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">成績推移</h2>
            </div>
            <p className="text-sm text-t-muted">波を見て、復習タイミングを決めるためのグラフです。</p>
          </div>
          <ProgressChart quizHistory={progress.quizHistory} />
        </section>
      )}
    </div>
  );
}
