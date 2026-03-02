import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuizStore } from '@/store/quiz';
import type { QuestionType, Difficulty } from '@/types/quiz';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';

interface ConfigScreenProps {
  topicTitle: string;
  topicSummary?: string;
  onBegin: () => void;
  onBack?: () => void;
  className?: string;
}

const TIME_LIMITS = [
  { value: null, label: 'No limit' },
  { value: 30, label: '30 sec' },
  { value: 60, label: '60 sec' },
  { value: 120, label: '2 min' },
];

const QUESTION_TYPES: { value: QuestionType | 'mixed'; label: string }[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in Blank' },
];

const DIFFICULTY_LEVELS: { value: Difficulty; label: string; description: string }[] = [
  { value: 'foundation', label: 'Foundation', description: 'Straightforward, factual' },
  { value: 'intermediate', label: 'Intermediate', description: 'Understanding & application' },
  { value: 'advanced', label: 'Advanced', description: 'Analysis & synthesis' },
];

export function ConfigScreen({
  topicTitle,
  topicSummary,
  onBegin,
  onBack,
  className,
}: ConfigScreenProps) {
  const { config, setConfig } = useQuizStore();
  const [questionCount, setQuestionCount] = useState(config.count);
  const [timeLimit, setTimeLimit] = useState<number | null>(config.timeLimit);
  const [questionTypes, setQuestionTypes] = useState<QuestionType | 'mixed'>(
    config.types.length >= 3 ? 'mixed' : config.types[0]
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(config.difficulty);

  const handleBegin = () => {
    const types: QuestionType[] =
      questionTypes === 'mixed'
        ? ['mcq', 'true_false', 'fill_blank']
        : [questionTypes];
    
    // Update config in store
    setConfig({
      count: questionCount,
      timeLimit,
      types,
      difficulty,
    });
    
    // Proceed to quiz - Quiz.tsx will read latest config from store
    onBegin();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn('max-w-lg mx-auto', className)}
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Topics</span>
        </button>
      )}

      {/* Topic header */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-2xl text-text tracking-tight mb-2">
          {topicTitle}
        </h1>
        {topicSummary && (
          <p className="text-sm text-text-soft">{topicSummary}</p>
        )}
      </div>

      {/* Configuration options */}
      <div className="space-y-8">
        {/* Question count */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-text font-medium">
              Question count
            </label>
            <span className="text-lg font-display text-accent tabular-nums">
              {questionCount}
            </span>
          </div>
          <Slider
            value={[questionCount]}
            onValueChange={([value]) => setQuestionCount(value)}
            min={5}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>5</span>
            <span>20</span>
          </div>
        </div>

        {/* Time limit */}
        <div>
          <label className="text-sm text-text font-medium mb-3 block">
            Time limit per question
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_LIMITS.map((option) => (
              <button
                key={option.label}
                onClick={() => setTimeLimit(option.value)}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-sm transition-all duration-150',
                  timeLimit === option.value
                    ? 'border-accent bg-accent-soft text-text font-medium'
                    : 'border-border bg-surface text-text-soft hover:border-text-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question types */}
        <div>
          <label className="text-sm text-text font-medium mb-3 block">
            Question types
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setQuestionTypes(type.value)}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 text-center',
                  questionTypes === type.value
                    ? 'border-accent bg-accent-soft text-text font-medium'
                    : 'border-border bg-surface text-text-soft hover:border-text-muted'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty level */}
        <div>
          <label className="text-sm text-text font-medium mb-3 block">
            Difficulty level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setDifficulty(level.value)}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 text-center',
                  difficulty === level.value
                    ? 'border-accent bg-accent-soft text-text font-medium'
                    : 'border-border bg-surface text-text-soft hover:border-text-muted'
                )}
              >
                <span className="block">{level.label}</span>
                <span className="block text-xs text-text-muted mt-0.5">{level.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Begin button */}
      <button
        onClick={handleBegin}
        className="w-full mt-10 px-6 py-3 rounded-xl bg-accent text-accent-text
                   text-base font-medium hover:opacity-90 transition-opacity duration-150"
      >
        Begin
      </button>
    </motion.div>
  );
}
