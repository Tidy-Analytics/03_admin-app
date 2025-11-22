'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseSelector } from '@/components/database-selector';
import { ProgressBar } from '@/components/progress-bar';
import { ColumnForm } from '@/components/column-form';
import { SampleRowViewer } from '@/components/sample-row-viewer';
import { useSelectedDatabase } from '@/lib/hooks/use-selected-database';
import type { DatabaseName } from '@/lib/db/connection';

export default function SchemaTriagePage() {
  const queryClient = useQueryClient();
  const { selectedDb, setDatabase, isLoaded } = useSelectedDatabase();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columnIndex, setColumnIndex] = useState(1);

  // Fetch tables list
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', selectedDb],
    queryFn: async () => {
      const res = await fetch(`/api/schema-triage/${selectedDb}/tables`);
      if (!res.ok) throw new Error('Failed to fetch tables');
      return res.json() as Promise<{ tables: string[] }>;
    },
    enabled: isLoaded,
  });

  // Fetch progress for selected table
  const { data: progressData } = useQuery({
    queryKey: ['progress', selectedDb, selectedTable],
    queryFn: async () => {
      const res = await fetch(`/api/schema-triage/${selectedDb}/progress?table=${selectedTable}`);
      if (!res.ok) throw new Error('Failed to fetch progress');
      return res.json() as Promise<{ tableName: string; total: number; reviewed: number; percentage: number }>;
    },
    enabled: !!selectedTable,
  });

  // Generate schema inventory mutation
  const generateMutation = useMutation({
    mutationFn: async (db: DatabaseName) => {
      const res = await fetch(`/api/schema-triage/${db}/generate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate schema inventory');
      return res.json() as Promise<{ success: boolean; count: number; inserted: number; message: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables', selectedDb] });
      alert(`${data.message}\n\nDiscovered: ${data.count} columns\nNew entries: ${data.inserted}`);
    },
  });

  // Reset table and column when database changes
  useEffect(() => {
    setSelectedTable('');
    setColumnIndex(1);
  }, [selectedDb]);

  // Reset column when table changes
  useEffect(() => {
    setColumnIndex(1);
  }, [selectedTable]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Left Arrow: Previous column
      if (e.ctrlKey && e.key === 'ArrowLeft' && selectedTable) {
        e.preventDefault();
        setColumnIndex(prev => Math.max(1, prev - 1));
      }
      // Ctrl+Right Arrow: Next column
      if (e.ctrlKey && e.key === 'ArrowRight' && selectedTable && progressData) {
        e.preventDefault();
        setColumnIndex(prev => Math.min(progressData.total, prev + 1));
      }
      // Ctrl+Shift+R: Refresh sample (handled in SampleRowViewer)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, progressData]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setColumnIndex(prev => Math.max(1, prev - 1));
    } else {
      setColumnIndex(prev => progressData ? Math.min(progressData.total, prev + 1) : prev + 1);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const tables = tablesData?.tables || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Schema Triage</h1>

      <p className="text-gray-600">
        Review and categorize database columns to build the company master table schema.
      </p>

      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <DatabaseSelector value={selectedDb} onChange={setDatabase} />

        <button
          onClick={() => generateMutation.mutate(selectedDb)}
          disabled={generateMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Schema Inventory'}
        </button>

        {tables.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Table:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select table...</option>
              {tables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tablesLoading && (
        <div className="text-gray-600">Loading tables...</div>
      )}

      {!tablesLoading && tables.length === 0 && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            No tables found in the schema inventory. Click "Generate Schema Inventory" to scan the database.
          </p>
        </div>
      )}

      {selectedTable && progressData && (
        <div className="space-y-6">
          <ProgressBar reviewed={progressData.reviewed} total={progressData.total} />

          <ColumnForm
            database={selectedDb}
            table={selectedTable}
            columnIndex={columnIndex}
            onNavigate={handleNavigate}
          />

          <SampleRowViewer database={selectedDb} table={selectedTable} />
        </div>
      )}
    </div>
  );
}
