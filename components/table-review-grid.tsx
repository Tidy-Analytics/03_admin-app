'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DispositionButtonGroup from './disposition-button-group';
import { DispositionValue } from '@/lib/db/schema';

interface Column {
  id: number;
  tableName: string;
  columnName: string;
  columnType: string;
  dispositionId: number | null;
  masterEligible: boolean | null;
  dispositionLabel: string | null;
}

interface TableReviewGridProps {
  tableName: string;
  columns: Column[];
  dispositions: DispositionValue[];
}

export default function TableReviewGrid({
  tableName,
  columns,
  dispositions,
}: TableReviewGridProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      columnId,
      updates,
    }: {
      columnId: number;
      updates: { dispositionId?: number | null; masterEligible?: boolean };
    }) => {
      const res = await fetch(`/api/schema-triage/column/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update column');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['table-columns', tableName] });
      queryClient.invalidateQueries({ queryKey: ['progress', tableName] });
    },
  });

  const handleDispositionChange = (columnId: number, dispositionId: number | null) => {
    updateMutation.mutate({
      columnId,
      updates: { dispositionId },
    });
  };

  const handleMasterEligibleChange = (columnId: number, checked: boolean) => {
    updateMutation.mutate({
      columnId,
      updates: { masterEligible: checked },
    });
  };

  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No columns found for table "{tableName}". Try generating the schema inventory first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Column Name
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Type
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Disposition
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
              Master Eligible
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => (
            <tr key={col.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                {col.columnName}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                {col.columnType}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <DispositionButtonGroup
                  dispositions={dispositions}
                  selectedId={col.dispositionId}
                  onSelect={(id) => handleDispositionChange(col.id, id)}
                  columnId={col.id}
                />
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={col.masterEligible ?? false}
                  onChange={(e) => handleMasterEligibleChange(col.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
