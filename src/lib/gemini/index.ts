/**
 * Gemini API Service
 * 
 * High-level functions for interacting with Gemini API.
 * These wrap the client, prompts, and parsers together.
 * 
 * OPTIMIZATION: Uses localStorage caching to minimize API calls.
 */

import { safeGeminiCall, hasApiKeys, fileToGenerativePart, isMultimodalSupported } from "./client";
import {
  buildAnalysisPrompt,
  buildQuizPrompt,
  buildNotesPrompt,
  buildEvalPrompt,
  buildQuickAnalysisPrompt,
} from "./prompts";
import {
  parseAnalysisResponse,
  parseQuizResponse,
  parseNotesResponse,
  parseEvalResponse,
  parseQuickAnalysisResponse,
  AnalysisResponse,
  QuizResponse,
  EvalResponse,
  QuickAnalysisResponse,
} from "./parsers";
import { QuestionType, Difficulty, Question } from "@/types/quiz";

// ============= CACHING LAYER =============
const CACHE_PREFIX = "quietude_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full or unavailable - ignore
  }
}
// =========================================

/**
 * Analyze uploaded content to determine if it needs a study plan
 * CACHED: Same content won't trigger another API call for 24h
 */
export async function analyzeContent(content: string): Promise<AnalysisResponse> {
  // Check cache first
  const cacheKey = `analysis_${hashString(content)}`;
  const cached = getCached<AnalysisResponse>(cacheKey);
  if (cached) {
    console.log("[Gemini] Using cached analysis");
    return cached;
  }

  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  const prompt = buildAnalysisPrompt();

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent([
      { text: prompt },
      { text: `\n\nContent to analyze:\n${content.slice(0, 30000)}` },
    ]);

    const response = result.response.text();
    const parsed = parseAnalysisResponse(response);
    setCache(cacheKey, parsed); // Cache the result
    return parsed;
  });
}

/**
 * Process a file (image, PDF, audio) using Gemini multimodal capabilities
 * Returns extracted text content from the file
 */
export async function processFile(file: File): Promise<string> {
  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  // For text files, just read directly
  if (file.type === "text/plain" || file.type === "text/markdown") {
    return await file.text();
  }

  // Check if file type is supported
  if (!isMultimodalSupported(file.type)) {
    throw new Error(`UNSUPPORTED_FILE: File type ${file.type} is not supported`);
  }

  const filePart = await fileToGenerativePart(file);

  // Build appropriate prompt based on file type
  let extractionPrompt: string;
  
  if (file.type.startsWith("image/")) {
    extractionPrompt = `Analyze this image and extract ALL text content visible in it. 
If it's a photo of notes, a textbook, slides, or any educational material:
1. Extract ALL the text exactly as shown
2. Preserve the structure (headings, bullet points, numbered lists)
3. Include any formulas, equations, or special notation
4. Note any diagrams or figures with descriptions

If it's a diagram, chart, or visual:
1. Describe what the image shows in detail
2. Extract any labels, legends, or text
3. Explain the relationships or data shown

Output the extracted content in a clear, organized format that can be used for studying.`;
  } else if (file.type === "application/pdf") {
    extractionPrompt = `Analyze this PDF document and extract ALL the text content.
1. Preserve the document structure (headings, sections, paragraphs)
2. Include bullet points, numbered lists, tables
3. Preserve any formulas, equations, or special notation
4. Note any figures or diagrams with brief descriptions
5. Maintain the logical flow of the content

Output the complete extracted content in a clear, organized format suitable for studying.`;
  } else if (file.type.startsWith("audio/")) {
    extractionPrompt = `Transcribe this audio file completely and accurately.
1. Capture all spoken content
2. Include speaker changes if multiple speakers
3. Note any important emphasis or tone
4. Organize into logical paragraphs
5. If it's a lecture or educational content, structure it with key topics

Output the complete transcription in a clear, organized format suitable for studying.`;
  } else {
    extractionPrompt = `Extract and describe all the content from this file in detail. 
Format the output in a clear, organized way suitable for educational purposes.`;
  }

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent([
      { text: extractionPrompt },
      filePart,
    ]);

    const response = result.response.text();
    
    if (!response || response.trim().length < 10) {
      throw new Error("EXTRACTION_FAILED: Could not extract meaningful content from the file");
    }
    
    return response;
  });
}

/**
 * Generate a cache key for a file based on name, size, and last modified
 */
async function getFileCacheKey(file: File): Promise<string> {
  // Use file metadata for cache key (avoids reading entire file)
  const fileId = `${file.name}_${file.size}_${file.lastModified}`;
  return `file_${hashString(fileId)}`;
}

/**
 * Analyze a file directly (combines processFile + analyzeContent)
 * For images, PDFs, and audio files
 * CACHED: Same file won't trigger another API call for 24h
 */
