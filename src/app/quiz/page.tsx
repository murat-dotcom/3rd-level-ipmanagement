'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionType, SubjectSlug, SUBJECT_LABELS, ALL_SUBJECTS } from '@/types/question';

export default function QuizSetup() {
  const router = useRouter();
  const [examType, setExamType] = useState<QuestionType>('gakka');
  const [subjectFilter, setSubjectFilter] = useState<SubjectSlug | 'all'>('all');
  const [questionCount, setQuestionCount] = useState(30);

  const startQuiz = () => {
    const params = new URLSearchParams({
      type: examType,
      subject: subjectFilter,
      count: questionCount.toString(),
    });
    const sessionId = Date.now().toString(36);
    router.push(`/quiz/${sessionId}?${params.toString()}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">模擬試験</h1>
      <p className="text-sm text-slate-600">試験形式に合わせた模擬試験を行います</p>

      {/* Exam Type */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
        <h2 className="font-bold">試験タイプ</h2>
        <div className="flex gap-3">
          {(['gakka', 'jitsugu'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setExamType(type)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                examType === type
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type === 'gakka' ? '学科試験' : '実技試験'}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
        <h2 className="font-bold">科目選択</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSubjectFilter('all')}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              subjectFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
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
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {SUBJECT_LABELS[subject]}
            </button>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
        <h2 className="font-bold">問題数</h2>
        <div className="flex gap-3">
          {[10, 20, 30].map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                questionCount === count
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {count}問
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={startQuiz}
        className="w-full py-4 bg-primary text-white rounded-xl text-lg font-bold hover:bg-blue-900 transition-colors"
      >
        試験を開始する
      </button>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-slate-600 space-y-1">
        <p>・学科試験: 3肢択一 / 45分（30問の場合）</p>
        <p>・実技試験: 記述・択一併用 / 45分（30問の場合）</p>
        <p>・合格基準: 70%以上</p>
      </div>
    </div>
  );
}
