import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import DrawingCanvas from './components/DrawingCanvas';
import PredictionPanel from './components/PredictionPanel';
import DualModelComparison from './components/DualModelComparison';
import PersonalizedFeedbackCard from './components/PersonalizedFeedbackCard';
import LearningCenter from './components/LearningCenter';
import EvaluationDashboard from './components/EvaluationDashboard';
import PerformanceDashboard from './components/PerformanceDashboard';
import HistoryView from './components/HistoryView';
import CustomDatasetWorkflow from './components/CustomDatasetWorkflow';
import DocumentationView from './components/DocumentationView';

import { preprocessCanvas } from './utils/preprocessor';
import { 
  MODEL_CONFIGS, 
  loadModel, 
  predictSketch, 
  predictDualComparison 
} from './utils/modelManager';
import { analyzeDrawingFeedback } from './utils/feedbackEngine';
import { 
  getHistory, 
  saveHistoryItem, 
  getProgress, 
  updateProgress, 
  INITIAL_CHALLENGES 
} from './utils/storage';
import confetti from 'canvas-confetti';
import * as tf from '@tensorflow/tfjs';

export default function App() {
  // Navigation & Mode
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'learning' | 'evaluation' | 'telemetry' | 'history' | 'custom' | 'docs'
  const [mode, setMode] = useState('digit'); // 'digit' | 'doodle'
  const [selectedModelId, setSelectedModelId] = useState('mnist-cnn');
  const [isDualMode, setIsDualMode] = useState(false);
  const [currentTarget, setCurrentTarget] = useState('7');

  // Prediction State
  const [prediction, setPrediction] = useState(null);
  const [dualResult, setDualResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // History & Progress
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(getProgress());

  // Performance Telemetry
  const [telemetry, setTelemetry] = useState({
    loadTimeMs: 0,
    lastLatencyMs: 0,
    avgLatencyMs: 0,
    totalPredictions: 0,
    backend: 'webgl',
    latencyHistory: []
  });

  const lastCanvasRef = useRef(null);

  // Load initial data
  useEffect(() => {
    setHistory(getHistory());
    setProgress(getProgress());

    // Detect TFJS Backend
    tf.ready().then(() => {
      setTelemetry(prev => ({ ...prev, backend: tf.getBackend() }));
    });
  }, []);

  // Sync default model and target when mode changes
  useEffect(() => {
    if (mode === 'digit') {
      setSelectedModelId('mnist-cnn');
      setCurrentTarget('7');
    } else {
      setSelectedModelId('doodle-cnn');
      setCurrentTarget('cat');
    }
    // Pre-warm model
    const warmupId = mode === 'digit' ? 'mnist-cnn' : 'doodle-cnn';
    loadModel(warmupId).then(res => {
      setTelemetry(prev => ({ ...prev, loadTimeMs: res.loadTimeMs }));
    }).catch(console.error);
  }, [mode]);

  // Main drawing inference processor
  const processCanvasDrawing = useCallback(async (canvas) => {
    if (!canvas) return;
    lastCanvasRef.current = canvas;

    const prep = preprocessCanvas(canvas, true);

    if (prep.isEmpty) {
      setPrediction(null);
      setDualResult(null);
      setPreviewUrl(null);
      setFeedback(null);
      return;
    }

    setPreviewUrl(prep.previewUrl);
    setIsPredicting(true);

    try {
      if (isDualMode) {
        // Run both ANN and CNN
        const dual = await predictDualComparison(mode, prep.tensorData);
        setDualResult(dual);
        setPrediction(dual.cnn);

        // Update telemetry
        const lat = dual.cnn.latencyMs;
        setTelemetry(prev => {
          const hist = [...prev.latencyHistory, lat].slice(-20);
          const total = prev.totalPredictions + 1;
          const avg = Math.round((prev.avgLatencyMs * (total - 1) + lat) / total);
          return {
            ...prev,
            lastLatencyMs: lat,
            avgLatencyMs: avg,
            totalPredictions: total,
            latencyHistory: hist
          };
        });

        // Feedback based on CNN
        handleFeedbackAndGamification(dual.cnn, prep.box, prep.previewUrl);
      } else {
        // Run single selected model
        const res = await predictSketch(selectedModelId, prep.tensorData);
        setPrediction(res);
        setDualResult(null);

        const lat = res.latencyMs;
        setTelemetry(prev => {
          const hist = [...prev.latencyHistory, lat].slice(-20);
          const total = prev.totalPredictions + 1;
          const avg = Math.round((prev.avgLatencyMs * (total - 1) + lat) / total);
          return {
            ...prev,
            lastLatencyMs: lat,
            avgLatencyMs: avg,
            totalPredictions: total,
            latencyHistory: hist
          };
        });

        handleFeedbackAndGamification(res, prep.box, prep.previewUrl);
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsPredicting(false);
    }
  }, [mode, selectedModelId, isDualMode, currentTarget]);

  // Handle drawing feedback, gamification points, challenges, and history
  const handleFeedbackAndGamification = (predResult, box, preview) => {
    if (!predResult || !predResult.topPrediction) return;

    const top = predResult.topPrediction;
    const isMatch = String(top.label).toLowerCase() === String(currentTarget).toLowerCase();

    // 1. Analyze feedback
    const fb = analyzeDrawingFeedback(currentTarget, predResult, box);
    setFeedback(fb);

    // 2. Save to history
    saveHistoryItem({
      mode,
      modelId: predResult.modelId,
      predictedLabel: top.label,
      confidence: top.confidence,
      target: currentTarget,
      isMatch,
      previewUrl: preview
    });
    setHistory(getHistory());

    // 3. Update gamification progress
    const updated = updateProgress(curr => {
      let pts = curr.points;
      let streak = curr.streak;
      let bestStreak = curr.bestStreak;
      let comp = { ...curr.completedChallenges };
      let badges = { ...curr.unlockedBadges };

      // Badge: first_stroke
      badges['first_stroke'] = true;

      // Badge: bullseye
      if (top.confidence >= 0.95) {
        badges['bullseye'] = true;
      }

      // Badge: model_explorer
      if (predResult.modelId.includes('ann')) {
        curr.hasTestedAnn = true;
      }
      if (predResult.modelId.includes('cnn')) {
        curr.hasTestedCnn = true;
      }
      if (curr.hasTestedAnn && curr.hasTestedCnn) {
        badges['model_explorer'] = true;
      }

      if (isMatch) {
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
        pts += 25; // base match points

        if (streak >= 3) {
          badges['streak_3'] = true;
        }

        // Check active challenges
        INITIAL_CHALLENGES.forEach(ch => {
          if (!comp[ch.id] && ch.mode === mode && String(ch.target).toLowerCase() === String(currentTarget).toLowerCase()) {
            if (top.confidence >= ch.minConfidence) {
              comp[ch.id] = true;
              pts += ch.points;
              // Confetti on completing challenge!
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            }
          }
        });

        // Record drawn class
        curr.drawnClasses = curr.drawnClasses || {};
        curr.drawnClasses[top.label] = true;
        const allDoodles = ['cat', 'car', 'house', 'tree', 'flower', 'star', 'apple', 'fish', 'airplane', 'cloud'];
        if (allDoodles.every(d => curr.drawnClasses[d])) {
          badges['doodle_all'] = true;
        }

        if (pts >= 500) {
          badges['master_sketcher'] = true;
        }
      } else {
        streak = 0;
      }

      return {
        ...curr,
        points: pts,
        streak,
        bestStreak,
        totalAttempts: (curr.totalAttempts || 0) + 1,
        successfulAttempts: (curr.successfulAttempts || 0) + (isMatch ? 1 : 0),
        completedChallenges: comp,
        unlockedBadges: badges
      };
    });

    setProgress(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Application Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={mode}
        setMode={setMode}
        telemetry={telemetry}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: DRAWING STUDIO */}
        {activeTab === 'canvas' && (
          <div className="space-y-6">
            
            {/* Quick Practice Mode Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-slate-800">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-300">Practice Goal:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold capitalize border border-indigo-500/30">
                  Target: {currentTarget}
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">
                  Mode: <strong className="text-white capitalize">{mode === 'digit' ? 'MNIST Digits' : 'QuickDraw'}</strong>
                </span>
              </div>

              {/* Quick Target Changer */}
              <div className="flex items-center space-x-1 flex-wrap">
                <span className="text-xs text-slate-400 mr-1 hidden md:inline">Change Target:</span>
                {(mode === 'digit' 
                  ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] 
                  : ['cat', 'car', 'house', 'tree', 'flower', 'star', 'apple', 'fish', 'airplane', 'cloud']
                ).map(t => (
                  <button
                    key={t}
                    onClick={() => setCurrentTarget(t)}
                    className={`px-2 py-0.5 rounded text-xs font-bold capitalize transition-all ${
                      currentTarget === t
                        ? 'bg-pink-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Two-Column Drawing & Prediction Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Interactive Canvas (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <DrawingCanvas
                  onDrawingChange={processCanvasDrawing}
                  mode={mode}
                  setMode={setMode}
                  isPredicting={isPredicting}
                  autoPredict={true}
                  onManualPredict={processCanvasDrawing}
                />
              </div>

              {/* Right Column: Prediction Engine & Feedback (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-5">
                
                {isDualMode ? (
                  <DualModelComparison
                    dualResult={dualResult}
                    mode={mode}
                  />
                ) : (
                  <PredictionPanel
                    prediction={prediction}
                    selectedModelId={selectedModelId}
                    setSelectedModelId={setSelectedModelId}
                    mode={mode}
                    previewUrl={previewUrl}
                    dualComparison={dualResult}
                    isDualMode={isDualMode}
                    setIsDualMode={setIsDualMode}
                    isPredicting={isPredicting}
                  />
                )}

                {/* Personalized Drawing Feedback Card */}
                {feedback && (
                  <PersonalizedFeedbackCard feedback={feedback} />
                )}

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: LEARNING CENTER */}
        {activeTab === 'learning' && (
          <LearningCenter
            progress={progress}
            currentTarget={currentTarget}
            setCurrentTarget={setCurrentTarget}
            mode={mode}
            setMode={setMode}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 3: MODEL EVALUATION DASHBOARD */}
        {activeTab === 'evaluation' && (
          <EvaluationDashboard />
        )}

        {/* TAB 4: BROWSER PERFORMANCE TELEMETRY */}
        {activeTab === 'telemetry' && (
          <PerformanceDashboard
            telemetry={telemetry}
            mode={mode}
          />
        )}

        {/* TAB 5: PREDICTION HISTORY */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onHistoryCleared={() => setHistory([])}
          />
        )}

        {/* TAB 6: CUSTOM TRAINING WORKFLOW */}
        {activeTab === 'custom' && (
          <CustomDatasetWorkflow />
        )}

        {/* TAB 7: DOCUMENTATION & INTERVIEW GUIDE */}
        {activeTab === 'docs' && (
          <DocumentationView />
        )}

      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SketchAI &copy; {new Date().getFullYear()} &bull; Intelligent Sketch Recognition and Learning System
          </span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Client-Side TensorFlow.js</span>
            <span>&bull;</span>
            <span>Python & Keras CNN/ANN</span>
            <span>&bull;</span>
            <span>Accenture Placement Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
