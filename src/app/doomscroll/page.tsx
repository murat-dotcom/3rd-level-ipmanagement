'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS, TermCategory } from '@/types/question';
import { getProgress, saveProgress } from '@/lib/storage';

const BATCH_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 250;
const CATEGORY_ORDER: TermCategory[] = ['定義', '手続', '期間', '権利', '要件', '制度', '条約', '比較'];

const SUBJECT_COLORS: Record<SubjectSlug, string> = {
  patent: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/15',
  copyright: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/15',
  trademark: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/15',
  design: 'bg-pink-500/12 text-pink-700 dark:text-pink-300 border-pink-500/15',
  treaties: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/15',
  other: 'bg-surface-alt text-t-secondary border-border',
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
const DIFFICULTY_STYLES = {
  1: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/15',
  2: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/15',
  3: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/15',
} as const;
const SUBJECT_AVATARS: Record<SubjectSlug, string> = {
  patent: '💡',
  copyright: '🎵',
  trademark: '🏷️',
  design: '🎨',
  treaties: '🌍',
  other: '🧠',
};

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
      className={`relative overflow-hidden rounded-[1.75rem] border bg-surface/95 shadow-[0_20px_70px_rgba(15,23,42,0.07)] transition-all duration-300 ${
        isRead ? 'border-success/25' : 'border-border/80'
      } ${isPinned ? 'ring-2 ring-primary/25' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/10 via-accent/8 to-transparent" aria-hidden="true" />
      <div className="relative p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-alt text-xl">
            {SUBJECT_AVATARS[term.subject]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-t-muted">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${SUBJECT_COLORS[term.subject]}`}>
                <span>{SUBJECT_AVATARS[term.subject]}</span>
                {SUBJECT_LABELS[term.subject]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2.5 py-1 font-medium text-t-secondary">
                {CATEGORY_ICONS[term.category] || '📝'} {term.category}
              </span>
              <span className={`inline-flex rounded-full border px-2.5 py-1 font-medium ${DIFFICULTY_STYLES[term.difficulty]}`}>
                {DIFFICULTY_LABELS[term.difficulty]}
              </span>
              {term.source === 'generated' && (
                <span className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  AI生成
                </span>
              )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-t-primary leading-tight">
                  {term.term}
                  {term.reading && <span className="ml-2 text-sm font-medium text-t-muted">({term.reading})</span>}
                </h2>
                <p className="mt-1 text-xs text-t-muted">
                  {SUBJECT_LABELS[term.subject]} の学習フィードに投稿 ・ 保存推奨
                  {term.english && <span className="ml-2 italic">{term.english}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPin(term.id)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all ${
                    isPinned ? 'border-primary bg-primary text-white' : 'border-border bg-surface-alt text-t-muted hover:border-primary/20 hover:text-primary'
                  }`}
                  aria-label={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
                  title={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
                >
                  📌
                </button>
                <button
                  onClick={() => onToggleRead(term.id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-all ${
                    isRead
                      ? 'border-success/20 bg-success text-white'
                      : 'border-border bg-surface-alt text-t-secondary hover:border-success/20 hover:text-success'
                  }`}
                  aria-label={isRead ? '既読を解除' : '既読にする'}
                  title={isRead ? '既読を解除' : '既読にする'}
                >
                  <span>{isRead ? '✓' : '○'}</span>
                  <span className="hidden sm:inline">{isRead ? '読了済み' : 'あとで読む'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-surface-alt/70 p-4">
          <p className="text-sm leading-7 text-t-secondary">{term.definition}</p>
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-accent/15 bg-accent/8 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Key takeaway</p>
          <p className="mt-2 text-sm leading-7 text-t-secondary">{term.keyPoint}</p>
        </div>

        {term.relatedTermIds.length > 0 && (
          <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-surface p-4">
            <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between text-sm font-semibold text-primary">
              <span>関連用語で深掘りする</span>
              <span>{expanded ? '▲' : '▼'} {term.relatedTermIds.length}件</span>
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
                      className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/12"
                    >
                      #{relTerm.term}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4 text-sm text-t-muted">
          <span className="font-medium text-t-secondary">反応する:</span>
          <span className="rounded-full bg-surface-alt px-3 py-1">🤍 保存</span>
          <span className="rounded-full bg-surface-alt px-3 py-1">💬 覚えどころ</span>
          <span className="rounded-full bg-surface-alt px-3 py-1">🔁 もう一度見る</span>
          <span className="ml-auto text-xs">学習用フィード</span>
        </div>
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
  const visibleUnreadCount = visibleTerms.filter((t) => !readIds.has(t.id)).length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.95))] p-6 md:p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
        <div className="absolute -top-10 right-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              学習フィードに刷新
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-t-primary">
              Doomscroll を、
              <span className="block text-primary">ちゃんと学べるソーシャルフィードに。</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-7 text-t-secondary">
              用語の流し読み体験を、投稿カード・保存アクション・やることが分かるヘッダーで再設計しました。SNSの軽さは残しつつ、理解と再訪がしやすい構成です。
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3">
                <p className="text-t-muted">読了率</p>
                <p className="mt-1 text-2xl font-bold text-primary">{progressPercent}%</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3">
                <p className="text-t-muted">表示中</p>
                <p className="mt-1 text-2xl font-bold text-t-primary">{filteredTerms.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3">
                <p className="text-t-muted">未読</p>
                <p className="mt-1 text-2xl font-bold text-accent">{unreadFilteredCount}</p>
              </div>
            </div>
          </div>

          <div className="theme-card border-white/40 bg-white/70 dark:bg-slate-950/30 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">今日のフィード設計</p>
                <h2 className="mt-1 text-xl font-bold text-t-primary">スクロールしても迷わない</h2>
              </div>
              <span className="text-3xl" aria-hidden="true">📱</span>
            </div>
            <div className="mt-4 space-y-3 text-sm text-t-secondary">
              <div className="rounded-2xl bg-surface-alt/80 p-3">・検索、フィルター、フォーカスモードを一体化</div>
              <div className="rounded-2xl bg-surface-alt/80 p-3">・カードを投稿風レイアウトにして読みやすさアップ</div>
              <div className="rounded-2xl bg-surface-alt/80 p-3">・未読ジャンプと一括読了で復習導線を強化</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="theme-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Feed status</p>
              <h2 className="mt-1 text-xl font-bold text-t-primary">学習フィードの状態</h2>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{readCount}/{totalCount} 読了</div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full rounded-full bg-gradient-to-r from-primary via-sky-400 to-accent transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-2xl bg-surface-alt p-4">
              <p className="text-t-muted">読了</p>
              <p className="mt-1 text-2xl font-bold text-success">{filteredReadCount}</p>
            </div>
            <div className="rounded-2xl bg-surface-alt p-4">
              <p className="text-t-muted">未読</p>
              <p className="mt-1 text-2xl font-bold text-accent">{unreadFilteredCount}</p>
            </div>
            <div className="rounded-2xl bg-surface-alt p-4">
              <p className="text-t-muted">表示件数</p>
              <p className="mt-1 text-2xl font-bold text-primary">{visibleTerms.length}</p>
            </div>
          </div>
        </div>

        <div className="theme-card p-5">
          <p className="text-sm font-semibold text-primary">フォーカスモード</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs md:text-sm">
            <button onClick={() => setFocusMode('balanced')} className={`rounded-2xl px-3 py-3 font-semibold transition-all ${focusMode === 'balanced' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>標準</button>
            <button onClick={() => setFocusMode('quick')} className={`rounded-2xl px-3 py-3 font-semibold transition-all ${focusMode === 'quick' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>時短</button>
            <button onClick={() => setFocusMode('challenge')} className={`rounded-2xl px-3 py-3 font-semibold transition-all ${focusMode === 'challenge' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>応用</button>
          </div>
          <p className="mt-3 text-sm leading-6 text-t-secondary">
            {focusMode === 'quick' && '未読×基本だけを優先表示。短時間で「今日の最低限」を終わらせるモードです。'}
            {focusMode === 'challenge' && '応用レベルを優先して、本番対応力を高める流し読みモードです。'}
            {focusMode === 'balanced' && '科目横断でバランスよく眺めながら、スキマ時間で定着させる標準モードです。'}
          </p>
        </div>
      </section>

      <section className="theme-card overflow-hidden">
        <div className="border-b border-border/80 bg-gradient-to-r from-primary/8 via-transparent to-accent/8 p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">フィードを整える</p>
              <h2 className="mt-1 text-xl font-bold text-t-primary">検索・絞り込み・クイック操作</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleJumpToUnread} className="rounded-full bg-accent/12 px-4 py-2 text-sm font-semibold text-accent">次の未読へ</button>
              <button onClick={handleMarkVisibleRead} className="rounded-full bg-success/12 px-4 py-2 text-sm font-semibold text-success">表示中を既読 ({visibleUnreadCount})</button>
              <button onClick={shuffled ? handleReset : handleShuffle} className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {shuffled ? '順序を戻す' : 'シャッフル'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div className="rounded-[1.5rem] border border-border/80 bg-surface-alt/60 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
              <span className="text-lg" aria-hidden="true">🔎</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="用語・定義・ポイントを検索..."
                className="w-full bg-transparent text-sm text-t-primary outline-none placeholder:text-t-muted"
              />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value as SubjectSlug | 'all')} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-t-primary outline-none focus:border-primary">
                <option value="all">全科目</option>
                {ALL_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>{SUBJECT_LABELS[subject]}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as TermCategory | 'all')} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-t-primary outline-none focus:border-primary">
                <option value="all">全カテゴリ</option>
                {CATEGORY_ORDER.map((category) => (
                  <option key={category} value={category}>{CATEGORY_ICONS[category] || ''} {category}</option>
                ))}
              </select>
              <select value={String(difficultyFilter)} onChange={(e) => setDifficultyFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3)} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-t-primary outline-none focus:border-primary">
                <option value="all">全難易度</option>
                <option value="1">基本</option>
                <option value="2">標準</option>
                <option value="3">応用</option>
              </select>
              <div className="flex flex-wrap gap-2">
                {(['all', 'unread', 'read'] as const).map((mode) => (
                  <button key={mode} onClick={() => setReadMode(mode)} className={`flex-1 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${readMode === mode ? 'bg-primary text-white' : 'border border-border bg-surface text-t-secondary hover:border-primary/20'}`}>
                    {mode === 'all' ? 'すべて' : mode === 'unread' ? '未読' : '既読'}
                  </button>
                ))}
              </div>
            </div>

            {(subjectFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all' || searchQuery || readMode !== 'all') && (
              <button onClick={clearFilters} className="mt-3 text-sm font-semibold text-error hover:underline">条件をすべてリセット</button>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-r from-primary/8 via-transparent to-accent/8 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">AIで新しい投稿を補充</p>
                <p className="mt-1 text-sm leading-6 text-t-secondary">
                  設定済みの APIキー / モデルを使って、現在の科目に合う補足用語を 3 件追加します。
                </p>
              </div>
              <button
                onClick={handleGenerateTerms}
                disabled={isGenerating}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? '生成中...' : 'AIで3件追加'}
              </button>
            </div>
            {generationError && <p className="mt-3 text-sm font-medium text-error">{generationError}</p>}
            {generatedTerms.length > 0 && <p className="mt-3 text-xs text-t-muted">追加済み AI 用語: {generatedTerms.length}件。カード上に「AI生成」バッジが表示されます。</p>}
          </div>
        </div>
      </section>

      {pinnedTerm && (
        <section className="rounded-[1.75rem] border border-primary/20 bg-primary/8 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pinned post</p>
              <p className="mt-2 text-lg font-bold text-t-primary">
                {pinnedTerm.term}
                <span className={`ml-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${SUBJECT_COLORS[pinnedTerm.subject]}`}>
                  {SUBJECT_LABELS[pinnedTerm.subject]}
                </span>
              </p>
              {!filteredTerms.find((t) => t.id === pinnedTerm.id) && <p className="mt-1 text-sm text-accent">現在のフィルター外ですが、ピン留め中なので先頭に表示しています。</p>}
            </div>
            <button onClick={() => setPinnedTermId(null)} className="shrink-0 text-sm font-semibold text-primary hover:underline">解除</button>
          </div>
        </section>
      )}

      <div className="space-y-4">
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
          <p className="text-sm text-t-muted">さらにスクロールして次の投稿を読み込む ({visibleTerms.length}/{filteredTerms.length})</p>
        </div>
      )}

      {!hasMore && visibleTerms.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-t-muted">{filteredTerms.length} 件の投稿を表示しました。ここまでで今日のフィードは完走です。</p>
        </div>
      )}

      {visibleTerms.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-t-muted">該当する投稿がありません</p>
          <button onClick={clearFilters} className="mt-3 text-sm font-medium text-primary hover:underline">絞り込みをリセットする</button>
        </div>
      )}
    </div>
  );
}
