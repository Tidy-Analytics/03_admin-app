'use client';

import React from 'react';
import { DispositionValue } from '@/lib/db/schema';

interface DispositionButtonGroupProps {
  dispositions: DispositionValue[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  columnId: number;
}

function abbreviateLabel(label: string): string {
  const abbrevMap: Record<string, string> = {
    'Primary Key': 'PK',
    'Foreign Key': 'FK',
    'Ignore': 'Ign',
    'Master Eligible': 'Mstr',
    'Metadata': 'Meta',
    'Transactional': 'Txn',
    'Reference': 'Ref',
  };

  return abbrevMap[label] || (label.length > 5 ? label.substring(0, 4) : label);
}

export default function DispositionButtonGroup({
  dispositions,
  selectedId,
  onSelect,
  columnId,
}: DispositionButtonGroupProps) {
  const useAbbreviation = dispositions.length > 4;

  return (
    <div className="flex gap-1 flex-wrap">
      {dispositions.map((disp) => {
        const isSelected = selectedId === disp.id;
        const label = useAbbreviation ? abbreviateLabel(disp.label) : disp.label;

        return (
          <button
            key={disp.id}
            onClick={() => onSelect(isSelected ? null : disp.id)}
            className={`
              px-2 py-1 text-xs font-medium rounded transition-colors
              ${isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
            title={useAbbreviation ? disp.label : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
