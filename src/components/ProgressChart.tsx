'use client';

import { QuizResult } from '@/types/question';

interface ProgressChartProps {
  quizHistory: QuizResult[];
}

export default function ProgressChart({ quizHistory }: ProgressChartProps) {
  if (quizHistory.length < 2) {
    return (
      <div className="text-sm text-t-muted text-center py-8">
        グラフを表示するには2回以上試験を受けてください
      </div>
    );
  }

  const recent = quizHistory.slice(-10);
  const maxScore = 100;
  const chartWidth = 300;
  const chartHeight = 150;
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = recent.map((r, i) => {
    const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
    const x = padding.left + (i / (recent.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (pct / maxScore) * innerHeight;
    return { x, y, pct, date: r.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const passY = padding.top + innerHeight - (70 / maxScore) * innerHeight;

  return (
    <div className="w-full overflow-x-auto" role="img" aria-label="成績推移グラフ">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-md mx-auto">
        {/* Grid lines */}
        <g className="chart-grid">
          {[0, 25, 50, 75, 100].map((v) => {
            const y = padding.top + innerHeight - (v / maxScore) * innerHeight;
            return (
              <g key={v}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} strokeWidth={0.5} />
                <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize={8} fill="rgb(var(--c-text-muted))">
                  {v}%
                </text>
              </g>
            );
          })}
        </g>

        {/* Pass line */}
        <line
          x1={padding.left}
          y1={passY}
          x2={chartWidth - padding.right}
          y2={passY}
          stroke="rgb(var(--c-accent))"
          strokeWidth={1}
          strokeDasharray="4 2"
        />
        <text x={chartWidth - padding.right + 2} y={passY + 3} fontSize={7} fill="rgb(var(--c-accent))">
          合格
        </text>

        {/* Line */}
        <path d={pathD} fill="none" stroke="rgb(var(--c-primary))" strokeWidth={2} />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={p.pct >= 70 ? 'rgb(var(--c-success))' : 'rgb(var(--c-error))'} />
            <text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize={6} fill="rgb(var(--c-text-muted))">
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
