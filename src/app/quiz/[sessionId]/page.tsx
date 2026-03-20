'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, SubjectSlug } from '@/types/question';
import { allQuestions } from '@/data/questions';
import { getProgress, saveProgress, updateStreak, addMistake, incrementDailyQuestions } from '@/lib/storage';

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
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  }, [examType, subjectFilter, questionCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(questionCount === 30 ? 45 * 60 : Math.round((questionCount / 30) * 45 * 60));
  const [finished, setFinished] = useState(false);
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const completionRef = useRef(false);

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

  const finishQuiz = useCallback((finalTimeLeft?: number) => {
    if (completionRef.current) return;
    completionRef.current = true;

    let score = 0;
    const wrongIds: string[] = [];
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) {
        score++;
      } else {
        wrongIds.push(q.id);
      }
    });

    const remainingTime = finalTimeLeft ?? timeLeft;
    const totalTime = (questionCount === 30 ? 45 * 60 : Math.round((questionCount / 30) * 45 * 60)) - remainingTime;

    let progress = getProgress();
    progress = updateStreak(progress);
    progress = incrementDailyQuestions(progress, questions.length);

    questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) {
        progress = addMistake(progress, q.id, answers[i] ?? -1);
      }
    });

    progress.quizHistory.push({
      date: new Date().toISOString().split('T')[0],
      type: examType as 'gakka' | 'jitsugu',
      score,
      total: questions.length,
      timeSpent: totalTime,
      wrongQuestionIds: wrongIds,
      subject: subjectFilter as SubjectSlug | 'all',
    });
    saveProgress(progress);
    setSavedScore(score);
    setTimeLeft(remainingTime);
    setFinished(true);
  }, [answers, examType, questionCount, questions, subjectFilter, timeLeft]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, finishQuiz]);

  useEffect(() => {
    if (finished) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const ci = parseInt(key, 10) - 1;
        if (ci < (questions[currentIndex]?.choices.length || 0)) {
          setAnswers((prev) => ({ ...prev, [currentIndex]: ci }));
        }
      }
      if (key === 'ArrowRight' || key === 'n') {
        if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
      }
      if (key === 'ArrowLeft' || key === 'p') {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
      }
      if (key === 'f') {
        setFlagged((prev) => {
          const next = new Set(prev);
          if (next.has(currentIndex)) next.delete(currentIndex);
          else next.add(currentIndex);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [finished, currentIndex, questions]);

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
        <p className="text-t-muted mb-4">条件に合う問題がありません</p>
        <button onClick={() => router.push('/quiz')} className="text-primary font-medium hover:underline">戻る</button>
      </div>
    );
  }

  if (finished) {
    const score = savedScore ?? questions.reduce((total, q, i) => total + Number(answers[i] === q.correctIndex), 0);
    const wrongQuestions: { q: Question; selected: number | undefined }[] = [];
    questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) {
        wrongQuestions.push({ q, selected: answers[i] });
      }
    });
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-primary">試験結果</h1>

        <div className={`text-center p-6 rounded-card border-2 ${passed ? 'border-success bg-success/5' : 'border-error bg-error/5'}`}>
          <p className="text-4xl font-bold text-t-primary mb-2">{score} / {questions.length}</p>
          <p className={`text-xl font-bold ${passed ? 'text-success' : 'text-error'}`}>
            {percentage}% — {passed ? '合格ライン達成!' : '不合格'}
          </p>
        </div>

        {wrongQuestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-t-primary">間違えた問題</h2>
            {wrongQuestions.map(({ q, selected }) => (
              <div key={q.id} className="theme-card p-4 space-y-2">
                <p className="font-medium text-t-primary">{q.question}</p>
                <div className="space-y-1">
                  {q.choices.map((choice, ci) => (
                    <div
                      key={ci}
                      className={`p-2 rounded-lg text-sm ${
                        ci === q.correctIndex
                          ? 'bg-success/10 text-success font-medium border border-success'
                          : ci === selected
                          ? 'bg-error/10 text-error border border-error'
                          : 'bg-surface-alt text-t-muted'
                      }`}
                    >
                      {ci + 1}. {choice}
                      {ci === q.correctIndex && ' ✓'}
                      {ci === selected && ci !== q.correctIndex && ' ✗'}
                    </div>
                  ))}
                </div>
                <div className="bg-primary/5 p-2 rounded-lg text-sm text-t-secondary">
                  <p className="font-medium mb-1 text-t-primary">解説</p>
                  <p>{q.explanation}</p>
                </div>
                {q.relatedArticle && (
                  <p className="text-xs text-t-muted">
                    <span className="font-medium">関連条文:</span> {q.relatedArticle}
                  </p>
                )}
                <p className="text-xs text-primary font-medium">
                  ポイント: {q.keyPoint}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/quiz')}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            新しい試験を始める
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 bg-surface-alt text-t-secondary rounded-xl font-medium hover:bg-surface-hover transition-colors"
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
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-t-secondary">
          問 {currentIndex + 1} / {questions.length}
        </span>
        <span className={`text-sm font-bold ${timeLeft < 300 ? 'text-error' : 'text-primary'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="w-full bg-surface-alt rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <p className="text-xs text-t-muted hidden md:block" aria-hidden="true">
        キーボード: 1-4で選択 / ←→で移動 / Fでフラグ
      </p>

      <div className="theme-card p-5 space-y-4">
        <div className="flex justify-between">
          <span className="text-xs text-t-muted">{currentQuestion.topic}</span>
          <button
            onClick={toggleFlag}
            className={`text-sm px-2 py-0.5 rounded-lg transition-all ${
              flagged.has(currentIndex) ? 'bg-accent text-white' : 'bg-surface-alt text-t-muted'
            }`}
            aria-label={flagged.has(currentIndex) ? 'フラグを解除' : 'フラグを付ける'}
          >
            {flagged.has(currentIndex) ? 'フラグ済' : 'フラグ'}
          </button>
        </div>

        <p className="text-base font-medium leading-relaxed text-t-primary">{currentQuestion.question}</p>

        <div className="space-y-2" role="radiogroup" aria-label="解答選択">
          {currentQuestion.choices.map((choice, ci) => (
            <button
              key={ci}
              onClick={() => selectAnswer(ci)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                answers[currentIndex] === ci
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 hover:bg-surface-alt text-t-primary'
              }`}
              role="radio"
              aria-checked={answers[currentIndex] === ci}
            >
              <span className="inline-block w-6 text-t-muted font-mono">{ci + 1}.</span> {choice}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 bg-surface-alt text-t-secondary rounded-xl font-medium disabled:opacity-40 hover:bg-surface-hover transition-colors"
          aria-label="前の問題"
        >
          前の問題
        </button>
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={() => finishQuiz()}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            試験を終了する
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            aria-label="次の問題"
          >
            次の問題
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 justify-center" role="navigation" aria-label="問題一覧">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              i === currentIndex
                ? 'bg-primary text-white'
                : answers[i] !== undefined
                ? 'bg-primary/15 text-primary'
                : flagged.has(i)
                ? 'bg-accent/15 text-accent'
                : 'bg-surface-alt text-t-muted'
            }`}
            aria-label={`問題${i + 1}`}
            aria-current={i === currentIndex ? 'step' : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
