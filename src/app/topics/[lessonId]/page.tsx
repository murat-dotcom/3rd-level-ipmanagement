'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { allTopics } from '@/data/topics';
import { allQuestions } from '@/data/questions';
import { getProgress, saveProgress, updateStreak } from '@/lib/storage';
import { Question } from '@/types/question';

export default function LessonView() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const lesson = allTopics.find((t) => t.id === lessonId);
  const [completed, setCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const progress = getProgress();
    if (lesson) {
      setCompleted(progress.topicsCompleted.includes(lesson.id));
    }
  }, [lesson]);

  const markCompleted = () => {
    const progress = getProgress();
    const updated = updateStreak(progress);
    if (!updated.topicsCompleted.includes(lessonId)) {
      updated.topicsCompleted.push(lessonId);
    }
    saveProgress(updated);
    setCompleted(true);
  };

  const startMiniQuiz = () => {
    if (!lesson) return;
    const related = allQuestions.filter((q) =>
      lesson.relatedQuestionIds.includes(q.id)
    );
    const shuffled = related.sort(() => Math.random() - 0.5).slice(0, 5);
    setQuizQuestions(shuffled);
    setShowQuiz(true);
  };

  if (!lesson) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
        <p className="text-t-muted">レッスンが見つかりません</p>
        <button onClick={() => router.push('/topics')} className="text-primary font-medium hover:underline mt-2">
          戻る
        </button>
      </div>
    );
  }

  if (showQuiz) {
    const score = quizSubmitted
      ? quizQuestions.reduce((sum, q, i) => sum + (quizAnswers[i] === q.correctIndex ? 1 : 0), 0)
      : 0;

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-primary">理解度チェック</h1>
        <p className="text-sm text-t-muted">{lesson.title}</p>

        {quizQuestions.map((q, qi) => (
          <div key={q.id} className="theme-card p-4 space-y-3">
            <p className="font-medium text-sm text-t-primary">{qi + 1}. {q.question}</p>
            <div className="space-y-1">
              {q.choices.map((choice, ci) => (
                <button
                  key={ci}
                  onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [qi]: ci }))}
                  disabled={quizSubmitted}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-all ${
                    quizSubmitted
                      ? ci === q.correctIndex
                        ? 'bg-success/10 text-success border border-success'
                        : ci === quizAnswers[qi]
                        ? 'bg-error/10 text-error border border-error'
                        : 'bg-surface-alt text-t-muted'
                      : quizAnswers[qi] === ci
                      ? 'bg-primary/10 border border-primary text-primary'
                      : 'bg-surface-alt hover:bg-surface-hover border border-transparent text-t-secondary'
                  }`}
                >
                  {ci + 1}. {choice}
                </button>
              ))}
            </div>
            {quizSubmitted && (
              <div className="space-y-1">
                <p className="text-xs text-t-secondary bg-primary/5 p-2 rounded-lg">{q.explanation}</p>
                {q.relatedArticle && (
                  <p className="text-xs text-t-muted">関連条文: {q.relatedArticle}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {!quizSubmitted ? (
          <button
            onClick={() => setQuizSubmitted(true)}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            回答を確認する
          </button>
        ) : (
          <div className="space-y-3">
            <div className={`text-center p-4 rounded-card ${score >= Math.ceil(quizQuestions.length * 0.7) ? 'bg-success/10' : 'bg-error/10'}`}>
              <p className="text-2xl font-bold text-t-primary">{score} / {quizQuestions.length}</p>
            </div>
            <button
              onClick={() => router.push('/topics')}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              トピック一覧へ戻る
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.push('/topics')} className="text-sm text-primary font-medium hover:underline">
        ← トピック一覧
      </button>

      <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>

      {lesson.sections.map((section, i) => (
        <div key={i} className="theme-card p-5 space-y-3">
          <h2 className="font-bold text-base text-t-primary">{section.heading}</h2>
          <div className="text-sm leading-relaxed text-t-secondary whitespace-pre-line">
            {section.content}
          </div>
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
            <p className="text-xs font-bold text-accent mb-1">ポイント</p>
            <p className="text-sm text-t-secondary">{section.keyTakeaway}</p>
          </div>
        </div>
      ))}

      {lesson.mnemonics && lesson.mnemonics.length > 0 && (
        <div className="theme-card bg-primary/5 border-primary/20 p-4">
          <h3 className="font-bold text-sm text-primary mb-2">覚え方のコツ</h3>
          {lesson.mnemonics.map((m, i) => (
            <p key={i} className="text-sm text-t-secondary">・{m}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {!completed && (
          <button
            onClick={markCompleted}
            className="flex-1 py-3 bg-success text-white rounded-xl font-medium hover:opacity-90 transition-colors"
          >
            学習完了にする
          </button>
        )}
        <button
          onClick={startMiniQuiz}
          className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          理解度チェック
        </button>
      </div>

      {completed && (
        <p className="text-center text-sm text-success font-medium">✓ 学習完了</p>
      )}
    </div>
  );
}
