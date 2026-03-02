import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  topic_id: string;
  topic_title: string;
  subject: string;
  content_html: string;
  created_at: string;
  session_id?: string; // Optional link to the quiz session that generated it
}

interface NotesStore {
  notes: Note[];
  selectedNote: Note | null;
  isGenerating: boolean;
  error: string | null;

  // Actions
  addNote: (note: Note) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  
  // Generation state
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  
  // Getters
  getNotesBySubject: () => Record<string, Note[]>;
  getRecentNotes: (limit?: number) => Note[];
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      selectedNote: null,
      isGenerating: false,
      error: null,

      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes],
        })),

      updateNote: (id, content) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, content_html: content } : n
          ),
          selectedNote:
            state.selectedNote?.id === id
              ? { ...state.selectedNote, content_html: content }
              : state.selectedNote,
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        })),

      selectNote: (id) =>
        set((state) => ({
          selectedNote: id ? state.notes.find((n) => n.id === id) || null : null,
        })),

      setGenerating: (isGenerating) => set({ isGenerating }),
      
      setError: (error) => set({ error }),

      clearAll: () => set({ notes: [], selectedNote: null, isGenerating: false, error: null }),

      getNotesBySubject: () => {
        const { notes } = get();
        return notes.reduce<Record<string, Note[]>>((acc, note) => {
          const subject = note.subject || 'General';
          if (!acc[subject]) {
            acc[subject] = [];
          }
          acc[subject].push(note);
          return acc;
        }, {});
      },

      getRecentNotes: (limit = 5) => {
        const { notes } = get();
        return notes.slice(0, limit);
      },
    }),
    {
      name: 'quietude:notes',
    }
  )
);

// Selectors
export const selectNoteCount = (state: NotesStore) => state.notes.length;

export const selectNotesByTopic = (topicId: string) => (state: NotesStore) =>
  state.notes.filter((n) => n.topic_id === topicId);
