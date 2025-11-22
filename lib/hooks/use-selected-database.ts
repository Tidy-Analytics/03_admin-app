import { useState, useEffect } from 'react';
import type { DatabaseName } from '@/lib/db/connection';

const STORAGE_KEY = 'admin-selected-database';
const DEFAULT_DB: DatabaseName = 'names';

export function useSelectedDatabase() {
  const [selectedDb, setSelectedDb] = useState<DatabaseName>(DEFAULT_DB);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DatabaseName | null;
    if (stored && (stored === 'names' || stored === 'tidyanalytics-prospecting')) {
      setSelectedDb(stored);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when changed
  const setDatabase = (db: DatabaseName) => {
    setSelectedDb(db);
    localStorage.setItem(STORAGE_KEY, db);
  };

  return { selectedDb, setDatabase, isLoaded };
}
