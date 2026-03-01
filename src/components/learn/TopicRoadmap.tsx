import { motion } from "framer-motion";
import { TopicNode, Topic } from "./TopicNode";
import { StudyPlanHeader, StudyPlan } from "./StudyPlanHeader";
import { useNavigate } from "react-router-dom";

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

  const handleTopicClick = (topic: Topic) => {
    if (topic.status === "locked") return;
    
    // Navigate to quiz for this topic
    navigate(`/learn/${plan.id}/${topic.id}/quiz`);
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
