import React from 'react';
import { 
  Lightbulb, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Info
} from 'lucide-react';

export default function PersonalizedFeedbackCard({ feedback }) {
  if (!feedback) return null;

  const {
    target,
    predictedLabel,
    isMatch,
    confidence,
    status,
    title,
    explanation,
    topAlternative,
    suggestions,
    disclaimer
  } = feedback;

  const statusColors = {
    excellent: 'from-emerald-950/40 border-emerald-500/40 text-emerald-300',
    good: 'from-blue-950/40 border-blue-500/40 text-blue-300',
    confused: 'from-amber-950/40 border-amber-500/40 text-amber-300',
    incorrect: 'from-rose-950/40 border-rose-500/40 text-rose-300'
  };

  const statusIcons = {
    excellent: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    good: <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />,
    confused: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
    incorrect: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
  };

  return (
    <div className={`rounded-2xl glass-panel p-5 border bg-gradient-to-b ${statusColors[status] || statusColors.confused} shadow-xl space-y-4`}>
      
      {/* Title & Target Match Status */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          {statusIcons[status]}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              {title}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>Target: <strong className="text-indigo-300 capitalize">{target}</strong></span>
              <span>•</span>
              <span>Predicted: <strong className="text-pink-300 capitalize">{predictedLabel}</strong> ({Math.round(confidence * 100)}%)</span>
            </div>
          </div>
        </div>

        {/* Match / Mismatch Pill */}
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
            isMatch
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}
        >
          {isMatch ? 'Matched' : 'Discrepancy'}
        </span>
      </div>

      {/* Confusion Analysis Explanation */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center space-x-2 mb-1.5 text-xs font-semibold text-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Feature & Confusion Analysis:</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {explanation}
        </p>

        {topAlternative && !isMatch && (
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1.5">
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span>
              Second probable alternative was <strong>"{topAlternative.label}"</strong> ({Math.round(topAlternative.confidence * 100)}%).
            </span>
          </div>
        )}
      </div>

      {/* Actionable Drawing Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggestions to Enhance Feature Recognition:</span>
          </div>
          <ul className="grid grid-cols-1 gap-1.5 pl-2">
            {suggestions.map((tip, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistical Machine Learning Disclaimer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-[10px] text-slate-400 leading-tight">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
        <p>{disclaimer}</p>
      </div>

    </div>
  );
}
