import { safeGeminiCall } from './client';

export interface LessonBlock {
  type: 'text' | 'yes_no' | 'choice' | 'text_input' | 'confidence' | 'fill_blank' | 'true_false' | 'rating' | 'sorting';
  content?: string;
  question?: string;
  statement?: string;
  options?: string[];
  blankSentence?: string;
  blankAnswer?: string;
  sortItems?: string[];
  correctOrder?: number[];
}

export interface LessonChunk {
  blocks: LessonBlock[];
  isComplete: boolean;
  summary?: {
    strengths: string[];
    areasToExplore: string[];
    closingThought: string;
  };
}

export interface PastBlock {
  type: string;
  question?: string;
  userAnswer?: string | number | boolean;
}

const SYSTEM_PROMPT = `You are an interactive Socratic tutor creating a flowing, adaptive lesson.

CRITICAL RULES:
- Generate EXACTLY 2 blocks per chunk: one "text" block + one interaction block
- The "text" block: 2-4 sentences explaining a concept. Use **bold** for key terms.
- The interaction block: ONE question using a DIFFERENT type than the last one used
- NEVER put explanatory text inside an interaction block — text goes in "text" blocks only
- NEVER generate a summary alongside an unanswered interaction — summary comes in its OWN chunk with NO interaction
- Adapt the lesson based on previous answers

INTERACTION TYPES (you have 9 types — use as many different ones as possible across the lesson):

1. "yes_no" — Ask a Yes/No question
   Required: "question"
   Example: {"type":"yes_no","question":"Can a firewall alone protect against phishing?"}

2. "true_false" — Present a STATEMENT, user decides if True or False
   Required: "statement"
   Example: {"type":"true_false","statement":"RAM retains data even after the computer is turned off."}

3. "choice" — Multiple choice with 3-4 options
   Required: "question", "options" (array of 3-4 strings)
   Example: {"type":"choice","question":"Which protocol is used for secure web browsing?","options":["HTTP","FTP","HTTPS","SMTP"]}

4. "text_input" — Open-ended short answer (1-2 sentences)
   Required: "question"
   Example: {"type":"text_input","question":"In your own words, why is encryption important?"}

5. "confidence" — Ask how confident they feel about a concept
   Required: "question"
   Example: {"type":"confidence","question":"How confident are you in explaining the difference between TCP and UDP?"}

6. "fill_blank" — A sentence with ONE gap marked as ___ and the correct answer
   Required: "blankSentence" (must contain exactly one ___), "blankAnswer" (single word or short phrase)
   WRONG: {"blankSentence":"A virus is a type of malware..."} — this has no blank!
   CORRECT: {"blankSentence":"A ___ is a type of malware that attaches to programs.","blankAnswer":"virus"}

7. "rating" — Rate understanding of a specific concept on 1-5
   Required: "question"
   Example: {"type":"rating","question":"How well do you understand how DNS resolution works?"}

8. "sorting" — Put 3-5 items in the correct order
   Required: "question", "sortItems" (array of 3-5 strings in SHUFFLED order), "correctOrder" (array of indices for correct order)
   Example: {"type":"sorting","question":"Arrange these network layers from lowest to highest:","sortItems":["Application","Transport","Network","Physical"],"correctOrder":[3,2,1,0]}

9. "yes_no" can be reused if needed after using 4+ other types

VARIETY ENFORCEMENT:
- Track which types you've used and PRIORITIZE unused types
- In a 6-interaction lesson, use AT LEAST 5 different types
- Never use the same type twice in a row

RESPONSE FORMAT (strict JSON, NO markdown fences, NO extra text):
{"blocks":[{"type":"text","content":"..."},{"type":"choice","question":"...","options":["A","B","C"]}],"isComplete":false}

WHEN isComplete IS TRUE (final chunk):
- Generate ONLY a "text" block wrapping up — NO interaction block
- Include the summary object
- Do NOT pair summary with an unanswered question
{"blocks":[{"type":"text","content":"Great exploration! Let's see how you did..."}],"isComplete":true,"summary":{"strengths":["..."],"areasToExplore":["..."],"closingThought":"..."}}`;

export async function generateLessonChunk(
  topicTitle: string,
  topicSummary: string,
  pastBlocks: PastBlock[],
  interactionCount: number,
  sourceContent?: string
): Promise<LessonChunk> {
  const contextSnippet = sourceContent
    ? sourceContent.slice(0, 2000)
    : topicSummary;

  const historyText = pastBlocks.length > 0
    ? pastBlocks
        .map((b, i) => {
          if (b.type === 'text') return '';
          return `[${b.type}] Q: ${b.question || '?'} → Answer: ${b.userAnswer ?? 'N/A'}`;
        })
        .filter(Boolean)
        .join('\n')
    : 'No interactions yet.';

  const usedTypes = pastBlocks
    .filter(b => b.type !== 'text' && b.type !== 'summary')
    .map(b => b.type);
  const lastType = usedTypes[usedTypes.length - 1] || 'none';
  const allTypes = ['yes_no', 'true_false', 'choice', 'text_input', 'confidence', 'fill_blank', 'rating', 'sorting'];
  const unusedTypes = allTypes.filter(t => !usedTypes.includes(t));

  const shouldEnd = interactionCount >= 6;

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent([
      {
        text: `${SYSTEM_PROMPT}

Topic: "${topicTitle}"
Context: ${contextSnippet}

Interactions completed: ${interactionCount}
Previous interactions:
${historyText}

Last interaction type: "${lastType}" — DO NOT use this type.
Types already used: [${usedTypes.join(', ')}]
Types NOT yet used (PREFER these): [${unusedTypes.join(', ')}]

${shouldEnd
  ? 'This is the FINAL chunk. Set isComplete: true. Include ONLY a closing text block and a summary. Do NOT include any interaction block.'
  : `Generate the next chunk: 1 text block + 1 interaction block. Use one of the unused types: [${unusedTypes.join(', ')}]`
}

Return ONLY valid JSON:`,
      },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as LessonChunk;
  }, 2, 45000);
}
