'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DispositionValue } from '@/lib/db/schema';

export default function DispositionConfigPage() {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  // Fetch dispositions
  const { data, isLoading } = useQuery({
    queryKey: ['dispositions'],
    queryFn: async () => {
      const res = await fetch('/api/disposition-values');
      if (!res.ok) throw new Error('Failed to fetch dispositions');
      return res.json() as Promise<{ dispositions: DispositionValue[] }>;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch('/api/disposition-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          sortOrder: (data?.dispositions.length || 0) + 1
        }),
      });
      if (!res.ok) throw new Error('Failed to create disposition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositions'] });
      setNewLabel('');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, label }: { id: number; label: string }) => {
      const res = await fetch(`/api/disposition-values/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error('Failed to update disposition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositions'] });
      setEditingId(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/disposition-values/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete disposition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositions'] });
    },
  });

  const handleCreate = () => {
    if (newLabel.trim()) {
      createMutation.mutate(newLabel.trim());
    }
  };

  const handleUpdate = (id: number) => {
    if (editLabel.trim()) {
      updateMutation.mutate({ id, label: editLabel.trim() });
    }
  };

  const handleEdit = (disposition: DispositionValue) => {
    setEditingId(disposition.id);
    setEditLabel(disposition.label);
  };

  if (isLoading) {
    return <div>Loading dispositions...</div>;
  }

  const dispositions = data?.dispositions || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Disposition Value Manager</h1>

      <p className="text-gray-600">
        Manage the disposition values used to categorize database columns during schema triage.
        These values will appear in the dropdown when reviewing columns.
      </p>

      {/* Add New */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New disposition label..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Adding...' : 'Add New Value'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dispositions.map((d) => (
              <tr key={d.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === d.id ? (
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(d.id)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{d.label}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {d.sortOrder}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {d.isActive ? '✓' : '✗'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {editingId === d.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(d.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(d)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Deactivate this disposition? It will no longer appear in dropdowns.')) {
                            deleteMutation.mutate(d.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dispositions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No disposition values found. Add your first one above!
        </div>
      )}
    </div>
  );
}
