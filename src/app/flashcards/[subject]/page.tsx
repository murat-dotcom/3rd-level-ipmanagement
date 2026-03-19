'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Flashcard, SubjectSlug, SUBJECT_LABELS } from '@/types/question';
import { allFlashcards } from '@/data/flashcards';
import { getProgress, saveProgress, getFlashcardState, isDueForReview, updateStreak, incrementDailyCards } from '@/lib/storage';
import { sm2 } from '@/lib/sm2';

const RATING_BUTTONS = [
  { label: 'もう一回', quality: 1, color: 'bg-error' },
  { label: '難しい', quality: 2, color: 'bg-accent' },
  { label: '普通', quality: 3, color: 'bg-primary' },
  { label: '簡単', quality: 4, color: 'bg-success' },
];

export default function FlashcardSession() {
  const params = useParams();
  const router = useRouter();
  const subject = params.subject as string;

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    const progress = getProgress();
    let pool: Flashcard[];

    if (subject === 'all') {
      pool = allFlashcards.filter((fc) => isDueForReview(getFlashcardState(progress, fc.id)));
    } else {
      pool = allFlashcards.filter((fc) => fc.subject === subject);
    }

    setCards(pool.sort(() => Math.random() - 0.5));
  }, [subject]);

  // Keyboard shortcuts
  useEffect(() => {
    if (sessionDone) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      }
      if (flipped && e.key >= '1' && e.key <= '4') {
        const quality = parseInt(e.key);
        rateCard(quality);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sessionDone, flipped, currentIndex, cards]);

  const rateCard = (quality: number) => {
    const card = cards[currentIndex];
    let progress = getProgress();
    const state = getFlashcardState(progress, card.id);
    const result = sm2(quality, state.repetition, state.easeFactor, state.interval);

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + result.interval);

    progress = updateStreak(progress);
    progress = incrementDailyCards(progress);
    progress.flashcardState[card.id] = {
      ...result,
      nextReview: nextDate.toISOString().split('T')[0],
    };
    saveProgress(progress);

    setReviewed((prev) => prev + 1);
    setFlipped(false);

    if (currentIndex + 1 >= cards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-primary">暗記カード</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {subject === 'all' ? '今日復習するカードはありません' : 'このカテゴリにカードがありません'}
        </p>
        <button onClick={() => router.push('/flashcards')} className="text-primary underline">
          戻る
        </button>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-primary">セッション完了!</h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-4xl font-bold text-success">{reviewed}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">枚のカードを復習しました</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/flashcards')}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
          >
            デッキ一覧へ
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
          >
            ホームへ
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const subjectLabel = subject === 'all' ? '全科目' : SUBJECT_LABELS[subject as SubjectSlug] || subject;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-primary">{subjectLabel}</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-slate-400 hidden md:block" aria-hidden="true">
        スペース/Enterで裏返し / 1-4で評価
      </p>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[250px] flex items-center justify-center p-6 cursor-pointer select-none"
        role="button"
        aria-label={flipped ? '答え' : 'タップで答えを表示'}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); !flipped && setFlipped(true); } }}
      >
        <div className="text-center">
          {!flipped ? (
            <>
              <p className="text-lg font-medium leading-relaxed">{currentCard.front}</p>
              <p className="text-xs text-slate-400 mt-4">タップで答えを表示</p>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-2">答え</p>
              <p className="text-lg font-medium leading-relaxed text-primary">{currentCard.back}</p>
            </>
          )}
        </div>
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="評価">
          {RATING_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => rateCard(btn.quality)}
              className={`${btn.color} text-white py-3 rounded-lg text-sm font-medium`}
              aria-label={`${btn.label} (${btn.quality})`}
            >
              <span className="hidden md:inline text-xs opacity-70 mr-1">{btn.quality}</span>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {currentCard.tags.map((tag) => (
          <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
