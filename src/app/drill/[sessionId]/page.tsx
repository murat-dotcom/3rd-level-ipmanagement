'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, SubjectSlug, SUBJECT_LABELS } from '@/types/question';
import { allQuestions } from '@/data/questions';
import { allFlashcards } from '@/data/flashcards';
import { getProgress, saveProgress, updateStreak } from '@/lib/storage';

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

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    if (selectedAnswer === questions[currentIndex].correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      // Save progress
      const progress = getProgress();
      const updated = updateStreak(progress);
      saveProgress(updated);
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
        <p className="text-slate-500">条件に合う問題がありません</p>
        <button onClick={() => router.push('/drill')} className="text-primary underline">戻る</button>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 text-center">
        <h1 className="text-2xl font-bold text-primary">演習完了!</h1>
        <div className={`p-6 rounded-xl border-2 ${percentage >= 70 ? 'border-success bg-emerald-50' : 'border-error bg-red-50'}`}>
          <p className="text-4xl font-bold">{correctCount} / {questions.length}</p>
          <p className={`text-lg font-bold mt-1 ${percentage >= 70 ? 'text-success' : 'text-error'}`}>
            {percentage}%
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/drill')} className="flex-1 py-3 bg-primary text-white rounded-xl font-medium">
            別の演習を始める
          </button>
          <button onClick={() => router.push('/')} className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium">
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
        <span className="text-sm text-slate-600">
          {SUBJECT_LABELS[subject]} — {currentIndex + 1}/{questions.length}
        </span>
        <span className="text-sm font-bold text-primary">
          {correctCount}問正解
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">{currentQuestion.topic}</span>
          <span className="text-xs text-slate-400">
            {['', '基本', '標準', '応用'][currentQuestion.difficulty]}
          </span>
        </div>

        <p className="text-base font-medium leading-relaxed">{currentQuestion.question}</p>

        <div className="space-y-2">
          {currentQuestion.choices.map((choice, ci) => (
            <button
              key={ci}
              onClick={() => !showResult && setSelectedAnswer(ci)}
              disabled={showResult}
              className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                showResult
                  ? ci === currentQuestion.correctIndex
                    ? 'border-success bg-emerald-50 text-success font-medium'
                    : ci === selectedAnswer
                    ? 'border-error bg-red-50 text-error'
                    : 'border-slate-200 text-slate-400'
                  : selectedAnswer === ci
                  ? 'border-primary bg-blue-50 text-primary font-medium'
                  : 'border-slate-200 hover:border-primary hover:bg-slate-50'
              }`}
            >
              {ci + 1}. {choice}
              {showResult && ci === currentQuestion.correctIndex && ' ✓'}
              {showResult && ci === selectedAnswer && ci !== currentQuestion.correctIndex && ' ✗'}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="space-y-3">
            <div className={`p-3 rounded-lg text-sm ${isCorrect ? 'bg-emerald-50 text-success' : 'bg-red-50 text-error'}`}>
              {isCorrect ? '正解!' : '不正解'}
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-slate-700">
              <p className="font-medium mb-1">解説</p>
              <p>{currentQuestion.explanation}</p>
            </div>
            {currentQuestion.relatedArticle && (
              <p className="text-xs text-slate-500">関連条文: {currentQuestion.relatedArticle}</p>
            )}
            {!isCorrect && (
              <button
                onClick={() => addToFlashcards(currentQuestion)}
                disabled={addedToFlashcards.has(currentQuestion.id)}
                className={`text-sm px-3 py-1.5 rounded-lg ${
                  addedToFlashcards.has(currentQuestion.id)
                    ? 'bg-slate-200 text-slate-500'
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
