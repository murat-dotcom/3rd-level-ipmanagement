export type QuestionType = 'gakka' | 'jitsugu';
export type SubjectSlug = 'patent' | 'copyright' | 'trademark' | 'design' | 'treaties' | 'other';

export interface Question {
  id: string;
  subject: SubjectSlug;
  topic: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  keyPoint: string;
  relatedArticle?: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  subject: SubjectSlug;
  front: string;
  back: string;
  tags: string[];
}

export interface FlashcardState {
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReview: string;
}

export interface TopicLesson {
  id: string;
  subject: SubjectSlug;
  title: string;
  order: number;
  sections: {
    heading: string;
    content: string;
    keyTakeaway: string;
  }[];
  relatedQuestionIds: string[];
  mnemonics?: string[];
}

export interface QuizResult {
  date: string;
  type: QuestionType;
  score: number;
  total: number;
  timeSpent: number;
  wrongQuestionIds: string[];
  subject?: SubjectSlug | 'all';
}

export interface DailyGoal {
  cardsPerDay: number;
  questionsPerDay: number;
}

export interface MistakeEntry {
  questionId: string;
  date: string;
  selectedAnswer: number;
  reviewCount: number;
  mastered: boolean;
}

export interface AISettings {
  apiKey: string;
  model: string;
}

export interface UserProgress {
  quizHistory: QuizResult[];
  flashcardState: Record<string, FlashcardState>;
  topicsCompleted: string[];
  streakDays: number;
  lastStudyDate: string;
  dailyGoal?: DailyGoal;
  dailyProgress?: {
    date: string;
    cardsReviewed: number;
    questionsAnswered: number;
  };
  mistakeNotebook?: Record<string, MistakeEntry>;
  theme?: 'light' | 'dark';
  doomscrollRead?: string[];
  aiSettings?: AISettings;
}

export const SUBJECT_LABELS: Record<SubjectSlug, string> = {
  patent: '特許法・実用新案法',
  copyright: '著作権法',
  trademark: '商標法',
  design: '意匠法',
  treaties: '条約',
  other: 'その他',
};

export const ALL_SUBJECTS: SubjectSlug[] = ['patent', 'copyright', 'trademark', 'design', 'treaties', 'other'];

export type TermCategory = '定義' | '手続' | '期間' | '権利' | '要件' | '制度' | '条約' | '比較';

export interface DoomscrollTerm {
  id: string;
  term: string;
  reading?: string;
  definition: string;
  subject: SubjectSlug;
  category: TermCategory;
  keyPoint: string;
  relatedTermIds: string[];
  difficulty: 1 | 2 | 3;
  source?: 'local' | 'generated';
}
