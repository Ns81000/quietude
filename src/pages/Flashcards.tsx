import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Layers, Plus } from 'lucide-react';
import { useFlashcardsStore } from '@/store/flashcards';
import { usePathsStore } from '@/store/paths';
import { DeckList } from '@/components/flashcards/DeckList';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Flashcards() {
  const navigate = useNavigate();
  const { decks } = useFlashcardsStore();
  const { paths } = usePathsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Get unique subjects from decks
  const subjects = useMemo(() => {
    const unique = [...new Set(decks.map(d => d.subject))];
    return unique.sort();
  }, [decks]);

  // Filter decks based on search and subject
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesSearch = searchQuery === '' ||
        deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = subjectFilter === 'all' || deck.subject === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [decks, searchQuery, subjectFilter]);

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-content mx-auto"
      >
        <h1 className="font-display text-3xl text-text tracking-tight mb-2">Flashcards</h1>
        <p className="text-text-soft text-base mb-8">
          Master your subjects with spaced repetition.
        </p>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search flashcard decks..."
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

        {/* Decks grid */}
        {filteredDecks.length > 0 ? (
          <DeckList decks={filteredDecks} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-xl p-12 text-center"
          >
            <Layers className="w-12 h-12 text-text-muted mx-auto mb-4" />
            {searchQuery || subjectFilter !== 'all' ? (
              <>
                <h3 className="font-medium text-text mb-2">No decks found</h3>
                <p className="text-text-soft text-sm mb-4">
                  Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSubjectFilter('all');
                  }}
                  className="px-6 py-2.5 rounded-lg bg-surface border border-border text-text text-sm font-medium
                             hover:border-text-muted transition-colors"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="font-medium text-text mb-2">No flashcard decks yet</h3>
                <p className="text-text-soft text-sm mb-4">
                  Create flashcards from your learning topics to practice with spaced repetition.
                </p>
                <button
                  onClick={() => navigate('/learn')}
                  className="px-6 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium
                             hover:opacity-90 transition-opacity duration-150"
                >
                  Browse Topics
                </button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </Shell>
  );
}
