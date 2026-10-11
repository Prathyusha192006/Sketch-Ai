import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Pen, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Sparkles, 
  Sliders, 
  MousePointer,
  HelpCircle
} from 'lucide-react';

export default function DrawingCanvas({ 
  onDrawingChange, 
  mode, 
  setMode, 
  isPredicting,
  autoPredict = true,
  onManualPredict
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [brushSize, setBrushSize] = useState(16);
  const [history, setHistory] = useState([]);
  const [hasInk, setHasInk] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Initialize canvas with black background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Save blank state in history
    setHistory([canvas.toDataURL()]);
    setHasInk(false);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Push state to history stack
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => {
      const next = [...prev, dataUrl];
      return next.slice(-20); // Limit to last 20 steps
    });
    setHasInk(true);
    if (onDrawingChange) {
      onDrawingChange(canvas);
    }
  }, [onDrawingChange]);

  // Undo last stroke
  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const nextHistory = [...history];
    nextHistory.pop(); // Remove current state
    const prevState = nextHistory[nextHistory.length - 1];

    const img = new Image();
    img.src = prevState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(nextHistory);
      setHasInk(nextHistory.length > 1);
      if (onDrawingChange) {
        onDrawingChange(canvas);
      }
    };
  };

  // Clear canvas completely
  const handleClear = () => {
    initCanvas();
    if (onDrawingChange) {
      onDrawingChange(canvasRef.current);
    }
  };

  // Coordinate normalizer for mouse, touch, and stylus
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

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'pen' ? '#ffffff' : '#090d16';

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

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
    saveState();
  };

  return (
    <div className="flex flex-col rounded-2xl glass-panel p-5 shadow-2xl border border-slate-800/80">
      
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-white tracking-wide">
            {mode === 'digit' ? 'Handwritten Digit Canvas' : 'QuickDraw Doodle Canvas'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
            280×280 px
          </span>
        </div>

        {/* Mode Selector within Canvas */}
        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
          <button
            onClick={() => setMode('digit')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              mode === 'digit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            0-9 Digits
          </button>
          <button
            onClick={() => setMode('doodle')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              mode === 'doodle'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Doodles (10 Classes)
          </button>
        </div>
      </div>

      {/* Interactive Drawing Canvas Container */}
      <div className="relative flex justify-center items-center my-1 select-none">
        <div className="relative group rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-slate-700/50 via-slate-800/50 to-slate-900/60 shadow-inner">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="cursor-crosshair rounded-xl block shadow-2xl touch-none bg-[#090d16]"
            style={{ width: '280px', height: '280px', touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Guide Overlay for Centering / Proportions */}
          {showGuide && (
            <div className="absolute inset-1.5 pointer-events-none rounded-xl border border-indigo-500/20 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-indigo-500/15" />
              <div className="border-r border-b border-indigo-500/15" />
              <div className="border-b border-indigo-500/15" />
              <div className="border-r border-b border-indigo-500/15" />
              <div className="border-r border-b border-indigo-500/25 bg-indigo-500/5" />
              <div className="border-b border-indigo-500/15" />
              <div className="border-r border-indigo-500/15" />
              <div className="border-r border-indigo-500/15" />
              <div />
            </div>
          )}

          {/* Empty Canvas Prompt Overlay */}
          {!hasInk && (
            <div className="absolute inset-1.5 flex flex-col items-center justify-center pointer-events-none text-slate-500">
              <MousePointer className="w-6 h-6 mb-2 animate-bounce opacity-40 text-indigo-400" />
              <span className="text-xs font-medium text-slate-400">
                {mode === 'digit' ? 'Draw a digit (0 to 9) here' : 'Draw a star, cat, car, apple, fish, house...'}
              </span>
              <span className="text-[10px] text-slate-600 mt-0.5">Mouse, Touch or Stylus supported</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Controls & Toolbar */}
      <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-800/80">
        
        {/* Row 1: Tool Selection & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Pen / Eraser Tool Toggle */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setTool('pen')}
              title="Draw Tool"
              className={`p-2 rounded-lg transition-all ${
                tool === 'pen'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              title="Eraser Tool"
              className={`p-2 rounded-lg transition-all ${
                tool === 'eraser'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Undo, Clear, Guide */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              title="Undo last stroke"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              disabled={!hasInk}
              title="Clear Canvas"
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 hover:text-red-400 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGuide(!showGuide)}
              title="Toggle Grid Guide"
              className={`p-2 rounded-xl border transition-all ${
                showGuide 
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Manual Predict Trigger (if not auto-predicting) */}
          {!autoPredict && (
            <button
              onClick={() => onManualPredict && onManualPredict(canvasRef.current)}
              disabled={!hasInk || isPredicting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPredicting ? 'Classifying...' : 'Predict Sketch'}</span>
            </button>
          )}

        </div>

        {/* Row 2: Brush Size Slider */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Brush Size:</span>
            <span className="font-mono text-slate-200">{brushSize}px</span>
          </div>
          <div className="flex items-center space-x-3 w-40">
            <input
              type="range"
              min="8"
              max="36"
              step="2"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