export async function analyzeFile(file: File): Promise<AnalysisResponse> {
  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  // For text files, use the regular flow (already cached)
  if (file.type === "text/plain" || file.type === "text/markdown") {
    const text = await file.text();
    return analyzeContent(text);
  }

  // Check cache first using file metadata
  const cacheKey = await getFileCacheKey(file);
  const cached = getCached<AnalysisResponse & { extractedContent?: string }>(cacheKey);
  if (cached) {
    console.log("[Gemini] Using cached file analysis for:", file.name);
    return cached;
  }

  // Check if file type is supported
  if (!isMultimodalSupported(file.type)) {
    throw new Error(`UNSUPPORTED_FILE: File type ${file.type} is not supported`);
  }

  const filePart = await fileToGenerativePart(file);

  // Optimized combined prompt: more concise for faster processing
  const fileTypeLabel = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "PDF" : "audio";
  const combinedPrompt = `Analyze this ${fileTypeLabel} for study purposes. Extract key content and classify it.

Respond with JSON only:
{
  "extractedContent": "extracted text summary (key points only, max 2000 chars)",
  "needsStudyPlan": boolean,
  "subject": "subject area",
  "educationLevel": "High School|Undergraduate|Graduate",
  "topicType": "conceptual|factual|procedural|mixed",
  "topics": [{"id":1,"title":"string","difficulty":"foundation|intermediate|advanced","estimatedQuestions":5-15,"summary":"one sentence"}]
}

Rules:
- needsStudyPlan=true if multiple distinct topics (2-5 topics)
- needsStudyPlan=false for single topic content (1 topic)
- Topic titles must be specific
- JSON only, no markdown`;

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent([
      { text: combinedPrompt },
      filePart,
    ]);

    const response = result.response.text();
    
    // Parse the combined response
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Store extracted content for later use
      const analysisResult: AnalysisResponse & { extractedContent?: string } = {
        needsStudyPlan: parsed.needsStudyPlan ?? false,
        subject: parsed.subject || "General Studies",
        educationLevel: parsed.educationLevel || "Undergraduate",
        topicType: parsed.topicType || "mixed",
        topics: parsed.topics || [{
          id: 1,
          title: parsed.subject || "Main Topic",
          difficulty: "intermediate",
          estimatedQuestions: 10,
          summary: "Content extracted from uploaded file",
        }],
        extractedContent: parsed.extractedContent,
      };
      
      // Cache the result
      setCache(cacheKey, analysisResult);
      
      return analysisResult;
    } catch (parseError) {
      console.error("[Gemini] Failed to parse file analysis:", parseError);
      // Fallback: extract content and create default analysis
      return {
        needsStudyPlan: false,
        subject: "Uploaded Content",
        educationLevel: "Undergraduate",
        topicType: "mixed",
        topics: [{
          id: 1,
          title: file.name.replace(/\.[^/.]+$/, ""),
          difficulty: "intermediate",
          estimatedQuestions: 10,
          summary: "Content from uploaded file",
        }],
      };
    }
  });
}

/**
 * Quick analysis for short content
 * CACHED: Same content won't trigger another API call for 24h
 */
export async function quickAnalyze(content: string): Promise<QuickAnalysisResponse> {
  // Check cache first
  const cacheKey = `quick_${hashString(content)}`;
  const cached = getCached<QuickAnalysisResponse>(cacheKey);
  if (cached) {
    console.log("[Gemini] Using cached quick analysis");
    return cached;
  }

  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  const prompt = buildQuickAnalysisPrompt(content);

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const parsed = parseQuickAnalysisResponse(response);
    setCache(cacheKey, parsed); // Cache the result
    return parsed;
  });
}

/**
 * Generate quiz questions for a topic
 * NOT CACHED: Users expect fresh questions each time
 */
export async function generateQuiz(params: {
  topicTitle: string;
  topicSummary: string;
  questionCount: number;
  types: QuestionType[];
  difficulty: Difficulty;
  isDigDeeper?: boolean;
  isRetake?: boolean;
  sourceContent?: string;
}): Promise<Question[]> {
  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  const prompt = buildQuizPrompt({
    ...params,
    isDigDeeper: params.isDigDeeper || false,
    isRetake: params.isRetake || false,
  });

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const { questions } = parseQuizResponse(response);
    return questions;
  });
}

/**
 * Generate study notes for a topic
 * CACHED: Same topic won't trigger another API call for 24h
 */
export async function generateNotes(params: {
  topicTitle: string;
  topicSummary: string;
  sourceContent?: string;
}): Promise<string> {
  // Check cache first - notes for same topic shouldn't change
  const cacheKey = `notes_${hashString(params.topicTitle + params.topicSummary)}`;
  const cached = getCached<string>(cacheKey);
  if (cached) {
    console.log("[Gemini] Using cached notes");
    return cached;
  }

  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  const prompt = buildNotesPrompt(
    params.topicTitle,
    params.topicSummary,
    params.sourceContent
  );

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const notes = parseNotesResponse(response);
    setCache(cacheKey, notes); // Cache the result
    return notes;
  });
}

