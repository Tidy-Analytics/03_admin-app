'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SampleRowViewerProps {
  table: string;
}

export function SampleRowViewer({ table }: SampleRowViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['sample', table, refreshKey],
    queryFn: async () => {
      const res = await fetch(`/api/schema-triage/sample?table=${encodeURIComponent(table)}`);
      if (!res.ok) throw new Error('Failed to fetch sample row');
      return res.json() as Promise<{
        table: string;
        sampleRow: Record<string, any> | null;
        masterEligibleColumns: string[];
        message?: string;
      }>;
    },
    enabled: isOpen && !!table,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
      >
        Show Sample Row (Ctrl+Shift+R)
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sample Row from {table}</h3>
        <div className="space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh Sample'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-gray-600">Loading sample data...</div>
      )}

      {!isLoading && data && data.sampleRow === null && (
        <div className="text-gray-600">{data.message || 'No data available'}</div>
      )}

      {!isLoading && data && data.sampleRow && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Column
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.sampleRow).map(([key, value]) => {
                const isMasterEligible = data.masterEligibleColumns.includes(key);
                return (
                  <tr key={key} className={isMasterEligible ? 'bg-green-50' : ''}>
                    <td className="px-4 py-2 text-sm font-mono text-gray-900 whitespace-nowrap">
                      {isMasterEligible && <span className="mr-1">⭐</span>}
                      {key}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {value !== null ? String(value) : <span className="text-gray-400 italic">NULL</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500">
            ⭐ = Master-eligible column
          </div>
        </div>
      )}
    </div>
  );
}
