/**
 * Gemini Response Parsers
 * 
 * Utilities for parsing and validating responses from Gemini API.
 * Handles JSON extraction, fence stripping, and type validation.
 */

import { Question, QuestionType } from "@/types/quiz";

/**
 * Strip markdown code fences from response
 */
export function stripCodeFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ```
  let cleaned = text.trim();
  
  // Check for code fence at start
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
  }
  
  // Check for code fence at end
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return cleaned.trim();
}

/**
 * Safely parse JSON from Gemini response
 */
export function parseJSON<T>(text: string): T {
  const cleaned = stripCodeFences(text);
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    // Try to extract JSON object/array from the text
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as T;
      } catch {
        throw new Error(`Failed to parse JSON response: ${cleaned.slice(0, 200)}`);
      }
    }
    throw new Error(`Invalid JSON response: ${cleaned.slice(0, 200)}`);
  }
}

/**
 * Analysis response structure
 */
export interface AnalysisResponse {
  needsStudyPlan: boolean;
  subject: string;
  educationLevel: string;
  topicType: string;
  topics: Array<{
    id: number;
    title: string;
    difficulty: "foundation" | "intermediate" | "advanced";
    estimatedQuestions: number;
    summary: string;
  }>;
}

/**
 * Parse and validate analysis response
 */
export function parseAnalysisResponse(text: string): AnalysisResponse {
  const data = parseJSON<AnalysisResponse>(text);
  
  // Validate required fields
  if (typeof data.needsStudyPlan !== "boolean") {
    throw new Error("Invalid analysis response: missing needsStudyPlan");
  }
  
  if (!data.subject || typeof data.subject !== "string") {
    throw new Error("Invalid analysis response: missing subject");
  }
  
  if (data.needsStudyPlan && (!Array.isArray(data.topics) || data.topics.length < 2)) {
    throw new Error("Invalid analysis response: study plan requires at least 2 topics");
  }
  
  // Validate topics
  if (data.topics) {
    data.topics.forEach((topic, index) => {
      if (!topic.title) {
        throw new Error(`Invalid topic at index ${index}: missing title`);
      }
      if (!["foundation", "intermediate", "advanced"].includes(topic.difficulty)) {
        topic.difficulty = "intermediate"; // Default fallback
      }
      if (!topic.estimatedQuestions || topic.estimatedQuestions < 5) {
        topic.estimatedQuestions = 10; // Default
      }
    });
  }
  
  return data;
}

/**
 * Quiz response structure
 */
export interface QuizResponse {
  questions: Question[];
}

/**
 * Parse and validate quiz response
 */
export function parseQuizResponse(text: string): QuizResponse {
  const data = parseJSON<{ questions: Record<string, unknown>[] }>(text);
  
  if (!Array.isArray(data.questions)) {
    throw new Error("Invalid quiz response: missing questions array");
  }
  
  const validTypes: QuestionType[] = ["mcq", "true_false", "fill_blank"];
  
  const questions: Question[] = data.questions.map((q, index) => {
    const id = (q.id as string) || `q${index + 1}`;
    const type = q.type as QuestionType;
    
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid question type at index ${index}: ${type}`);
    }
    
    const text = (q.text as string) || "";
    const explanation = (q.explanation as string) || "";
    
    switch (type) {
      case "mcq":
        return {
          id,
          type,
          text,
          options: (q.options as string[]) || [],
          correct: (q.correct as number) || 0,
          explanation,
        };
        
      case "true_false":
        return {
          id,
          type,
          text,
          correct: ((q.correct as number) || 0) as 0 | 1,
          explanation,
        };
        
      case "fill_blank":
        return {
          id,
          type,
          text,
          blank_answer: (q.blank_answer as string) || "",
          explanation,
        };
    }
  });
  
  return { questions };
}

/**
 * Notes response (HTML string)
 */
export function parseNotesResponse(text: string): string {
  let html = text.trim();
  
  // Strip code fences if present
  html = stripCodeFences(html);
  
  // Ensure it starts with valid HTML
  if (!html.startsWith("<")) {
    // Try to find HTML content
    const htmlMatch = html.match(/<h1[\s\S]*$/i);
    if (htmlMatch) {
      html = htmlMatch[0];
    } else {
      throw new Error("Invalid notes response: not valid HTML");
    }
  }
  
  return html;
}

/**
 * Fill-in-blank evaluation response
 */
export interface EvalResponse {
  correct: boolean;
  reason: string;
}

/**
 * Parse evaluation response
 */
export function parseEvalResponse(text: string): EvalResponse {
  const data = parseJSON<EvalResponse>(text);
  
  return {
    correct: Boolean(data.correct),
    reason: data.reason || "",
  };
}

/**
 * Classification response
 */
export interface ClassificationResponse {
  subject: string;
  subfield: string;
}

/**
 * Parse classification response
 */
export function parseClassificationResponse(text: string): ClassificationResponse {
  const data = parseJSON<ClassificationResponse>(text);
  
  return {
    subject: data.subject || "General",
    subfield: data.subfield || "",
  };
}

/**
 * Quick analysis response
 */
export interface QuickAnalysisResponse {
  title: string;
  subject: string;
  summary: string;
  difficulty: "foundation" | "intermediate" | "advanced";
  estimatedQuestions: number;
}

/**
 * Parse quick analysis response
 */
export function parseQuickAnalysisResponse(text: string): QuickAnalysisResponse {
  const data = parseJSON<QuickAnalysisResponse>(text);
  
  return {
    title: data.title || "Untitled Topic",
    subject: data.subject || "General",
    summary: data.summary || "",
    difficulty: data.difficulty || "intermediate",
    estimatedQuestions: data.estimatedQuestions || 10,
  };
}
