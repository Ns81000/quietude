import { safeGeminiCall } from './client';

export interface LessonBlock {
  type: 'text' | 'yes_no' | 'choice' | 'text_input' | 'confidence' | 'fill_blank' | 'true_false' | 'rating' | 'sorting';
  content?: string;
  question?: string;
  statement?: string;
  options?: string[];
  correctAnswer?: number | boolean | string; // AI provides correct answer
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
  wasCorrect?: boolean; // For true/false, choice questions
  confidence?: 'low' | 'medium' | 'high'; // Derived from answer type
}

const SYSTEM_PROMPT = `You are a Socratic tutor. Be conversational, direct, and adaptive.

RULES:
1. Generate 2 blocks: "text" (1 sentence) + interaction
2. Text must reference their LAST answer:
   - If ✓: "Right!" or "Correct!" then 1 new sentence
   - If ✗: "Not quite. The answer is [X]. Here's why: [1 sentence]"
3. NEVER repeat concepts they already demonstrated
4. Use different interaction types

CRITICAL - AFTER WRONG ANSWER:
- State the CORRECT answer explicitly
- Give 1 sentence explanation
- Move to DIFFERENT concept (don't ask about same thing again)

NEVER:
- Say "You correctly identified..." (just say "Right!")
- Re-explain after correct answer
- Ask about same concept twice
- Start with "Welcome!" or "Let's explore..."

EXAMPLES:
✓ Answer: "Right! Now let's see how X differs from Y."
✗ Answer: "Not quite. The answer is B because [reason]. Let's try something else."

INTERACTION TYPES (9 types - vary usage):

1. yes_no: {"type":"yes_no","question":"...","correctAnswer":true}
2. true_false: {"type":"true_false","statement":"...","correctAnswer":true}
3. choice: {"type":"choice","question":"...","options":["A","B","C"],"correctAnswer":1}
4. text_input: {"type":"text_input","question":"..."} (no correctAnswer - subjective)
5. confidence: {"type":"confidence","question":"How confident..."} (no correctAnswer - self-assessment)
6. fill_blank: {"type":"fill_blank","blankSentence":"A ___ is...","blankAnswer":"word"}
7. rating: {"type":"rating","question":"How well..."} (no correctAnswer - self-assessment)
8. sorting: {"type":"sorting","question":"Order these:","sortItems":["A","B","C"],"correctOrder":[2,0,1]}
9. yes_no (reuse after 4+ other types)

IMPORTANT: For yes_no, true_false, choice - MUST include correctAnswer field so we can validate responses.

RESPONSE FORMAT (JSON only, no markdown):
{"blocks":[{"type":"text","content":"..."},{"type":"choice","question":"...","options":["A","B","C"],"correctAnswer":1}],"isComplete":false}

WHEN isComplete=true (final):
{"blocks":[{"type":"text","content":"Wrap up..."}],"isComplete":true,"summary":{"strengths":["specific observation from answers"],"areasToExplore":["specific gaps from answers"],"closingThought":"..."}}`;

export async function generateLessonChunk(
  topicTitle: string,
  topicSummary: string,
  pastBlocks: PastBlock[],
  interactionCount: number,
  sourceContent?: string
): Promise<LessonChunk> {
  const contextSnippet = sourceContent
    ? sourceContent.slice(0, 1500)
    : topicSummary;

  // Build concise history with clear correctness indicators
  const historyText = pastBlocks.length > 0
    ? pastBlocks
        .slice(-3) // Only last 3 interactions for token efficiency
        .map((b) => {
          if (b.type === 'text') return '';
          
          let indicator = '';
          if (b.wasCorrect === true) indicator = ' ✓';
          else if (b.wasCorrect === false) indicator = ' ✗';
          else if (b.confidence === 'low') indicator = ' (uncertain)';
          else if (b.confidence === 'high') indicator = ' (confident)';
          
          return `${b.type}: "${b.question?.slice(0, 60)}" → ${b.userAnswer}${indicator}`;
        })
        .filter(Boolean)
        .join('\n')
    : 'Starting conversation.';

  const usedTypes = pastBlocks
    .filter(b => b.type !== 'text' && b.type !== 'summary')
    .map(b => b.type);
  const lastType = usedTypes[usedTypes.length - 1] || 'none';
  const allTypes = ['yes_no', 'true_false', 'choice', 'text_input', 'confidence', 'fill_blank', 'rating', 'sorting'];
  const unusedTypes = allTypes.filter(t => !usedTypes.includes(t));

  const shouldEnd = interactionCount >= 6;

  // Get last answer for context
  const lastBlock = pastBlocks[pastBlocks.length - 1];
  const lastAnswerContext = lastBlock ? 
    `Their LAST answer: ${lastBlock.userAnswer} ${lastBlock.wasCorrect === true ? '✓ CORRECT' : lastBlock.wasCorrect === false ? '✗ WRONG' : lastBlock.confidence === 'low' ? '(LOW confidence)' : ''}` 
    : '';

  // Track wrong answers to avoid repeating same concept
  const wrongConcepts = pastBlocks
    .filter(b => b.wasCorrect === false)
    .map(b => b.question?.slice(0, 30))
    .slice(-2); // Last 2 wrong answers

  const wrongConceptsText = wrongConcepts.length > 0 
    ? `\nThey struggled with: ${wrongConcepts.join(', ')}. DON'T ask about these again - move to different concept.`
    : '';

  return safeGeminiCall(async (model) => {
    const result = await model.generateContent([
      {
        text: `${SYSTEM_PROMPT}

Topic: "${topicTitle}"
Context: ${contextSnippet}

Interaction #${interactionCount}
Recent history:
${historyText}${wrongConceptsText}

${lastAnswerContext}

Last type used: "${lastType}" (DON'T use again)
Unused types: [${unusedTypes.join(', ')}]

${shouldEnd
  ? `FINAL. Set isComplete:true. Count their ✓ and ✗ from history above. Summary strengths = concepts with ✓, areasToExplore = concepts with ✗. Be specific and honest.`
  : `Next: 1 text (${lastBlock?.wasCorrect === true ? '"Right!" then 1 new sentence' : lastBlock?.wasCorrect === false ? '"Not quite. Answer is [X] because [reason]." then move to DIFFERENT concept' : '1 sentence'}) + 1 interaction (unused type).`
}

JSON only:`,
      },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as LessonChunk;
  }, 2, 30000);
}
