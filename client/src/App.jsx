import React, { useState, useEffect } from 'react';
import {
  Brain,
  Database,
  Key,
  Code2,
  Table,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';

import ConceptSelector from './components/ConceptSelector';
import ExplanationForm from './components/ExplanationForm';
import FollowupForm from './components/FollowupForm';
import ResultCard from './components/ResultCard';
import SqlModal from './components/SqlModal';
import HistoryDrawer from './components/HistoryDrawer';
import ConfigModal from './components/ConfigModal';

const STEPS = {
  SELECT: 'SELECT',
  EXPLAIN: 'EXPLAIN',
  FOLLOWUP: 'FOLLOWUP',
  RESULT: 'RESULT'
};

// Safe API Fetch wrapper to prevent "unexpected end of JSON input" errors
async function safeApiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error(`Cannot reach backend server (${netErr.message}). Verify it is running on http://127.0.0.1:4000.`);
  }

  const rawText = await res.text();
  if (!rawText || !rawText.trim()) {
    throw new Error(`Server returned an empty response (Status ${res.status}). Ensure backend is online.`);
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (jsonErr) {
    throw new Error(`Invalid response format from server (${res.status}): ${rawText.slice(0, 140)}`);
  }

  if (!res.ok || data.success === false) {
    throw new Error(data?.error || `Server error (Status ${res.status})`);
  }

  return data;
}

export default function App() {
  const [step, setStep] = useState(STEPS.SELECT);
  const [concepts, setConcepts] = useState([]);
  const [status, setStatus] = useState(null);

  // Active session & evaluation state
  const [session, setSession] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [gapData, setGapData] = useState(null); // { attempt_id, gap_id, recited_sentence, followup_question, diagnosis }
  const [resultData, setResultData] = useState(null);

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Fetch status & concepts on mount
  const refreshStatus = async () => {
    try {
      const data = await safeApiFetch('/api/status');
      setStatus(data);
    } catch (err) {
      console.warn('Could not fetch server status:', err.message);
    }
  };

  const fetchConcepts = async () => {
    try {
      const data = await safeApiFetch('/api/concepts');
      if (data.concepts) {
        setConcepts(data.concepts);
      }
    } catch (err) {
      console.warn('Could not fetch concepts:', err.message);
    }
  };

  useEffect(() => {
    refreshStatus();
    fetchConcepts();
  }, []);

  // 1. Start Session
  const handleStartSession = async ({ golden_pair_id, learner_nickname }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await safeApiFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ golden_pair_id, learner_nickname })
      });

      setSession(data.session);
      setSelectedConcept(data.concept);
      setStep(STEPS.EXPLAIN);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit initial explanation -> Groq detects gap
  const handleSubmitExplanation = async (explanation) => {
    setLoading(true);
    setError(null);

    try {
      const data = await safeApiFetch('/api/analyze-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          explanation
        })
      });

      setGapData({
        attempt_id: data.attempt_id,
        gap_id: data.gap_id,
        recited_sentence: data.recited_sentence,
        followup_question: data.followup_question,
        diagnosis: data.diagnosis
      });
      setStep(STEPS.FOLLOWUP);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit follow-up answer -> Grade against golden answer in DB
  const handleSubmitFollowup = async (follow_up_answer) => {
    setLoading(true);
    setError(null);

    try {
      const data = await safeApiFetch('/api/check-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: gapData.attempt_id,
          session_id: session.id,
          follow_up_answer
        })
      });

      setResultData(data);
      setStep(STEPS.RESULT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(STEPS.SELECT);
    setSession(null);
    setSelectedConcept(null);
    setGapData(null);
    setResultData(null);
    setError(null);
    refreshStatus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-600/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-tight">Concept Check</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Module 2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Cognitive Gap Diagnostic • Groq & Supabase
              </p>
            </div>
          </div>

          {/* Action buttons and Status Pills */}
          <div className="flex items-center space-x-2">
            {/* Supabase Status Pill */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition-colors"
              title="Click to view database connection status"
            >
              <Database className={`w-3.5 h-3.5 ${status?.database?.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden md:inline font-mono text-[11px]">
                {status?.database?.isConnected ? 'Supabase Connected' : 'In-Memory DB'}
              </span>
            </button>

            {/* Groq Status Pill */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition-colors"
              title="Click to configure Groq API Key"
            >
              <Sparkles className={`w-3.5 h-3.5 ${status?.groqConfigured ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline font-mono text-[11px]">
                {status?.groqConfigured ? 'Groq Active' : 'Configure Groq'}
              </span>
            </button>

            {/* View SQL Button */}
            <button
              onClick={() => setShowSqlModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300 font-medium transition-colors"
              title="View SQL for Supabase"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQL</span>
            </button>

            {/* Inspect DB history button */}
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors border border-slate-700"
              title="Inspect live database records"
            >
              <Table className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Inspect DB</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-slate-900/30 border-b border-slate-800/60 py-3">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between text-xs font-medium">
          <div className={`flex items-center space-x-2 ${step === STEPS.SELECT ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === STEPS.SELECT ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span>Select Concept</span>
          </div>
          <div className="h-0.5 w-6 sm:w-12 bg-slate-800" />
          <div className={`flex items-center space-x-2 ${step === STEPS.EXPLAIN ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === STEPS.EXPLAIN ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span>Explain</span>
          </div>
          <div className="h-0.5 w-6 sm:w-12 bg-slate-800" />
          <div className={`flex items-center space-x-2 ${step === STEPS.FOLLOWUP ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === STEPS.FOLLOWUP ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span>Gap & Follow-up</span>
          </div>
          <div className="h-0.5 w-6 sm:w-12 bg-slate-800" />
          <div className={`flex items-center space-x-2 ${step === STEPS.RESULT ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === STEPS.RESULT ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>4</span>
            <span>Check & Result</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {step === STEPS.SELECT && (
          <ConceptSelector
            concepts={concepts}
            onStartSession={handleStartSession}
            loading={loading}
          />
        )}

        {step === STEPS.EXPLAIN && (
          <ExplanationForm
            session={session}
            concept={selectedConcept}
            onSubmitExplanation={handleSubmitExplanation}
            onBack={() => setStep(STEPS.SELECT)}
            loading={loading}
          />
        )}

        {step === STEPS.FOLLOWUP && (
          <FollowupForm
            concept={selectedConcept}
            recitedSentence={gapData?.recited_sentence}
            followupQuestion={gapData?.followup_question}
            diagnosis={gapData?.diagnosis}
            onSubmitFollowup={handleSubmitFollowup}
            loading={loading}
          />
        )}

        {step === STEPS.RESULT && (
          <ResultCard
            result={resultData}
            concept={selectedConcept}
            onReset={handleReset}
            onOpenHistory={() => setShowHistoryDrawer(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-6 text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>Concept Check Diagnostic</span>
            <span>•</span>
            <span className="text-slate-400">4 Supabase Tables: golden_pairs, sessions, attempts, gaps</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSqlModal(true)}
              className="hover:text-slate-200 transition-colors underline"
            >
              Supabase SQL
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="hover:text-slate-200 transition-colors underline"
            >
              API Credentials
            </button>
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="hover:text-slate-200 transition-colors underline"
            >
              Live Records
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SqlModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
      <HistoryDrawer isOpen={showHistoryDrawer} onClose={() => setShowHistoryDrawer(false)} />
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        status={status}
        onRefreshStatus={refreshStatus}
      />
    </div>
  );
}
