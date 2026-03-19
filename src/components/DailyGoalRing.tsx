'use client';

interface DailyGoalRingProps {
  current: number;
  goal: number;
  label: string;
  color: string;
}

export default function DailyGoalRing({ current, goal, label, color }: DailyGoalRingProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / Math.max(goal, 1), 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={goal} aria-label={label}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle
          cx={48}
          cy={48}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={6}
        />
        <circle
          cx={48}
          cy={48}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
        <text x={48} y={44} textAnchor="middle" fontSize={16} fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">
          {current}
        </text>
        <text x={48} y={58} textAnchor="middle" fontSize={10} className="fill-slate-500">
          / {goal}
        </text>
      </svg>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}
