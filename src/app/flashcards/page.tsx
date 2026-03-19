'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress, getFlashcardState, isDueForReview } from '@/lib/storage';
import { allFlashcards } from '@/data/flashcards';
import { SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';

export default function FlashcardsIndex() {
  const [counts, setCounts] = useState<Record<SubjectSlug, { total: number; due: number }> | null>(null);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    const progress = getProgress();
    const result: Record<string, { total: number; due: number }> = {};
    let total = 0;

    ALL_SUBJECTS.forEach((subject) => {
      const cards = allFlashcards.filter((fc) => fc.subject === subject);
      const due = cards.filter((fc) => isDueForReview(getFlashcardState(progress, fc.id))).length;
      result[subject] = { total: cards.length, due };
      total += due;
    });

    setCounts(result as Record<SubjectSlug, { total: number; due: number }>);
    setTotalDue(total);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">暗記カード</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">SM-2アルゴリズムによるスペースドリピティション学習</p>

      {/* Today's cards */}
      <Link
        href="/flashcards/all"
        className="block bg-accent text-white rounded-xl p-5 text-center hover:bg-amber-600 transition-colors"
      >
        <p className="text-2xl font-bold">{totalDue}枚</p>
        <p className="text-sm mt-1">今日のカードを復習する</p>
      </Link>

      {/* Per-subject */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">科目別デッキ</h2>
        {ALL_SUBJECTS.map((subject) => {
          const stats = counts?.[subject];
          return (
            <Link
              key={subject}
              href={`/flashcards/${subject}`}
              className="block bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{SUBJECT_LABELS[subject]}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stats?.total || 0}枚</p>
                </div>
                {(stats?.due || 0) > 0 && (
                  <span className="bg-accent text-white text-xs px-2 py-1 rounded-full font-bold">
                    {stats?.due}枚復習
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
