'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, SubjectSlug, SUBJECT_LABELS } from '@/types/question';
import { allQuestions } from '@/data/questions';
import { getProgress, saveProgress, updateStreak, addMistake, incrementDailyQuestions } from '@/lib/storage';

export default function DrillSession() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subject = searchParams.get('subject') as SubjectSlug;
  const topicFilter = searchParams.get('topic') || 'all';
  const difficultyFilter = parseInt(searchParams.get('difficulty') || '0', 10);

  const questions = useMemo(() => {
    let pool = allQuestions.filter((q) => q.subject === subject);
    if (topicFilter !== 'all') pool = pool.filter((q) => q.topic === topicFilter);
    if (difficultyFilter > 0) pool = pool.filter((q) => q.difficulty === difficultyFilter);
    return pool.sort(() => Math.random() - 0.5);
  }, [subject, topicFilter, difficultyFilter]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [addedToFlashcards, setAddedToFlashcards] = useState<Set<string>>(new Set());

  // Keyboard shortcuts
  useEffect(() => {
    if (finished) return;
    const handler = (e: KeyboardEvent) => {
      if (!showResult && e.key >= '1' && e.key <= '4') {
        const ci = parseInt(e.key) - 1;
        if (ci < (questions[currentIndex]?.choices.length || 0)) {
          setSelectedAnswer(ci);
        }
      }
      if (e.key === 'Enter' && !showResult && selectedAnswer !== null) {
        checkAnswer();
      }
      if (e.key === 'Enter' && showResult) {
        nextQuestion();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [finished, showResult, selectedAnswer, currentIndex, questions]);

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    const isCorrect = selectedAnswer === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      // Add to mistake notebook
      let progress = getProgress();
      progress = addMistake(progress, questions[currentIndex].id, selectedAnswer);
      saveProgress(progress);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      let progress = getProgress();
      progress = updateStreak(progress);
      progress = incrementDailyQuestions(progress, questions.length);
      saveProgress(progress);
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const addToFlashcards = (q: Question) => {
    const progress = getProgress();
    const cardId = `fc-drill-${q.id}`;
    if (!progress.flashcardState[cardId]) {
      progress.flashcardState[cardId] = {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        nextReview: new Date().toISOString().split('T')[0],
      };
      saveProgress(progress);
    }
    setAddedToFlashcards((prev) => new Set(prev).add(q.id));
  };

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-slate-500 dark:text-slate-400">条件に合う問題がありません</p>
        <button onClick={() => router.push('/drill')} className="text-primary underline">戻る</button>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 text-center">
        <h1 className="text-2xl font-bold text-primary">演習完了!</h1>
        <div className={`p-6 rounded-xl border-2 ${percentage >= 70 ? 'border-success bg-emerald-50 dark:bg-emerald-900/30' : 'border-error bg-red-50 dark:bg-red-900/30'}`}>
          <p className="text-4xl font-bold">{correctCount} / {questions.length}</p>
          <p className={`text-lg font-bold mt-1 ${percentage >= 70 ? 'text-success' : 'text-error'}`}>
            {percentage}%
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/drill')} className="flex-1 py-3 bg-primary text-white rounded-xl font-medium">
            別の演習を始める
          </button>
          <button onClick={() => router.push('/mistakes')} className="flex-1 py-3 bg-error text-white rounded-xl font-medium">
            間違いノート
          </button>
          <button onClick={() => router.push('/')} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium">
            ホームへ
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {SUBJECT_LABELS[subject]} — {currentIndex + 1}/{questions.length}
        </span>
        <span className="text-sm font-bold text-primary">
          {correctCount}問正解
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-slate-400 hidden md:block" aria-hidden="true">
        キーボード: 1-4で選択 / Enterで確認・次へ
      </p>

      {/* Question */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">{currentQuestion.topic}</span>
          <span className="text-xs text-slate-400">
            {['', '基本', '標準', '応用'][currentQuestion.difficulty]}
          </span>
        </div>

        <p className="text-base font-medium leading-relaxed">{currentQuestion.question}</p>

        <div className="space-y-2" role="radiogroup" aria-label="解答選択">
          {currentQuestion.choices.map((choice, ci) => (
            <button
              key={ci}
              onClick={() => !showResult && setSelectedAnswer(ci)}
              disabled={showResult}
              className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                showResult
                  ? ci === currentQuestion.correctIndex
                    ? 'border-success bg-emerald-50 dark:bg-emerald-900/30 text-success font-medium'
                    : ci === selectedAnswer
                    ? 'border-error bg-red-50 dark:bg-red-900/30 text-error'
                    : 'border-slate-200 dark:border-slate-600 text-slate-400'
                  : selectedAnswer === ci
                  ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-primary font-medium'
                  : 'border-slate-200 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              role="radio"
              aria-checked={selectedAnswer === ci}
            >
              <span className="inline-block w-6 text-slate-400 font-mono">{ci + 1}.</span> {choice}
              {showResult && ci === currentQuestion.correctIndex && ' ✓'}
              {showResult && ci === selectedAnswer && ci !== currentQuestion.correctIndex && ' ✗'}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="space-y-3">
            <div className={`p-3 rounded-lg text-sm ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/30 text-success' : 'bg-red-50 dark:bg-red-900/30 text-error'}`}>
              {isCorrect ? '正解!' : '不正解'}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium mb-1">解説</p>
              <p>{currentQuestion.explanation}</p>
            </div>
            {currentQuestion.relatedArticle && (
              <p className="text-xs text-slate-500">
                <span className="font-medium">関連条文:</span> {currentQuestion.relatedArticle}
              </p>
            )}
            <p className="text-xs text-primary font-medium">ポイント: {currentQuestion.keyPoint}</p>
            {!isCorrect && (
              <button
                onClick={() => addToFlashcards(currentQuestion)}
                disabled={addedToFlashcards.has(currentQuestion.id)}
                className={`text-sm px-3 py-1.5 rounded-lg ${
                  addedToFlashcards.has(currentQuestion.id)
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    : 'bg-accent text-white hover:bg-amber-600'
                }`}
              >
                {addedToFlashcards.has(currentQuestion.id) ? '暗記カードに追加済' : '暗記カードに追加'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      {!showResult ? (
        <button
          onClick={checkAnswer}
          disabled={selectedAnswer === null}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-40"
        >
          回答を確認する
        </button>
      ) : (
        <button
          onClick={nextQuestion}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium"
        >
          {currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題へ'}
        </button>
      )}
    </div>
  );
}
