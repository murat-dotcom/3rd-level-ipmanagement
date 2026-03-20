'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Flashcard, SubjectSlug, SUBJECT_LABELS } from '@/types/question';
import { allFlashcards } from '@/data/flashcards';
import { getProgress, saveProgress, getFlashcardState, isDueForReview, updateStreak, incrementDailyCards } from '@/lib/storage';
import { sm2 } from '@/lib/sm2';

const RATING_BUTTONS = [
  { label: 'もう一回', quality: 1, className: 'bg-error' },
  { label: '難しい', quality: 2, className: 'bg-accent' },
  { label: '普通', quality: 3, className: 'bg-primary' },
  { label: '簡単', quality: 4, className: 'bg-success' },
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
        <p className="text-t-muted">
          {subject === 'all' ? '今日復習するカードはありません' : 'このカテゴリにカードがありません'}
        </p>
        <button onClick={() => router.push('/flashcards')} className="text-primary font-medium hover:underline">
          戻る
        </button>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-primary">セッション完了!</h1>
        <div className="theme-card p-6">
          <p className="text-4xl font-bold text-success">{reviewed}</p>
          <p className="text-sm text-t-secondary mt-1">枚のカードを復習しました</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/flashcards')}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            デッキ一覧へ
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 bg-surface-alt text-t-secondary rounded-xl font-medium hover:bg-surface-hover transition-colors"
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
        <span className="text-sm text-t-muted">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="w-full bg-surface-alt rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      <p className="text-xs text-t-muted hidden md:block" aria-hidden="true">
        スペース/Enterで裏返し / 1-4で評価
      </p>

      <div
        onClick={() => !flipped && setFlipped(true)}
        className="theme-card min-h-[250px] flex items-center justify-center p-6 cursor-pointer select-none hover:shadow-md transition-all"
        role="button"
        aria-label={flipped ? '答え' : 'タップで答えを表示'}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); !flipped && setFlipped(true); } }}
      >
        <div className="text-center">
          {!flipped ? (
            <>
              <p className="text-lg font-medium leading-relaxed text-t-primary">{currentCard.front}</p>
              <p className="text-xs text-t-muted mt-4">タップで答えを表示</p>
            </>
          ) : (
            <>
              <p className="text-xs text-t-muted mb-2">答え</p>
              <p className="text-lg font-medium leading-relaxed text-primary">{currentCard.back}</p>
            </>
          )}
        </div>
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="評価">
          {RATING_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => rateCard(btn.quality)}
              className={`${btn.className} text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all`}
              aria-label={`${btn.label} (${btn.quality})`}
            >
              <span className="hidden md:inline text-xs opacity-70 mr-1">{btn.quality}</span>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {currentCard.tags.map((tag) => (
          <span key={tag} className="bg-surface-alt text-t-muted text-xs px-2 py-0.5 rounded-lg">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
