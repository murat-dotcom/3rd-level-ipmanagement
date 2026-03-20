'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress, saveProgress, markMistakeMastered } from '@/lib/storage';
import { allQuestions } from '@/data/questions';
import { MistakeEntry, Question, SUBJECT_LABELS, SubjectSlug } from '@/types/question';

export default function MistakeNotebook() {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<(MistakeEntry & { question: Question })[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'mastered'>('active');
  const [subjectFilter, setSubjectFilter] = useState<SubjectSlug | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const progress = getProgress();
    if (!progress.mistakeNotebook) return;

    const entries = Object.values(progress.mistakeNotebook)
      .map((entry) => {
        const question = allQuestions.find((q) => q.id === entry.questionId);
        if (!question) return null;
        return { ...entry, question };
      })
      .filter(Boolean) as (MistakeEntry & { question: Question })[];

    setMistakes(entries.sort((a, b) => b.reviewCount - a.reviewCount));
  }, []);

  const handleMastered = (questionId: string) => {
    const progress = getProgress();
    const updated = markMistakeMastered(progress, questionId);
    saveProgress(updated);
    setMistakes((prev) =>
      prev.map((m) => (m.questionId === questionId ? { ...m, mastered: true } : m))
    );
  };

  const filtered = mistakes.filter((m) => {
    if (filter === 'active' && m.mastered) return false;
    if (filter === 'mastered' && !m.mastered) return false;
    if (subjectFilter !== 'all' && m.question.subject !== subjectFilter) return false;
    return true;
  });

  const subjectCounts: Record<string, number> = {};
  mistakes.filter((m) => !m.mastered).forEach((m) => {
    subjectCounts[m.question.subject] = (subjectCounts[m.question.subject] || 0) + 1;
  });

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">間違いノート</h1>
      <p className="text-sm text-t-secondary">
        間違えた問題を復習して苦手を克服しましょう
      </p>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`p-3 rounded-card text-center text-sm font-medium border-2 transition-all ${
            filter === 'all' ? 'bg-primary text-white border-primary' : 'theme-card'
          }`}
        >
          <p className="text-xl font-bold">{mistakes.length}</p>
          <p className={filter === 'all' ? '' : 'text-t-secondary'}>全て</p>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-3 rounded-card text-center text-sm font-medium border-2 transition-all ${
            filter === 'active' ? 'bg-error text-white border-error' : 'theme-card'
          }`}
        >
          <p className="text-xl font-bold">{mistakes.filter((m) => !m.mastered).length}</p>
          <p className={filter === 'active' ? '' : 'text-t-secondary'}>未克服</p>
        </button>
        <button
          onClick={() => setFilter('mastered')}
          className={`p-3 rounded-card text-center text-sm font-medium border-2 transition-all ${
            filter === 'mastered' ? 'bg-success text-white border-success' : 'theme-card'
          }`}
        >
          <p className="text-xl font-bold">{mistakes.filter((m) => m.mastered).length}</p>
          <p className={filter === 'mastered' ? '' : 'text-t-secondary'}>克服済</p>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSubjectFilter('all')}
          className={`py-1 px-3 rounded-xl text-xs font-medium transition-all ${
            subjectFilter === 'all' ? 'bg-primary text-white' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
          }`}
        >
          全科目
        </button>
        {Object.entries(subjectCounts).map(([subject, count]) => (
          <button
            key={subject}
            onClick={() => setSubjectFilter(subject as SubjectSlug)}
            className={`py-1 px-3 rounded-xl text-xs font-medium transition-all ${
              subjectFilter === subject ? 'bg-primary text-white' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'
            }`}
          >
            {SUBJECT_LABELS[subject as SubjectSlug]} ({count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-t-muted">
          {filter === 'active' ? '未克服の問題はありません！' : '該当する問題がありません'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m.questionId}
              className={`theme-card transition-all ${
                m.mastered ? 'opacity-70 border-success/30' : ''
              }`}
            >
              <button
                onClick={() => setExpandedId(expandedId === m.questionId ? null : m.questionId)}
                className="w-full text-left p-4"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium flex-1 text-t-primary">{m.question.question}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-t-muted">{m.reviewCount}回</span>
                    {m.mastered && <span className="text-xs bg-success text-white px-1.5 py-0.5 rounded-lg">克服</span>}
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-t-muted">{SUBJECT_LABELS[m.question.subject]}</span>
                  <span className="text-xs text-t-muted">{m.question.topic}</span>
                </div>
              </button>

              {expandedId === m.questionId && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <div className="space-y-1">
                    {m.question.choices.map((choice, ci) => (
                      <div
                        key={ci}
                        className={`p-2 rounded-lg text-sm ${
                          ci === m.question.correctIndex
                            ? 'bg-success/10 text-success font-medium border border-success'
                            : ci === m.selectedAnswer
                            ? 'bg-error/10 text-error border border-error'
                            : 'bg-surface-alt text-t-muted'
                        }`}
                      >
                        {ci + 1}. {choice}
                        {ci === m.question.correctIndex && ' ✓'}
                        {ci === m.selectedAnswer && ci !== m.question.correctIndex && ' ✗'}
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1 text-t-primary">解説</p>
                    <p className="text-t-secondary">{m.question.explanation}</p>
                  </div>
                  {m.question.relatedArticle && (
                    <p className="text-xs text-t-muted">関連条文: {m.question.relatedArticle}</p>
                  )}
                  <p className="text-xs text-primary font-medium">ポイント: {m.question.keyPoint}</p>
                  {!m.mastered && (
                    <button
                      onClick={() => handleMastered(m.questionId)}
                      className="w-full py-2 bg-success text-white rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      克服済みにする
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
