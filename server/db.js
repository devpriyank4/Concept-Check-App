import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import crypto from 'crypto';
import { INITIAL_GOLDEN_PAIRS } from './seedData.js';

// Polyfill WebSocket for Node.js < 22 for Supabase Realtime support
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

let supabase = null;
let useSupabase = false;

// Fallback in-memory storage matching the exact 4 Supabase tables
const memoryDb = {
  golden_pairs: INITIAL_GOLDEN_PAIRS.map((item, index) => ({
    id: `00000000-0000-4000-a000-00000000000${index + 1}`,
    ...item
  })),
  sessions: [],
  attempts: [],
  gaps: []
};

function isRealSupabaseConfig(url, key) {
  if (!url || !key) return false;
  if (!url.startsWith('https://') && !url.startsWith('http://')) return false;
  if (url.includes('your-project-id') || url.includes('your-project') || url.includes('example.com')) return false;
  if (key.includes('your_service_role') || key.includes('your_anon_key') || key.includes('your_key')) return false;
  return true;
}

export function initDb(customUrl, customKey) {
  const url = customUrl || process.env.SUPABASE_URL;
  const key = customKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (isRealSupabaseConfig(url, key)) {
    try {
      supabase = createClient(url, key, {
        auth: { persistSession: false },
        global: {
          fetch: (url, opts) => fetch(url, { ...opts, timeout: 5000 })
        }
      });
      useSupabase = true;
      console.log('🔗 Configured Supabase client with URL:', url);
    } catch (err) {
      console.warn('⚠️ Failed to initialize Supabase client:', err.message);
      useSupabase = false;
    }
  } else {
    useSupabase = false;
    console.log('ℹ️ Running in memory database fallback mode (Placeholder or missing Supabase credentials)');
  }
}

// Auto-seed golden_pairs in Supabase if needed
export async function ensureSeeded() {
  if (!useSupabase || !supabase) return;

  try {
    const { data, error } = await supabase.from('golden_pairs').select('id, concept_name');
    if (error) {
      console.warn('⚠️ Supabase select golden_pairs returned error (schema may need running):', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('🌱 Seeding golden_pairs into Supabase...');
      const { error: insertErr } = await supabase.from('golden_pairs').insert(INITIAL_GOLDEN_PAIRS);
      if (insertErr) {
        console.warn('⚠️ Could not insert seed golden pairs into Supabase:', insertErr.message);
      } else {
        console.log('✅ Seeded 3 golden pairs into Supabase.');
      }
    }
  } catch (err) {
    console.warn('⚠️ Error checking/seeding Supabase:', err.message);
  }
}

export async function getDbStatus() {
  let isConnected = false;
  let supabaseError = null;

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('golden_pairs').select('count', { count: 'exact', head: true });
      if (!error) {
        isConnected = true;
      } else {
        supabaseError = error.message;
      }
    } catch (err) {
      supabaseError = err.message;
    }
  }

  const counts = {
    golden_pairs: 0,
    sessions: 0,
    attempts: 0,
    gaps: 0
  };

  if (isConnected) {
    try {
      const [gp, s, a, g] = await Promise.all([
        supabase.from('golden_pairs').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('attempts').select('*', { count: 'exact', head: true }),
        supabase.from('gaps').select('*', { count: 'exact', head: true })
      ]);
      counts.golden_pairs = gp.count || 0;
      counts.sessions = s.count || 0;
      counts.attempts = a.count || 0;
      counts.gaps = g.count || 0;
    } catch (e) {
      console.warn('Could not fetch all counts from Supabase:', e.message);
    }
  } else {
    counts.golden_pairs = memoryDb.golden_pairs.length;
    counts.sessions = memoryDb.sessions.length;
    counts.attempts = memoryDb.attempts.length;
    counts.gaps = memoryDb.gaps.length;
  }

  return {
    provider: isConnected ? 'supabase' : 'in-memory',
    supabaseConfigured: Boolean(process.env.SUPABASE_URL),
    isConnected,
    supabaseError,
    counts
  };
}

// 1. golden_pairs operations
export async function getGoldenPairs() {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('golden_pairs')
        .select('id, concept_name, test_question, correct_answer')
        .order('concept_name');
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('Error fetching golden_pairs from Supabase:', err.message);
    }
  }
  return memoryDb.golden_pairs;
}

