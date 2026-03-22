'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS, TermCategory } from '@/types/question';
import { getProgress, saveProgress } from '@/lib/storage';

const BATCH_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 250;
const CATEGORY_ORDER: TermCategory[] = ['定義', '手続', '期間', '権利', '要件', '制度', '条約', '比較'];
const READ_MODE_LABELS = {
  all: 'すべて',
  unread: '未読だけ',
  read: '既読だけ',
} as const;
const FOCUS_MODE_META = {
  balanced: {
    label: '標準',
    emoji: '🧠',
    title: '全体をゆるく周回',
    description: '科目横断でバランスよく流し見。スキマ時間の定着向けです。',
  },
  quick: {
    label: '時短',
    emoji: '⚡',
    title: '5分で未読を回収',
    description: '未読×基本レベルを優先表示。短時間で進捗を積み上げられます。',
  },
  challenge: {
    label: '応用',
    emoji: '🔥',
    title: '難所だけ集中的に',
    description: '応用レベル中心のフィードで、本番対応力を上げます。',
  },
} as const;

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

const DIFFICULTY_META = {
  1: { label: '基本', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  2: { label: '標準', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  3: { label: '応用', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
} as const;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function StatPill({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'accent' | 'success'; }) {
  const toneClass = tone === 'accent'
    ? 'bg-accent/10 text-accent border-accent/20'
    : tone === 'success'
      ? 'bg-success/10 text-success border-success/20'
      : 'bg-surface-alt text-t-secondary border-border';

  return (
    <div className={`rounded-2xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
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
  const difficultyMeta = DIFFICULTY_META[term.difficulty];

  return (
    <article
      id={`term-${term.id}`}
      className={`overflow-hidden rounded-[28px] border border-border/70 bg-surface/95 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] transition-all duration-300 ${
        isRead ? 'border-success/30 bg-success/5' : 'hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-34px_rgba(15,23,42,0.4)]'
      }`}
    >
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SUBJECT_COLORS[term.subject]}`}>
                {SUBJECT_LABELS[term.subject]}
              </span>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-t-secondary border border-border/60">
                {CATEGORY_ICONS[term.category] || '📝'} {term.category}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyMeta.className}`}>
                {difficultyMeta.label}
              </span>
              {term.source === 'generated' && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  AI生成
                </span>
              )}
              {isPinned && (
                <span className="rounded-full border border-primary/20 bg-surface px-3 py-1 text-xs font-semibold text-primary">
                  📌 ピン留め中
                </span>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-tight text-t-primary">
                {term.term}
                {term.reading && (
                  <span className="ml-2 text-sm font-medium text-t-muted">({term.reading})</span>
                )}
              </h3>
              {term.english && <p className="mt-1 text-sm italic text-t-muted">{term.english}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onPin(term.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                isPinned
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-border bg-surface text-t-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
              }`}
              aria-label={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
              title={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
            >
              📌
            </button>
            <button
              onClick={() => onToggleRead(term.id)}
              className={`flex h-11 min-w-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition-all ${
                isRead
                  ? 'border-success bg-success text-white shadow-sm'
                  : 'border-border bg-surface text-t-secondary hover:border-success/30 hover:bg-success/5 hover:text-success'
              }`}
              aria-label={isRead ? '既読を解除' : '既読にする'}
              title={isRead ? '既読を解除' : '既読にする'}
            >
              {isRead ? '既読' : '未読'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="rounded-3xl bg-bg/80 px-4 py-4 ring-1 ring-border/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-t-muted">Definition</p>
          <p className="mt-2 text-[15px] leading-7 text-t-primary">{term.definition}</p>
        </div>

        <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent px-4 py-4">
          <div className="flex items-center gap-2 text-accent">
            <span className="text-base">💡</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Exam cue</p>
          </div>
          <p className="mt-2 text-sm leading-7 text-t-secondary">{term.keyPoint}</p>
        </div>

        {term.relatedTermIds.length > 0 && (
          <div className="rounded-3xl bg-surface-alt/80 px-4 py-4 ring-1 ring-border/60">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
              <span>{expanded ? '▼' : '▶'}</span>
              <span>関連用語をひらく</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{term.relatedTermIds.length}</span>
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
                      className="rounded-full border border-primary/15 bg-surface px-3 py-2 text-xs font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/5"
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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

  const pinnedTerm = pinnedTermId ? (filteredTerms.find((term) => term.id === pinnedTermId) || termMap.get(pinnedTermId) || null) : null;
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
  const activeFilterCount = Number(subjectFilter !== 'all') + Number(categoryFilter !== 'all') + Number(difficultyFilter !== 'all') + Number(Boolean(searchQuery)) + Number(readMode !== 'all');
  const feedHeadline = focusMode === 'quick'
    ? '今は「未読を片付ける」テンポ。'
    : focusMode === 'challenge'
      ? '今は「応用だけ深掘る」テンポ。'
      : '今は「全体を流し見する」テンポ。';

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:px-8">
      <div className="mb-6 overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-primary/15 via-surface to-accent/10 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="grid gap-6 px-5 py-6 md:grid-cols-[1.25fr,0.75fr] md:px-8 md:py-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/80 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
              <span>📱</span>
              <span>用語フィード</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-t-primary md:text-4xl">学習用 doomscroll を、ちゃんと気持ちいい feed に。</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-t-secondary md:text-[15px]">
                検索・絞り込み・未読ジャンプはそのままに、フィードの視認性と没入感をアップ。流し見でも頭に入りやすいレイアウトへ再設計しました。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatPill label="読了率" value={`${progressPercent}%`} tone="success" />
              <StatPill label="未読" value={unreadFilteredCount} tone="accent" />
              <StatPill label="フィード件数" value={filteredTerms.length} />
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button onClick={handleJumpToUnread} className="rounded-full bg-primary px-4 py-2.5 font-semibold text-white transition-all hover:bg-primary-hover">
                次の未読へ
              </button>
              <button onClick={handleMarkVisibleRead} className="rounded-full border border-success/20 bg-success/10 px-4 py-2.5 font-semibold text-success transition-all hover:bg-success/15">
                表示中を既読 ({visibleTerms.filter((t) => !readIds.has(t.id)).length})
              </button>
              <button onClick={shuffled ? handleReset : handleShuffle} className="rounded-full border border-border bg-surface px-4 py-2.5 font-semibold text-t-secondary transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary">
                {shuffled ? '順序を戻す' : 'シャッフルする'}
              </button>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-border/70 bg-surface/90 p-4 backdrop-blur">
            <div className="rounded-3xl bg-bg/70 p-4 ring-1 ring-border/60">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-t-muted">Now studying</p>
              <p className="mt-2 text-lg font-bold text-t-primary">{feedHeadline}</p>
              <p className="mt-2 text-sm leading-6 text-t-secondary">{FOCUS_MODE_META[focusMode].description}</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4 ring-1 ring-border/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-t-muted">Pinned</p>
                  <p className="mt-2 text-base font-bold text-t-primary">{pinnedTerm ? pinnedTerm.term : 'まだピン留めなし'}</p>
                  <p className="mt-1 text-sm text-t-secondary">
                    {pinnedTerm ? '比較したい用語や復習したい用語を上部に固定できます。' : '重要語を固定すると、フィードの先頭で繰り返し確認できます。'}
                  </p>
                </div>
                <span className="text-2xl">📌</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-surface shadow-[0_20px_55px_-38px_rgba(15,23,42,0.4)]">
          <div className="border-b border-border/60 px-5 py-4">
            <p className="text-sm font-semibold text-primary">学習ダッシュボード</p>
            <h2 className="mt-1 text-xl font-bold text-t-primary">進捗が一目で見える学習面</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-t-secondary">全体の読了進捗</span>
                <span className="font-bold text-primary">{readCount}/{totalCount} · {progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-bg/80 p-4 ring-1 ring-border/60">
                <p className="text-xs uppercase tracking-[0.16em] text-t-muted">表示中</p>
                <p className="mt-2 text-2xl font-bold text-t-primary">{filteredTerms.length}</p>
                <p className="mt-1 text-xs text-t-secondary">いまの条件で見える用語数</p>
              </div>
              <div className="rounded-3xl bg-accent/10 p-4 ring-1 ring-accent/10">
                <p className="text-xs uppercase tracking-[0.16em] text-accent/80">未読</p>
                <p className="mt-2 text-2xl font-bold text-accent">{unreadFilteredCount}</p>
                <p className="mt-1 text-xs text-t-secondary">次に触れるべき用語</p>
              </div>
              <div className="rounded-3xl bg-success/10 p-4 ring-1 ring-success/10">
                <p className="text-xs uppercase tracking-[0.16em] text-success/80">読了</p>
                <p className="mt-2 text-2xl font-bold text-success">{filteredReadCount}</p>
                <p className="mt-1 text-xs text-t-secondary">この条件内で読み終えた数</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-surface shadow-[0_20px_55px_-38px_rgba(15,23,42,0.4)]">
          <div className="border-b border-border/60 px-5 py-4">
            <p className="text-sm font-semibold text-primary">フォーカスモード</p>
            <h2 className="mt-1 text-xl font-bold text-t-primary">見るリズムを先に選ぶ</h2>
          </div>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-3">
            {(Object.entries(FOCUS_MODE_META) as Array<[keyof typeof FOCUS_MODE_META, (typeof FOCUS_MODE_META)[keyof typeof FOCUS_MODE_META]]>).map(([mode, meta]) => (
              <button
                key={mode}
                onClick={() => setFocusMode(mode)}
                className={`rounded-[24px] border p-4 text-left transition-all ${
                  focusMode === mode
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-bg/70 text-t-primary hover:border-primary/20 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${focusMode === mode ? 'bg-white/15 text-white' : 'bg-surface text-t-muted'}`}>
                    {meta.label}
                  </span>
                </div>
                <p className={`mt-4 font-bold ${focusMode === mode ? 'text-white' : 'text-t-primary'}`}>{meta.title}</p>
                <p className={`mt-2 text-sm leading-6 ${focusMode === mode ? 'text-white/80' : 'text-t-secondary'}`}>{meta.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 mb-5 overflow-hidden rounded-[28px] border border-border/80 bg-bg/85 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Feed controls</p>
              <h2 className="mt-1 text-xl font-bold text-t-primary">SNSっぽく、でも学習は迷わない</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-t-secondary">
              <span className="rounded-full bg-surface px-3 py-1.5 ring-1 ring-border/60">アクティブ条件 {activeFilterCount}</span>
              <span className="rounded-full bg-surface px-3 py-1.5 ring-1 ring-border/60">{READ_MODE_LABELS[readMode]}</span>
              <span className="rounded-full bg-surface px-3 py-1.5 ring-1 ring-border/60">{filteredTerms.length}件表示候補</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr,0.8fr,0.8fr,0.8fr]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-t-muted">検索</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="用語・定義・ポイントを検索..."
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-t-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-t-muted">科目</span>
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value as SubjectSlug | 'all')} className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-t-primary outline-none transition-all focus:border-primary">
                <option value="all">全科目</option>
                {ALL_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>{SUBJECT_LABELS[subject]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-t-muted">カテゴリ</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as TermCategory | 'all')} className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-t-primary outline-none transition-all focus:border-primary">
                <option value="all">全カテゴリ</option>
                {CATEGORY_ORDER.map((category) => (
                  <option key={category} value={category}>{CATEGORY_ICONS[category] || ''} {category}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-t-muted">難易度</span>
              <select value={String(difficultyFilter)} onChange={(e) => setDifficultyFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3)} className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-t-primary outline-none transition-all focus:border-primary">
                <option value="all">全難易度</option>
                <option value="1">基本</option>
                <option value="2">標準</option>
                <option value="3">応用</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'unread', 'read'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setReadMode(mode)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  readMode === mode
                    ? 'bg-primary text-white'
                    : 'border border-border bg-surface text-t-secondary hover:border-primary/20 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {READ_MODE_LABELS[mode]}
              </button>
            ))}
            <button onClick={handleGenerateTerms} disabled={isGenerating} className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {isGenerating ? '生成中...' : 'AIで3件追加'}
            </button>
            {(subjectFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all' || searchQuery || readMode !== 'all') && (
              <button onClick={clearFilters} className="rounded-full border border-error/20 bg-error/10 px-4 py-2 text-xs font-semibold text-error transition-all hover:bg-error/15">
                条件をクリア
              </button>
            )}
          </div>

          {generationError && <p className="text-sm font-medium text-error">{generationError}</p>}
          {generatedTerms.length > 0 && (
            <p className="text-xs text-t-muted">追加済み AI用語: {generatedTerms.length}件。生成カードには「AI生成」バッジを表示しています。</p>
          )}
        </div>
      </div>

      {pinnedTerm && (
        <div className="mb-5 rounded-[28px] border border-primary/20 bg-gradient-to-r from-primary/10 via-surface to-transparent p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.4)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pinned card</p>
              <p className="mt-2 text-xl font-bold text-t-primary">
                {pinnedTerm.term}
                <span className={`ml-2 rounded-full px-2.5 py-1 align-middle text-xs font-semibold ${SUBJECT_COLORS[pinnedTerm.subject]}`}>
                  {SUBJECT_LABELS[pinnedTerm.subject]}
                </span>
              </p>
              <p className="mt-2 text-sm text-t-secondary">
                {!filteredTerms.find((t) => t.id === pinnedTerm.id) ? '現在のフィルター外ですが、重要なので先頭に固定しています。' : '比較したい用語としてフィード上部に固定しています。'}
              </p>
            </div>
            <button onClick={() => setPinnedTermId(null)} className="rounded-full border border-primary/20 bg-surface px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/5">解除</button>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[0.7fr,1.3fr]">
        <aside className="h-fit rounded-[28px] border border-border/70 bg-surface p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] lg:sticky lg:top-[8.75rem]">
          <p className="text-sm font-semibold text-primary">Feed summary</p>
          <h2 className="mt-1 text-xl font-bold text-t-primary">今の学習面を整理</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl bg-bg/70 p-4 ring-1 ring-border/60">
              <p className="text-xs uppercase tracking-[0.16em] text-t-muted">フィルター状況</p>
              <p className="mt-2 text-sm leading-6 text-t-secondary">
                {activeFilterCount === 0 ? 'フィルターなし。全体を自然に流し読みできます。' : `${activeFilterCount}件の条件でフィードを調整中。必要な情報だけ残しています。`}
              </p>
            </div>
            <div className="rounded-3xl bg-bg/70 p-4 ring-1 ring-border/60">
              <p className="text-xs uppercase tracking-[0.16em] text-t-muted">次のアクション</p>
              <ul className="mt-2 space-y-2 text-sm text-t-secondary">
                <li>・未読が多いなら「時短」で回収</li>
                <li>・引っかかる用語はピン留め</li>
                <li>・比較系は関連用語を連続タップ</li>
              </ul>
            </div>
          </div>
        </aside>

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
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-t-secondary">
            <span>⬇️</span>
            <span>さらに表示中… {visibleTerms.length}/{filteredTerms.length}</span>
          </div>
        </div>
      )}

      {!hasMore && visibleTerms.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-t-muted">{filteredTerms.length} 用語を表示しました。ここまで読めたら十分に前進です。</p>
        </div>
      )}

      {visibleTerms.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-t-muted">該当する用語がありません</p>
          <button onClick={clearFilters} className="mt-3 text-sm font-medium text-primary hover:underline">絞り込みをリセットする</button>
        </div>
      )}
    </div>
  );
}
