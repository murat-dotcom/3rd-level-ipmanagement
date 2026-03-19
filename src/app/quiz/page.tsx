'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionType, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS } from '@/types/question';

export default function QuizSetup() {
  const router = useRouter();
  const [examType, setExamType] = useState<QuestionType>('gakka');
  const [subjectFilter, setSubjectFilter] = useState<SubjectSlug | 'all'>('all');
  const [questionCount, setQuestionCount] = useState(30);
  const [mode, setMode] = useState<'standard' | 'mock'>('standard');

  const startQuiz = () => {
    const params = new URLSearchParams({
      type: examType,
      subject: subjectFilter,
      count: questionCount.toString(),
    });
    const sessionId = Date.now().toString(36);
    router.push(`/quiz/${sessionId}?${params.toString()}`);
  };

  const startMockExam = () => {
    const params = new URLSearchParams({
      type: examType,
      subject: 'all',
      count: '30',
    });
    const sessionId = `mock-${Date.now().toString(36)}`;
    router.push(`/quiz/${sessionId}?${params.toString()}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">模擬試験</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">試験形式に合わせた模擬試験を行います</p>

      {/* Mode Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
        <h2 className="font-bold">モード選択</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('standard')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              mode === 'standard'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            通常モード
          </button>
          <button
            onClick={() => setMode('mock')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              mode === 'mock'
                ? 'bg-accent text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            本番模擬試験
          </button>
        </div>
        {mode === 'mock' && (
          <p className="text-xs text-accent font-medium">
            本番と同じ30問・45分制限。全科目からランダム出題されます。
          </p>
        )}
      </div>

      {/* Exam Type */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
        <h2 className="font-bold">試験タイプ</h2>
        <div className="flex gap-3" role="radiogroup" aria-label="試験タイプ">
          {(['gakka', 'jitsugu'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setExamType(type)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                examType === type
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
              role="radio"
              aria-checked={examType === type}
            >
              {type === 'gakka' ? '学科試験' : '実技試験'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'standard' && (
        <>
          {/* Subject Filter */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h2 className="font-bold">科目選択</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="科目選択">
              <button
                onClick={() => setSubjectFilter('all')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  subjectFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                role="radio"
                aria-checked={subjectFilter === 'all'}
              >
                全科目
              </button>
              {ALL_SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    subjectFilter === subject
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  role="radio"
                  aria-checked={subjectFilter === subject}
                >
                  {SUBJECT_LABELS[subject]}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h2 className="font-bold">問題数</h2>
            <div className="flex gap-3" role="radiogroup" aria-label="問題数">
              {[10, 20, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    questionCount === count
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  role="radio"
                  aria-checked={questionCount === count}
                >
                  {count}問
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Start Button */}
      <button
        onClick={mode === 'mock' ? startMockExam : startQuiz}
        className={`w-full py-4 text-white rounded-xl text-lg font-bold transition-colors ${
          mode === 'mock' ? 'bg-accent hover:bg-amber-600' : 'bg-primary hover:bg-blue-900'
        }`}
      >
        {mode === 'mock' ? '本番模擬試験を開始する' : '試験を開始する'}
      </button>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400 space-y-1">
        <p>・学科試験: 3肢択一 / 45分（30問の場合）</p>
        <p>・実技試験: 記述・択一併用 / 45分（30問の場合）</p>
        <p>・合格基準: 70%以上</p>
        <p>・キーボード: 1-3で回答選択、←→で移動、Fでフラグ</p>
      </div>
    </div>
  );
}
