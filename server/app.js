import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  initDb,
  ensureSeeded,
  getDbStatus,
  getGoldenPairs,
  getGoldenPairById,
  createSession,
  getSessionById,
  createAttempt,
  updateAttempt,
  getAttemptById,
  createGap,
  getGapByAttemptId,
  getFullHistory
} from './db.js';

import {
  initGroq,
  isGroqConfigured,
  detectRecitedSentenceAndGap,
  gradeFollowupAnswer
} from './groq.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and Groq
initDb();
initGroq();
ensureSeeded();

const app = express();

app.use(cors());
app.use(express.json());

// 1. System & DB Status
app.get('/api/status', async (req, res) => {
  const dbStatus = await getDbStatus();
  res.json({
    ok: true,
    groqConfigured: isGroqConfigured(),
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 2. Get list of Module 2 concepts from golden_pairs
app.get('/api/concepts', async (req, res) => {
  try {
    const pairs = await getGoldenPairs();
    const concepts = pairs.map(p => ({
      id: p.id,
      concept_name: p.concept_name,
      test_question: p.test_question
    }));
    res.json({ success: true, concepts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create a learner session
app.post('/api/sessions', async (req, res) => {
  try {
    const { golden_pair_id, learner_nickname } = req.body;
    if (!golden_pair_id) {
      return res.status(400).json({ success: false, error: 'golden_pair_id is required' });
    }

    const goldenPair = await getGoldenPairById(golden_pair_id);
    if (!goldenPair) {
      return res.status(404).json({ success: false, error: 'Selected concept not found' });
    }

    const session = await createSession({
      golden_pair_id,
      learner_nickname: learner_nickname || 'Learner'
    });

    res.json({
      success: true,
      session,
      concept: {
        id: goldenPair.id,
        concept_name: goldenPair.concept_name,
        test_question: goldenPair.test_question
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Submit explanation -> Detect Recited Sentence -> Generate Follow-up
app.post('/api/analyze-explanation', async (req, res) => {
  try {
    const { session_id, explanation } = req.body;

    if (!session_id || !explanation || !explanation.trim()) {
      return res.status(400).json({ success: false, error: 'session_id and explanation are required' });
    }

    const session = await getSessionById(session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const goldenPair = await getGoldenPairById(session.golden_pair_id);
    if (!goldenPair) {
      return res.status(404).json({ success: false, error: 'Associated concept not found' });
    }

    // Insert attempt record into `attempts` table
    const attempt = await createAttempt({
      session_id,
      what_they_said: explanation.trim(),
      passed: null,
      followup_sent: true
    });

    // Call Groq API to pinpoint recited sentence & create follow-up question
    const analysis = await detectRecitedSentenceAndGap({
      conceptName: goldenPair.concept_name,
      testQuestion: goldenPair.test_question,
      explanation: explanation.trim()
    });

    // Insert gap record into `gaps` table
    const gap = await createGap({
      attempt_id: attempt.id,
      recited_sentence: analysis.recited_sentence,
      followup_question: analysis.followup_question
    });

    res.json({
      success: true,
      attempt_id: attempt.id,
      gap_id: gap.id,
      recited_sentence: analysis.recited_sentence,
      followup_question: analysis.followup_question,
      diagnosis: analysis.diagnosis
    });
  } catch (err) {
    console.error('Error in analyze-explanation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Submit follow-up answer -> Grade against pre-written correct answer in database
app.post('/api/check-followup', async (req, res) => {
  try {
    const { attempt_id, session_id, follow_up_answer } = req.body;

    if (!attempt_id || !follow_up_answer || !follow_up_answer.trim()) {
      return res.status(400).json({ success: false, error: 'attempt_id and follow_up_answer are required' });
    }

    const attempt = await getAttemptById(attempt_id);
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    const session = await getSessionById(session_id || attempt.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const goldenPair = await getGoldenPairById(session.golden_pair_id);
    if (!goldenPair) {
      return res.status(404).json({ success: false, error: 'Golden pair not found' });
    }

    const gap = await getGapByAttemptId(attempt.id);

    // Call Groq API to evaluate learner's follow-up against the pre-written correct answer
    const gradeResult = await gradeFollowupAnswer({
      conceptName: goldenPair.concept_name,
      followupQuestion: gap ? gap.followup_question : goldenPair.test_question,
      learnerAnswer: follow_up_answer.trim(),
      prewrittenCorrectAnswer: goldenPair.correct_answer
    });

    // Update attempts table with passed status
    await updateAttempt(attempt.id, {
      passed: gradeResult.passed
    });

    res.json({
      success: true,
      passed: gradeResult.passed,
      score: gradeResult.score,
      verdict: gradeResult.verdict,
      feedback: gradeResult.feedback,
      reasoning: gradeResult.reasoning,
      recited_sentence: gap?.recited_sentence,
      followup_question: gap?.followup_question,
      correct_answer: goldenPair.correct_answer
    });
  } catch (err) {
    console.error('Error in check-followup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Inspect Database History (Full trace across all 4 tables)
app.get('/api/history', async (req, res) => {
  try {
    const history = await getFullHistory(50);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Update Runtime Config (Groq Key or Supabase URL/Key)
app.post('/api/config', async (req, res) => {
  try {
    const { groq_api_key, supabase_url, supabase_key } = req.body;

    if (groq_api_key) {
      process.env.GROQ_API_KEY = groq_api_key.trim();
      initGroq(groq_api_key.trim());
    }

    if (supabase_url && supabase_key) {
      process.env.SUPABASE_URL = supabase_url.trim();
      process.env.SUPABASE_KEY = supabase_key.trim();
      initDb(supabase_url.trim(), supabase_key.trim());
      await ensureSeeded();
    }

    const status = await getDbStatus();
    res.json({
      success: true,
      groqConfigured: isGroqConfigured(),
      database: status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Global error handler ensuring JSON responses
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

export default app;
