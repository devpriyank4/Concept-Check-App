import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink } from 'lucide-react';

export const SQL_SCHEMA_CONTENT = `-- ==============================================================================
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
  correct_answer = EXCLUDED.correct_answer;`;

export default function SqlModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Supabase SQL Schema</h3>
              <p className="text-xs text-slate-400">Creates the 4 tables and seeds the Module 2 golden pairs</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-900/30 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-indigo-300">Quick Setup:</span>
            <span>Open your Supabase project &rarr; Navigate to <strong>SQL Editor</strong> &rarr; Click <strong>New Query</strong> &rarr; Paste & click <strong>Run</strong>.</span>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre leading-relaxed select-all">
            {SQL_SCHEMA_CONTENT}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 text-xs text-slate-400">
          <span>Tables: <code className="text-slate-300">golden_pairs</code>, <code className="text-slate-300">sessions</code>, <code className="text-slate-300">attempts</code>, <code className="text-slate-300">gaps</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
