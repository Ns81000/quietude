import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { TopicRoadmap } from "@/components/learn/TopicRoadmap";
import { StudyPlan } from "@/components/learn/StudyPlanHeader";
import { Topic } from "@/components/learn/TopicNode";
import { useQuizStore } from "@/store/quiz";
import { useSessionsStore } from "@/store/sessions";
import { useNotesStore } from "@/store/notes";
import { usePathsStore, selectActivePath } from "@/store/paths";

export function Learn() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  
  // Subscribe directly to paths store for reactive learningPath
  const learningPath = usePathsStore(selectActivePath);
  const sessions = useSessionsStore((s) => s.sessions);
  const notes = useNotesStore((s) => s.notes);

  // Convert learningPath to StudyPlan format
  const plan: StudyPlan | null = useMemo(() => {
    if (!learningPath) return null;
    
    const completedTopics = learningPath.topics.filter((topic) => {
      // Filter sessions by both topic_id AND path_id to prevent cross-path matching
      const topicSessions = sessions.filter((s) => s.topic_id === topic.id && s.path_id === learningPath.id && s.passed);
      return topicSessions.length > 0;
    }).length;
    
    return {
      id: learningPath.id,
      title: learningPath.subject,
      subject: learningPath.subject,
      totalTopics: learningPath.topics.length,
      completedTopics,
      // Estimate ~3 minutes per question, convert to hours
      estimatedHours: Math.max(1, Math.round(learningPath.topics.reduce((sum, t) => sum + (t.estimated_questions || 5), 0) * 3 / 60)) || 1,
      lastStudied: sessions[0]?.submitted_at ? new Date(sessions[0].submitted_at) : undefined,
      createdAt: new Date(learningPath.created_at),
    };
  }, [learningPath, sessions]);

  // Convert topics to Topic[] format for TopicRoadmap
  const topics: Topic[] = useMemo(() => {
    if (!learningPath) return [];
    
    return learningPath.topics.map((topic, index) => {
      // Check if topic has been passed - filter by both topic_id AND path_id
      const topicSessions = sessions.filter((s) => s.topic_id === topic.id && s.path_id === learningPath.id);
      const passedSession = topicSessions.find((s) => s.passed);
      const hasNotes = notes.some((n) => n.topic_id === topic.id);
      
      // Determine status based on progress
      let status: Topic['status'] = 'locked';
      
      if (passedSession) {
        // Topic completed
        status = 'completed';
      } else if (index === 0) {
        // First topic is always available or in-progress
        status = topicSessions.length > 0 ? 'in-progress' : 'available';
      } else {
        // Check if previous topic is completed - include path_id filter
        const prevTopic = learningPath.topics[index - 1];
        const prevPassed = sessions.some((s) => s.topic_id === prevTopic.id && s.path_id === learningPath.id && s.passed);
        
        if (prevPassed) {
          // Previous topic passed - this one is available
          status = topicSessions.length > 0 ? 'in-progress' : 'available';
        }
        // Otherwise stays locked
      }
      
      return {
        id: topic.id.toString(),
        title: topic.title,
        description: topic.summary || `Learn about ${topic.title}`,
        status,
        quizScore: passedSession?.score_pct,
        notesGenerated: hasNotes,
        estimatedMinutes: (topic.estimated_questions || 5) * 3,
      };
    });
  }, [learningPath, sessions, notes]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleEditPlan = () => {
    // TODO: Open edit modal
    console.log("Edit plan");
  };

  const handleDeletePlan = () => {
    // TODO: Show confirmation dialog
    console.log("Delete plan");
  };

  if (!plan || !learningPath) {
    return (
      <Shell>
        <div className="max-w-content mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h2 className="font-display text-2xl text-text mb-4">
              No Study Plan Yet
            </h2>
            <p className="text-text-soft mb-6">
              Upload some content on the Dashboard to create a study plan.
            </p>
            <Button onClick={handleBack}>
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-content mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Topic Roadmap */}
        <TopicRoadmap
          plan={plan}
          topics={topics}
          onEditPlan={handleEditPlan}
          onDeletePlan={handleDeletePlan}
        />
      </div>
    </Shell>
  );
}

export default Learn;
