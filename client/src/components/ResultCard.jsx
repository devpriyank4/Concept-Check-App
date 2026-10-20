import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Database, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';

export default function ResultCard({
  result,
  concept,
  onReset,
  onOpenHistory
}) {
  const [showGoldenAnswer, setShowGoldenAnswer] = useState(true);

  if (!result) return null;

  const passed = Boolean(result.passed);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Result Status Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border shadow-xl text-center space-y-4 ${
        passed
          ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/40 shadow-emerald-500/10'
          : 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500/40 shadow-rose-500/10'
      }`}>
        <div className={`inline-flex p-3 rounded-2xl border ${
          passed
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        }`}>
          {passed ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <div>
          <div className="flex items-center justify-center space-x-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              passed ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {passed ? 'Concept Check: PASSED' : 'Concept Check: FAILED'}
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            {passed
              ? 'Your explanation successfully matched the core technical principles!'
              : 'Your follow-up answer did not sufficiently match the required technical mechanism.'}
          </p>
        </div>

        {/* Feedback box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Diagnostic Feedback</span>
            </span>
            {result.score !== undefined && (
              <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                passed ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
              }`}>
                Score: {result.score}/100
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {result.feedback}
          </p>
        </div>
      </div>

      {/* Golden Correct Answer from Database */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={() => setShowGoldenAnswer(!showGoldenAnswer)}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 border-b border-slate-800 text-left transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Database Pre-written Golden Answer</h4>
              <p className="text-xs text-slate-400">Stored in Supabase table <code className="text-indigo-300">golden_pairs.correct_answer</code></p>
            </div>
          </div>
          {showGoldenAnswer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showGoldenAnswer && (
          <div className="p-6 bg-slate-950/60 space-y-3">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              {result.correct_answer}
            </p>
            <div className="text-[11px] text-slate-400 flex items-center space-x-1">
              <span>This benchmark is used by Groq to evaluate learner answers against the golden standard.</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Another Concept Check</span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Inspect Supabase Record</span>
        </button>
      </div>
    </div>
  );
}
