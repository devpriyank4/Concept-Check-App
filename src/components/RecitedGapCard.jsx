import React from 'react';
import { AlertTriangle, Quote, Sparkles } from 'lucide-react';

export default function RecitedGapCard({ recitedSentence, diagnosis }) {
  if (!recitedSentence) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-2 text-amber-400">
        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider">
          Groq Gap Detection • Recited Phrase Identified
        </span>
      </div>

      {/* Recited sentence quote */}
      <div className="relative pl-6 pr-4 py-3 rounded-xl bg-slate-950/80 border border-amber-500/20">
        <Quote className="w-4 h-4 text-amber-400/60 absolute left-2 top-3" />
        <p className="text-sm font-medium text-amber-100 italic leading-relaxed">
          "{recitedSentence}"
        </p>
      </div>

      {/* Diagnosis explanation */}
      {diagnosis && (
        <div className="flex items-start space-x-2 text-xs text-amber-200/80 pt-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-amber-300">Diagnostic insight:</strong> {diagnosis}
          </span>
        </div>
      )}
    </div>
  );
}
