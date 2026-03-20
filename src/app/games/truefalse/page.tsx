'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface TFQuestion {
  term: DoomscrollTerm;
  shownDefinition: string;
  isCorrect: boolean;
}

function generateTFQuestion(pool: DoomscrollTerm[]): TFQuestion {
  const shuffled = shuffleArray(pool);
  const term = shuffled[0];
  const isCorrect = Math.random() < 0.5;

  if (isCorrect) {
    return { term, shownDefinition: term.definition, isCorrect: true };
  } else {
    const other = shuffled.find((t) => t.id !== term.id && t.definition !== term.definition);
    return { term, shownDefinition: other?.definition ?? term.definition, isCorrect: !other ? true : false };
  }
}

type Phase = 'setup' | 'playing' | 'result';

export default function TrueFalseBlitz() {
  const [subject, setSubject] = useState<SubjectSlug | 'all'>('all');
  const [phase, setPhase] = useState<Phase>('setup');
  const [question, setQuestion] = useState<TFQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const poolRef = useRef<DoomscrollTerm[]>([]);

  useEffect(() => {
    const p = getProgress();
    setHighScore(getGameHighScore(p, 'truefalse'));
  }, []);

  const nextQuestion = useCallback(() => {
    setQuestion(generateTFQuestion(poolRef.current));
    setFeedback(null);
    setShowAnswer(false);
  }, []);

  const startGame = () => {
    const pool = subject === 'all' ? allDoomscrollTerms : allDoomscrollTerms.filter((t) => t.subject === subject);
    poolRef.current = pool;
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrect(0);
    setWrong(0);
    setLives(3);
    setPhase('playing');
    setQuestion(generateTFQuestion(pool));
    setFeedback(null);
    setShowAnswer(false);
  };

  const endGame = useCallback((finalScore: number) => {
    setPhase('result');
    let p = getProgress();
    p = updateStreak(p);
    p = updateGameHighScore(p, 'truefalse', finalScore, subject);
    saveProgress(p);
    setHighScore(getGameHighScore(p, 'truefalse'));
  }, [subject]);

  const handleAnswer = (userSaysCorrect: boolean) => {
    if (!question || feedback) return;

    const isRight = userSaysCorrect === question.isCorrect;

    if (isRight) {
      const newCombo = combo + 1;
      const comboBonus = Math.min(newCombo, 10) * 10;
      const points = 100 + comboBonus;
      const newScore = score + points;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setScore(newScore);
      setCorrect((c) => c + 1);
      setFeedback('correct');
      setTimeout(() => nextQuestion(), 400);
    } else {
      const newLives = lives - 1;
      setCombo(0);
      setWrong((w) => w + 1);
      setLives(newLives);
      setFeedback('wrong');
      setShowAnswer(true);

      if (newLives <= 0) {
        setTimeout(() => endGame(score), 1200);
      } else {
        setTimeout(() => nextQuestion(), 1200);
      }
    }
  };

  if (phase === 'setup') {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <Link href="/games" className="text-sm text-primary hover:underline">← ゲームセンター</Link>
        <h1 className="text-2xl font-bold text-primary">⭕ ○×ブリッツ</h1>
        <p className="text-sm text-t-secondary">用語と定義の組み合わせが正しければ○、間違っていれば×を押そう。ライフ3つで勝負！コンボでボーナス得点。</p>

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
          <p className="text-sm font-medium text-t-primary">ルール</p>
          <ul className="text-sm text-t-secondary space-y-1">
            <li>・ライフは3つ。不正解で1つ減ります</li>
            <li>・連続正解でコンボボーナス（最大+100点）</li>
            <li>・ライフがなくなるとゲーム終了</li>
          </ul>
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
        <h1 className="text-2xl font-bold text-primary">ゲームオーバー</h1>
        {isNewHigh && <p className="text-lg font-bold text-accent animate-bounce">🎉 新記録達成！</p>}
        <div className="theme-card p-6 space-y-4">
          <p className="text-4xl font-bold text-primary">{score.toLocaleString()}<span className="text-lg">点</span></p>
          <div className="grid grid-cols-4 gap-3 text-center">
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
            <div>
              <p className="text-2xl font-bold text-accent">{maxCombo}</p>
              <p className="text-xs text-t-muted">最大コンボ</p>
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

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-xl ${i < lives ? '' : 'opacity-20 grayscale'}`}>
              ❤️
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-bold">
              {combo}コンボ
            </span>
          )}
          <span className="text-xl font-bold text-primary tabular-nums">{score}点</span>
        </div>
      </div>

      {/* Question card */}
      <div className={`theme-card p-6 space-y-4 transition-all ${
        feedback === 'correct' ? 'ring-2 ring-success' : feedback === 'wrong' ? 'ring-2 ring-error' : ''
      }`}>
        <div>
          <p className="text-xs text-t-muted mb-1">用語</p>
          <p className="text-xl font-bold text-t-primary">
            {question.term.term}
            {question.term.reading && <span className="ml-2 text-sm font-normal text-t-muted">({question.term.reading})</span>}
          </p>
        </div>
        <div className="border-t border-border/50 pt-3">
          <p className="text-xs text-t-muted mb-1">定義</p>
          <p className="text-base text-t-secondary leading-relaxed">{question.shownDefinition}</p>
        </div>

        {showAnswer && (
          <div className="border-t border-border/50 pt-3">
            <p className="text-xs text-error mb-1">正しい定義:</p>
            <p className="text-sm text-t-primary">{question.term.definition}</p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-t-muted">この用語と定義の組み合わせは正しい？</p>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(true)}
          disabled={feedback !== null}
          className={`py-5 rounded-xl text-xl font-bold transition-all active:scale-95 ${
            feedback !== null && question.isCorrect
              ? 'bg-success text-white'
              : feedback !== null
              ? 'theme-surface-alt text-t-muted'
              : 'theme-card theme-card-hover text-success'
          }`}
        >
          ○ 正しい
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={feedback !== null}
          className={`py-5 rounded-xl text-xl font-bold transition-all active:scale-95 ${
            feedback !== null && !question.isCorrect
              ? 'bg-success text-white'
              : feedback !== null
              ? 'theme-surface-alt text-t-muted'
              : 'theme-card theme-card-hover text-error'
          }`}
        >
          × 間違い
        </button>
      </div>
    </div>
  );
}
