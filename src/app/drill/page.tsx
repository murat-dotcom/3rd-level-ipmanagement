'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS } from '@/types/question';
import { allQuestions } from '@/data/questions';

function DrillSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubject = (searchParams.get('subject') as SubjectSlug) || 'patent';

  const [subject, setSubject] = useState<SubjectSlug>(initialSubject);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 0>(0);

  const topics = useMemo(() => {
    const filtered = allQuestions.filter((q) => q.subject === subject);
    return [...new Set(filtered.map((q) => q.topic))];
  }, [subject]);

  const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');

  const availableCount = useMemo(() => {
    let pool = allQuestions.filter((q) => q.subject === subject);
    if (selectedTopic !== 'all') pool = pool.filter((q) => q.topic === selectedTopic);
    if (difficulty > 0) pool = pool.filter((q) => q.difficulty === difficulty);
    return pool.length;
  }, [subject, selectedTopic, difficulty]);

  const startDrill = () => {
    const params = new URLSearchParams({
      subject,
      topic: selectedTopic,
      difficulty: difficulty.toString(),
    });
    const sessionId = Date.now().toString(36);
    router.push(`/drill/${sessionId}?${params.toString()}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">過去問演習</h1>
      <p className="text-sm text-t-secondary">科目・トピック別に問題を解きます（即時フィードバック）</p>

      <div className="theme-card p-5 space-y-3">
        <h2 className="font-bold text-t-primary">科目</h2>
        <div className="grid grid-cols-2 gap-2">
          {ALL_SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => { setSubject(s); setSelectedTopic('all'); }}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                subject === s ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
              }`}
            >
              {SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {topics.length > 0 && (
        <div className="theme-card p-5 space-y-3">
          <h2 className="font-bold text-t-primary">トピック</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`py-1.5 px-3 rounded-xl text-sm font-medium transition-all ${
                selectedTopic === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
              }`}
            >
              全トピック
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`py-1.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  selectedTopic === topic ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="theme-card p-5 space-y-3">
        <h2 className="font-bold text-t-primary">難易度</h2>
        <div className="flex gap-2">
          {[
            { value: 0, label: '全て' },
            { value: 1, label: '基本' },
            { value: 2, label: '標準' },
            { value: 3, label: '応用' },
          ].map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value as 0 | 1 | 2 | 3)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                difficulty === d.value ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={startDrill}
        disabled={availableCount === 0}
        className="w-full py-4 bg-primary text-white rounded-xl text-lg font-bold hover:bg-primary-hover transition-all shadow-sm hover:shadow-md disabled:opacity-40"
      >
        演習を開始する（{availableCount}問）
      </button>
    </div>
  );
}

export default function DrillSetup() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-t-muted">読み込み中...</div>}>
      <DrillSetupInner />
    </Suspense>
  );
}
