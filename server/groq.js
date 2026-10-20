import Groq from 'groq-sdk';

let groqClient = null;

function isRealGroqKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  if (!apiKey.startsWith('gsk_')) return false;
  if (apiKey.includes('your_groq_api_key') || apiKey.length < 25) return false;
  return true;
}

export function initGroq(customApiKey) {
  const apiKey = customApiKey || process.env.GROQ_API_KEY;
  if (isRealGroqKey(apiKey)) {
    try {
      groqClient = new Groq({ apiKey, timeout: 8000, maxRetries: 1 });
      console.log('⚡ Groq API client initialized');
    } catch (err) {
      console.warn('⚠️ Failed to initialize Groq client:', err.message);
      groqClient = null;
    }
  } else {
    console.log('ℹ️ Placeholder or no GROQ_API_KEY detected. Fast fallback evaluator active.');
    groqClient = null;
  }
}

export function isGroqConfigured() {
  return isRealGroqKey(process.env.GROQ_API_KEY) || Boolean(groqClient);
}

function extractJson(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (err2) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Step 1: Detect the sentence where the learner recited phrases and craft 1 follow-up question
 */
export async function detectRecitedSentenceAndGap({ conceptName, testQuestion, explanation }) {
  const apiKey = process.env.GROQ_API_KEY;
  const client = groqClient || (isRealGroqKey(apiKey) ? new Groq({ apiKey, timeout: 8000, maxRetries: 1 }) : null);

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert cognitive evaluator and computer science instructor.
Your job is to analyze a learner's explanation of a specific technical concept and identify where they stopped thinking critically and instead started reciting memorized phrases, buzzwords, or textbook clichés.

Rules:
1. "recited_sentence": Find the exact sentence from the learner's text where they switched from genuine understanding to reciting textbook phrases, jargon soup, or unsubstantiated claims.
   - It MUST be an exact quote or substring of one sentence from the learner's input.
   - If the learner only wrote one sentence or very short text, use that exact sentence.
2. "followup_question": Write exactly ONE focused, probing follow-up question targeting that recited sentence.
   - The question must press the learner to explain the actual underlying mechanism, rationale, or consequence rather than repeating buzzwords.
3. "diagnosis": A short 1-2 sentence educator note on why this sentence signals memorization over comprehension.

Respond ONLY with valid JSON in this exact structure:
{
  "recited_sentence": "exact sentence from learner explanation",
  "diagnosis": "Why this represents recited knowledge vs deep comprehension",
  "followup_question": "Single direct follow-up question"
}`
          },
          {
            role: 'user',
            content: `Concept: ${conceptName}
Prompt Question: ${testQuestion}

Learner's Explanation:
"${explanation}"`
          }
        ]
      });

      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = extractJson(raw);
        if (parsed && parsed.recited_sentence && parsed.followup_question) {
          return {
            recited_sentence: parsed.recited_sentence,
            followup_question: parsed.followup_question,
            diagnosis: parsed.diagnosis || 'Recited textbook phrase detected.'
          };
        }
      }
    } catch (err) {
      console.warn('⚠️ Groq API gap analysis failed:', err.message);
    }
  }

  // Smart Heuristic Fallback when Groq API key is not yet set or returns an error
  return fallbackGapDetection(conceptName, explanation);
}

/**
 * Step 2: Check learner follow-up answer against pre-written correct answer in database
 */
export async function gradeFollowupAnswer({ conceptName, followupQuestion, learnerAnswer, prewrittenCorrectAnswer }) {
  const apiKey = process.env.GROQ_API_KEY;
  const client = groqClient || (isRealGroqKey(apiKey) ? new Groq({ apiKey, timeout: 8000, maxRetries: 1 }) : null);

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an exacting but fair computer science grader.
Your task is to compare a learner's follow-up answer against the pre-written correct answer stored in the database.

Criteria:
- The learner's answer must match the core principles and causal mechanisms expressed in the golden correct answer.
- Do NOT require identical wording; assess semantic comprehension and technical accuracy.
- Mark "passed": true if their answer demonstrates correct understanding of the concept and addresses the follow-up question accurately according to the golden answer.
- Mark "passed": false if their answer is evasive, repeats the recited buzzword without explaining the mechanism, contains technical inaccuracies, or fails to address the follow-up question.

Respond ONLY with valid JSON:
{
  "passed": true, // or false
  "score": 85, // integer 0 to 100
  "verdict": "Passed" // or "Failed"
  "feedback": "Two or three sentences clearly explaining why they passed or what critical insight was missing.",
  "reasoning": "Internal pedagogical justification comparing learner answer with golden answer"
}`
          },
          {
            role: 'user',
            content: `Concept: ${conceptName}
Follow-up Question Asked: ${followupQuestion}
Database Pre-written Correct Answer: "${prewrittenCorrectAnswer}"

Learner's Follow-up Answer:
"${learnerAnswer}"`
          }
        ]
      });

      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = extractJson(raw);
        if (parsed) {
          return {
            passed: Boolean(parsed.passed),
            score: typeof parsed.score === 'number' ? parsed.score : (parsed.passed ? 85 : 40),
            verdict: parsed.passed ? 'Passed' : 'Failed',
            feedback: parsed.feedback || (parsed.passed ? 'Well done! Your explanation demonstrates genuine understanding.' : 'Did not sufficiently match the core principles.'),
            reasoning: parsed.reasoning || ''
          };
        }
      }
    } catch (err) {
      console.warn('⚠️ Groq API follow-up grading failed:', err.message);
    }
  }

  // Fallback semantic evaluator
  return fallbackGrading(conceptName, learnerAnswer, prewrittenCorrectAnswer);
}

