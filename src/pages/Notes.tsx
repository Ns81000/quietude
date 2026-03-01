import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { NoteCard } from "@/components/notes/NoteCard";
import { NotesViewer } from "@/components/notes/NotesViewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowLeft, FileText, Trash2, Download } from "lucide-react";
import { useNotesStore, Note } from "@/store/notes";
import { exportNoteToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function NotesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use real notes from store
  const notes = useNotesStore((s) => s.notes);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  
  const selectedNoteId = searchParams.get("note");
  const selectedNote = notes.find(n => n.id === selectedNoteId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  
  // Get unique subjects
  const subjects = useMemo(() => {
    const unique = [...new Set(notes.map(n => n.subject))];
    return unique.sort();
  }, [notes]);
  
  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = searchQuery === "" || 
        note.topic_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSubject = subjectFilter === "all" || note.subject === subjectFilter;
      
      return matchesSearch && matchesSubject;
    });
  }, [notes, searchQuery, subjectFilter]);

  const handleNoteClick = (noteId: string) => {
    setSearchParams({ note: noteId });
  };

  const handleBackToList = () => {
    setSearchParams({});
  };
  
  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    if (selectedNoteId === noteId) {
      setSearchParams({});
    }
  };

  // Note detail view
  if (selectedNote) {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-prose mx-auto"
        >
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Button>
          
          {/* Note header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                {selectedNote.subject}
              </span>
              <span className="text-xs text-text-muted">
                {new Date(selectedNote.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="font-display text-3xl text-text">{selectedNote.topic_title}</h1>
          </div>
          
          {/* Note content */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <NotesViewer contentHtml={selectedNote.content_html} />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/learn?topic=${selectedNote.topic_id}`)}
            >
              Take Quiz Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportNoteToPDF(selectedNote);
                toast.success("PDF export started", {
                  description: "Your browser's print dialog will open to save as PDF."
                });
              }}
              title="Export to PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The note will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteNote(selectedNote.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </Shell>
    );
  }

  // Notes list view
  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-content mx-auto"
      >
        <h1 className="font-display text-3xl text-text tracking-tight mb-2">Notes</h1>
        <p className="text-text-soft text-base mb-8">All your generated study notes.</p>
        
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Notes grid */}
        {filteredNotes.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NoteCard
                    id={note.id}
                    topicTitle={note.topic_title}
                    subject={note.subject}
                    wordCount={note.content_html?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length || 0}
                    createdAt={note.created_at}
                    onClick={handleNoteClick}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-xl p-12 text-center"
          >
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
            {searchQuery || subjectFilter !== "all" ? (
              <>
                <h3 className="font-medium text-text mb-2">No notes found</h3>
                <p className="text-text-soft text-sm mb-4">
                  Try adjusting your search or filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSubjectFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-medium text-text mb-2">No notes yet</h3>
                <p className="text-text-soft text-sm mb-4">
                  Notes are generated when you don't pass a quiz. They help you learn the material you missed.
                </p>
                <Button onClick={() => navigate("/dashboard")}>
                  Start Learning
                </Button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </Shell>
  );
}
