'use client';

interface ProgressBarProps {
  reviewed: number;
  total: number;
}

export function ProgressBar({ reviewed, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Progress:</span>
        <span className="font-medium text-gray-900">
          {reviewed} of {total} columns reviewed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
