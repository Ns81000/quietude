import { motion } from "framer-motion";
import { useState } from "react";
import { TopicNode, Topic } from "./TopicNode";
import { StudyPlanHeader, StudyPlan } from "./StudyPlanHeader";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useNotesStore } from "@/store/notes";
import { useFlashcardsStore } from "@/store/flashcards";
import { usePathsStore } from "@/store/paths";
import { useAuthStore } from "@/store/auth";
import { generateNotes, generateFlashcards } from "@/lib/gemini";
import { getInitialReviewParams } from "@/lib/srs";
import { syncFlashcardDeck, syncFlashcardsBatch, syncNote } from "@/lib/firebase/sync";

interface TopicRoadmapProps {
  plan: StudyPlan;
  topics: Topic[];
  onEditPlan?: () => void;
  onDeletePlan?: () => void;
}

export function TopicRoadmap({
  plan,
  topics,
  onEditPlan,
  onDeletePlan,
}: TopicRoadmapProps) {
  const navigate = useNavigate();
  const addNote = useNotesStore((s) => s.addNote);
  const { addDeck, addCards } = useFlashcardsStore();
  const { userId } = useAuthStore();
  const learningPath = usePathsStore((s) => s.paths.find(p => p.id === plan.id));
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  const handleTopicClick = (topic: Topic) => {
    if (topic.status === "locked") return;
    
    // Navigate to quiz for this topic
    navigate(`/learn/${plan.id}/${topic.id}/quiz`);
  };

  const handleFlashcardClick = async (topic: Topic) => {
    if (isGeneratingFlashcards) return;
    
    setIsGeneratingFlashcards(true);
    toast.loading("Generating flashcards...", { id: "flashcards-gen" });

    try {
      // Get the full topic data from the learning path
      const fullTopic = learningPath?.topics.find(t => t.id === topic.id);
      const topicTitle = fullTopic?.title || topic.title;
      const topicSummary = fullTopic?.summary || topic.description || "";
      const sourceContent = learningPath?.source_text || (fullTopic as any)?.source_content || "";

      let generatedCards: Array<{
        front: string;
        back: string;
        explanation: string;
        hint?: string;
        tags: string[];
        difficulty: 'easy' | 'medium' | 'hard';
      }>;

      try {
        generatedCards = await generateFlashcards({
          topicTitle,
          topicSummary,
          cardCount: 15, // Generate 15 cards per topic
          sourceContent: sourceContent.slice(0, 15000),
        });
      } catch (apiError) {
        console.error('Failed to generate flashcards:', apiError);
        toast.error('Failed to generate flashcards. Please try again.', { id: "flashcards-gen" });
        setIsGeneratingFlashcards(false);
        return;
      }

      // Create a deck for this topic
      const deckId = `deck-${Date.now()}`;
      const now = new Date().toISOString();
      
      const newDeck = {
        id: deckId,
        name: topicTitle,
        description: topicSummary || `Flashcards for ${topicTitle}`,
        topicId: topic.id,
        pathId: plan.id,
        subject: learningPath?.subject || plan.subject || 'General',
        settings: {
          cardsPerSession: 10,
          showHints: true,
          autoFlip: false,
          autoFlipDelay: 3,
          shuffleOnStart: true,
          soundEnabled: false,
        },
        stats: {
          totalCards: generatedCards.length,
          knownCards: 0,
          learningCards: 0,
          newCards: generatedCards.length,
          difficultCards: 0,
          lastPracticed: null,
          totalReviews: 0,
          averageScore: 0,
          streak: 0,
        },
        createdAt: now,
        updatedAt: now,
      };

      // Create flashcards from generated cards
      const initialReviewParams = getInitialReviewParams();
      const flashcards = generatedCards.map((card, index) => ({
        id: `card-${deckId}-${index}`,
        deckId,
        topicId: topic.id,
        pathId: plan.id,
        front: card.front,
        back: card.back,
        hint: card.hint,
        explanation: card.explanation,
        tags: card.tags,
        difficulty: card.difficulty,
        status: 'new' as const,
        easeFactor: initialReviewParams.easeFactor,
        interval: initialReviewParams.interval,
        repetitions: initialReviewParams.repetitions,
        nextReview: initialReviewParams.nextReview,
        lastReviewed: null,
        timesReviewed: 0,
        timesCorrect: 0,
        timesWrong: 0,
        averageResponseTime: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: 'ai' as const,
        relatedCards: [],
      }));

      // Save to store
      addDeck(newDeck);
      addCards(flashcards);

      // Sync to Firebase if user is logged in
      if (userId) {
        try {
          await syncFlashcardDeck(newDeck, userId);
          await syncFlashcardsBatch(flashcards, userId);
        } catch (syncError) {
          console.warn('Firebase sync failed:', syncError);
          // Continue anyway - data is saved locally
        }
      }

      toast.success(`Generated ${generatedCards.length} flashcards!`, { id: "flashcards-gen" });
      
      // Navigate to flashcards page
      setTimeout(() => {
        navigate('/flashcards');
      }, 500);
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      toast.error('Failed to generate flashcards. Please try again.', { id: "flashcards-gen" });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleNotesClick = async (topic: Topic) => {
    if (isGeneratingNotes) return;
    
    setIsGeneratingNotes(true);
    toast.loading("Generating study notes...", { id: "notes-gen" });

    try {
      // Get the full topic data from the learning path
      const fullTopic = learningPath?.topics.find(t => t.id === topic.id);
      const topicTitle = fullTopic?.title || topic.title;
      const topicSummary = fullTopic?.summary || topic.description || "";
      const sourceContent = learningPath?.source_text || (fullTopic as any)?.source_content || "";

      let notesHtml: string;

      try {
        notesHtml = await generateNotes({
          topicTitle,
          topicSummary,
          sourceContent: sourceContent.slice(0, 15000),
        });
      } catch (apiError) {
        console.error('Failed to generate notes:', apiError);
        toast.error('Failed to generate notes. Please try again.', { id: "notes-gen" });
        setIsGeneratingNotes(false);
        return;
      }

      // Save notes to store
      const newNote = {
        id: `note-${Date.now()}`,
        topic_id: topic.id,
        topic_title: topicTitle,
        subject: learningPath?.subject || plan.subject || 'General',
        content_html: notesHtml,
        created_at: new Date().toISOString(),
      };
      
      addNote(newNote);

      // Sync to Firebase if user is logged in
      if (userId) {
        try {
          await syncNote(newNote, userId);
        } catch (syncError) {
          console.warn('Firebase sync failed:', syncError);
        }
      }

      toast.success("Notes generated successfully!", { id: "notes-gen" });
      
      // Navigate to notes page
      setTimeout(() => {
        navigate('/notes');
      }, 500);
    } catch (error) {
      console.error('Failed to generate notes:', error);
      toast.error('Failed to generate notes. Please try again.', { id: "notes-gen" });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Group topics by completion status for visual separation
  const completedTopics = topics.filter(t => t.status === "completed");
  const currentTopic = topics.find(t => t.status === "in-progress" || t.status === "available");
  const upcomingTopics = topics.filter(t => t.status === "locked");

  return (
    <div className="space-y-8">
      {/* Study Plan Header */}
      <StudyPlanHeader
        plan={plan}
        onEditPlan={onEditPlan}
        onDeletePlan={onDeletePlan}
      />

      {/* Topic Roadmap */}
      <div className="space-y-6">
        {/* Completed Section */}
        {completedTopics.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-correct" />
              Completed ({completedTopics.length})
            </h2>
            <div className="space-y-2">
              {completedTopics.map((topic, index) => (
                <TopicNode
                  key={topic.id}
                  topic={topic}
                  index={topics.indexOf(topic)}
                  isLast={index === completedTopics.length - 1 && !currentTopic && upcomingTopics.length === 0}
                  onClick={() => handleTopicClick(topic)}
                  onFlashcardClick={() => handleFlashcardClick(topic)}
                  onNotesClick={() => handleNotesClick(topic)}
                  onDiscussClick={() => navigate(`/discuss?topic=${topic.id}&path=${plan.id}`)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Current / Next Up Section */}
        {currentTopic && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-sm font-medium text-accent uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {currentTopic.status === "in-progress" ? "Continue Learning" : "Next Up"}
            </h2>
            <TopicNode
              topic={currentTopic}
              index={topics.indexOf(currentTopic)}
              isLast={upcomingTopics.length === 0}
              onClick={() => handleTopicClick(currentTopic)}
              onFlashcardClick={() => handleFlashcardClick(currentTopic)}
              onNotesClick={() => handleNotesClick(currentTopic)}
              onDiscussClick={() => navigate(`/discuss?topic=${currentTopic.id}&path=${plan.id}`)}
            />
          </motion.section>
        )}

        {/* Upcoming / Locked Section */}
        {upcomingTopics.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-border" />
              Upcoming ({upcomingTopics.length})
            </h2>
            <div className="space-y-2">
              {upcomingTopics.map((topic, index) => (
                <TopicNode
                  key={topic.id}
                  topic={topic}
                  index={topics.indexOf(topic)}
                  isLast={index === upcomingTopics.length - 1}
                  onClick={() => handleTopicClick(topic)}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Empty state */}
      {topics.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-text-muted">
            No topics in this study plan yet.
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default TopicRoadmap;
