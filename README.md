# Concept Check Web App (Module 2)

An AI-powered diagnostic web app designed to evaluate conceptual mastery and detect when learners stop thinking and start reciting memorized phrases.

Built with **React**, **Node.js/Express**, **Groq API** (`llama-3.3-70b-versatile`), and **Supabase**.

---

## 🚀 Quick Start

The app is currently running live at:
- **Primary Web App URL:** [http://localhost:4000](http://localhost:4000) (Serves integrated React UI & Node API)
- **Vite Hot-Reload URL:** [http://localhost:5173](http://localhost:5173)

---

## 🧠 What the App Does

1. **Concept Selection:** A learner picks one of the three Module 2 concepts:
   - `API key security`
   - `App memory`
   - `Foreign key placement`
2. **Learner Explanation:** Learner types their explanation in their own words and clicks **Submit**.
3. **Groq Gap Detection:** The Node server sends their explanation to the **Groq API** (key remains strictly server-side). Groq:
   - Identifies the exact sentence where the learner stopped thinking and started reciting buzzwords or textbook phrases.
   - Generates one targeted follow-up question to probe true mechanistic understanding.
4. **Follow-up Interaction:** The app shows the learner the flagged recited sentence and the follow-up question.
5. **Grading Against Database:** The learner submits their follow-up answer. The backend compares it against the pre-written `correct_answer` stored in Supabase `golden_pairs`.
   - If it matches the core technical principles: **Passed**
   - If evasive or repeating jargon: **Failed**
6. **Supabase Persistence:** Every step is recorded in Supabase across 4 relational tables.

---

## 🗄️ Supabase Database Schema

Paste this SQL script directly into your **Supabase Dashboard > SQL Editor**:

```sql
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

-- Enable Row Level Security (RLS) & Policies
ALTER TABLE golden_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;

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
```

---

## 🔒 Security & Environment Variables

Create `server/.env` with your credentials:

```bash
# Groq API Key (Server-side only)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_anon_key_here

# Port
PORT=4000
```

> **Note:** You can also configure or test keys directly in the web UI by clicking the **API & Database Settings** modal button in the top navigation bar.
