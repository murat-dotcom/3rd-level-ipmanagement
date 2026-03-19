'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress } from '@/lib/storage';
import { allTopics } from '@/data/topics';
import { SUBJECT_LABELS, ALL_SUBJECTS, SubjectSlug } from '@/types/question';

export default function TopicsIndex() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const progress = getProgress();
    setCompleted(progress.topicsCompleted);
  }, []);

  const topicsBySubject = ALL_SUBJECTS.map((subject) => ({
    subject,
    label: SUBJECT_LABELS[subject],
    lessons: allTopics
      .filter((t) => t.subject === subject)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">トピック解説</h1>
      <p className="text-sm text-slate-600">科目ごとに体系的に学習できます</p>

      {topicsBySubject.map(({ subject, label, lessons }) => (
        <div key={subject} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <h2 className="font-bold text-sm">{label}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {lessons.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">準備中</p>
            ) : (
              lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/topics/${lesson.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      completed.includes(lesson.id)
                        ? 'bg-success text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {completed.includes(lesson.id) ? '✓' : lesson.order}
                  </span>
                  <span className="text-sm font-medium">{lesson.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