/**
 * Evaluate a fill-in-the-blank answer
 * Uses a shorter timeout since this should be fast
 */
export async function evaluateAnswer(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<EvalResponse> {
  if (!hasApiKeys()) {
    throw new Error("NO_API_KEYS: Gemini API keys not configured");
  }

  const prompt = buildEvalPrompt(
    params.question,
    params.correctAnswer,
    params.userAnswer
  );

  // Use shorter timeout (15s) and fewer retries (1) for evaluation
  // This is a simple task that should be fast
  return safeGeminiCall(async (model) => {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return parseEvalResponse(response);
  }, 1, 15000);
}

/**
 * Mock functions for demo mode (when no API keys are configured)
 */
export function getMockAnalysis(content: string): AnalysisResponse {
  const lines = content.split("\n").filter(line => line.trim());
  const hasMultipleTopics = lines.length > 20 || content.length > 2000;

  if (hasMultipleTopics) {
    return {
      needsStudyPlan: true,
      subject: "General Studies",
      educationLevel: "Undergraduate",
      topicType: "mixed",
      topics: [
        {
          id: 1,
          title: "Introduction and Overview",
          difficulty: "foundation",
          estimatedQuestions: 8,
          summary: "Basic concepts and foundational knowledge",
        },
        {
          id: 2,
          title: "Core Concepts",
          difficulty: "intermediate",
          estimatedQuestions: 10,
          summary: "Main ideas and principles",
        },
        {
          id: 3,
          title: "Advanced Applications",
          difficulty: "advanced",
          estimatedQuestions: 12,
          summary: "Practical applications and complex scenarios",
        },
      ],
    };
  }

  return {
    needsStudyPlan: false,
    subject: "General Studies",
    educationLevel: "Undergraduate",
    topicType: "conceptual",
    topics: [],
  };
}

export function getMockQuestions(count: number, types: QuestionType[]): Question[] {
  const questions: Question[] = [];
  const useTypes = types.length > 0 ? types : ["mcq", "true_false"] as QuestionType[];

  for (let i = 0; i < count; i++) {
    const type = useTypes[i % useTypes.length];

    switch (type) {
      case "mcq":
        questions.push({
          id: `q${i + 1}`,
          type: "mcq",
          text: `Sample question ${i + 1}: What is the correct answer?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct: Math.floor(Math.random() * 4),
          explanation: "This is the explanation for the correct answer.",
        });
        break;

      case "true_false":
        questions.push({
          id: `q${i + 1}`,
          type: "true_false",
          text: `Sample statement ${i + 1}: This statement is true.`,
          correct: Math.random() > 0.5 ? 1 : 0,
          explanation: "This is the explanation for why this is true or false.",
        });
        break;

      case "fill_blank": {
        const blankAnswer = "definitely";
        const underscores = "_".repeat(blankAnswer.length);
        questions.push({
          id: `q${i + 1}`,
          type: "fill_blank",
          text: `Complete the sentence: The answer is ${underscores} correct.`,
          blank_answer: blankAnswer,
          explanation: "The word 'definitely' fits best in this context.",
        });
        break;
      }
    }
  }

  return questions;
}

export function getMockNotes(topicTitle: string): string {
  return `
<h1>${topicTitle}</h1>

<h2>Overview</h2>
<p>This section provides an introduction to the key concepts covered in this topic. Understanding these fundamentals is essential for building a strong foundation.</p>

<h2>Key Concepts</h2>
<h3>Concept 1: Foundations</h3>
<p>The first concept to understand is the basic principle. <strong>This is a key term</strong> that forms the basis for everything else.</p>
<blockquote>Example: Consider how this applies in real-world scenarios where you might encounter similar situations.</blockquote>

<h3>Concept 2: Applications</h3>
<p>Building on the foundation, we can apply these principles to solve practical problems.</p>
<ul>
<li>Application in context A</li>
<li>Application in context B</li>
<li>Application in context C</li>
</ul>

<h2>Important Details</h2>
<p>Pay special attention to these critical details that often appear in assessments:</p>
<ol>
<li>First important detail to remember</li>
<li>Second important detail with implications</li>
<li>Third important detail for context</li>
</ol>

<h2>Key Takeaways</h2>
<ul>
<li>The foundation is essential for understanding advanced concepts</li>
<li>Practical application reinforces theoretical knowledge</li>
<li>Details matter in assessment scenarios</li>
<li>Regular review improves retention</li>
<li>Connect concepts to real-world examples</li>
</ul>
`.trim();
}

// Re-export utilities from client
export { hasApiKeys, getQuotaStatus, isMultimodalSupported } from "./client";

// Export types
export type { AnalysisResponse, QuizResponse, EvalResponse, QuickAnalysisResponse };