export async function getGoldenPairById(id) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('golden_pairs')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Error fetching golden_pair by id from Supabase:', err.message);
    }
  }
  return memoryDb.golden_pairs.find(item => item.id === id) || null;
}

// 2. sessions operations
export async function createSession({ golden_pair_id, learner_nickname }) {
  const started_at = new Date().toISOString();

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          golden_pair_id,
          learner_nickname: learner_nickname?.trim() || 'Anonymous Learner',
          started_at
        }])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      console.warn('Supabase createSession error:', error?.message);
    } catch (err) {
      console.warn('Supabase createSession threw:', err.message);
    }
  }

  // Fallback
  const newSession = {
    id: crypto.randomUUID(),
    golden_pair_id,
    learner_nickname: learner_nickname?.trim() || 'Anonymous Learner',
    started_at
  };
  memoryDb.sessions.unshift(newSession);
  return newSession;
}

export async function getSessionById(id) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getSessionById error:', err.message);
    }
  }
  return memoryDb.sessions.find(s => s.id === id) || null;
}

// 3. attempts operations
export async function createAttempt({ session_id, what_they_said, passed = null, followup_sent = true }) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('attempts')
        .insert([{
          session_id,
          what_they_said,
          passed,
          followup_sent
        }])
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase createAttempt error:', error?.message);
    } catch (err) {
      console.warn('Supabase createAttempt threw:', err.message);
    }
  }

  const newAttempt = {
    id: crypto.randomUUID(),
    session_id,
    what_they_said,
    passed,
    followup_sent
  };
  memoryDb.attempts.unshift(newAttempt);
  return newAttempt;
}

export async function updateAttempt(id, updates) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('attempts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase updateAttempt error:', error?.message);
    } catch (err) {
      console.warn('Supabase updateAttempt threw:', err.message);
    }
  }

  const index = memoryDb.attempts.findIndex(a => a.id === id);
  if (index !== -1) {
    memoryDb.attempts[index] = { ...memoryDb.attempts[index], ...updates };
    return memoryDb.attempts[index];
  }
  return null;
}

export async function getAttemptById(id) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getAttemptById error:', err.message);
    }
  }
  return memoryDb.attempts.find(a => a.id === id) || null;
}

// 4. gaps operations
export async function createGap({ attempt_id, recited_sentence, followup_question }) {
  const created_at = new Date().toISOString();

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('gaps')
        .insert([{
          attempt_id,
          recited_sentence,
          followup_question,
          created_at
        }])
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase createGap error:', error?.message);
    } catch (err) {
      console.warn('Supabase createGap threw:', err.message);
    }
  }

  const newGap = {
    id: crypto.randomUUID(),
    attempt_id,
    recited_sentence,
    followup_question,
    created_at
  };
  memoryDb.gaps.unshift(newGap);
  return newGap;
}

export async function getGapByAttemptId(attempt_id) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('gaps')
        .select('*')
        .eq('attempt_id', attempt_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getGapByAttemptId error:', err.message);
    }
  }
  return memoryDb.gaps.find(g => g.attempt_id === attempt_id) || null;
}

// History viewer combining all tables
export async function getFullHistory(limit = 20) {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          learner_nickname,
          started_at,
          golden_pairs:golden_pair_id (id, concept_name, test_question, correct_answer),
          attempts:attempts (
            id,
            what_they_said,
            passed,
            followup_sent,
            gaps:gaps (id, recited_sentence, followup_question, created_at)
          )
        `)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getFullHistory error:', err.message);
    }
  }

  // Build relational view from memoryDb
  return memoryDb.sessions.slice(0, limit).map(session => {
    const goldenPair = memoryDb.golden_pairs.find(gp => gp.id === session.golden_pair_id) || null;
    const sessionAttempts = memoryDb.attempts
      .filter(att => att.session_id === session.id)
      .map(att => {
        const gap = memoryDb.gaps.filter(g => g.attempt_id === att.id);
        return {
          ...att,
          gaps: gap
        };
      });

    return {
      ...session,
      golden_pairs: goldenPair,
      attempts: sessionAttempts
    };
  });
}
