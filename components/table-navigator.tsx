'use client';

import React from 'react';

interface TableNavigatorProps {
  tables: string[];
  currentTable: string | null;
  onTableChange: (table: string) => void;
}

export default function TableNavigator({
  tables,
  currentTable,
  onTableChange,
}: TableNavigatorProps) {
  const currentIndex = currentTable ? tables.indexOf(currentTable) : -1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onTableChange(tables[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < tables.length - 1) {
      onTableChange(tables[currentIndex + 1]);
    }
  };

  const isPreviousDisabled = currentIndex <= 0;
  const isNextDisabled = currentIndex >= tables.length - 1 || currentIndex === -1;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePrevious}
        disabled={isPreviousDisabled}
        className={`
          px-4 py-2 rounded font-medium transition-colors
          ${isPreviousDisabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        ← Previous Table
      </button>

      <select
        value={currentTable || ''}
        onChange={(e) => onTableChange(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select a table...</option>
        {tables.map((table) => (
          <option key={table} value={table}>
            {table}
          </option>
        ))}
      </select>

      <button
        onClick={handleNext}
        disabled={isNextDisabled}
        className={`
          px-4 py-2 rounded font-medium transition-colors
          ${isNextDisabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        Next Table →
      </button>
    </div>
  );
}
