'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TableNavigator from '@/components/table-navigator';
import TableReviewGrid from '@/components/table-review-grid';
import TableNotesEditor from '@/components/table-notes-editor';
import { SampleRowViewer } from '@/components/sample-row-viewer';
import { DispositionValue } from '@/lib/db/schema';

export default function SchemaTriageV2Page() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch disposition values
  const { data: dispositionsData } = useQuery({
    queryKey: ['dispositions'],
    queryFn: async () => {
      const res = await fetch('/api/disposition-values');
      if (!res.ok) throw new Error('Failed to fetch dispositions');
      return res.json() as Promise<{ dispositions: DispositionValue[] }>;
    },
  });

  // Fetch table list
  const { data: tablesData, refetch: refetchTables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await fetch('/api/schema-triage/tables');
      if (!res.ok) throw new Error('Failed to fetch tables');
      return res.json() as Promise<{ tables: string[] }>;
    },
  });

  // Fetch columns for selected table
  const { data: columnsData } = useQuery({
    queryKey: ['table-columns', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return null;
      const res = await fetch(`/api/schema-triage/table?name=${encodeURIComponent(selectedTable)}`);
      if (!res.ok) throw new Error('Failed to fetch columns');
      return res.json() as Promise<{ columns: any[] }>;
    },
    enabled: !!selectedTable,
  });

  // Fetch progress for selected table
  const { data: progressData } = useQuery({
    queryKey: ['progress', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return null;
      const res = await fetch(`/api/schema-triage/progress?table=${encodeURIComponent(selectedTable)}`);
      if (!res.ok) throw new Error('Failed to fetch progress');
      return res.json() as Promise<{
        table: string;
        total: number;
        reviewed: number;
        percentComplete: number;
      }>;
    },
    enabled: !!selectedTable,
  });

  // Generate schema inventory mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/schema-triage/generate', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate schema inventory');
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Schema inventory generated!\n\nTotal columns: ${data.totalColumns}\nNew columns: ${data.newColumns}\nExisting columns: ${data.existingColumns}`);
      refetchTables();
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tablesData?.tables || !selectedTable) return;

      const currentIndex = tablesData.tables.indexOf(selectedTable);

      // Ctrl+Shift+Left: Previous table
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedTable(tablesData.tables[currentIndex - 1]);
        }
      }

      // Ctrl+Shift+Right: Next table
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < tablesData.tables.length - 1) {
          setSelectedTable(tablesData.tables[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tablesData, selectedTable]);

  const tables = tablesData?.tables || [];
  const columns = columnsData?.columns || [];
  const dispositions = dispositionsData?.dispositions || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Schema Triage - tidyanalytics-prospecting
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Company Consolidation Workflow
          </p>
        </div>

        {/* Generate Inventory Button */}
        <div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Schema Inventory'}
          </button>
        </div>

        {/* Table Navigator */}
        {tables.length > 0 && (
          <TableNavigator
            tables={tables}
            currentTable={selectedTable}
            onTableChange={setSelectedTable}
          />
        )}

        {/* Main Content Area */}
        {selectedTable && (
          <div className="space-y-6">
            {/* Table Header with Progress */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  TABLE: {selectedTable}
                </h2>
                {progressData && (
                  <div className="text-sm text-gray-600">
                    Progress: {progressData.reviewed} / {progressData.total} columns ({progressData.percentComplete}%)
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {progressData && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressData.percentComplete}%` }}
                  />
                </div>
              )}

              {/* Table Notes */}
              <TableNotesEditor tableName={selectedTable} />
            </div>

            {/* Column Review Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              <TableReviewGrid
                tableName={selectedTable}
                columns={columns}
                dispositions={dispositions}
              />
            </div>

            {/* Sample Row Viewer (Bottom Section) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sample Row from: {selectedTable}
              </h3>
              <SampleRowViewer table={selectedTable} />
            </div>
          </div>
        )}

        {/* No Table Selected Message */}
        {!selectedTable && tables.length > 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              Select a table from the dropdown above to begin triage
            </p>
          </div>
        )}

        {/* No Tables Available Message */}
        {tables.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No tables found. Generate the schema inventory to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
