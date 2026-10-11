import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Download, 
  Filter, 
  CheckCircle, 
  Clock, 
  Cpu, 
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { clearHistory } from '../utils/storage';

export default function HistoryView({ history = [], onHistoryCleared }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'digit' | 'doodle'

  const filtered = history.filter(item => {
    if (filterMode === 'all') return true;
    return item.mode === filterMode;
  });

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local prediction history?')) {
      clearHistory();
      if (onHistoryCleared) onHistoryCleared();
    }
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `sketchai_history_${Date.now()}.json`);
    dl.click();
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = ['id', 'timestamp', 'mode', 'modelId', 'predictedLabel', 'confidence', 'target', 'isMatch'];
    const rows = history.map(h => [
      h.id,
      h.timestamp,
      h.mode,
      h.modelId,
      h.predictedLabel,
      h.confidence,
      h.target || '',
      h.isMatch !== undefined ? h.isMatch : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `sketchai_history_${Date.now()}.csv`);
    dl.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Local Browser Storage</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
            Prediction History & Gallery
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review your past drawing attempts, confidence scores, and architectural comparisons saved locally.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilterMode('digit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'digit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Digits
            </button>
            <button
              onClick={() => setFilterMode('doodle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'doodle' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Doodles
            </button>
          </div>

          {/* Export & Clear */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={exportJSON}
              disabled={history.length === 0}
              title="Export as JSON"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-all"
            >
              <FileJson className="w-4 h-4" />
            </button>
            <button
              onClick={exportCSV}
              disabled={history.length === 0}
              title="Export as CSV"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              disabled={history.length === 0}
              title="Clear Local History"
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 text-slate-400 disabled:opacity-40 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-300">No History Records Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Draw digits or sketches in the Drawing Studio to build your personal prediction portfolio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl glass-panel p-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              {/* Thumbnail & Prediction Header */}
              <div className="flex items-start space-x-3">
                {item.previewUrl ? (
                  <div className="w-16 h-16 rounded-xl bg-black border border-slate-700/80 p-1 shrink-0 overflow-hidden shadow-inner">
                    <img
                      src={item.previewUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-contain image-rendering-pixelated"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Cpu className="w-6 h-6 text-slate-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.mode}
                    </span>
                    {item.isMatch !== undefined && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        item.isMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.isMatch ? 'Match' : 'Mismatch'}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    <span className="text-xs text-slate-400 block">Classified As:</span>
                    <span className="font-heading font-extrabold text-xl text-white capitalize">
                      {item.predictedLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence & Model Meta */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>

                {item.target && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Intended Target:</span>
                    <span className="font-semibold text-indigo-300 capitalize">
                      {item.target}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                  <span>{item.modelId.includes('cnn') ? 'CNN' : 'ANN'}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
