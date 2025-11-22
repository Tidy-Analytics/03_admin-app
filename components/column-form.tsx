'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DatabaseName } from '@/lib/db/connection';
import type { SchemaInventoryRow, DispositionValue } from '@/lib/db/schema';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface ColumnFormProps {
  database: DatabaseName;
  table: string;
  columnIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function ColumnForm({ database, table, columnIndex, onNavigate }: ColumnFormProps) {
  const queryClient = useQueryClient();

  // Fetch column data
  const { data, isLoading } = useQuery({
    queryKey: ['column', database, table, columnIndex],
    queryFn: async () => {
      const res = await fetch(`/api/schema-triage/${database}/column?table=${table}&index=${columnIndex}`);
      if (!res.ok) throw new Error('Failed to fetch column');
      return res.json() as Promise<{ column: SchemaInventoryRow; totalColumns: number; currentIndex: number }>;
    },
  });

  // Fetch dispositions
  const { data: dispositionsData } = useQuery({
    queryKey: ['dispositions'],
    queryFn: async () => {
      const res = await fetch('/api/disposition-values');
      if (!res.ok) throw new Error('Failed to fetch dispositions');
      return res.json() as Promise<{ dispositions: DispositionValue[] }>;
    },
  });

  // Local state for form fields
  const [dispositionId, setDispositionId] = useState<number | null>(null);
  const [masterEligible, setMasterEligible] = useState(false);
  const [notes, setNotes] = useState('');
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving' | null>(null);

  // Debounced notes for auto-save (5 seconds after typing stops)
  const debouncedNotes = useDebounce(notes, 5000);

  // Sync local state with fetched data
  useEffect(() => {
    if (data?.column) {
      setDispositionId(data.column.dispositionId);
      setMasterEligible(data.column.masterEligible ?? false);
      setNotes(data.column.notes || '');
    }
  }, [data?.column]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SchemaInventoryRow>) => {
      const res = await fetch(`/api/schema-triage/${database}/column/${data!.column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update column');
      return res.json();
    },
    onMutate: () => {
      setSaveIndicator('saving');
    },
    onSuccess: () => {
      setSaveIndicator('saved');
      setTimeout(() => setSaveIndicator(null), 2000);
      queryClient.invalidateQueries({ queryKey: ['column', database, table, columnIndex] });
      queryClient.invalidateQueries({ queryKey: ['progress', database, table] });
    },
    onError: () => {
      setSaveIndicator(null);
    },
  });

  // Auto-save handlers
  const handleDispositionChange = (value: string) => {
    const id = value ? parseInt(value) : null;
    setDispositionId(id);
    updateMutation.mutate({ dispositionId: id });
  };

  const handleMasterEligibleChange = (checked: boolean) => {
    setMasterEligible(checked);
    updateMutation.mutate({ masterEligible: checked });
  };

  useEffect(() => {
    if (data?.column && debouncedNotes !== data.column.notes) {
      updateMutation.mutate({ notes: debouncedNotes });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);

  if (isLoading || !data) {
    return <div className="text-gray-600">Loading column data...</div>;
  }

  const { column, totalColumns, currentIndex } = data;
  const dispositions = dispositionsData?.dispositions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {table} → Column {currentIndex} of {totalColumns}
        </h2>
        <div className="text-sm text-gray-600">
          {saveIndicator === 'saving' && '💾 Saving...'}
          {saveIndicator === 'saved' && '💾 Saved'}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Column Name</label>
          <div className="mt-1 font-mono text-sm text-gray-900">{column.columnName}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Column Type</label>
          <div className="mt-1 font-mono text-sm text-gray-600">{column.columnType}</div>
        </div>

        <div>
          <label htmlFor="disposition" className="block text-sm font-medium text-gray-700">
            Disposition
          </label>
          <select
            id="disposition"
            value={dispositionId?.toString() || ''}
            onChange={(e) => handleDispositionChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select disposition...</option>
            {dispositions.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="master-eligible"
            checked={masterEligible}
            onChange={(e) => handleMasterEligibleChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="master-eligible" className="text-sm text-gray-700 cursor-pointer">
            Include in company master (master eligible)
          </label>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your triage notes here..."
            className="mt-1 block w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ◄ Previous Column (Ctrl+←)
          </button>
          <button
            onClick={() => onNavigate('next')}
            disabled={currentIndex === totalColumns}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Column (Ctrl+→) ►
          </button>
        </div>
      </div>
    </div>
  );
}
