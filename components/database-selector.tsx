'use client';

import type { DatabaseName } from '@/lib/db/connection';

interface DatabaseSelectorProps {
  value: DatabaseName;
  onChange: (db: DatabaseName) => void;
}

export function DatabaseSelector({ value, onChange }: DatabaseSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Database:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DatabaseName)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
      >
        <option value="names">names</option>
        <option value="tidyanalytics-prospecting">tidyanalytics-prospecting</option>
      </select>
    </div>
  );
}
