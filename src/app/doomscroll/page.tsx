'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { allDoomscrollTerms } from '@/data/doomscroll';
import { DoomscrollTerm, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS, TermCategory } from '@/types/question';
import { getProgress, saveProgress } from '@/lib/storage';

const BATCH_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 250;
const CATEGORY_ORDER: TermCategory[] = ['定義', '手続', '期間', '権利', '要件', '制度', '条約', '比較'];

const SUBJECT_COLORS: Record<SubjectSlug, string> = {
  patent: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  copyright: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  trademark: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  design: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  treaties: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  other: 'bg-surface-alt text-t-secondary',
};

const SUBJECT_ACCENTS: Record<SubjectSlug, string> = {
  patent: 'from-sky-500/15 to-cyan-500/5',
  copyright: 'from-violet-500/15 to-fuchsia-500/5',
  trademark: 'from-amber-500/15 to-orange-500/5',
  design: 'from-pink-500/15 to-rose-500/5',
  treaties: 'from-emerald-500/15 to-teal-500/5',
  other: 'from-slate-500/10 to-slate-500/5',
};

const SUBJECT_AVATAR: Record<SubjectSlug, string> = {
  patent: '💡',
  copyright: '🎼',
  trademark: '🏷️',
  design: '🎨',
  treaties: '🌐',
  other: '🧠',
};

