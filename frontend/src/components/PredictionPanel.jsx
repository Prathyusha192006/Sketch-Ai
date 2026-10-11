import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Clock, 
  Eye, 
  Layers, 
  ChevronRight,
  SplitSquareVertical,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ConfidenceBars from './ConfidenceBars';
import { MODEL_CONFIGS } from '../utils/modelManager';

export default function PredictionPanel({
  prediction,
  selectedModelId,
  setSelectedModelId,
  mode,
  previewUrl,
  dualComparison,
  isDualMode,
  setIsDualMode,
  isPredicting
}) {
  const [showAllClasses, setShowAllClasses] = useState(false);
  const currentConfig = MODEL_CONFIGS[selectedModelId] || {};

  // Filter available models for current mode (digit or doodle)
  const availableModels = Object.values(MODEL_CONFIGS).filter(m => m.mode === mode);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Top Model Switcher & Mode Header */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Inference Engine
            </span>
          </div>

          {/* Toggle Dual Mode Comparison */}
          <button
            onClick={() => setIsDualMode(!isDualMode)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              isDualMode
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Dual Model Comparison</span>
          </button>
        </div>

        {/* Model Tabs */}
        {!isDualMode ? (
          <div className="grid grid-cols-2 gap-2">
            {availableModels.map((m) => {
              const isSelected = selectedModelId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {m.type} {m.type === 'CNN' ? 'Classifier' : 'Baseline'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {m.accuracy}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1">
                    {m.params.toLocaleString()} params • {m.sizeKb} KB
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-300 flex items-center space-x-2">
            <SplitSquareVertical className="w-4 h-4 shrink-0 text-purple-400" />
            <span>
              Evaluating <strong>ANN Baseline</strong> and <strong>CNN Classifier</strong> simultaneously on your drawing.
            </span>
          </div>
        )}
      </div>

      {/* Main Prediction Display Card */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient background effect */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="font-heading font-bold text-sm text-white tracking-wide">
              Prediction Output
            </h3>
          </div>

          {prediction && (
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Clock className="w-3 h-3" />
                <span>{prediction.latencyMs}ms</span>
              </span>
            </div>
          )}
        </div>

        {isPredicting ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Forward pass running on GPU/WebGL...</span>
          </div>
        ) : !prediction || !prediction.topPrediction ? (
          <div className="py-10 text-center space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-400">Canvas Ready</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Draw a {mode === 'digit' ? 'digit (0 to 9)' : 'sketch (cat, car, house, tree, flower)'} on the left to see real-time deep learning inference.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* Top Prediction Highlight Hero */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30">
              <div>
                <span className="text-[11px] font-medium text-indigo-300 uppercase tracking-wider block mb-1">
                  Top Classification
                </span>
                <div className="flex items-baseline space-x-3">
                  <span className="font-heading font-extrabold text-4xl text-white capitalize tracking-tight">
                    {prediction.topPrediction.label}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {prediction.topPrediction.percentage}% confidence
                  </span>
                </div>
              </div>

              {/* Preprocessed 28x28 Tensor Inspection Thumbnail */}
              {previewUrl && (
                <div className="flex flex-col items-center group relative">
                  <div className="relative p-1 rounded-lg bg-black border border-indigo-500/40 shadow-md">
                    <img
                      src={previewUrl}
                      alt="Normalized 28x28 Tensor"
                      className="w-12 h-12 image-rendering-pixelated rounded"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 flex items-center">
                    <Eye className="w-2.5 h-2.5 mr-0.5" /> 28×28 Tensor
                  </span>
                </div>
              )}
            </div>

            {/* Confidence Distribution Bars */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Top Candidate Probabilities
                </span>
                <button
                  onClick={() => setShowAllClasses(!showAllClasses)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {showAllClasses ? 'Show Top 3' : 'View All Classes'}
                </button>
              </div>

              <ConfidenceBars 
                predictions={prediction.allPredictions} 
                showAll={showAllClasses} 
              />
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
