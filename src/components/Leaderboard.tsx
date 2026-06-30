import { Trophy } from 'lucide-react';
import type { LeaderboardRow } from '../types';

interface LeaderboardProps {
  rows: LeaderboardRow[];
  period: string;
}

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];

export default function Leaderboard({ rows, period }: LeaderboardProps) {
  const top5 = rows.slice(0, 5);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-amber-500" />
        <span className="text-sm font-semibold text-gray-700 capitalize">
          {period} Leaderboard
        </span>
      </div>
      <ol className="space-y-2">
        {top5.map((row, i) => (
          <li key={row.email} className="flex items-center gap-3">
            <span className={`text-base font-bold w-5 text-center ${medalColors[i] ?? 'text-gray-400'}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{row.name}</div>
              <div className="text-xs text-gray-500">{row.days} days</div>
            </div>
            <span className="text-sm font-semibold text-blue-600">{row.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
