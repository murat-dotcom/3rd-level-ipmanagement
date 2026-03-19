import { UserProgress, FlashcardState, DailyGoal, MistakeEntry, SubjectSlug } from '@/types/question';

const STORAGE_KEY = 'chizai-drill-progress';

const DEFAULT_PROGRESS: UserProgress = {
  quizHistory: [],
  flashcardState: {},
  topicsCompleted: [],
  streakDays: 0,
  lastStudyDate: '',
  dailyGoal: { cardsPerDay: 20, questionsPerDay: 10 },
  dailyProgress: { date: '', cardsReviewed: 0, questionsAnswered: 0 },
  mistakeNotebook: {},
  theme: 'light',
};

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const data = JSON.parse(raw) as UserProgress;
    // Ensure new fields exist
    if (!data.dailyGoal) data.dailyGoal = DEFAULT_PROGRESS.dailyGoal;
    if (!data.dailyProgress) data.dailyProgress = DEFAULT_PROGRESS.dailyProgress;
    if (!data.mistakeNotebook) data.mistakeNotebook = {};
    if (!data.theme) data.theme = 'light';
    return data;
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

export function getDailyProgress(progress: UserProgress): { cardsReviewed: number; questionsAnswered: number } {
  const today = new Date().toISOString().split('T')[0];
  if (progress.dailyProgress?.date === today) {
    return {
      cardsReviewed: progress.dailyProgress.cardsReviewed,
      questionsAnswered: progress.dailyProgress.questionsAnswered,
    };
  }
  return { cardsReviewed: 0, questionsAnswered: 0 };
}

export function incrementDailyCards(progress: UserProgress, count: number = 1): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const current = progress.dailyProgress?.date === today ? progress.dailyProgress : { date: today, cardsReviewed: 0, questionsAnswered: 0 };
  return {
    ...progress,
    dailyProgress: {
      ...current,
      date: today,
      cardsReviewed: current.cardsReviewed + count,
    },
  };
}

export function incrementDailyQuestions(progress: UserProgress, count: number = 1): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const current = progress.dailyProgress?.date === today ? progress.dailyProgress : { date: today, cardsReviewed: 0, questionsAnswered: 0 };
  return {
    ...progress,
    dailyProgress: {
      ...current,
      date: today,
      questionsAnswered: current.questionsAnswered + count,
    },
  };
}

export function addMistake(progress: UserProgress, questionId: string, selectedAnswer: number): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const existing = progress.mistakeNotebook?.[questionId];
  return {
    ...progress,
    mistakeNotebook: {
      ...progress.mistakeNotebook,
      [questionId]: {
        questionId,
        date: today,
        selectedAnswer,
        reviewCount: existing ? existing.reviewCount + 1 : 1,
        mastered: false,
      },
    },
  };
}

export function markMistakeMastered(progress: UserProgress, questionId: string): UserProgress {
  if (!progress.mistakeNotebook?.[questionId]) return progress;
  return {
    ...progress,
    mistakeNotebook: {
      ...progress.mistakeNotebook,
      [questionId]: {
        ...progress.mistakeNotebook[questionId],
        mastered: true,
      },
    },
  };
}

export function getWeakSubjects(progress: UserProgress): { subject: SubjectSlug; accuracy: number }[] {
  const subjectStats: Record<string, { correct: number; total: number }> = {};

  progress.quizHistory.forEach((result) => {
    result.wrongQuestionIds.forEach(() => {
      // Count wrongs per quiz - we use overall score for subject analysis
    });
  });

  // Analyze from mistake notebook for subject-level accuracy
  const mistakesBySubject: Record<string, number> = {};
  if (progress.mistakeNotebook) {
    Object.values(progress.mistakeNotebook).forEach((entry) => {
      if (!entry.mastered) {
        const subject = entry.questionId.split('-')[0] as SubjectSlug;
        mistakesBySubject[subject] = (mistakesBySubject[subject] || 0) + 1;
      }
    });
  }

  // Calculate from quiz history with subject tracking
  progress.quizHistory.forEach((result) => {
    const sub = result.subject || 'all';
    if (sub !== 'all') {
      if (!subjectStats[sub]) subjectStats[sub] = { correct: 0, total: 0 };
      subjectStats[sub].correct += result.score;
      subjectStats[sub].total += result.total;
    }
  });

  const subjects: SubjectSlug[] = ['patent', 'copyright', 'trademark', 'design', 'treaties', 'other'];
  return subjects
    .map((subject) => {
      const stats = subjectStats[subject];
      const accuracy = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : -1;
      return { subject, accuracy };
    })
    .filter((s) => s.accuracy >= 0)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function exportProgress(): string {
  if (typeof window === 'undefined') return '{}';
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw || '{}';
}

export function importProgress(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (typeof data !== 'object' || data === null) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
