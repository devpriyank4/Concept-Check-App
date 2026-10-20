import React, { useState } from 'react';
import { ShieldAlert, Cpu, Database, ArrowRight, Sparkles, User } from 'lucide-react';

const CONCEPT_ICONS = {
  'API key security': ShieldAlert,
  'App memory': Cpu,
  'Foreign key placement': Database
};

const CONCEPT_DESCRIPTIONS = {
  'API key security': 'Protecting privileged credentials, client vs. server exposure, and proxy architecture.',
  'App memory': 'Heap allocation, references, garbage collection, and identifying subtle JavaScript memory leaks.',
  'Foreign key placement': 'Relational data modeling, cardinality, normal forms, and proper placement in 1:N relations.'
};

export default function ConceptSelector({ concepts, onStartSession, loading }) {
  const [selectedId, setSelectedId] = useState(concepts[0]?.id || '');
  const [nickname, setNickname] = useState('');

  // Fallback if concepts aren't loaded yet
  const displayConcepts = concepts.length > 0 ? concepts : [
    { id: '1', concept_name: 'API key security' },
    { id: '2', concept_name: 'App memory' },
    { id: '3', concept_name: 'Foreign key placement' }
  ];

  const handleStart = (e) => {
    e.preventDefault();
    const targetId = selectedId || displayConcepts[0]?.id;
    onStartSession({
      golden_pair_id: targetId,
      learner_nickname: nickname.trim() || 'Learner'
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Intro hero card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Module 2 • Conceptual Thinking Check</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Beyond Rote Memorization
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Select a concept and explain it in your own words. Our AI diagnostic detects when you stop reasoning and start reciting phrases, then stress-tests your true understanding.
        </p>
      </div>

      <form onSubmit={handleStart} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Step 1: Learner Nickname */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Learner Nickname</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Maya, DevPriyank, Ada..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Step 2: Select Concept */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Select Module 2 Concept
          </label>
          <div className="grid grid-cols-1 gap-3">
            {displayConcepts.map((c) => {
              const Icon = CONCEPT_ICONS[c.concept_name] || Database;
              const isSelected = (selectedId || displayConcepts[0]?.id) === c.id;

              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-4 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border mt-0.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {c.concept_name}
                      </h4>
                      {isSelected && (
                        <span className="text-[11px] font-medium text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {CONCEPT_DESCRIPTIONS[c.concept_name] || c.test_question || 'Module 2 foundational concept.'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <span>{loading ? 'Initializing Session...' : 'Start Concept Explanation'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>
    </div>
  );
}
