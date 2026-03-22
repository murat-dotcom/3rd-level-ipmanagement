'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getProgress } from '@/lib/storage';
import { allTopics } from '@/data/topics';
import { SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';

const SUBJECT_TINTS: Record<SubjectSlug, string> = {
  patent: 'from-sky-500/18 via-cyan-500/10 to-transparent border-sky-500/20',
  copyright: 'from-violet-500/18 via-fuchsia-500/10 to-transparent border-violet-500/20',
  trademark: 'from-amber-500/18 via-orange-500/10 to-transparent border-amber-500/20',
  design: 'from-pink-500/18 via-rose-500/10 to-transparent border-pink-500/20',
  treaties: 'from-emerald-500/18 via-teal-500/10 to-transparent border-emerald-500/20',
  other: 'from-slate-500/16 via-slate-400/8 to-transparent border-border',
};

const SUBJECT_ICONS: Record<SubjectSlug, string> = {
  patent: '💡',
  copyright: '🎼',
  trademark: '🏷️',
  design: '🎨',
  treaties: '🌐',
  other: '📚',
};

export default function TopicsIndex() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const progress = getProgress();
    setCompleted(progress.topicsCompleted);
  }, []);

  const topicsBySubject = useMemo(
    () =>
      ALL_SUBJECTS.map((subject) => {
        const lessons = allTopics
          .filter((t) => t.subject === subject)
          .sort((a, b) => a.order - b.order);
        const completedCount = lessons.filter((lesson) => completed.includes(lesson.id)).length;
        const nextLesson = lessons.find((lesson) => !completed.includes(lesson.id)) ?? lessons[0] ?? null;
        const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

        return {
          subject,
          label: SUBJECT_LABELS[subject],
          lessons,
          completedCount,
          progress,
          nextLesson,
        };
      }),
    [completed]
  );

  const totalLessons = allTopics.length;
  const completedLessons = completed.length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const remainingLessons = Math.max(totalLessons - completedLessons, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.25),_transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))] p-6 md:p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
        <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              学習エリアをリデザイン
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-t-primary">学習を進めたくなる、
                <span className="block text-primary">見通しの良いレッスン一覧</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base leading-7 text-t-secondary">
                科目ごとの進捗・次に読むべきレッスン・やり残しがひと目で分かる構成に刷新しました。必要なときにすぐ始められる、落ち着いた学習導線です。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3 backdrop-blur">
                <p className="text-t-muted">完了レッスン</p>
                <p className="mt-1 text-2xl font-bold text-primary">{completedLessons}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3 backdrop-blur">
                <p className="text-t-muted">残り</p>
                <p className="mt-1 text-2xl font-bold text-accent">{remainingLessons}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3 backdrop-blur">
                <p className="text-t-muted">達成率</p>
                <p className="mt-1 text-2xl font-bold text-success">{completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="theme-card border-white/40 bg-white/70 dark:bg-slate-950/30 p-5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-primary">今の学習ペース</p>
            <div className="mt-4 rounded-3xl bg-surface-alt/80 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-t-secondary">全体進捗</span>
                <span className="font-semibold text-t-primary">{completedLessons}/{totalLessons}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/70 dark:bg-slate-900/60">
                <div className="h-full rounded-full bg-gradient-to-r from-primary via-sky-400 to-accent transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-t-secondary">
                あと <span className="font-semibold text-t-primary">{remainingLessons} レッスン</span> で全範囲を1周。短い時間でも、未完了の科目から1つ進めるだけで着実に前進できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="theme-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-t-muted">Clarity</p>
          <h2 className="mt-2 text-lg font-bold text-t-primary">科目ごとの見通し</h2>
          <p className="mt-2 text-sm leading-6 text-t-secondary">各カードで進捗・次の一歩・レッスン一覧をひとまとめに。迷わず読み始められます。</p>
        </div>
        <div className="theme-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-t-muted">Momentum</p>
          <h2 className="mt-2 text-lg font-bold text-t-primary">次のレッスンを強調</h2>
          <p className="mt-2 text-sm leading-6 text-t-secondary">未完了の最初のレッスンを目立たせ、途中離脱しにくい流れに整えました。</p>
        </div>
        <div className="theme-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-t-muted">Calm UI</p>
          <h2 className="mt-2 text-lg font-bold text-t-primary">配色をソフトに整理</h2>
          <p className="mt-2 text-sm leading-6 text-t-secondary">強い色を減らし、学習の邪魔にならないカードベースの情報設計へ変更しています。</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-t-primary">科目別レッスン</h2>
            <p className="text-sm text-t-muted mt-1">次の一歩と全体像を同時に見ながら進められます。</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {topicsBySubject.map(({ subject, label, lessons, completedCount, progress, nextLesson }) => (
            <div key={subject} className={`relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br ${SUBJECT_TINTS[subject]} theme-card p-5`}>
              <div className="absolute right-4 top-4 text-4xl opacity-15" aria-hidden="true">{SUBJECT_ICONS[subject]}</div>
              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-t-secondary backdrop-blur">
                      <span>{SUBJECT_ICONS[subject]}</span>
                      {label}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold text-t-primary">{label}</h3>
                    <p className="mt-1 text-sm text-t-secondary">{completedCount}/{lessons.length} 完了 ・ 達成率 {progress}%</p>
                  </div>
                  <div className="min-w-[78px] rounded-2xl bg-surface/85 px-3 py-2 text-center backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-t-muted">Progress</p>
                    <p className="mt-1 text-xl font-bold text-primary">{progress}%</p>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-surface/80 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                {nextLesson ? (
                  <div className="rounded-[1.5rem] border border-white/40 bg-surface/75 p-4 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-t-muted">Next lesson</p>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-t-primary">{nextLesson.title}</p>
                        <p className="mt-1 text-sm text-t-secondary">最初の未完了レッスンから、自然に学習を再開できます。</p>
                      </div>
                      <Link href={`/topics/${nextLesson.id}`} className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
                        開く
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-success/20 bg-success/8 p-4">
                    <p className="text-sm font-semibold text-success">この科目は完了済みです。</p>
                    <p className="mt-1 text-sm text-t-secondary">仕上げとして気になるレッスンを復習して知識を定着させましょう。</p>
                  </div>
                )}

                <div className="grid gap-2">
                  {lessons.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-sm text-t-muted">準備中</p>
                  ) : (
                    lessons.map((lesson) => {
                      const isDone = completed.includes(lesson.id);
                      const isNext = nextLesson?.id === lesson.id && !isDone;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/topics/${lesson.id}`}
                          className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                            isNext
                              ? 'border-primary/25 bg-primary/8 shadow-sm'
                              : 'border-white/40 bg-surface/70 hover:border-primary/20 hover:bg-surface'
                          }`}
                        >
                          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${isDone ? 'bg-success text-white' : isNext ? 'bg-primary text-white' : 'bg-surface-alt text-t-secondary'}`}>
                            {isDone ? '✓' : lesson.order}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-semibold text-t-primary">{lesson.title}</span>
                              {isNext && <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">次に読む</span>}
                              {isDone && <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold text-success">完了</span>}
                            </div>
                            <p className="mt-1 text-xs text-t-muted">レッスン {lesson.order}</p>
                          </div>
                          <span className="text-t-muted transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
