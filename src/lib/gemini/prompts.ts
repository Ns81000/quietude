/**
 * Gemini Prompt Templates
 * 
 * All prompts used for Gemini API calls, following the specification
 * from QUIETUDE_DOCS.md Section 9.
 */

import { QuestionType, Difficulty } from "@/types/quiz";

/**
 * Build prompt for content analysis (deciding if study plan is needed)
 */
export function buildAnalysisPrompt(): string {
  return `
You are analysing study material uploaded by a student.

Determine:
1. Whether this content needs a structured study plan (multiple topics) or is a single topic.
2. If a study plan is needed, extract an ordered list of topics.
3. Classify the subject, education level, and topic type.

Respond ONLY with valid JSON. No preamble. No markdown fences.

Schema:
{
  "needsStudyPlan": boolean,
  "subject": "string",
  "educationLevel": "High School | Undergraduate | Postgraduate | Professional | Other",
  "topicType": "factual | conceptual | procedural | mixed",
  "topics": [
    {
      "id": number,
      "title": "string — specific, not generic",
      "difficulty": "foundation | intermediate | advanced",
      "estimatedQuestions": number (5–15),
      "summary": "string — one sentence"
    }
  ]
}

If needsStudyPlan is false, return topics as [].
Topics must be ordered foundational to advanced. Maximum 12. Minimum 2 if needsStudyPlan is true.
Topic titles must be specific: not "Introduction" but "Cell Structure and Organelles".
`.trim();
}

/**
 * Build prompt for quiz question generation
 */
export function buildQuizPrompt(params: {
  topicTitle: string;
  topicSummary: string;
  questionCount: number;
  types: QuestionType[];
  difficulty: Difficulty;
  isDigDeeper: boolean;
  isRetake: boolean;
  sourceContent?: string;
}): string {
  const {
    topicTitle,
    topicSummary,
    questionCount,
    types,
    difficulty,
    isDigDeeper,
    isRetake,
    sourceContent,
  } = params;

  const difficultyDesc =
    difficulty === "foundation"
      ? "straightforward, factual"
      : difficulty === "intermediate"
      ? "requires understanding and some application"
      : "requires analysis and synthesis";

  // Build type distribution instructions
  const typeCount = types.length;
  const questionsPerType = Math.floor(questionCount / typeCount);
  const remainder = questionCount % typeCount;
  
  let typeDistribution = '';
  if (typeCount === 1) {
    typeDistribution = `ALL ${questionCount} questions must be of type "${types[0]}". Do NOT use any other question type.`;
  } else {
    const distribution = types.map((t, i) => 
      `${questionsPerType + (i < remainder ? 1 : 0)} x ${t}`
    ).join(', ');
    typeDistribution = `Distribute questions across types: ${distribution}. Mix them throughout, don't group by type.`;
  }

  return `
You are generating quiz questions for a student studying: ${topicTitle}
Topic summary: ${topicSummary}
${sourceContent ? `\nSource content:\n${sourceContent.slice(0, 8000)}\n` : ""}
${isDigDeeper ? "DIG DEEPER: Focus on application, analysis, synthesis. Minimal factual recall." : ""}
${isRetake ? "RETAKE: Generate different questions. Do not repeat question text from a previous attempt." : ""}

Generate exactly ${questionCount} questions.
Difficulty: ${difficultyDesc}.

IMPORTANT - Question type requirement:
${typeDistribution}
Allowed types: ${types.join(", ")}
Do NOT generate any question types not listed above.

Respond ONLY with valid JSON. No preamble. No markdown fences.

Schema:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq | true_false | fill_blank",
      "text": "question text",
      "options": ["A","B","C","D"],
      "correct": 0,
      "blank_answer": "string",
      "explanation": "one to two sentences"
    }
  ]
}

Include only the fields relevant to each question type:
- mcq: id, type, text, options, correct, explanation
- true_false: id, type, text, correct (0 for false, 1 for true), explanation
- fill_blank: id, type, text (with underscores matching answer length, e.g., "______" for 6-letter answer), blank_answer, explanation

MCQ distractors must be plausible — not obviously wrong.
Fill in the blank: The number of underscores (_) in the text MUST equal the number of characters in blank_answer.
`.trim();
}

/**
 * Build prompt for notes generation
 */
export function buildNotesPrompt(
  topicTitle: string,
  topicSummary: string,
  sourceContent?: string
): string {
  return `
Generate study notes for a student who scored below 75% on: ${topicTitle}
Topic summary: ${topicSummary}
${sourceContent ? `\nSource content:\n${sourceContent.slice(0, 8000)}\n` : ""}

Rules:
- H1 for topic title, H2 for major sections, H3 for sub-points
- Plain, direct English. No filler. No academic padding.
- At least one concrete example or analogy per major section
- Key terms in <strong> tags — used sparingly, only the most important
- End with a "Key Takeaways" section: exactly 4–5 bullet points, one sentence each
- No emoji. Use plain hyphens for lists.
- Length: 400–800 words depending on topic complexity.

Respond ONLY with clean HTML. No markdown. No code fences. Start with <h1>.
Allowed tags: h1, h2, h3, p, strong, em, ul, li, ol, blockquote
`.trim();
}

/**
 * Build prompt for fill-in-blank answer evaluation
 */
export function buildEvalPrompt(
  question: string,
  blankAnswer: string,
  userAnswer: string
): string {
  return `
Fill-in-the-blank evaluation.

Question: ${question}
Correct answer: ${blankAnswer}
Student answer: ${userAnswer}

Accept: minor spelling errors, synonyms with the same meaning, different capitalisation.
Reject: clearly wrong terms, answers that change the meaning.

Respond ONLY with valid JSON:
{ "correct": true | false, "reason": "one short sentence" }
`.trim();
}

/**
 * Build prompt for subject classification
 */
export function buildClassificationPrompt(
  pathTitle: string,
  topicTitle: string
): string {
  return `
Classify this study content into a standard academic subject.
Path: ${pathTitle}
Topic: ${topicTitle}

Respond ONLY with valid JSON:
{
  "subject": "string — e.g. Biology, Mathematics, History, Computer Science",
  "subfield": "string — e.g. Cell Biology, Calculus, Modern History, Algorithms"
}
`.trim();
}

/**
 * Build prompt for single topic quick analysis
 */
export function buildQuickAnalysisPrompt(content: string): string {
  return `
Analyze this brief study content and extract the main topic.

Content:
${content.slice(0, 4000)}

Respond ONLY with valid JSON:
{
  "title": "specific topic title",
  "subject": "academic subject",
  "summary": "one sentence summary",
  "difficulty": "foundation | intermediate | advanced",
  "estimatedQuestions": number (5-15)
}
`.trim();
}
