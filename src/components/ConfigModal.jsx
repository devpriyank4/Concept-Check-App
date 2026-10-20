import React, { useState } from 'react';
import { X, Key, Database, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose, status, onRefreshStatus }) {
  const [groqKey, setGroqKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groq_api_key: groqKey || undefined,
          supabase_url: supabaseUrl || undefined,
          supabase_key: supabaseKey || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Configuration updated successfully!' });
        setGroqKey('');
        setSupabaseKey('');
        onRefreshStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update configuration.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">API & Database Settings</h3>
              <p className="text-xs text-slate-400">Keys are stored server-side in memory and never exposed to the browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pills */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <Sparkles className={`w-4 h-4 ${status?.groqConfigured ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-medium text-slate-300">Groq API</div>
              <div className="text-[11px] font-mono text-slate-400">
                {status?.groqConfigured ? '⚡ Connected' : '○ Fallback Mode'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <Database className={`w-4 h-4 ${status?.database?.isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-medium text-slate-300">Supabase DB</div>
              <div className="text-[11px] font-mono text-slate-400">
                {status?.database?.isConnected ? '🟢 Live Connected' : '📦 In-Memory DB'}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Groq API Key
            </label>
            <input
              type="password"
              placeholder={status?.groqConfigured ? '•••••••••••••••••••• (configured)' : 'gsk_...'}
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200 placeholder-slate-600 font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Get an API key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">console.groq.com</a>.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200 placeholder-slate-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Supabase Service Role Key or Anon Key
            </label>
            <input
              type="password"
              placeholder={status?.database?.isConnected ? '•••••••••••••••••••• (configured)' : 'eyJhbGciOi...'}
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200 placeholder-slate-600 font-mono"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${message.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={onRefreshStatus}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading || (!groqKey && !supabaseUrl && !supabaseKey)}
                className="px-4 py-2 text-xs font-medium text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
