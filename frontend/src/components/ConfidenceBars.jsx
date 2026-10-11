import React from 'react';

export default function ConfidenceBars({ predictions = [], showAll = false }) {
  const displayItems = showAll ? predictions : predictions.slice(0, 3);

  if (!displayItems || displayItems.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 italic">
        Awaiting drawing input for prediction confidence...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayItems.map((item, index) => {
        const isTop = index === 0;
        const percent = Math.min(100, Math.max(0, item.percentage || (item.confidence * 100)));

        return (
          <div key={item.label} className="group">
            {/* Label, Rank & Percentage */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isTop
                      ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  #{index + 1}
                </span>
                <span className={`font-semibold capitalize tracking-wide ${isTop ? 'text-white text-sm' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </div>

              <span className={`font-mono font-medium ${isTop ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}>
                {percent.toFixed(1)}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isTop
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm shadow-indigo-500/50'
                    : index === 1
                    ? 'bg-indigo-600/70'
                    : 'bg-slate-700'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
