'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { allTopics } from '@/data/topics';
import { allQuestions } from '@/data/questions';
import { getProgress, saveProgress, updateStreak } from '@/lib/storage';
import { TopicLesson, Question } from '@/types/question';

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
        <p className="text-slate-500">レッスンが見つかりません</p>
        <button onClick={() => router.push('/topics')} className="text-primary underline mt-2">
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
        <p className="text-sm text-slate-500">{lesson.title}</p>

        {quizQuestions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
            <div className="space-y-1">
              {q.choices.map((choice, ci) => (
                <button
                  key={ci}
                  onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [qi]: ci }))}
                  disabled={quizSubmitted}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    quizSubmitted
                      ? ci === q.correctIndex
                        ? 'bg-emerald-50 text-success border border-success'
                        : ci === quizAnswers[qi]
                        ? 'bg-red-50 text-error border border-error'
                        : 'bg-slate-50 text-slate-500'
                      : quizAnswers[qi] === ci
                      ? 'bg-blue-50 border border-primary text-primary'
                      : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {ci + 1}. {choice}
                </button>
              ))}
            </div>
            {quizSubmitted && (
              <p className="text-xs text-slate-600 bg-blue-50 p-2 rounded">{q.explanation}</p>
            )}
          </div>
        ))}

        {!quizSubmitted ? (
          <button
            onClick={() => setQuizSubmitted(true)}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium"
          >
            回答を確認する
          </button>
        ) : (
          <div className="space-y-3">
            <div className={`text-center p-4 rounded-xl ${score >= Math.ceil(quizQuestions.length * 0.7) ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className="text-2xl font-bold">{score} / {quizQuestions.length}</p>
            </div>
            <button
              onClick={() => router.push('/topics')}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium"
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
      <button onClick={() => router.push('/topics')} className="text-sm text-primary">
        ← トピック一覧
      </button>

      <h1 className="text-xl font-bold text-primary">{lesson.title}</h1>

      {lesson.sections.map((section, i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
          <h2 className="font-bold text-base">{section.heading}</h2>
          <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {section.content}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-bold text-accent mb-1">ポイント</p>
            <p className="text-sm text-slate-700">{section.keyTakeaway}</p>
          </div>
        </div>
      ))}

      {lesson.mnemonics && lesson.mnemonics.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <h3 className="font-bold text-sm text-purple-700 mb-2">覚え方のコツ</h3>
          {lesson.mnemonics.map((m, i) => (
            <p key={i} className="text-sm text-purple-600">・{m}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {!completed && (
          <button
            onClick={markCompleted}
            className="flex-1 py-3 bg-success text-white rounded-xl font-medium"
          >
            学習完了にする
          </button>
        )}
        <button
          onClick={startMiniQuiz}
          className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
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
