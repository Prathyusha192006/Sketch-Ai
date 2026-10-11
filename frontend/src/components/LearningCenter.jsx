import React from 'react';
import { 
  Award, 
  Flame, 
  Target, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_CHALLENGES, BADGES } from '../utils/storage';

export default function LearningCenter({
  progress,
  currentTarget,
  setCurrentTarget,
  mode,
  setMode,
  setActiveTab
}) {
  const {
    points = 0,
    streak = 0,
    bestStreak = 0,
    totalAttempts = 0,
    successfulAttempts = 0,
    completedChallenges = {},
    unlockedBadges = {}
  } = progress;

  const successRate = totalAttempts > 0 
    ? Math.round((successfulAttempts / totalAttempts) * 100) 
    : 0;

  const completedCount = Object.keys(completedChallenges).length;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSelectChallenge = (ch) => {
    setMode(ch.mode);
    setCurrentTarget(ch.target);
    setActiveTab('canvas');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-600/20 via-pink-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Interactive Learning & Gamification</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
              AI Sketch Masterclass
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Complete guided practice challenges, train your drawing precision to activate deep neural features, earn points, and unlock achievements.
            </p>
          </div>

          {/* Quick Target Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-pink-400" />
              <span>Active Target:</span>
            </span>

            <div className="flex items-center space-x-1.5">
              {mode === 'digit' ? (
                <div className="flex flex-wrap gap-1">
                  {['0','1','2','3','4','5','6','7','8','9'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => setCurrentTarget(digit)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentTarget === digit
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {['cat', 'car', 'house', 'tree', 'flower'].map((doodle) => (
                    <button
                      key={doodle}
                      onClick={() => setCurrentTarget(doodle)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                        currentTarget === doodle
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {doodle}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Points */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Score Points</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading font-extrabold text-2xl text-white">
            {points.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>+100-150 pts per challenge</span>
          </div>
        </div>

        {/* Current & Best Streak */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Recognition Streak</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="font-heading font-extrabold text-2xl text-orange-400 flex items-center space-x-1.5">
            <span>{streak}</span>
            <span className="text-xs font-medium text-slate-400">🔥 (Best: {bestStreak})</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Consecutive target matches
          </div>
        </div>

        {/* Success Rate */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Accuracy Rate</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading font-extrabold text-2xl text-emerald-400">
            {successRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {successfulAttempts} of {totalAttempts} attempts
          </div>
        </div>

        {/* Challenges Completed */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Completed Quests</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading font-extrabold text-2xl text-indigo-300">
            {completedCount} / {INITIAL_CHALLENGES.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {Math.round((completedCount / INITIAL_CHALLENGES.length) * 100)}% progress
          </div>
        </div>

      </div>

      {/* Main Learning Sections: Challenges & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Practice Challenges (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-sm text-white">
                Practice Challenges
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Earn Points & Mastery
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INITIAL_CHALLENGES.map((ch) => {
              const isCompleted = !!completedChallenges[ch.id];
              return (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold capitalize">
                        {ch.target}
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        {ch.title}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400">
                      +{ch.points} pts
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                    {ch.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500">
                      Req: &gt;{Math.round(ch.minConfidence * 100)}%
                    </span>

                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelectChallenge(ch)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Attempt Quest</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Badges (1 Column) */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="font-heading font-bold text-sm text-white">
                Badges & Trophies
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {Object.keys(unlockedBadges).length} / {BADGES.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {BADGES.map((badge) => {
              const isUnlocked = !!unlockedBadges[badge.id];
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl border flex items-center space-x-3 transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-indigo-950/40 to-slate-900 border-indigo-500/40 text-white shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="text-2xl p-2 rounded-lg bg-slate-800/60 shrink-0">
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {badge.title}
                      </h5>
                      {isUnlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
