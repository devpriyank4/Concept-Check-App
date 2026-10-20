import React, { useState } from 'react';
import { HelpCircle, Send, Sparkles, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import RecitedGapCard from './RecitedGapCard';

const SAMPLE_FOLLOWUP_ANSWERS = {
  'API key security': {
    good: "Client bundles and browser network requests are completely exposed to end-users who can inspect any embedded secret. Private keys must remain on a secure backend server environment variable, and requests must be routed via a backend proxy endpoint that authenticates the user and rate limits requests.",
    poor: "Because environment variables are just the standard recommended pattern in every React documentation guide and developers shouldn't put secrets in React state."
  },
  'App memory': {
    good: "Garbage collection works by tracing active references from root objects like window. A memory leak occurs when un-cleared event listeners or intervals retain references to detached DOM nodes or large closure scopes, preventing the engine from freeing the heap memory.",
    poor: "The browser just cleans up RAM whenever it feels like it, so you have to run performance profiling tools to clean the memory."
  },
  'Foreign key placement': {
    good: "In a 1:N relationship, placing the foreign key on the child ('many') table maintains scalar integrity because each child has exactly one parent. Putting it on the parent ('one') side would require storing an array of child IDs, violating 1NF and breaking relational integrity.",
    poor: "You put it on the child because the child comes after the parent in chronological order and that's the best practice."
  }
};

export default function FollowupForm({
  concept,
  recitedSentence,
  followupQuestion,
  diagnosis,
  onSubmitFollowup,
  loading
}) {
  const [followupAnswer, setFollowupAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!followupAnswer.trim()) return;
    onSubmitFollowup(followupAnswer.trim());
  };

  const sample = SAMPLE_FOLLOWUP_ANSWERS[concept?.concept_name] || {};

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 1. Recited Sentence Warning Card */}
      <RecitedGapCard recitedSentence={recitedSentence} diagnosis={diagnosis} />

      {/* 2. Follow-up Question and Answer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>AI Follow-up Question</span>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug">
            {followupQuestion}
          </h3>
          <p className="text-xs text-slate-400">
            Address this specific mechanistic question to prove conceptual mastery. Your answer will be evaluated against the database's pre-written correct answer.
          </p>
        </div>

        {/* Quick Test Fillers */}
        {(sample.good || sample.poor) && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Presets (Click to test pass/fail):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sample.good && (
                <button
                  type="button"
                  onClick={() => setFollowupAnswer(sample.good)}
                  className="flex items-start space-x-2 p-2 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-left transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <div className="text-[11px]">
                    <span className="font-semibold block">Accurate Answer (Pass)</span>
                    <span className="text-emerald-400/70 line-clamp-1">Mechanistic understanding</span>
                  </div>
                </button>
              )}

              {sample.poor && (
                <button
                  type="button"
                  onClick={() => setFollowupAnswer(sample.poor)}
                  className="flex items-start space-x-2 p-2 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/40 text-rose-300 text-left transition-all"
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                  <div className="text-[11px]">
                    <span className="font-semibold block">Evasive Answer (Fail)</span>
                    <span className="text-rose-400/70 line-clamp-1">More vague jargon</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Your Follow-up Answer
            </label>
            <textarea
              rows={5}
              value={followupAnswer}
              onChange={(e) => setFollowupAnswer(e.target.value)}
              placeholder="Explain the specific technical mechanism..."
              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-600 transition-colors leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !followupAnswer.trim()}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-indigo-300" />
                <span>Checking Against Database Golden Answer...</span>
              </>
            ) : (
              <>
                <span>Submit Follow-up Check</span>
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
