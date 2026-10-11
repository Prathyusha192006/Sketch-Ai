import React, { useState } from 'react';
import { 
  BarChart3, 
  Cpu, 
  Zap, 
  CheckCircle, 
  TrendingUp, 
  Layers, 
  Clock, 
  Database,
  ArrowUpRight,
  Info,
  Grid
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

import mnistEval from '../data/mnist_evaluation.json';
import doodleEval from '../data/doodle_evaluation.json';

export default function EvaluationDashboard() {
  const [datasetType, setDatasetType] = useState('mnist'); // 'mnist' | 'doodle'
  const [selectedCmModel, setSelectedCmModel] = useState('cnn'); // 'ann' | 'cnn'
  const [activeCell, setActiveCell] = useState(null);

  const currentEval = datasetType === 'mnist' ? mnistEval : doodleEval;
  const ann = currentEval.models.ann;
  const cnn = currentEval.models.cnn;
  const labels = currentEval.class_labels;

  // Prepare Recharts data for Training Curves
  const epochsCount = ann.training_history.accuracy.length;
  const trainingCurvesData = Array.from({ length: epochsCount }).map((_, idx) => ({
    epoch: `Epoch ${idx + 1}`,
    annTrainAcc: Math.round(ann.training_history.accuracy[idx] * 1000) / 10,
    annValAcc: Math.round(ann.training_history.val_accuracy[idx] * 1000) / 10,
    cnnTrainAcc: Math.round(cnn.training_history.accuracy[idx] * 1000) / 10,
    cnnValAcc: Math.round(cnn.training_history.val_accuracy[idx] * 1000) / 10,
    annTrainLoss: Math.round(ann.training_history.loss[idx] * 1000) / 1000,
    annValLoss: Math.round(ann.training_history.val_loss[idx] * 1000) / 1000,
    cnnTrainLoss: Math.round(cnn.training_history.loss[idx] * 1000) / 1000,
    cnnValLoss: Math.round(cnn.training_history.val_loss[idx] * 1000) / 1000,
  }));

  // Latency & Params Bar Data
  const benchmarkData = [
    {
      name: 'ANN Baseline',
      accuracy: Math.round(ann.test_accuracy * 1000) / 10,
      f1Score: Math.round(ann.weighted_f1 * 1000) / 10,
      latency: ann.inference_latency_ms,
      params: Math.round(ann.total_parameters / 1000)
    },
    {
      name: 'CNN Classifier',
      accuracy: Math.round(cnn.test_accuracy * 1000) / 10,
      f1Score: Math.round(cnn.weighted_f1 * 1000) / 10,
      latency: cnn.inference_latency_ms,
      params: Math.round(cnn.total_parameters / 1000)
    }
  ];

  // Confusion matrix active data
  const currentCm = selectedCmModel === 'cnn' ? cnn.confusion_matrix : ann.confusion_matrix;
  const maxCmVal = Math.max(...currentCm.flat());

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Empirical Model Performance Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
            ANN Baseline vs. CNN Classifier Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Measured against {currentEval.test_dataset_size.toLocaleString()} held-out test samples on actual Python TensorFlow test suite.
          </p>
        </div>

        {/* Dataset Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { setDatasetType('mnist'); setActiveCell(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              datasetType === 'mnist'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MNIST Digits (10 Classes)
          </button>
          <button
            onClick={() => { setDatasetType('doodle'); setActiveCell(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              datasetType === 'doodle'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            QuickDraw Doodles (5 Classes)
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Test Accuracy */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Test Set Accuracy</span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-heading font-extrabold text-emerald-400">
                {(cnn.test_accuracy * 100).toFixed(2)}%
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">CNN Classifier</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-heading font-bold text-slate-300">
                {(ann.test_accuracy * 100).toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">ANN Base</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium">
            +{( (cnn.test_accuracy - ann.test_accuracy) * 100 ).toFixed(2)}% gain with Conv2D
          </div>
        </div>

        {/* F1-Score */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Weighted F1-Score</span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-heading font-extrabold text-indigo-400">
                {cnn.weighted_f1.toFixed(4)}
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">CNN Balanced</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-heading font-bold text-slate-300">
                {ann.weighted_f1.toFixed(4)}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">ANN Base</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-indigo-300 font-mono">
            Macro F1: {cnn.macro_f1.toFixed(4)}
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Inference Latency</span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-heading font-extrabold text-white">
                {cnn.inference_latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">CNN GPU/Batch</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-heading font-bold text-slate-300">
                {ann.inference_latency_ms} ms
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">ANN Base</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Both &lt;100ms real-time latency
          </div>
        </div>

        {/* Parameter Overhead */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Model Parameters</span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-heading font-extrabold text-pink-400">
                {(cnn.total_parameters / 1000).toFixed(0)}k
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">CNN Weights</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-heading font-bold text-slate-300">
                {(ann.total_parameters / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">ANN Base</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Shard: ~879 KB vs ~427 KB
          </div>
        </div>

      </div>

      {/* Comprehensive Comparison Table */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
        <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Full Architectural & Performance Metric Comparison</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Evaluation Metric</th>
                <th className="py-2.5 px-3 font-semibold text-indigo-300">Baseline ANN (MLP)</th>
                <th className="py-2.5 px-3 font-semibold text-pink-300">High-Accuracy CNN</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-400">Empirical Difference / Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Architecture Type</td>
                <td className="py-2.5 px-3 text-slate-400">Flatten &rarr; Dense(128) &rarr; Dense(64)</td>
                <td className="py-2.5 px-3 text-slate-300 font-bold">Conv2D(32) &rarr; MaxPool &rarr; Conv2D(64) &rarr; Dense</td>
                <td className="py-2.5 px-3 text-slate-300">CNN learns translation-invariant spatial filters</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Test Accuracy</td>
                <td className="py-2.5 px-3 text-slate-300">{(ann.test_accuracy * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">{(cnn.test_accuracy * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-emerald-400">+{( (cnn.test_accuracy - ann.test_accuracy) * 100 ).toFixed(2)}% Higher Precision</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Weighted Precision</td>
                <td className="py-2.5 px-3 text-slate-300">{ann.weighted_precision.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-indigo-300 font-bold">{cnn.weighted_precision.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-slate-400">Significantly lower false-positive rate</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Weighted Recall</td>
                <td className="py-2.5 px-3 text-slate-300">{ann.weighted_recall.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-indigo-300 font-bold">{cnn.weighted_recall.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-slate-400">Captures edge strokes without missing classes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Weighted F1-Score</td>
                <td className="py-2.5 px-3 text-slate-300">{ann.weighted_f1.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-indigo-300 font-bold">{cnn.weighted_f1.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-emerald-400">Optimal Harmonic Mean of Precision & Recall</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Total Trainable Params</td>
                <td className="py-2.5 px-3 text-indigo-400 font-bold">{ann.total_parameters.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-slate-300">{cnn.total_parameters.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-slate-400">ANN has ~50% fewer parameters</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-300">Binary Shard Size</td>
                <td className="py-2.5 px-3 text-indigo-400 font-bold">~427 KB</td>
                <td className="py-2.5 px-3 text-slate-300">~879 KB</td>
                <td className="py-2.5 px-3 text-slate-400">ANN downloads 2x faster over cellular networks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Training & Validation Curves (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Accuracy Curves */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs text-white">
              Training & Validation Accuracy Progression
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Across Epochs</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingCurvesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={['dataMin - 2', 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="annValAcc" name="ANN Val Acc" stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cnnValAcc" name="CNN Val Acc" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loss Curves */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs text-white">
              Categorical Crossentropy Loss Convergence
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Log Loss</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingCurvesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="annValLoss" name="ANN Val Loss" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cnnValLoss" name="CNN Val Loss" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Interactive Confusion Matrix Heatmap */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-2">
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>Interactive Confusion Matrix Heatmap</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Row: True Class • Column: Predicted Class. Hover or click cells to inspect true vs predicted counts.
            </p>
          </div>

          {/* Model Switcher for Confusion Matrix */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => { setSelectedCmModel('ann'); setActiveCell(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCmModel === 'ann'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ANN Matrix
            </button>
            <button
              onClick={() => { setSelectedCmModel('cnn'); setActiveCell(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCmModel === 'cnn'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CNN Matrix
            </button>
          </div>
        </div>

        {/* Matrix Visualization */}
        <div className="flex flex-col items-center">
          <div className="overflow-x-auto max-w-full p-2">
            
            {/* Header Columns */}
            <div className="flex items-center ml-12 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Predicted:</span>
              <div className="flex gap-1">
                {labels.map((l, cIdx) => (
                  <div key={cIdx} className="w-9 text-center text-xs font-bold text-slate-300 capitalize truncate">
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-1">
              {currentCm.map((row, rIdx) => (
                <div key={rIdx} className="flex items-center">
                  <div className="w-12 text-right pr-2 text-xs font-bold text-slate-300 capitalize truncate">
                    {labels[rIdx]}
                  </div>

                  <div className="flex gap-1">
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const intensity = val / maxCmVal;
                      const isSelected = activeCell && activeCell.row === rIdx && activeCell.col === cIdx;

                      // Color based on model and diagonal
                      let bgStyle;
                      if (selectedCmModel === 'cnn') {
                        bgStyle = isDiagonal
                          ? `rgba(16, 185, 129, ${Math.max(0.2, intensity)})`
                          : val > 0 ? `rgba(244, 63, 94, ${Math.min(0.8, (val / (maxCmVal * 0.1)))})` : 'rgba(30, 41, 59, 0.4)';
                      } else {
                        bgStyle = isDiagonal
                          ? `rgba(99, 102, 241, ${Math.max(0.2, intensity)})`
                          : val > 0 ? `rgba(244, 63, 94, ${Math.min(0.8, (val / (maxCmVal * 0.1)))})` : 'rgba(30, 41, 59, 0.4)';
                      }

                      return (
                        <button
                          key={cIdx}
                          onClick={() => setActiveCell({ row: rIdx, col: cIdx, val, trueLabel: labels[rIdx], predLabel: labels[cIdx] })}
                          onMouseEnter={() => setActiveCell({ row: rIdx, col: cIdx, val, trueLabel: labels[rIdx], predLabel: labels[cIdx] })}
                          style={{ backgroundColor: bgStyle }}
                          className={`w-9 h-9 rounded flex items-center justify-center text-[10px] font-mono transition-transform ${
                            isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105'
                          } ${isDiagonal ? 'font-bold text-white' : val > 0 ? 'text-rose-200' : 'text-slate-600'}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Active Cell Inspector */}
          {activeCell && (
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center space-x-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                True Class: <strong className="text-white capitalize">{activeCell.trueLabel}</strong> &rarr; 
                Predicted: <strong className="text-white capitalize">{activeCell.predLabel}</strong> &bull; 
                Test Samples: <strong className="text-emerald-400 font-mono">{activeCell.val}</strong> 
                {activeCell.row === activeCell.col ? ' (Correctly Classified)' : ' (Misclassification / Confusion)'}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
