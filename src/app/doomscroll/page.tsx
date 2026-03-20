'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS, TermCategory } from '@/types/question';
import { getProgress, saveProgress } from '@/lib/storage';

const BATCH_SIZE = 12;
const CATEGORY_ORDER: TermCategory[] = ['定義', '手続', '期間', '権利', '要件', '制度', '条約', '比較'];

const SUBJECT_COLORS: Record<SubjectSlug, string> = {
  patent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  copyright: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  trademark: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  design: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  treaties: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

const CATEGORY_ICONS: Record<string, string> = {
  定義: '📖',
  手続: '📋',
  期間: '⏰',
  権利: '🔑',
  要件: '✅',
  制度: '🏛️',
  条約: '🌐',
  比較: '⚖️',
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
  isPinned,
  onPin,
}: {
  term: DoomscrollTerm;
  isRead: boolean;
  onToggleRead: (id: string) => void;
  onRelatedClick: (id: string) => void;
  termMap: Map<string, DoomscrollTerm>;
  isPinned: boolean;
  onPin: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={`term-${term.id}`}
      className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 shadow-sm ${
        isRead
          ? 'border-success/40 bg-emerald-50/50 dark:bg-emerald-900/10'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUBJECT_COLORS[term.subject]}`}>
              {SUBJECT_LABELS[term.subject]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              {CATEGORY_ICONS[term.category] || '📝'} {term.category}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                term.difficulty === 1
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : term.difficulty === 2
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}
            >
              {DIFFICULTY_LABELS[term.difficulty]}
            </span>
            {term.source === 'generated' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                AI生成
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPin(term.id)}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isPinned
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
              aria-label={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
              title={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
            >
              📌
            </button>
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
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {term.term}
          {term.reading && (
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-2">
              ({term.reading})
            </span>
          )}
        </h3>
      </div>

      <div className="px-4 pb-3">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{term.definition}</p>
      </div>

      <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">💡 ポイント</p>
        <p className="text-sm text-amber-900 dark:text-amber-200">{term.keyPoint}</p>
      </div>

      {term.relatedTermIds.length > 0 && (
        <div className="px-4 pb-4">
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline font-medium">
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
  const [categoryFilter, setCategoryFilter] = useState<TermCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<1 | 2 | 3 | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readMode, setReadMode] = useState<'all' | 'unread' | 'read'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [shuffled, setShuffled] = useState(false);
  const [generatedTerms, setGeneratedTerms] = useState<DoomscrollTerm[]>([]);
  const [terms, setTerms] = useState<DoomscrollTerm[]>(allDoomscrollTerms);
  const [pinnedTermId, setPinnedTermId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<'balanced' | 'quick' | 'challenge'>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const termMap = useMemo(() => {
    const map = new Map<string, DoomscrollTerm>();
    [...generatedTerms, ...allDoomscrollTerms].forEach((t) => map.set(t.id, t));
    return map;
  }, [generatedTerms]);

  useEffect(() => {
    const progress = getProgress();
    if (progress.doomscrollRead) {
      setReadIds(new Set(progress.doomscrollRead));
    }
  }, []);

  useEffect(() => {
    setTerms([...generatedTerms, ...allDoomscrollTerms]);
  }, [generatedTerms]);

  useEffect(() => {
    if (focusMode === 'quick') {
      setDifficultyFilter(1);
      setReadMode('unread');
    } else if (focusMode === 'challenge') {
      setDifficultyFilter(3);
      setReadMode('all');
    } else {
      setDifficultyFilter('all');
      setReadMode('all');
    }
    setDisplayCount(BATCH_SIZE);
  }, [focusMode]);

  const filteredTerms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return terms.filter((t) => {
      if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
      if (readMode === 'unread' && readIds.has(t.id)) return false;
      if (readMode === 'read' && !readIds.has(t.id)) return false;
      if (!normalizedQuery) return true;

      const haystack = [t.term, t.reading, t.definition, t.keyPoint, SUBJECT_LABELS[t.subject], t.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [terms, subjectFilter, categoryFilter, difficultyFilter, readMode, readIds, searchQuery]);

  const pinnedTerm = pinnedTermId ? filteredTerms.find((term) => term.id === pinnedTermId) || null : null;
  const unpinnedTerms = pinnedTerm ? filteredTerms.filter((term) => term.id !== pinnedTerm.id) : filteredTerms;
  const visibleTerms = useMemo(() => {
    const sliced = unpinnedTerms.slice(0, displayCount);
    return pinnedTerm ? [pinnedTerm, ...sliced] : sliced;
  }, [unpinnedTerms, displayCount, pinnedTerm]);
  const hasMore = unpinnedTerms.length > displayCount;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount((prev) => prev + BATCH_SIZE);
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [subjectFilter, categoryFilter, difficultyFilter, searchQuery, readMode]);

  const persistReadIds = useCallback((next: Set<string>) => {
    const progress = getProgress();
    progress.doomscrollRead = Array.from(next);
    saveProgress(progress);
  }, []);

  const toggleRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        persistReadIds(next);
        return next;
      });
    },
    [persistReadIds]
  );

  const handleMarkVisibleRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      visibleTerms.forEach((term) => next.add(term.id));
      persistReadIds(next);
      return next;
    });
  }, [persistReadIds, visibleTerms]);

  const handleJumpToUnread = useCallback(() => {
    const nextUnread = filteredTerms.find((term) => !readIds.has(term.id));
    if (!nextUnread) return;
    setPinnedTermId(nextUnread.id);
    requestAnimationFrame(() => {
      const el = document.getElementById(`term-${nextUnread.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1800);
      }
    });
  }, [filteredTerms, readIds]);

  const handleRelatedClick = useCallback((id: string) => {
    const el = document.getElementById(`term-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
    } else {
      setSubjectFilter('all');
      setCategoryFilter('all');
      setDifficultyFilter('all');
      setReadMode('all');
      setSearchQuery('');
      setPinnedTermId(id);
      setDisplayCount(terms.length);
      setTimeout(() => {
        const el2 = document.getElementById(`term-${id}`);
        if (el2) {
          el2.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el2.classList.add('ring-2', 'ring-primary');
          setTimeout(() => el2.classList.remove('ring-2', 'ring-primary'), 2000);
        }
      }, 100);
    }
  }, [terms.length]);

  const handleShuffle = () => {
    setTerms(shuffleArray(filteredTerms.length > 0 ? filteredTerms : [...generatedTerms, ...allDoomscrollTerms]));
    setShuffled(true);
    setPinnedTermId(null);
    setDisplayCount(BATCH_SIZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setTerms([...generatedTerms, ...allDoomscrollTerms]);
    setShuffled(false);
    setPinnedTermId(null);
    setDisplayCount(BATCH_SIZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSubjectFilter('all');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setSearchQuery('');
    setReadMode('all');
    setFocusMode('balanced');
    setPinnedTermId(null);
  };

  const handleGenerateTerms = useCallback(async () => {
    setGenerationError('');
    setIsGenerating(true);
    try {
      const progress = getProgress();
      const apiKey = progress.aiSettings?.apiKey?.trim();
      const model = progress.aiSettings?.model?.trim() || 'gpt-5-mini';

      if (!apiKey) {
        throw new Error('設定画面で OpenAI APIキーを保存してください。');
      }

      const response = await fetch('/api/generate/doomscroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model,
          subject: subjectFilter === 'all' ? 'other' : subjectFilter,
          count: 3,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : '生成に失敗しました。');
      }

      const nextGeneratedTerms = (payload.terms as Array<Omit<DoomscrollTerm, 'id' | 'relatedTermIds'>>).map((term, index) => ({
        ...term,
        id: `generated-${Date.now()}-${index}`,
        relatedTermIds: [],
        source: 'generated' as const,
      }));

      setGeneratedTerms((prev) => [...nextGeneratedTerms, ...prev]);
      setPinnedTermId(nextGeneratedTerms[0]?.id || null);
      setDisplayCount((prev) => prev + nextGeneratedTerms.length);
      setShuffled(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : '生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  }, [subjectFilter]);

  const readCount = readIds.size;
  const totalCount = terms.length;
  const progressPercent = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;
  const filteredReadCount = filteredTerms.filter((term) => readIds.has(term.id)).length;
  const unreadFilteredCount = filteredTerms.length - filteredReadCount;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary">📜 用語ドゥームスクロール</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          検索・絞り込み・未読ジャンプで、だらだらスクロールをちゃんと学習時間に変えよう。
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-sky-50 to-violet-50 dark:from-primary/15 dark:via-slate-800 dark:to-violet-900/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">AIで新しい用語を追加</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              設定に保存した APIキー / モデルを使って、現在の科目に合わせた補足用語を Web検索つきで3件生成します。
            </p>
          </div>
          <button
            onClick={handleGenerateTerms}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? '生成中...' : 'AIで3件追加'}
          </button>
        </div>
        {generationError && <p className="mt-3 text-sm text-error font-medium">{generationError}</p>}
        {generatedTerms.length > 0 && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            追加済み AI用語: {generatedTerms.length}件。生成カードには「AI生成」バッジを表示しています。
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr] mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center text-sm mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">学習進捗</span>
            <span className="font-bold text-primary">
              {readCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3">
              <p className="text-slate-500 dark:text-slate-400">表示中</p>
              <p className="text-xl font-bold text-primary mt-1">{filteredTerms.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3">
              <p className="text-slate-500 dark:text-slate-400">未読</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{unreadFilteredCount}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3">
              <p className="text-slate-500 dark:text-slate-400">読了</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{filteredReadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-primary">フォーカスモード</p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <button onClick={() => setFocusMode('balanced')} className={`rounded-lg px-3 py-2 font-medium ${focusMode === 'balanced' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>標準</button>
            <button onClick={() => setFocusMode('quick')} className={`rounded-lg px-3 py-2 font-medium ${focusMode === 'quick' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>時短</button>
            <button onClick={() => setFocusMode('challenge')} className={`rounded-lg px-3 py-2 font-medium ${focusMode === 'challenge' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>応用</button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            {focusMode === 'quick' && '未読×基本だけを優先表示。5分学習向けです。'}
            {focusMode === 'challenge' && '応用レベルを中心に流して、本番対応力を上げます。'}
            {focusMode === 'balanced' && '科目横断でバランスよく確認できます。'}
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 mb-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="用語・定義・ポイントを検索"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value as SubjectSlug | 'all')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="all">全科目</option>
            {ALL_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{SUBJECT_LABELS[subject]}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as TermCategory | 'all')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="all">全カテゴリ</option>
            {CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select value={String(difficultyFilter)} onChange={(e) => setDifficultyFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="all">全難易度</option>
            <option value="1">基本</option>
            <option value="2">標準</option>
            <option value="3">応用</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'unread', 'read'] as const).map((mode) => (
            <button key={mode} onClick={() => setReadMode(mode)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${readMode === mode ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
              {mode === 'all' ? 'すべて' : mode === 'unread' ? '未読だけ' : '既読だけ'}
            </button>
          ))}
          <button onClick={handleJumpToUnread} className="text-xs px-3 py-1.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">次の未読へ</button>
          <button onClick={handleMarkVisibleRead} className="text-xs px-3 py-1.5 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">表示中を既読</button>
          <button onClick={shuffled ? handleReset : handleShuffle} className="text-xs px-3 py-1.5 rounded-full font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
            {shuffled ? '元の順序に戻す' : '表示中をシャッフル'}
          </button>
          <button onClick={clearFilters} className="text-xs px-3 py-1.5 rounded-full font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">条件をクリア</button>
        </div>
      </div>

      {pinnedTerm && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary">ピン留め中</p>
              <p className="font-bold mt-1">{pinnedTerm.term}</p>
            </div>
            <button onClick={() => setPinnedTermId(null)} className="text-xs text-primary underline">解除</button>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-2">
        {visibleTerms.map((term) => (
          <TermCard
            key={term.id}
            term={term}
            isRead={readIds.has(term.id)}
            onToggleRead={toggleRead}
            onRelatedClick={handleRelatedClick}
            termMap={termMap}
            isPinned={pinnedTermId === term.id}
            onPin={setPinnedTermId}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-2">読み込み中...</p>
        </div>
      )}

      {!hasMore && visibleTerms.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">🎉 条件に合う {filteredTerms.length} 用語を表示しました！</p>
        </div>
      )}

      {visibleTerms.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-slate-400">該当する用語がありません</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-primary underline">絞り込みをリセットする</button>
        </div>
      )}
    </div>
  );
}