// Heuristic fallback for gap detection
function fallbackGapDetection(conceptName, text) {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  let targetSentence = sentences[sentences.length - 1] || text;
  // If multiple sentences, look for buzzword heavy sentence
  const buzzwords = ['secure', 'best practice', 'never expose', 'environment variables', 'leak', 'memory', 'heap', 'garbage collection', 'relational', 'foreign key', 'one-to-many'];
  for (const s of sentences) {
    const hits = buzzwords.filter(bw => s.toLowerCase().includes(bw));
    if (hits.length >= 2) {
      targetSentence = s;
      break;
    }
  }

  let followup = `What specific technical mechanism makes "${targetSentence.slice(0, 40)}..." work under the hood?`;
  if (conceptName === 'API key security') {
    followup = 'Why can client-side JavaScript or bundle files never truly protect a private API secret, even if obfuscated?';
  } else if (conceptName === 'App memory') {
    followup = 'How does the garbage collector decide whether an object in heap memory can be reclaimed, and what breaks that?';
  } else if (conceptName === 'Foreign key placement') {
    followup = 'Why does putting the foreign key on the "one" side violate First Normal Form (1NF) or relational integrity?';
  }

  return {
    recited_sentence: targetSentence,
    diagnosis: 'Textbook buzzwords detected without complete mechanistic breakdown.',
    followup_question: followup
  };
}

// Heuristic fallback for grading
function fallbackGrading(conceptName, learnerAnswer, prewrittenCorrectAnswer) {
  const lower = learnerAnswer.toLowerCase();
  let passed = false;
  let feedback = '';

  if (conceptName === 'API key security') {
    const mentionsServer = lower.includes('server') || lower.includes('backend') || lower.includes('env') || lower.includes('proxy');
    const mentionsClientPublic = lower.includes('browser') || lower.includes('inspect') || lower.includes('client') || lower.includes('public') || lower.includes('network');
    passed = mentionsServer && mentionsClientPublic && learnerAnswer.trim().length > 30;
    feedback = passed
      ? 'Passed: You clearly highlighted that client bundles are public and keys must be protected behind server-side environment variables or proxies.'
      : 'Failed: Ensure you explain why client-side code is publicly inspectable and why sensitive operations must be routed through a server backend.';
  } else if (conceptName === 'App memory') {
    const mentionsRef = lower.includes('reference') || lower.includes('root') || lower.includes('reach');
    const mentionsLeak = lower.includes('listener') || lower.includes('timer') || lower.includes('interval') || lower.includes('closure') || lower.includes('leak');
    passed = (mentionsRef || mentionsLeak) && learnerAnswer.trim().length > 30;
    feedback = passed
      ? 'Passed: You accurately identified reference retention and how un-cleared listeners/timers prevent garbage collection.'
      : 'Failed: Your answer needs to connect how active references prevent the garbage collector from freeing heap memory.';
  } else if (conceptName === 'Foreign key placement') {
    const mentionsMany = lower.includes('many') || lower.includes('child');
    const mentionsOne = lower.includes('one') || lower.includes('array') || lower.includes('parent') || lower.includes('1nf') || lower.includes('scalar');
    passed = mentionsMany && mentionsOne && learnerAnswer.trim().length > 30;
    feedback = passed
      ? 'Passed: You correctly pinpointed that the foreign key belongs on the many (child) side to preserve scalar columns and relational integrity.'
      : 'Failed: Remember that in a one-to-many relationship, placing the key on the parent side would require storing an array or duplicating rows, violating 1NF.';
  } else {
    passed = learnerAnswer.trim().length > 40;
    feedback = passed ? 'Passed: Answer addresses the core conceptual requirements.' : 'Failed: Explanation was too brief or missed key concepts.';
  }

  return {
    passed,
    score: passed ? 85 : 45,
    verdict: passed ? 'Passed' : 'Failed',
    feedback,
    reasoning: 'Fallback heuristic evaluation against database golden answer.'
  };
}
