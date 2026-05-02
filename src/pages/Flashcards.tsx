import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Layers, Plus, Trophy, Zap, Brain } from 'lucide-react';
import { useFlashcardsStore } from '@/store/flashcards';
import { usePathsStore } from '@/store/paths';
import { DeckList } from '@/components/flashcards/DeckList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Flashcards() {
  const navigate = useNavigate();
  const { decks, cards } = useFlashcardsStore();
  const { paths } = usePathsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Stats for the header
  const totalCards = cards.length;
  const knownCards = cards.filter(c => c.status === 'known').length;
  const cardsDue = useMemo(() => {
    const now = new Date();
    return cards.filter(c => new Date(c.nextReview) <= now).length;
  }, [cards]);

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
        <PageHeader 
          title="Flashcards"
          description="Master your subjects with spaced repetition and AI-powered memory aids."
          icon={Layers}
          stats={[
            { label: 'Total Cards', value: totalCards, icon: Brain },
            { label: 'Mastered', value: knownCards, icon: Trophy, color: 'text-correct' },
            { label: 'Needs Review', value: cardsDue, icon: Zap, color: 'text-accent' },
          ]}
        />

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
            className="relative bg-surface border border-border rounded-2xl p-12 text-center overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-6 right-8 text-accent/10">
              <Layers size={24} />
            </div>
            <div className="absolute bottom-8 left-10 w-14 h-14 rounded-full bg-accent/5" />
            <div className="absolute top-1/3 right-6 w-8 h-8 rounded-full bg-correct/5" />
            
            {searchQuery || subjectFilter !== 'all' ? (
              <>
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-5">
                  <Layers className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-lg text-text mb-2">No decks found</h3>
                <p className="text-text-soft text-sm mb-5 max-w-xs mx-auto">
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
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-5">
                  <Layers className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-lg text-text mb-2">No flashcard decks yet</h3>
                <p className="text-text-soft text-sm mb-5 max-w-xs mx-auto leading-relaxed">
                  Create flashcards from your learning topics to practice with spaced repetition.
                </p>
                <button
                  onClick={() => navigate('/learn')}
                  className="px-6 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium
                             hover:opacity-90 transition-opacity duration-150 shadow-sm"
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
