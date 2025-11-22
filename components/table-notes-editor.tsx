'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface TableNotesEditorProps {
  tableName: string;
}

export default function TableNotesEditor({ tableName }: TableNotesEditorProps) {
  const [notes, setNotes] = useState('');
  const [saveIndicator, setSaveIndicator] = useState<'saving' | 'saved' | null>(null);
  const queryClient = useQueryClient();

  // Fetch table notes
  const { data } = useQuery({
    queryKey: ['table-notes', tableName],
    queryFn: async () => {
      const res = await fetch(`/api/schema-triage/table-notes?table=${encodeURIComponent(tableName)}`);
      if (!res.ok) throw new Error('Failed to fetch table notes');
      return res.json();
    },
    enabled: !!tableName,
  });

  // Initialize notes from fetched data
  useEffect(() => {
    if (data) {
      setNotes(data.notes || '');
    }
  }, [data]);

  // Debounce notes for auto-save
  const debouncedNotes = useDebounce(notes, 500);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (notesText: string) => {
      const res = await fetch(`/api/schema-triage/table-notes?table=${encodeURIComponent(tableName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      });

      if (!res.ok) throw new Error('Failed to update table notes');
      return res.json();
    },
    onMutate: () => {
      setSaveIndicator('saving');
    },
    onSuccess: () => {
      setSaveIndicator('saved');
      setTimeout(() => setSaveIndicator(null), 2000);
      queryClient.invalidateQueries({ queryKey: ['table-notes', tableName] });
    },
    onError: () => {
      setSaveIndicator(null);
    },
  });

  // Auto-save when debounced notes change
  useEffect(() => {
    if (data && debouncedNotes !== (data.notes || '')) {
      updateMutation.mutate(debouncedNotes);
    }
  }, [debouncedNotes]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          Table Notes:
        </label>
        {saveIndicator && (
          <span className={`text-xs ${saveIndicator === 'saving' ? 'text-gray-500' : 'text-green-600'}`}>
            {saveIndicator === 'saving' ? '💾 Saving...' : '💾 Saved'}
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this table (purpose, data quality, consolidation strategy, etc.)"
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    </div>
  );
}
