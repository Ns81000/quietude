/**
 * Data Export/Import utilities for Quietude
 * Allows users to backup and restore their learning data
 */

import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore, type Note } from '@/store/notes';
import { useUserStore } from '@/store/user';
import type { LearningPath, QuizSession } from '@/types/quiz';

export interface ExportData {
  version: string;
  exportedAt: string;
  user: {
    email: string;
    name?: string | null;
    studyField?: string | null;
    learnStyle?: string | null;
    studyTime?: string | null;
  };
  paths: LearningPath[];
  sessions: QuizSession[];
  notes: Note[];
}

const EXPORT_VERSION = '1.0.0';

/**
 * Export all user data to a JSON object
 */
export function exportAllData(): ExportData {
  const userStore = useUserStore.getState();
  const pathsStore = usePathsStore.getState();
  const sessionsStore = useSessionsStore.getState();
  const notesStore = useNotesStore.getState();

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    user: {
      email: userStore.email || '',
      name: userStore.name,
      studyField: userStore.studyField,
      learnStyle: userStore.learnStyle,
      studyTime: userStore.studyTime,
    },
    paths: pathsStore.paths,
    sessions: sessionsStore.sessions,
    notes: notesStore.notes,
  };
}

/**
 * Download the export data as a JSON file
 */
export function downloadExport(): void {
  const data = exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `quietude-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const d = data as Record<string, unknown>;

  if (!d.version || typeof d.version !== 'string') {
    return { valid: false, error: 'Missing or invalid version' };
  }

  if (!Array.isArray(d.paths)) {
    return { valid: false, error: 'Missing or invalid paths array' };
  }

  if (!Array.isArray(d.sessions)) {
    return { valid: false, error: 'Missing or invalid sessions array' };
  }

  if (!Array.isArray(d.notes)) {
    return { valid: false, error: 'Missing or invalid notes array' };
  }

  return { valid: true };
}

/**
 * Import data from a JSON file
 * @param data The parsed JSON data to import
 * @param mergeMode If true, merges with existing data. If false, replaces all data.
 */
export function importData(data: ExportData, mergeMode: boolean = true): { success: boolean; error?: string; stats?: ImportStats } {
  const validation = validateImportData(data);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const pathsStore = usePathsStore.getState();
    const sessionsStore = useSessionsStore.getState();
    const notesStore = useNotesStore.getState();

    const stats: ImportStats = {
      pathsImported: 0,
      sessionsImported: 0,
      notesImported: 0,
    };

    if (mergeMode) {
      // Merge mode: Add new items, skip duplicates
      const existingPathIds = new Set(pathsStore.paths.map(p => p.id));
      const newPaths = data.paths.filter(p => !existingPathIds.has(p.id));
      newPaths.forEach(path => pathsStore.addPath(path));
      stats.pathsImported = newPaths.length;

      // Use the store's import method which handles deduplication
      const beforeSessions = sessionsStore.sessions.length;
      sessionsStore.importSessions(data.sessions);
      stats.sessionsImported = sessionsStore.sessions.length - beforeSessions;

      // Import notes (manual deduplication)
      const existingNoteIds = new Set(notesStore.notes.map(n => n.id));
      const newNotes = data.notes.filter(n => !existingNoteIds.has(n.id));
      newNotes.forEach(note => notesStore.addNote(note));
      stats.notesImported = newNotes.length;
    } else {
      // Replace mode: Clear and import all
      // Clear existing data
      pathsStore.paths.forEach(p => pathsStore.deletePath(p.id));
      sessionsStore.clearAllSessions();
      
      // Import all
      data.paths.forEach(path => pathsStore.addPath(path));
      stats.pathsImported = data.paths.length;

      sessionsStore.importSessions(data.sessions);
      stats.sessionsImported = data.sessions.length;

      data.notes.forEach(note => notesStore.addNote(note));
      stats.notesImported = data.notes.length;
    }

    return { success: true, stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Import failed' 
    };
  }
}

export interface ImportStats {
  pathsImported: number;
  sessionsImported: number;
  notesImported: number;
}

/**
 * Read and parse a JSON file from a File input
 */
export function readImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
