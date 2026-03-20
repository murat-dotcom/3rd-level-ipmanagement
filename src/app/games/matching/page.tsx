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

function pickTerms(subject: SubjectSlug | 'all', count: number): DoomscrollTerm[] {
  const pool = subject === 'all' ? allDoomscrollTerms : allDoomscrollTerms.filter((t) => t.subject === subject);
  return shuffleArray(pool).slice(0, count);
}

type GamePhase = 'setup' | 'playing' | 'result';

interface MatchRound {
  terms: DoomscrollTerm[];
  shuffledDefs: { id: string; definition: string }[];
}

export default function MatchingGame() {
  const [subject, setSubject] = useState<SubjectSlug | 'all'>('all');
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [round, setRound] = useState<MatchRound | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [totalRounds] = useState(5);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const pairsPerRound = 5;
  const wrongTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const p = getProgress();
    setHighScore(getGameHighScore(p, 'matching'));
  }, []);

  const startRound = useCallback((roundIdx: number) => {
    const terms = pickTerms(subject, pairsPerRound);
    const shuffledDefs = shuffleArray(terms.map((t) => ({ id: t.id, definition: t.definition })));
    setRound({ terms, shuffledDefs });
    setRoundNum(roundIdx);
    setSelectedTerm(null);
    setMatched(new Set());
    setWrong(null);
    setRoundStartTime(Date.now());
  }, [subject]);

  const startGame = () => {
    setScore(0);
    setPhase('playing');
    setStartTime(Date.now());
    startRound(0);
  };

  const handleTermClick = (termId: string) => {
    if (matched.has(termId) || wrong) return;
    setSelectedTerm(termId === selectedTerm ? null : termId);
  };

  const handleDefClick = (defId: string) => {
    if (!selectedTerm || matched.has(defId) || wrong) return;

    if (selectedTerm === defId) {
      const newMatched = new Set(matched);
      newMatched.add(defId);
      setMatched(newMatched);
      setSelectedTerm(null);

      const elapsed = (Date.now() - roundStartTime) / 1000;
      const timeBonus = Math.max(0, Math.floor((30 - elapsed) * 10));
      const roundScore = 100 + timeBonus;
      const newScore = score + roundScore;
      setScore(newScore);

      if (newMatched.size === pairsPerRound) {
        setTimeout(() => {
          if (roundNum + 1 < totalRounds) {
            startRound(roundNum + 1);
          } else {
            setPhase('result');
            let p = getProgress();
            p = updateStreak(p);
            p = updateGameHighScore(p, 'matching', newScore, subject);
            saveProgress(p);
            setHighScore(getGameHighScore(p, 'matching'));
          }
        }, 600);
      }
    } else {
      setWrong(defId);
      setScore((s) => Math.max(0, s - 30));
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        setWrong(null);
        setSelectedTerm(null);
      }, 500);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <Link href="/games" className="text-sm text-primary hover:underline">← ゲームセンター</Link>
        <h1 className="text-2xl font-bold text-primary">🔗 用語マッチング</h1>
        <p className="text-sm text-t-secondary">用語と定義を正しくペアにしよう。{totalRounds}ラウンド × {pairsPerRound}ペア。速くマッチするほどボーナス！</p>

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
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const isNewHigh = score >= highScore && score > 0;
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 text-center">
        <h1 className="text-2xl font-bold text-primary">ゲーム終了！</h1>
        {isNewHigh && <p className="text-lg font-bold text-accent animate-bounce">🎉 新記録達成！</p>}
        <div className="theme-card p-6 space-y-3">
          <p className="text-4xl font-bold text-primary">{score.toLocaleString()}<span className="text-lg">点</span></p>
          <p className="text-sm text-t-muted">クリアタイム: {totalTime}秒</p>
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

  if (!round) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/games" className="text-sm text-primary hover:underline">← 戻る</Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-t-muted">ラウンド {roundNum + 1}/{totalRounds}</span>
          <span className="font-bold text-primary">{score}点</span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < roundNum ? 'bg-success' : i === roundNum ? 'bg-primary scale-125' : 'theme-surface-alt'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-sm text-t-muted">用語をタップしてから、対応する定義をタップしてペアにしよう</p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Terms column */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-t-muted uppercase tracking-wider mb-2">用語</h3>
          {round.terms.map((t) => {
            const isMatched = matched.has(t.id);
            const isSelected = selectedTerm === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTermClick(t.id)}
                disabled={isMatched}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isMatched
                    ? 'bg-success/20 text-success line-through opacity-60'
                    : isSelected
                    ? 'bg-primary text-white shadow-md scale-[1.02]'
                    : 'theme-card theme-card-hover'
                }`}
              >
                {t.term}
                {t.reading && <span className="ml-2 text-xs opacity-70">({t.reading})</span>}
              </button>
            );
          })}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-t-muted uppercase tracking-wider mb-2">定義</h3>
          {round.shuffledDefs.map((d) => {
            const isMatched = matched.has(d.id);
            const isWrong = wrong === d.id;
            return (
              <button
                key={d.id}
                onClick={() => handleDefClick(d.id)}
                disabled={isMatched}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm leading-relaxed transition-all ${
                  isMatched
                    ? 'bg-success/20 text-success opacity-60'
                    : isWrong
                    ? 'bg-error/20 text-error animate-pulse'
                    : selectedTerm
                    ? 'theme-card theme-card-hover cursor-pointer ring-1 ring-primary/30'
                    : 'theme-card opacity-70'
                }`}
              >
                {d.definition}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
