'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, SubjectSlug } from '@/types/question';
import { allQuestions } from '@/data/questions';
import { getProgress, saveProgress, updateStreak } from '@/lib/storage';

export default function QuizSession() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const examType = searchParams.get('type') || 'gakka';
  const subjectFilter = searchParams.get('subject') || 'all';
  const questionCount = parseInt(searchParams.get('count') || '30', 10);

  const questions = useMemo(() => {
    let pool = allQuestions.filter((q) => q.type === examType);
    if (subjectFilter !== 'all') {
      pool = pool.filter((q) => q.subject === subjectFilter);
    }
    // Shuffle and take requested count
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  }, [examType, subjectFilter, questionCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(questionCount === 30 ? 45 * 60 : Math.round((questionCount / 30) * 45 * 60));
  const [finished, setFinished] = useState(false);

  // Timer
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (choiceIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: choiceIndex }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const finishQuiz = useCallback(() => {
    setFinished(true);
    // Calculate score and save
    let score = 0;
    const wrongIds: string[] = [];
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) {
        score++;
      } else {
        wrongIds.push(q.id);
      }
    });

    const totalTime = (questionCount === 30 ? 45 * 60 : Math.round((questionCount / 30) * 45 * 60)) - timeLeft;

    const progress = getProgress();
    const updated = updateStreak(progress);
    updated.quizHistory.push({
      date: new Date().toISOString().split('T')[0],
      type: examType as 'gakka' | 'jitsugu',
      score,
      total: questions.length,
      timeSpent: totalTime,
      wrongQuestionIds: wrongIds,
    });
    saveProgress(updated);
  }, [answers, questions, timeLeft, questionCount, examType]);

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
        <p className="text-slate-500 mb-4">条件に合う問題がありません</p>
        <button onClick={() => router.push('/quiz')} className="text-primary underline">戻る</button>
      </div>
    );
  }

  // Results view
  if (finished) {
    let score = 0;
    const wrongQuestions: { q: Question; selected: number | undefined }[] = [];
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) {
        score++;
      } else {
        wrongQuestions.push({ q, selected: answers[i] });
      }
    });
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-primary">試験結果</h1>

        <div className={`text-center p-6 rounded-xl border-2 ${passed ? 'border-success bg-emerald-50' : 'border-error bg-red-50'}`}>
          <p className="text-4xl font-bold mb-2">{score} / {questions.length}</p>
          <p className={`text-xl font-bold ${passed ? 'text-success' : 'text-error'}`}>
            {percentage}% — {passed ? '合格ライン達成!' : '不合格'}
          </p>
        </div>

        {wrongQuestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">間違えた問題</h2>
            {wrongQuestions.map(({ q, selected }) => (
              <div key={q.id} className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                <p className="font-medium">{q.question}</p>
                <div className="space-y-1">
                  {q.choices.map((choice, ci) => (
                    <div
                      key={ci}
                      className={`p-2 rounded text-sm ${
                        ci === q.correctIndex
                          ? 'bg-emerald-50 text-success font-medium border border-success'
                          : ci === selected
                          ? 'bg-red-50 text-error border border-error'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {ci + 1}. {choice}
                      {ci === q.correctIndex && ' ✓'}
                      {ci === selected && ci !== q.correctIndex && ' ✗'}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600 bg-blue-50 p-2 rounded">{q.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/quiz')}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-900"
          >
            新しい試験を始める
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300"
          >
            ダッシュボードへ
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-600">
          問 {currentIndex + 1} / {questions.length}
        </span>
        <span className={`text-sm font-bold ${timeLeft < 300 ? 'text-error' : 'text-primary'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">{currentQuestion.topic}</span>
          <button
            onClick={toggleFlag}
            className={`text-sm px-2 py-0.5 rounded ${
              flagged.has(currentIndex) ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {flagged.has(currentIndex) ? 'フラグ済' : 'フラグ'}
          </button>
        </div>

        <p className="text-base font-medium leading-relaxed">{currentQuestion.question}</p>

        <div className="space-y-2">
          {currentQuestion.choices.map((choice, ci) => (
            <button
              key={ci}
              onClick={() => selectAnswer(ci)}
              className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                answers[currentIndex] === ci
                  ? 'border-primary bg-blue-50 text-primary font-medium'
                  : 'border-slate-200 hover:border-primary hover:bg-slate-50'
              }`}
            >
              {ci + 1}. {choice}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium disabled:opacity-40"
        >
          前の問題
        </button>
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={finishQuiz}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-900"
          >
            試験を終了する
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-900"
          >
            次の問題
          </button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1 justify-center">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-7 h-7 rounded text-xs font-medium ${
              i === currentIndex
                ? 'bg-primary text-white'
                : answers[i] !== undefined
                ? 'bg-blue-100 text-primary'
                : flagged.has(i)
                ? 'bg-amber-100 text-accent'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
