'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS, TermCategory } from '@/types/question';
import { getProgress, saveProgress } from '@/lib/storage';

const BATCH_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 250;
const CATEGORY_ORDER: TermCategory[] = ['定義', '手続', '期間', '権利', '要件', '制度', '条約', '比較'];

const SUBJECT_COLORS: Record<SubjectSlug, string> = {
  patent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  copyright: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  trademark: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  treaties: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  other: 'bg-surface-alt text-t-secondary',
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
    <article
      id={`term-${term.id}`}
      className={`feed-card relative overflow-hidden p-4 md:p-5 transition-all duration-300 ${
        isRead ? 'border-success/30 bg-success/5' : ''
      } ${isPinned ? 'ring-2 ring-primary/40' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_right,rgba(var(--c-primary),0.12),transparent_50%)]" />
      <div className="relative space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 text-lg font-bold text-primary flex items-center justify-center">
            {term.term.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SUBJECT_COLORS[term.subject]}`}>
                {SUBJECT_LABELS[term.subject]}
              </span>
              <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-t-secondary">
                {CATEGORY_ICONS[term.category] || '📝'} {term.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  term.difficulty === 1
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : term.difficulty === 2
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                }`}
              >
                {DIFFICULTY_LABELS[term.difficulty]}
              </span>
              {term.source === 'generated' && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">AI生成</span>
              )}
              {isPinned && (
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">注目中</span>
              )}
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-t-primary">
              {term.term}
              {term.reading && <span className="ml-2 text-sm font-normal text-t-muted">({term.reading})</span>}
            </h3>
            {term.english && <p className="mt-1 text-xs italic text-t-muted">{term.english}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onPin(term.id)}
              className={`h-11 w-11 rounded-2xl text-lg transition ${
                isPinned ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-alt text-t-muted hover:bg-surface-hover'
              }`}
              aria-label={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
              title={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
            >
              📌
            </button>
            <button
              onClick={() => onToggleRead(term.id)}
              className={`h-11 w-11 rounded-2xl text-lg transition ${
                isRead ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-surface-alt text-t-muted hover:bg-surface-hover'
              }`}
              aria-label={isRead ? '既読を解除' : '既読にする'}
              title={isRead ? '既読を解除' : '既読にする'}
            >
              {isRead ? '✓' : '○'}
            </button>
          </div>
        </div>

        <p className="text-sm leading-7 text-t-secondary md:text-[15px]">{term.definition}</p>

        <div className="rounded-[1.25rem] border border-primary/10 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Point</p>
          <p className="mt-2 text-sm leading-6 text-t-secondary">{term.keyPoint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-y border-border/60 py-3 text-xs text-t-muted">
          <span>👍 役立つ知識</span>
          <span>•</span>
          <span>{isRead ? '既読済み' : '未読'}</span>
          <span>•</span>
          <span>難易度: {DIFFICULTY_LABELS[term.difficulty]}</span>
        </div>

        {term.relatedTermIds.length > 0 && (
          <div>
            <button onClick={() => setExpanded(!expanded)} className="text-sm font-semibold text-primary hover:underline">
              {expanded ? '▼' : '▶'} 関連用語をみる ({term.relatedTermIds.length})
            </button>
            {expanded && (
              <div className="mt-3 flex flex-wrap gap-2">
                {term.relatedTermIds.map((relId) => {
                  const relTerm = termMap.get(relId);
                  if (!relTerm) return null;
                  return (
                    <button
                      key={relId}
                      onClick={() => onRelatedClick(relId)}
                      className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
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
    </article>
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const termMap = useMemo(() => {
    const map = new Map<string, DoomscrollTerm>();
    allDoomscrollTerms.forEach((t) => map.set(t.id, t));
    generatedTerms.forEach((t) => map.set(t.id, t));
    return map;
  }, [generatedTerms]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

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
    const normalizedQuery = debouncedSearch.trim().toLowerCase();

    return terms.filter((t) => {
      if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
      if (readMode === 'unread' && readIds.has(t.id)) return false;
      if (readMode === 'read' && !readIds.has(t.id)) return false;
      if (!normalizedQuery) return true;

      const haystack = `${t.term} ${t.reading || ''} ${t.definition} ${t.keyPoint}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [terms, subjectFilter, categoryFilter, difficultyFilter, readMode, readIds, debouncedSearch]);

  const pinnedTerm = pinnedTermId ? filteredTerms.find((term) => term.id === pinnedTermId) || termMap.get(pinnedTermId) || null : null;
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
  }, [subjectFilter, categoryFilter, difficultyFilter, debouncedSearch, readMode]);

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
    const scrollAndHighlight = (elId: string) => {
      const el = document.getElementById(elId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
      }
    };

    const el = document.getElementById(`term-${id}`);
    if (el) {
      scrollAndHighlight(`term-${id}`);
    } else {
      setPinnedTermId(id);
      requestAnimationFrame(() => scrollAndHighlight(`term-${id}`));
    }
  }, []);

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
      const model = progress.aiSettings?.model?.trim() || 'gpt-4o-mini';

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
  const visibleUnread = visibleTerms.filter((term) => !readIds.has(term.id)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 md:px-8 md:py-8">
      <section className="hero-panel overflow-hidden p-5 md:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--c-primary),0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(var(--c-accent),0.16),transparent_30%)]" />
        <div className="relative grid gap-5 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-t-secondary shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
              用語フィード
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-t-primary md:text-4xl">doomscroll を、学習が続くソーシャルフィードへ。</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-t-secondary md:text-base">
              カードの密度、余白、アクション位置をSNSのタイムラインのように再設計しました。軽く流し読みしながらも、未読管理・ピン留め・関連ジャンプで学習の手応えを失わない構成です。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={handleJumpToUnread} className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-hover">
                次の未読へジャンプ
              </button>
              <button onClick={handleMarkVisibleRead} className="inline-flex items-center justify-center rounded-2xl border border-primary/20 bg-white/80 px-5 py-3 text-sm font-semibold text-primary backdrop-blur transition hover:border-primary/40 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10">
                表示中を既読にする ({visibleUnread})
              </button>
            </div>
          </div>

          <div className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Feed status</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-white/5">
                <p className="text-xs text-t-muted">読了率</p>
                <p className="mt-1 text-3xl font-bold text-t-primary">{progressPercent}%</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-white/5">
                <p className="text-xs text-t-muted">未読</p>
                <p className="mt-1 text-3xl font-bold text-accent">{unreadFilteredCount}</p>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-3 text-sm text-t-secondary">{readCount}/{totalCount} 語を読了。気になる用語はピン留めして、フィードの先頭で追い続けられます。</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr,1.15fr]">
        <div className="soft-panel p-5 md:p-6">
          <p className="text-sm font-semibold text-primary">フォーカスモード</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <button onClick={() => setFocusMode('balanced')} className={`rounded-2xl px-3 py-3 font-semibold transition ${focusMode === 'balanced' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>標準</button>
            <button onClick={() => setFocusMode('quick')} className={`rounded-2xl px-3 py-3 font-semibold transition ${focusMode === 'quick' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>時短</button>
            <button onClick={() => setFocusMode('challenge')} className={`rounded-2xl px-3 py-3 font-semibold transition ${focusMode === 'challenge' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>応用</button>
          </div>
          <p className="mt-4 text-sm leading-6 text-t-secondary">
            {focusMode === 'quick' && '未読 × 基本レベルだけを抽出。5分で流し読みしたいとき向け。'}
            {focusMode === 'challenge' && '応用レベル中心で本番対応力を強化。やや重めのフィードになります。'}
            {focusMode === 'balanced' && '科目を横断しながら、難易度もバランスよく確認できます。'}
          </p>
        </div>

        <div className="soft-panel p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">AIでフィードを補強</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">今見ている科目に、新しい用語を混ぜる</h2>
              <p className="mt-2 text-sm leading-6 text-t-secondary">設定に保存した APIキー / モデルで、現在の科目に合わせた補足用語を3件追加します。生成カードにもフィードの一員として馴染む見た目を与えています。</p>
            </div>
            <button
              onClick={handleGenerateTerms}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? '生成中...' : 'AIで3件追加'}
            </button>
          </div>
          {generationError && <p className="mt-4 text-sm font-medium text-error">{generationError}</p>}
          {generatedTerms.length > 0 && <p className="mt-4 text-xs text-t-muted">追加済み AI用語: {generatedTerms.length}件。先頭に優先表示されます。</p>}
        </div>
      </section>

      <section className="sticky top-0 z-40 rounded-[1.75rem] border border-border/70 bg-[rgb(var(--c-bg))/0.88] p-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl md:p-4">
        <div className="grid gap-2 md:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="用語・定義・ポイントを検索..."
            className="md:col-span-1 col-span-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-t-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value as SubjectSlug | 'all')} className="rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-t-primary outline-none focus:border-primary">
            <option value="all">全科目</option>
            {ALL_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{SUBJECT_LABELS[subject]}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as TermCategory | 'all')} className="rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-t-primary outline-none focus:border-primary">
            <option value="all">全カテゴリ</option>
            {CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>{CATEGORY_ICONS[category] || ''} {category}</option>
            ))}
          </select>
          <select value={String(difficultyFilter)} onChange={(e) => setDifficultyFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3)} className="rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-t-primary outline-none focus:border-primary">
            <option value="all">全難易度</option>
            <option value="1">基本</option>
            <option value="2">標準</option>
            <option value="3">応用</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-t-muted">{filteredTerms.length}件</span>
          {(['all', 'unread', 'read'] as const).map((mode) => (
            <button key={mode} onClick={() => setReadMode(mode)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${readMode === mode ? 'bg-primary text-white' : 'border border-border bg-surface text-t-secondary'}`}>
              {mode === 'all' ? 'すべて' : mode === 'unread' ? '未読だけ' : '既読だけ'}
            </button>
          ))}
          <button onClick={handleJumpToUnread} className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">次の未読へ</button>
          <button onClick={handleMarkVisibleRead} className="rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">表示中を既読 ({visibleUnread})</button>
          <button onClick={shuffled ? handleReset : handleShuffle} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            {shuffled ? '元の順序に戻す' : 'シャッフル'}
          </button>
          {(subjectFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all' || searchQuery || readMode !== 'all') && (
            <button onClick={clearFilters} className="rounded-full bg-error/10 px-3 py-1.5 text-xs font-semibold text-error">条件をクリア</button>
          )}
        </div>
      </section>

      {pinnedTerm && (
        <section className="soft-panel border-primary/20 bg-primary/5 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pinned</p>
              <p className="mt-2 text-lg font-bold text-t-primary">
                {pinnedTerm.term}
                <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${SUBJECT_COLORS[pinnedTerm.subject]}`}>
                  {SUBJECT_LABELS[pinnedTerm.subject]}
                </span>
              </p>
              {!filteredTerms.find((t) => t.id === pinnedTerm.id) && <p className="mt-1 text-xs text-accent">現在のフィルター外ですが、先頭に固定しています。</p>}
            </div>
            <button onClick={() => setPinnedTermId(null)} className="text-sm font-medium text-primary hover:underline">解除</button>
          </div>
        </section>
      )}

      <section className="space-y-4">
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
      </section>

      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center">
          <div className="inline-flex rounded-full border border-border bg-surface px-4 py-2 text-xs text-t-muted">
            下にスクロールして続きを表示（{visibleTerms.length}/{filteredTerms.length}）
          </div>
        </div>
      )}

      {!hasMore && visibleTerms.length > 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-t-muted">{filteredTerms.length} 用語を表示しました</p>
        </div>
      )}

      {visibleTerms.length === 0 && (
        <div className="soft-panel py-16 text-center">
          <p className="text-lg text-t-muted">該当する用語がありません</p>
          <button onClick={clearFilters} className="mt-3 text-sm font-medium text-primary hover:underline">絞り込みをリセットする</button>
        </div>
      )}
    </div>
  );
}
