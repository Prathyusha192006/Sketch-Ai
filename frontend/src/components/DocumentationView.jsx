import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Cpu, 
  Zap, 
  CheckCircle, 
  FileCode, 
  ShieldCheck, 
  Award,
  HelpCircle,
  Activity
} from 'lucide-react';

export default function DocumentationView() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Documentation Hero */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Technical Whitepaper & Architecture</span>
        </div>
        <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight">
          Intelligent Sketch Recognition & Learning System
        </h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          An end-to-end Machine Learning and Modern Web Application integrating deep convolutional neural networks, computer vision preprocessing, real-time client-side TensorFlow.js inference, and interactive gamified learning.
        </p>
      </div>

      {/* System Architecture Section */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>1. System Architecture & End-to-End Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">1</span>
            <h4 className="font-bold text-white text-sm">HTML5 Canvas Capture</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Captures high-frequency stylus, touch, or mouse strokes at 60 FPS onto a 280×280 rendering context with undo stack history.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">2</span>
            <h4 className="font-bold text-white text-sm">Computer Vision Preprocessing</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Computes stroke bounding box, preserves aspect ratio, resizes into 20×20, calculates Center-of-Mass, and embeds into 28×28 grayscale tensor [0.0, 1.0].
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs">3</span>
            <h4 className="font-bold text-white text-sm">Client-Side TFJS Inference</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Runs trained CNN/ANN directly on browser GPU via WebGL shaders. Instant 10-25ms inference latency without sending private sketch data over HTTP.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">4</span>
            <h4 className="font-bold text-white text-sm">Drawing Coach & Analytics</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Analyzes feature activation probabilities, detects confusion pairs (e.g. 7 vs 1, cat vs car), and rewards user gamification streaks.
            </p>
          </div>
        </div>
      </div>

      {/* Model Specifications Section */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-pink-400" />
          <span>2. Deep Learning Model Architectures</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Baseline ANN */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-indigo-300 text-sm">Artificial Neural Network (ANN) Baseline</span>
              <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">109K params</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              <li>• <strong>Input Layer:</strong> Flatten(28 × 28 × 1) &rarr; 784-dimensional vector</li>
              <li>• <strong>Dense Hidden Layer 1:</strong> 128 units, ReLU activation, He Normal initialization</li>
              <li>• <strong>Regularization:</strong> Dropout (rate = 0.20) to prevent overfitting</li>
              <li>• <strong>Dense Hidden Layer 2:</strong> 64 units, ReLU activation</li>
              <li>• <strong>Output Layer:</strong> Softmax distribution over classes</li>
            </ul>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <strong>Limitation:</strong> Treats pixels as independent features and discards spatial 2D grid adjacency. Sensitive to stroke offsets.
            </p>
          </div>

          {/* CNN Classifier */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-pink-300 text-sm">Convolutional Neural Network (CNN)</span>
              <span className="font-mono text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">225K params</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              <li>• <strong>Conv Block 1:</strong> Conv2D(32 filters, 3×3 kernel, ReLU) + MaxPooling2D(2×2)</li>
              <li>• <strong>Conv Block 2:</strong> Conv2D(64 filters, 3×3 kernel, ReLU) + MaxPooling2D(2×2)</li>
              <li>• <strong>Dense Transition:</strong> Flatten() &rarr; Dense(128 units, ReLU)</li>
              <li>• <strong>Regularization:</strong> Dropout (rate = 0.25)</li>
              <li>• <strong>Output Layer:</strong> Softmax categorical distribution</li>
            </ul>
            <p className="text-[11px] text-emerald-400 pt-1 border-t border-slate-800/80">
              <strong>Strength:</strong> Receptive field hierarchies extract localized curves, loops, and junctions with translation invariance.
            </p>
          </div>

        </div>
      </div>

      {/* Preprocessing Mathematical Pipeline */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>3. Mathematical Foundations & Image Preprocessing</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-indigo-400 font-bold block text-sm">Center-of-Mass Alignment</span>
            <div className="p-2.5 rounded bg-slate-950 text-slate-300 text-[11px]">
              cx = &sum;(x &bull; I(x,y)) / &sum;I(x,y)<br />
              cy = &sum;(y &bull; I(x,y)) / &sum;I(x,y)<br />
              &Delta;x = 14 - cx, &Delta;y = 14 - cy
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Matches MNIST standard alignment by centering the drawing's mass around pixel coordinate (14, 14).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-pink-400 font-bold block text-sm">Softmax Probability & Cross-Entropy</span>
            <div className="p-2.5 rounded bg-slate-950 text-slate-300 text-[11px]">
              P(y = c | x) = e^(z_c) / &sum;_k e^(z_k)<br />
              L = -&sum; y_true_c &bull; log(P(y_c))
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Converts unnormalized raw logits into normalized probabilities summing to 1.0.
            </p>
          </div>
        </div>
      </div>

      {/* Placement & Interview Talking Points */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>4. Placement Interview Questions & Talking Points</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              Q: Why is client-side browser inference via TensorFlow.js advantageous over a traditional Python Flask backend?
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Answer:</strong> (1) <strong>Zero Network Latency:</strong> Inference executes on the client GPU via WebGL shaders in 10-25ms instead of waiting for a roundtrip HTTP payload. (2) <strong>Cost & Scalability:</strong> The application scales to 1,000,000 concurrent users without incurring any GPU cloud compute costs. (3) <strong>Data Privacy:</strong> User drawings never leave the local browser during core recognition. (4) <strong>Offline Capability:</strong> The PWA/web app functions seamlessly offline once models are cached.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              Q: What causes the performance delta between ANN (97.41%) and CNN (99.07%) on MNIST?
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Answer:</strong> An ANN treats each of the 784 pixels as an independent, unrelated variable. If a user shifts digit '7' five pixels to the left, all input indices change completely. In contrast, CNN convolution kernels slide across the 2D matrix, sharing weights and capturing local spatial features (edges, curves, loops) regardless of translation or stroke width.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              Q: How does the application prevent blank-canvas crashes or noisy false positives?
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Answer:</strong> The custom preprocessor inspects the pixel alpha and RGB luminosity matrix. If total ink mass falls below an empirical threshold, it marks <code className="text-indigo-300">isEmpty: true</code>, skipping redundant GPU inference and displaying an intuitive user prompt.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
