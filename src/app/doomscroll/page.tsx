'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS } from '@/types/question';
import { getProgress, saveProgress } from '@/lib/storage';

const BATCH_SIZE = 10;

const SUBJECT_COLORS: Record<SubjectSlug, string> = {
  patent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  copyright: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  trademark: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  design: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  treaties: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

const CATEGORY_ICONS: Record<string, string> = {
  '定義': '📖',
  '手続': '📋',
  '期間': '⏰',
  '権利': '🔑',
  '要件': '✅',
  '制度': '🏛️',
  '条約': '🌐',
  '比較': '⚖️',
};

const DIFFICULTY_LABELS = ['', '基本', '標準', '応用'];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function TermCard({
  term,
  isRead,
  onToggleRead,
  onRelatedClick,
  termMap,
}: {
  term: DoomscrollTerm;
  isRead: boolean;
  onToggleRead: (id: string) => void;
  onRelatedClick: (id: string) => void;
  termMap: Map<string, DoomscrollTerm>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={`term-${term.id}`}
      className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 ${
        isRead
          ? 'border-success/40 bg-emerald-50/50 dark:bg-emerald-900/10'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUBJECT_COLORS[term.subject]}`}>
              {SUBJECT_LABELS[term.subject]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              {CATEGORY_ICONS[term.category] || '📝'} {term.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              term.difficulty === 1
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : term.difficulty === 2
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {DIFFICULTY_LABELS[term.difficulty]}
            </span>
          </div>
          <button
            onClick={() => onToggleRead(term.id)}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isRead
                ? 'bg-success text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            aria-label={isRead ? '既読を解除' : '既読にする'}
            title={isRead ? '既読を解除' : '既読にする'}
          >
            {isRead ? '✓' : '○'}
          </button>
        </div>

        {/* Term name */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {term.term}
          {term.reading && (
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-2">
              ({term.reading})
            </span>
          )}
        </h3>
      </div>

      {/* Definition */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {term.definition}
        </p>
      </div>

      {/* Key Point */}
      <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">💡 ポイント</p>
        <p className="text-sm text-amber-900 dark:text-amber-200">{term.keyPoint}</p>
      </div>

      {/* Related terms (expandable) */}
      {term.relatedTermIds.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {expanded ? '▼' : '▶'} 関連用語 ({term.relatedTermIds.length})
          </button>
          {expanded && (
            <div className="flex flex-wrap gap-2 mt-2">
              {term.relatedTermIds.map((relId) => {
                const relTerm = termMap.get(relId);
                if (!relTerm) return null;
                return (
                  <button
                    key={relId}
                    onClick={() => onRelatedClick(relId)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                  >
                    {relTerm.term}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoomscrollPage() {
  const [subjectFilter, setSubjectFilter] = useState<SubjectSlug | 'all'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [shuffled, setShuffled] = useState(false);
  const [terms, setTerms] = useState<DoomscrollTerm[]>(allDoomscrollTerms);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Build a map for quick lookups
  const termMap = useMemo(() => {
    const map = new Map<string, DoomscrollTerm>();
    allDoomscrollTerms.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  // Load read state from storage
  useEffect(() => {
    const progress = getProgress();
    if (progress.doomscrollRead) {
      setReadIds(new Set(progress.doomscrollRead));
    }
  }, []);

  // Filter terms
  const filteredTerms = useMemo(() => {
    if (subjectFilter === 'all') return terms;
    return terms.filter((t) => t.subject === subjectFilter);
  }, [terms, subjectFilter]);

  const visibleTerms = filteredTerms.slice(0, displayCount);
  const hasMore = displayCount < filteredTerms.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount((prev) => prev + BATCH_SIZE);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [subjectFilter]);

  const toggleRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Persist
      const progress = getProgress();
      progress.doomscrollRead = Array.from(next);
      saveProgress(progress);
      return next;
    });
  }, []);

  const handleRelatedClick = useCallback((id: string) => {
    const el = document.getElementById(`term-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
    } else {
      // Term might not be visible — reset filter and expand
      setSubjectFilter('all');
      setDisplayCount(allDoomscrollTerms.length);
      setTimeout(() => {
        const el2 = document.getElementById(`term-${id}`);
        if (el2) {
          el2.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el2.classList.add('ring-2', 'ring-primary');
          setTimeout(() => el2.classList.remove('ring-2', 'ring-primary'), 2000);
        }
      }, 100);
    }
  }, []);

  const handleShuffle = () => {
    setTerms(shuffleArray(allDoomscrollTerms));
    setShuffled(true);
    setDisplayCount(BATCH_SIZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setTerms(allDoomscrollTerms);
    setShuffled(false);
    setDisplayCount(BATCH_SIZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const readCount = readIds.size;
  const totalCount = allDoomscrollTerms.length;
  const progressPercent = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary">📜 用語ドゥームスクロール</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          スクロールしながら知財用語を学ぼう
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex justify-between items-center text-sm mb-1.5">
          <span className="text-slate-600 dark:text-slate-400">学習進捗</span>
          <span className="font-bold text-primary">{readCount}/{totalCount} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4 md:-mx-8 md:px-8">
        {/* Subject filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSubjectFilter('all')}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              subjectFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            すべて ({allDoomscrollTerms.length})
          </button>
          {ALL_SUBJECTS.map((sub) => {
            const count = allDoomscrollTerms.filter((t) => t.subject === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  subjectFilter === sub
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {SUBJECT_LABELS[sub].replace(/法$/, '').replace(/法・.*/, '')} ({count})
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={shuffled ? handleReset : handleShuffle}
            className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {shuffled ? '↺ 元の順序' : '🔀 シャッフル'}
          </button>
        </div>
      </div>

      {/* Term cards */}
      <div className="space-y-4 mt-2">
        {visibleTerms.map((term) => (
          <TermCard
            key={term.id}
            term={term}
            isRead={readIds.has(term.id)}
            onToggleRead={toggleRead}
            onRelatedClick={handleRelatedClick}
            termMap={termMap}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-2">読み込み中...</p>
        </div>
      )}

      {/* End message */}
      {!hasMore && visibleTerms.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            🎉 全 {filteredTerms.length} 用語を表示しました！
          </p>
        </div>
      )}

      {/* Empty state */}
      {visibleTerms.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-slate-400">該当する用語がありません</p>
        </div>
      )}
    </div>
  );
}
