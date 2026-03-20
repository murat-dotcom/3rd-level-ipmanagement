'use client';

interface DailyGoalRingProps {
  current: number;
  goal: number;
  label: string;
}

export default function DailyGoalRing({ current, goal, label }: DailyGoalRingProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / Math.max(goal, 1), 1);
  const offset = circumference - progress * circumference;
  const completed = current >= goal;

  return (
    <div className="flex flex-col items-center" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={goal} aria-label={label}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle
          cx={48}
          cy={48}
          r={radius}
          fill="none"
          stroke="rgb(var(--c-border))"
          strokeWidth={6}
        />
        <circle
          cx={48}
          cy={48}
          r={radius}
          fill="none"
          stroke={completed ? 'rgb(var(--c-success))' : 'rgb(var(--c-primary))'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
        <text x={48} y={44} textAnchor="middle" fontSize={16} fontWeight="bold" fill="rgb(var(--c-text))">
          {current}
        </text>
        <text x={48} y={58} textAnchor="middle" fontSize={10} fill="rgb(var(--c-text-muted))">
          / {goal}
        </text>
      </svg>
      <p className="text-xs text-t-secondary mt-1">{label}</p>
    </div>
  );
}
