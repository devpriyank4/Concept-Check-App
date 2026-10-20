-- ==============================================================================
-- Concept Check App - Supabase SQL Schema
-- Paste this script directly into Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create table: golden_pairs
CREATE TABLE IF NOT EXISTS golden_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_name TEXT NOT NULL UNIQUE,
  test_question TEXT NOT NULL,
  correct_answer TEXT NOT NULL
);

-- 2. Create table: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  golden_pair_id UUID NOT NULL REFERENCES golden_pairs(id) ON DELETE CASCADE,
  learner_nickname TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create table: attempts
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  what_they_said TEXT NOT NULL,
  passed BOOLEAN DEFAULT NULL,
  followup_sent BOOLEAN DEFAULT false
);

-- 4. Create table: gaps
CREATE TABLE IF NOT EXISTS gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  recited_sentence TEXT NOT NULL,
  followup_question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) & permissive policies for the web app demo
ALTER TABLE golden_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated or anon service access
DROP POLICY IF EXISTS "Public select golden_pairs" ON golden_pairs;
CREATE POLICY "Public select golden_pairs" ON golden_pairs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public modify golden_pairs" ON golden_pairs;
CREATE POLICY "Public modify golden_pairs" ON golden_pairs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select sessions" ON sessions;
CREATE POLICY "Public select sessions" ON sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert sessions" ON sessions;
CREATE POLICY "Public insert sessions" ON sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select attempts" ON attempts;
CREATE POLICY "Public select attempts" ON attempts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert attempts" ON attempts;
CREATE POLICY "Public insert attempts" ON attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update attempts" ON attempts;
CREATE POLICY "Public update attempts" ON attempts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public select gaps" ON gaps;
CREATE POLICY "Public select gaps" ON gaps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert gaps" ON gaps;
CREATE POLICY "Public insert gaps" ON gaps FOR INSERT WITH CHECK (true);

-- Seed Module 2 Concepts into golden_pairs
INSERT INTO golden_pairs (concept_name, test_question, correct_answer)
VALUES
  (
    'API key security',
    'Explain why API keys should not be exposed in client-side code and how they should be protected in production web applications.',
    'API keys that grant privileged database or backend access must only be stored in secure server-side environment variables and accessed by backend services. Client-side browser code is completely public—anyone can inspect network requests, source maps, or bundled JavaScript to extract keys. If an API key is needed on the frontend, it must either be restricted by origin/scope with read-only permissions, or requests must be proxied through a backend API endpoint that enforces authentication, rate limiting, and session verification.'
  ),
  (
    'App memory',
    'Explain how memory management works in modern web applications and what causes memory leaks in JavaScript.',
    'App memory is allocated on the heap and managed via automatic garbage collection, which tracks references starting from root objects. A memory leak occurs when unused objects or data retain unintended references—such as un-cleared setInterval/setTimeout timers, lingering event listeners on detached DOM elements, global variables, or closures holding large scopes—preventing the garbage collector from reclaiming that memory, which leads to bloated RAM usage and crashes.'
  ),
  (
    'Foreign key placement',
    'In relational database design, which table gets the foreign key in a one-to-many relationship, and why?',
    'In a one-to-many relationship, the foreign key must be placed on the ''many'' side (the child table) referencing the primary key of the ''one'' side (the parent table). This is because each child record corresponds to exactly one parent, allowing a single scalar foreign key column. Placing it on the parent side would require storing an array or multiple parent rows for child IDs, which violates First Normal Form (1NF) and breaks relational integrity.'
  )
ON CONFLICT (concept_name)
DO UPDATE SET
  test_question = EXCLUDED.test_question,
  correct_answer = EXCLUDED.correct_answer;