const CATEGORY_ICONS: Record<string, string> = {
  定義: '📖',
  手続: '📋',
  期間: '⏰',
  権利: '🔑',
  要件: '✅',
  制度: '🏛️',
  条約: '🌍',
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
      className={`overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all duration-300 ${
        isRead ? 'border-success/35 shadow-[0_14px_40px_rgba(16,185,129,0.10)]' : 'hover:-translate-y-1 hover:border-primary/25'
      }`}
    >
      <div className={`border-b border-border bg-gradient-to-br ${SUBJECT_ACCENTS[term.subject]} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-2xl shadow-sm">
              {SUBJECT_AVATAR[term.subject]}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-t-muted">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${SUBJECT_COLORS[term.subject]}`}>{SUBJECT_LABELS[term.subject]}</span>
                <span className="rounded-full bg-surface/80 px-2.5 py-1">{CATEGORY_ICONS[term.category] || '📝'} {term.category}</span>
                <span className="rounded-full bg-surface/80 px-2.5 py-1">難易度: {DIFFICULTY_LABELS[term.difficulty]}</span>
                {term.source === 'generated' && <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">AI生成</span>}
                {isPinned && <span className="rounded-full bg-primary px-2.5 py-1 font-semibold text-white">固定表示中</span>}
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-black tracking-tight text-t-primary">{term.term}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-t-muted">
                  {term.reading && <span>{term.reading}</span>}
                  {term.english && <span className="italic">• {term.english}</span>}
                  <span>• 1 min read</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onPin(isPinned ? '' : term.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${isPinned ? 'bg-primary text-white' : 'bg-surface text-t-muted hover:bg-surface-alt'}`}
              aria-label={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
              title={isPinned ? 'ピン留めを解除' : 'この用語をピン留め'}
            >
              📌
            </button>
            <button
              onClick={() => onToggleRead(term.id)}
              className={`flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-all ${isRead ? 'bg-success text-white' : 'bg-surface text-t-secondary hover:bg-surface-alt'}`}
              aria-label={isRead ? '既読を解除' : '既読にする'}
              title={isRead ? '既読を解除' : '既読にする'}
            >
              {isRead ? '✓ Read' : 'Mark read'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-[15px] leading-8 text-t-secondary">{term.definition}</p>

        <div className="mt-4 rounded-[1.25rem] border border-accent/15 bg-accent/5 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Key takeaway</p>
          <p className="mt-2 text-sm leading-7 text-t-secondary">{term.keyPoint}</p>
        </div>

        {term.relatedTermIds.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setExpanded(!expanded)} className="text-sm font-semibold text-primary hover:underline">
              {expanded ? '関連用語を閉じる' : `関連用語を表示 (${term.relatedTermIds.length})`}
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
                      className="rounded-full border border-border bg-surface-alt px-3 py-2 text-xs font-semibold text-t-secondary transition-all hover:border-primary/30 hover:text-primary"
                    >
                      #{relTerm.term}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-t-muted">
          <div className="flex flex-wrap items-center gap-4">
            <span>❤️ 理解メモ</span>
            <span>💬 試験で出やすい</span>
            <span>🔁 再接触で定着</span>
          </div>
          <button onClick={() => onRelatedClick(term.id)} className="font-semibold text-primary hover:underline">このカードを中心表示</button>
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
    <div className="mx-auto max-w-6xl space-y-5 p-4 pb-24 md:p-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(var(--c-primary),0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--c-accent),0.15),transparent_24%),linear-gradient(135deg,rgba(var(--c-surface),0.98),rgba(var(--c-surface-alt),0.94))] p-6 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="relative grid gap-5 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Social-feed style</span>
              <span className="rounded-full border border-border bg-surface/90 px-3 py-1 text-t-secondary">doomscroll → study scroll</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-t-primary md:text-5xl">📜 用語ドゥームスクロールを、
              <span className="block text-primary">SNSっぽい学習フィードに刷新。</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-t-secondary md:text-base">カードの密度を下げ、見出し・タグ・既読アクションを投稿UIのように整理しました。流し見しやすいのに、未読管理や固定表示でちゃんと勉強に戻れる設計です。</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border bg-surface/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-t-muted">Read</p>
              <p className="mt-2 text-3xl font-black text-t-primary">{progressPercent}%</p>
              <p className="mt-1 text-sm text-t-secondary">{readCount}/{totalCount} 読了</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-surface/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-t-muted">Visible</p>
              <p className="mt-2 text-3xl font-black text-primary">{filteredTerms.length}</p>
              <p className="mt-1 text-sm text-t-secondary">今の条件で表示</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-surface/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-t-muted">Unread</p>
              <p className="mt-2 text-3xl font-black text-accent">{unreadFilteredCount}</p>
              <p className="mt-1 text-sm text-t-secondary">次に読む候補</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Smart modes</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">見たいテンポを先に選ぶ</h2>
            </div>
            <span className="text-3xl">🧭</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <button onClick={() => setFocusMode('balanced')} className={`rounded-2xl px-3 py-3 font-semibold transition-all ${focusMode === 'balanced' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>標準</button>
            <button onClick={() => setFocusMode('quick')} className={`rounded-2xl px-3 py-3 font-semibold transition-all ${focusMode === 'quick' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>時短</button>
            <button onClick={() => setFocusMode('challenge')} className={`rounded-2xl px-3 py-3 font-semibold transition-all ${focusMode === 'challenge' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-t-secondary hover:bg-surface-hover'}`}>応用</button>
          </div>
          <p className="mt-3 text-sm leading-6 text-t-secondary">
            {focusMode === 'quick' && '未読×基本だけを優先表示。ちょっとした空き時間向け。'}
            {focusMode === 'challenge' && '応用レベル中心のフィード。得点差をつけたい時向け。'}
            {focusMode === 'balanced' && '科目横断で見やすい標準モード。まずはここから。'}
          </p>
          <div className="mt-5 rounded-[1.5rem] bg-surface-alt p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-t-secondary">フィード進捗</span>
              <span className="font-black text-primary">{progressPercent}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(var(--c-primary),1),rgba(var(--c-accent),0.95))] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-surface p-3"><p className="text-t-muted">表示中</p><p className="mt-1 text-xl font-bold text-t-primary">{filteredTerms.length}</p></div>
              <div className="rounded-2xl bg-surface p-3"><p className="text-t-muted">未読</p><p className="mt-1 text-xl font-bold text-accent">{unreadFilteredCount}</p></div>
              <div className="rounded-2xl bg-surface p-3"><p className="text-t-muted">読了</p><p className="mt-1 text-xl font-bold text-success">{filteredReadCount}</p></div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-[linear-gradient(135deg,rgba(var(--c-primary),0.08),rgba(var(--c-surface),0.98))] p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">AI boost</p>
              <h2 className="mt-1 text-2xl font-bold text-t-primary">フィードに新着用語を足す</h2>
              <p className="mt-2 text-sm leading-6 text-t-secondary">設定画面に保存した APIキー / モデルを使って、現在の科目に合わせた補足用語を3件生成します。</p>
            </div>
            <button
              onClick={handleGenerateTerms}
              disabled={isGenerating}
              className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? '生成中...' : 'AIで3件追加'}
            </button>
          </div>
          {generationError && <p className="mt-3 text-sm font-medium text-error">{generationError}</p>}
          {generatedTerms.length > 0 && <p className="mt-3 text-xs text-t-muted">追加済み AI用語: {generatedTerms.length}件。生成カードには「AI生成」バッジを表示しています。</p>}
        </div>
      </section>

      <section className="sticky top-0 z-40 rounded-[1.75rem] border border-border/80 bg-bg/90 p-4 shadow-sm backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-[1.2fr,0.9fr,0.9fr,0.8fr]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="用語・定義・ポイントを検索..."
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-t-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
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
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(['all', 'unread', 'read'] as const).map((mode) => (
            <button key={mode} onClick={() => setReadMode(mode)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${readMode === mode ? 'bg-primary text-white' : 'border border-border bg-surface text-t-secondary'}`}>
              {mode === 'all' ? 'すべて' : mode === 'unread' ? '未読だけ' : '既読だけ'}
            </button>
          ))}
          <button onClick={handleJumpToUnread} className="rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-accent">次の未読へ</button>
          <button onClick={handleMarkVisibleRead} className="rounded-full bg-success/10 px-4 py-2 text-xs font-semibold text-success">表示中を既読 ({visibleUnreadCount})</button>
          <button onClick={shuffled ? handleReset : handleShuffle} className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">{shuffled ? '元の順序に戻す' : 'シャッフル'}</button>
          {(subjectFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all' || searchQuery || readMode !== 'all') && (
            <button onClick={clearFilters} className="rounded-full bg-error/10 px-4 py-2 text-xs font-semibold text-error">条件をクリア</button>
          )}
          <span className="ml-auto text-xs font-semibold text-t-muted">{filteredTerms.length} posts</span>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.82fr,1.18fr] xl:grid-cols-[0.75fr,1.25fr]">
        <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">科目ショートカット</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {ALL_SUBJECTS.map((subject) => {
                const count = terms.filter((term) => term.subject === subject).length;
                return (
                  <button
                    key={subject}
                    onClick={() => setSubjectFilter(subjectFilter === subject ? 'all' : subject)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-all ${subjectFilter === subject ? 'border-primary bg-primary/8' : 'border-border bg-surface-alt hover:border-primary/25'}`}
                  >
                    <p className="text-xl">{SUBJECT_AVATAR[subject]}</p>
                    <p className="mt-2 text-sm font-bold text-t-primary">{SUBJECT_LABELS[subject]}</p>
                    <p className="text-xs text-t-muted">{count}語</p>
                  </button>
                );
              })}
            </div>
          </div>

          {pinnedTerm && (
            <div className="rounded-[1.75rem] border border-primary/20 bg-primary/5 p-5 shadow-sm">
              <p className="text-sm font-semibold text-primary">ピン留め中</p>
              <p className="mt-2 text-xl font-bold text-t-primary">{pinnedTerm.term}</p>
              <p className="mt-1 text-sm text-t-secondary">{pinnedTerm.keyPoint}</p>
              {!filteredTerms.find((t) => t.id === pinnedTerm.id) && <p className="mt-2 text-xs font-medium text-accent">現在のフィルター外ですが固定表示しています。</p>}
              <button onClick={() => setPinnedTermId(null)} className="mt-3 text-sm font-semibold text-primary hover:underline">固定を解除</button>
            </div>
          )}
        </aside>

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
              onPin={(id) => setPinnedTermId(id || null)}
            />
          ))}

          {hasMore && (
            <div ref={sentinelRef} className="rounded-[1.5rem] border border-dashed border-border bg-surface-alt/60 py-8 text-center">
              <p className="text-sm text-t-muted">下にスクロールして続きを表示（{visibleTerms.length}/{filteredTerms.length}）</p>
            </div>
          )}

          {!hasMore && visibleTerms.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-t-muted">{filteredTerms.length} 用語を表示しました</p>
            </div>
          )}

          {visibleTerms.length === 0 && (
            <div className="rounded-[1.75rem] border border-border bg-surface py-16 text-center shadow-sm">
              <p className="text-lg text-t-muted">該当する用語がありません</p>
              <button onClick={clearFilters} className="mt-3 text-sm font-semibold text-primary hover:underline">絞り込みをリセットする</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
