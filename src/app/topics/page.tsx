'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress } from '@/lib/storage';
import { allTopics } from '@/data/topics';
import { SUBJECT_LABELS, ALL_SUBJECTS } from '@/types/question';

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
      <p className="text-sm text-t-secondary">科目ごとに体系的に学習できます</p>

      {topicsBySubject.map(({ subject, label, lessons }) => (
        <div key={subject} className="theme-card overflow-hidden">
          <div className="bg-surface-alt px-4 py-3 border-b border-border">
            <h2 className="font-bold text-sm text-t-primary">{label}</h2>
          </div>
          <div className="divide-y divide-border-light">
            {lessons.length === 0 ? (
              <p className="p-4 text-sm text-t-muted">準備中</p>
            ) : (
              lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/topics/${lesson.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-surface-alt transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      completed.includes(lesson.id)
                        ? 'bg-success text-white'
                        : 'bg-surface-hover text-t-muted'
                    }`}
                    aria-label={completed.includes(lesson.id) ? '完了' : `レッスン${lesson.order}`}
                  >
                    {completed.includes(lesson.id) ? '✓' : lesson.order}
                  </span>
                  <span className="text-sm font-medium text-t-primary">{lesson.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
