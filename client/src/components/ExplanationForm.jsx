import React, { useState } from 'react';
import { Send, ArrowLeft, Lightbulb, Sparkles, HelpCircle } from 'lucide-react';

const PRESET_EXPLANATIONS = {
  'API key security': [
    {
      label: 'Recites buzzwords: "Best practice env variables"',
      text: "API keys are critical credentials used for authentication with external services. It is an industry best practice to never expose private keys in frontend client code. You should always store them securely in environment variables because that follows standard security guidelines."
    },
    {
      label: 'Recites jargon: "Next.js public runtime config"',
      text: "If you put your private API key in React state or JavaScript bundles, any user can inspect the devtools and steal it. You should always use a backend proxy. That is why enterprise security standards dictate defense in depth."
    }
  ],
  'App memory': [
    {
      label: 'Recites buzzwords: "Garbage collector sweeps memory"',
      text: "JavaScript engines handle memory automatically through the garbage collector which frees memory that is no longer in use. When you write bad code it causes a memory leak. Therefore developers should optimize their memory footprint."
    },
    {
      label: 'Recites textbook phrase: "Event listeners cause leaks"',
      text: "Memory is allocated in the heap for objects and variables. Modern browsers clean it up using mark-and-sweep. Event listeners on unmounted components cause memory leaks because the memory is still being held."
    }
  ],
  'Foreign key placement': [
    {
      label: 'Recites phrase: "Child references parent"',
      text: "In relational database design with tables like Customers and Orders, foreign keys establish relational integrity. The foreign key always goes on the child table to reference the parent primary key. This is a foundational rule of database normalization."
    },
    {
      label: 'Recites buzzwords: "One-to-many cardinality"',
      text: "When modeling a one-to-many relation, you need a foreign key constraint. You place it on the many table because that satisfies standard relational database design patterns."
    }
  ]
};

export default function ExplanationForm({ session, concept, onSubmitExplanation, onBack, loading }) {
  const [explanation, setExplanation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!explanation.trim()) return;
    onSubmitExplanation(explanation.trim());
  };

  const samplePresets = PRESET_EXPLANATIONS[concept?.concept_name] || [];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top concept header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Concept</span>
        </button>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
          Learner: {session?.learner_nickname}
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Concept Question prompt */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Concept Prompt: {concept?.concept_name}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug">
            {concept?.test_question || `Explain your understanding of ${concept?.concept_name}.`}
          </h3>
          <p className="text-xs text-slate-400">
            Explain the underlying mechanism in your own words. Avoid relying on buzzwords or memorized definitions.
          </p>
        </div>

        {/* Quick presets for testers */}
        {samplePresets.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Test Presets (Click to populate):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setExplanation(preset.text)}
                  className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 hover:border-indigo-500/40 border border-slate-800 text-slate-300 hover:text-white transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Your Explanation
            </label>
            <textarea
              rows={6}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Type your explanation here. Why does it work this way? What happens under the hood?..."
              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-600 transition-colors leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !explanation.trim()}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-indigo-300" />
                <span>Groq API Analyzing Recited Phrases...</span>
              </>
            ) : (
              <>
                <span>Submit Explanation</span>
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
