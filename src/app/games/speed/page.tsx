'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS } from '@/types/question';
import { getProgress, saveProgress, updateGameHighScore, updateStreak, getGameHighScore } from '@/lib/storage';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SpeedQuestion {
  term: DoomscrollTerm;
  choices: string[];
  correctIndex: number;
}

function generateQuestion(pool: DoomscrollTerm[]): SpeedQuestion {
  const shuffled = shuffleArray(pool);
  const term = shuffled[0];
  const distractors = shuffled.filter((t) => t.id !== term.id).slice(0, 3);
  const choices = shuffleArray([term, ...distractors]);
  const correctIndex = choices.findIndex((c) => c.id === term.id);
  return { term, choices: choices.map((c) => c.term), correctIndex };
}

type Phase = 'setup' | 'playing' | 'result';

export default function SpeedChallenge() {
  const [subject, setSubject] = useState<SubjectSlug | 'all'>('all');
  const [phase, setPhase] = useState<Phase>('setup');
  const [timeLeft, setTimeLeft] = useState(60);
  const [question, setQuestion] = useState<SpeedQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const poolRef = useRef<DoomscrollTerm[]>([]);

  useEffect(() => {
    const p = getProgress();
    setHighScore(getGameHighScore(p, 'speed'));
  }, []);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(poolRef.current));
    setFeedback(null);
  }, []);

  const startGame = () => {
    const pool = subject === 'all' ? allDoomscrollTerms : allDoomscrollTerms.filter((t) => t.subject === subject);
    poolRef.current = pool;
    setScore(0);
    setStreak(0);
    setMultiplier(1);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(60);
    setPhase('playing');
    setQuestion(generateQuestion(pool));
    setFeedback(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Save score on result
  useEffect(() => {
    if (phase === 'result' && score > 0) {
      let p = getProgress();
      p = updateStreak(p);
      p = updateGameHighScore(p, 'speed', score, subject);
      saveProgress(p);
      setHighScore(getGameHighScore(p, 'speed'));
    }
  }, [phase, score, subject]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleAnswer = (idx: number) => {
    if (!question || feedback) return;

    if (idx === question.correctIndex) {
      const newStreak = streak + 1;
      const newMult = newStreak >= 10 ? 4 : newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      const points = 100 * newMult;
      setStreak(newStreak);
      setMultiplier(newMult);
      setScore((s) => s + points);
      setCorrect((c) => c + 1);
      setFeedback('correct');
    } else {
      setStreak(0);
      setMultiplier(1);
      setWrong((w) => w + 1);
      setFeedback('wrong');
    }

    setTimeout(() => {
      nextQuestion();
    }, 300);
  };

  if (phase === 'setup') {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <Link href="/games" className="text-sm text-primary hover:underline">← ゲームセンター</Link>
        <h1 className="text-2xl font-bold text-primary">⚡ タイムアタック</h1>
        <p className="text-sm text-t-secondary">定義を読んで正しい用語を選ぼう。60秒間で最高スコアを目指せ！連続正解でスコア倍率UP。</p>

        <div className="theme-card p-4 space-y-3">
          <label className="text-sm font-medium text-t-primary">科目を選択</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSubject('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${subject === 'all' ? 'bg-primary text-white' : 'theme-surface-alt text-t-secondary hover:text-t-primary'}`}
            >
              全科目
            </button>
            {ALL_SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${subject === s ? 'bg-primary text-white' : 'theme-surface-alt text-t-secondary hover:text-t-primary'}`}
              >
                {SUBJECT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="theme-card p-4 space-y-2">
          <p className="text-sm font-medium text-t-primary">倍率システム</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-t-secondary">
            <span>3連続正解 → ×2</span>
            <span>5連続正解 → ×3</span>
            <span>10連続正解 → ×4</span>
            <span>不正解でリセット</span>
          </div>
        </div>

        {highScore > 0 && (
          <p className="text-sm text-t-muted">現在のハイスコア: <span className="font-bold text-primary">{highScore.toLocaleString()}</span>点</p>
        )}

        <button onClick={startGame} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-lg hover:opacity-90 transition-opacity">
          スタート！
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    const total = correct + wrong;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const isNewHigh = score >= highScore && score > 0;
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 text-center">
        <h1 className="text-2xl font-bold text-primary">タイムアップ！</h1>
        {isNewHigh && <p className="text-lg font-bold text-accent animate-bounce">🎉 新記録達成！</p>}
        <div className="theme-card p-6 space-y-4">
          <p className="text-4xl font-bold text-primary">{score.toLocaleString()}<span className="text-lg">点</span></p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-success">{correct}</p>
              <p className="text-xs text-t-muted">正解</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error">{wrong}</p>
              <p className="text-xs text-t-muted">不正解</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-t-primary">{accuracy}%</p>
              <p className="text-xs text-t-muted">正答率</p>
            </div>
          </div>
          <p className="text-sm text-t-muted">ハイスコア: {highScore.toLocaleString()}点</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity">
            もう一度
          </button>
          <Link href="/games" className="px-6 py-2.5 rounded-xl theme-surface-alt text-t-secondary font-medium hover:text-t-primary transition-all">
            戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const timerPercent = (timeLeft / 60) * 100;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-error animate-pulse' : 'text-t-primary'}`}>
            {timeLeft}s
          </span>
          {multiplier > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-bold">
              ×{multiplier}
            </span>
          )}
        </div>
        <span className="text-xl font-bold text-primary tabular-nums">{score}点</span>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 rounded-full theme-surface-alt overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-error' : 'bg-primary'}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Streak indicator */}
      {streak > 0 && (
        <div className="text-center">
          <span className="text-sm font-medium text-accent">{streak}連続正解！</span>
        </div>
      )}

      {/* Question */}
      <div className={`theme-card p-5 transition-all ${feedback === 'correct' ? 'ring-2 ring-success' : feedback === 'wrong' ? 'ring-2 ring-error' : ''}`}>
        <p className="text-xs text-t-muted mb-2">この定義に合う用語は？</p>
        <p className="text-base text-t-primary leading-relaxed">{question.term.definition}</p>
        <p className="text-xs text-t-muted mt-2">💡 {question.term.keyPoint}</p>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            className={`p-4 rounded-xl text-sm font-medium transition-all ${
              feedback !== null && idx === question.correctIndex
                ? 'bg-success text-white'
                : feedback === 'wrong' && idx !== question.correctIndex
                ? 'theme-card opacity-50'
                : 'theme-card theme-card-hover active:scale-95'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
