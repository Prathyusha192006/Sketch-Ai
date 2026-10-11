import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Zap, 
  Layers, 
  Activity,
  ArrowRight
} from 'lucide-react';
import ConfidenceBars from './ConfidenceBars';

export default function DualModelComparison({ dualResult, mode }) {
  if (!dualResult || !dualResult.ann || !dualResult.cnn) {
    return (
      <div className="rounded-2xl glass-panel p-6 text-center text-slate-500 border border-slate-800">
        Draw on the canvas to see both the ANN Baseline and CNN Classifier evaluate your sketch in real time.
      </div>
    );
  }

  const { ann, cnn, agreement } = dualResult;
  const annTop = ann.topPrediction;
  const cnnTop = cnn.topPrediction;

  return (
    <div className="rounded-2xl glass-panel p-5 border border-slate-800 shadow-2xl space-y-5">
      
      {/* Consensus Banner */}
      <div
        className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
          agreement
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/25 border-amber-500/30 text-amber-200'
        }`}
      >
        {agreement ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}

        <div>
          <h4 className="text-sm font-bold tracking-wide">
            {agreement
              ? `Unanimous Consensus: Classified as "${cnnTop.label.toUpperCase()}"`
              : `Architectural Divergence Detected`}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {agreement
              ? `Both architectures agreed on the classification. CNN showed ${cnnTop.percentage}% confidence, while ANN showed ${annTop.percentage}% confidence.`
              : `ANN predicted "${annTop.label}" (${annTop.percentage}%), whereas CNN predicted "${cnnTop.label}" (${cnnTop.percentage}%). CNN convolutional feature maps preserve 2D spatial locality, making them robust against translation and stroke variations.`}
          </p>
        </div>
      </div>

      {/* Side-by-Side Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ANN Baseline Card */}
        <div className="rounded-xl p-4 bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                ANN Baseline (MLP)
              </span>
            </div>
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {ann.latencyMs}ms
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white capitalize">
              {annTop.label}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {annTop.percentage}% conf
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Probabilities:
            </span>
            <ConfidenceBars predictions={ann.allPredictions.slice(0, 3)} />
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Params: ~109K</span>
            <span>Input: Flattened (784)</span>
          </div>
        </div>

        {/* CNN Classifier Card */}
        <div className="rounded-xl p-4 bg-slate-900/70 border border-indigo-500/30 space-y-3 shadow-md shadow-indigo-950/20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                CNN Classifier (Deep)
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {cnn.latencyMs}ms
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white capitalize">
              {cnnTop.label}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {cnnTop.percentage}% conf
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Probabilities:
            </span>
            <ConfidenceBars predictions={cnn.allPredictions.slice(0, 3)} />
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Params: ~225K</span>
            <span>Input: 2D Tensor (28×28×1)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
