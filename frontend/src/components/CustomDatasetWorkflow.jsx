import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Download, 
  Upload, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Play, 
  FileCode,
  Tag
} from 'lucide-react';
import { preprocessCanvas } from '../utils/preprocessor';

export default function CustomDatasetWorkflow() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('star');
  const [samples, setSamples] = useState([]);
  const [exportNotice, setExportNotice] = useState(null);

  // Initialize mini canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const clearMiniCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ffffff';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  // Add sample to dataset
  const handleAddSample = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const res = preprocessCanvas(canvas, true);
    if (res.isEmpty) {
      alert('Please draw a stroke on the canvas first!');
      return;
    }

    const newSample = {
      id: 'custom_' + Date.now(),
      label: currentLabel.trim().toLowerCase(),
      previewUrl: res.previewUrl,
      data: Array.from(res.tensorData)
    };

    setSamples(prev => [newSample, ...prev]);
    clearMiniCanvas();
  };

  const handleDeleteSample = (id) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  // Group samples by class
  const classCounts = samples.reduce((acc, s) => {
    acc[s.label] = (acc[s.label] || 0) + 1;
    return acc;
  }, {});

  const distinctClasses = Object.keys(classCounts);

  // Download Dataset JSON
  const handleDownloadDataset = () => {
    if (samples.length === 0) return;
    const datasetObj = {
      dataset_name: 'custom_sketch_dataset',
      created_at: new Date().toISOString(),
      classes: distinctClasses,
      total_samples: samples.length,
      samples: samples.map(s => ({
        label: s.label,
        data: s.data
      }))
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datasetObj, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', 'custom_dataset.json');
    dl.click();

    setExportNotice('Dataset saved! Follow the terminal command below to execute Python model training.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Wrench className="w-4 h-4" />
          <span>MLOps Workflow Studio</span>
        </div>
        <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
          Custom Dataset Preparation & Model Training
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Collect labeled drawing data, validate feature representations, export structured datasets, and train custom deep learning models with the integrated Python CLI pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Draw & Collect Data (1 Col) */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Draw Labeled Sample</span>
            </span>
            <button
              onClick={clearMiniCanvas}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="rounded-xl border border-slate-700 cursor-crosshair touch-none bg-[#090d16] shadow-md"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              Label / Category Tag:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentLabel}
                onChange={(e) => setCurrentLabel(e.target.value)}
                placeholder="e.g. star, triangle, fish..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-medium"
              />
              <button
                onClick={handleAddSample}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['star', 'heart', 'cloud', 'fish', 'diamond'].map((preset) => (
              <button
                key={preset}
                onClick={() => setCurrentLabel(preset)}
                className={`text-[10px] px-2 py-0.5 rounded border capitalize ${
                  currentLabel === preset
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Collected Dataset Inspector (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Collected Samples ({samples.length})
              </h3>
            </div>

            <button
              onClick={handleDownloadDataset}
              disabled={samples.length < 2}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export dataset.json</span>
            </button>
          </div>

          {/* Class Distribution Badges */}
          {distinctClasses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {distinctClasses.map(cls => (
                <span
                  key={cls}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span className="capitalize">{cls}:</span>
                  <strong className="text-white">{classCounts[cls]}</strong>
                </span>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 italic">
              Draw and save a few labeled sketches to see dataset distribution.
            </div>
          )}

          {/* Sample Thumbnail Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-56 overflow-y-auto p-1">
            {samples.map((s) => (
              <div
                key={s.id}
                className="group relative rounded-lg bg-black border border-slate-800 p-1 flex flex-col items-center shadow"
              >
                <img
                  src={s.previewUrl}
                  alt={s.label}
                  className="w-12 h-12 object-contain image-rendering-pixelated rounded"
                />
                <span className="text-[10px] font-mono text-slate-300 capitalize truncate max-w-full mt-1">
                  {s.label}
                </span>
                <button
                  onClick={() => handleDeleteSample(s.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Step 3: Python Training Command Terminal Guide */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Step 3: Execute Python Model Training Pipeline</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Once exported, place <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">custom_dataset.json</code> into <code className="text-slate-300">dataset/</code> and execute:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              py -3.11 model-training/custom_trainer.py --dataset_path dataset/custom_dataset.json --model_type cnn --epochs 5 --model_name custom_sketch_model
            </div>
            <p className="text-[10px] text-slate-500">
              The script validates dataset shapes, applies data augmentation, trains a CNN with Dropout, calculates F1-score & accuracy, and exports browser-ready TFJS shards to <code className="text-slate-400">exported-models/</code>!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
