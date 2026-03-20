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
      <p className="text-sm text-t-secondary">SM-2アルゴリズムによるスペースドリピティション学習</p>

      <Link
        href="/flashcards/all"
        className="block bg-accent text-white rounded-card p-5 text-center hover:bg-accent-hover transition-all shadow-sm hover:shadow-md"
      >
        <p className="text-2xl font-bold">{totalDue}枚</p>
        <p className="text-sm mt-1 opacity-90">今日のカードを復習する</p>
      </Link>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-t-primary">科目別デッキ</h2>
        {ALL_SUBJECTS.map((subject) => {
          const stats = counts?.[subject];
          return (
            <Link
              key={subject}
              href={`/flashcards/${subject}`}
              className="block theme-card theme-card-hover p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-t-primary">{SUBJECT_LABELS[subject]}</p>
                  <p className="text-xs text-t-muted">{stats?.total || 0}枚</p>
                </div>
                {(stats?.due || 0) > 0 && (
                  <span className="bg-accent text-white text-xs px-2.5 py-1 rounded-full font-bold">
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
