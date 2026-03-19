import { UserProgress, FlashcardState } from '@/types/question';

const STORAGE_KEY = 'chizai-drill-progress';

const DEFAULT_PROGRESS: UserProgress = {
  quizHistory: [],
  flashcardState: {},
  topicsCompleted: [],
  streakDays: 0,
  lastStudyDate: '',
};

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw) as UserProgress;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastStudyDate === today) return progress;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = progress.lastStudyDate === yesterday ? progress.streakDays + 1 : 1;

  return {
    ...progress,
    streakDays: newStreak,
    lastStudyDate: today,
  };
}

export function getFlashcardState(progress: UserProgress, cardId: string): FlashcardState {
  return progress.flashcardState[cardId] || {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: new Date().toISOString().split('T')[0],
  };
}

export function isDueForReview(state: FlashcardState): boolean {
  const today = new Date().toISOString().split('T')[0];
  return state.nextReview <= today;
}
