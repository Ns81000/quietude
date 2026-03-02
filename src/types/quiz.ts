export type Difficulty = 'foundation' | 'intermediate' | 'advanced';
export type SourceType = 'pdf' | 'image' | 'audio' | 'text' | 'paste' | 'youtube';
export type TopicStatus = 'locked' | 'active' | 'passed' | 'mastered' | 'mastered_with_depth';
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank';
export type LearningPhase =
  | 'IDLE' | 'UPLOADING' | 'ANALYSING' | 'TOPIC_MAP_READY'
  | 'TOPIC_SELECTED' | 'CONFIGURING' | 'QUIZ_GENERATING' | 'QUIZ_ACTIVE'
  | 'QUIZ_SUBMITTING' | 'QUIZ_RESULT_PASS' | 'QUIZ_RESULT_FAIL'
  | 'NOTES_GENERATING' | 'NOTES_READY' | 'DIG_DEEPER_ACTIVE' | 'TOPIC_COMPLETE';

export interface TopicMapItem {
  id: number;
  title: string;
  difficulty: Difficulty;
  estimatedQuestions: number;
  summary: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  title?: string;
  subject: string;
  education_level: string;
  topic_type: string;
  source_type?: SourceType;
  source_url?: string | null;
  source_text?: string;
  source_file_name?: string;
  topic_map?: { needsStudyPlan: boolean; topics: TopicMapItem[] };
  topics?: Array<{
    id: string;
    path_id: string;
    title: string;
    difficulty: Difficulty | string;
    estimated_questions: number;
    order_index: number;
    is_locked: boolean;
    summary: string;
    source_content?: string;
  }>;
  needs_study_plan: boolean;
  status: 'active' | 'completed' | 'archived';
  current_topic_id?: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  path_id: string;
  user_id: string;
  title: string;
  summary: string;
  order_index: number;
  difficulty: Difficulty;
  status: TopicStatus;
  best_score: number;
  attempts: number;
  dig_deeper_passed: boolean;
  unlocked_at: string | null;
  passed_at: string | null;
}

export interface QuizConfig {
  count: number;
  timeLimit: number | null;
  types: QuestionType[];
  difficulty: Difficulty;
}

// Question types
export interface MCQQuestion {
  id: string;
  type: 'mcq';
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface TrueFalseQuestion {
  id: string;
  type: 'true_false';
  text: string;
  correct: 0 | 1;
  explanation: string;
}

export interface FillBlankQuestion {
  id: string;
  type: 'fill_blank';
  text: string;
  blank_answer: string;
  explanation: string;
}

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | FillBlankQuestion;

export interface Answer {
  question_id: string;
  question_type: QuestionType;
  user_answer: number | string | number[] | string[] | Record<string, string>;
  correct: boolean;
  time_taken_secs: number;
}

export interface QuizSession {
  id: string;
  user_id: string;
  topic_id: string;
  path_id: string;
  is_dig_deeper: boolean;
  is_retake: boolean;
  config: QuizConfig;
  questions: Question[];
  answers: Answer[];
  score: number | null;
  total: number;
  score_pct: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_taken_secs: number | null;
}

export interface Note {
  id: string;
  user_id: string;
  topic_id: string;
  path_id: string;
  subject: string;
  content_html: string;
  content_raw: string;
  word_count: number;
  created_at: string;
}
