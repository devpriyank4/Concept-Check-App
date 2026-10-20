import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Database, Clock, User, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'schema'

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Database Inspector</h3>
              <p className="text-xs text-slate-400">Live records across golden_pairs, sessions, attempts, gaps</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Database className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-600" />
              <p className="text-sm">No session records yet.</p>
              <p className="text-xs text-slate-500 mt-1">Complete a concept check above to see live database records stored here.</p>
            </div>
          ) : (
            history.map((session, idx) => {
              const goldenPair = session.golden_pairs || {};
              const attempts = session.attempts || [];

              return (
                <div key={session.id || idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  {/* Session Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-sm font-semibold text-white">{session.learner_nickname}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-medium">
                        {goldenPair.concept_name || 'Concept'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Session metadata ids */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                    <div className="truncate">
                      <span className="text-slate-400">session_id:</span> {session.id?.slice(0, 13)}...
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400">golden_pair_id:</span> {session.golden_pair_id?.slice(0, 13)}...
                    </div>
                  </div>

                  {/* Attempts list */}
                  {attempts.map((att, aIdx) => (
                    <div key={att.id || aIdx} className="p-3 rounded-lg bg-slate-900 border border-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">
                          attempt_id: {att.id?.slice(0, 12)}...
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {att.passed === true && (
                            <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Passed</span>
                            </span>
                          )}
                          {att.passed === false && (
                            <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          )}
                          {att.passed === null && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                              Pending Follow-up
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400 font-mono text-[11px] block mb-0.5">what_they_said:</span>
                        <p className="bg-slate-950/60 p-2 rounded border border-slate-800/80 italic">
                          "{att.what_they_said}"
                        </p>
                      </div>

                      {/* Gaps detected */}
                      {att.gaps && att.gaps.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          {att.gaps.map((gap, gIdx) => (
                            <div key={gap.id || gIdx} className="p-2.5 rounded bg-amber-950/20 border border-amber-900/30 text-xs space-y-1">
                              <div className="text-[11px] font-semibold text-amber-400 flex items-center space-x-1">
                                <span>Recited sentence flagged by Groq:</span>
                              </div>
                              <p className="text-amber-200/90 italic font-mono text-[11px]">
                                "{gap.recited_sentence}"
                              </p>
                              <div className="text-[11px] font-semibold text-indigo-400 pt-1">
                                Follow-up question:
                              </div>
                              <p className="text-indigo-200 text-xs">
                                {gap.followup_question}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
