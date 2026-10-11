/**
 * Storage and Gamification System
 * Manages prediction history, gamification points, streaks, challenges, and badges in localStorage.
 */

const HISTORY_KEY = 'sketchai_history_v1';
const PROGRESS_KEY = 'sketchai_progress_v1';

export const INITIAL_CHALLENGES = [
  {
    id: 'ch_digit_7',
    mode: 'digit',
    target: '7',
    title: 'Precision Seven',
    description: 'Draw digit 7 with at least 85% confidence.',
    minConfidence: 0.85,
    points: 100,
    completed: false
  },
  {
    id: 'ch_digit_3',
    mode: 'digit',
    target: '3',
    title: 'Curved Symmetry',
    description: 'Draw digit 3 with at least 85% confidence.',
    minConfidence: 0.85,
    points: 100,
    completed: false
  },
  {
    id: 'ch_digit_0',
    mode: 'digit',
    target: '0',
    title: 'Flawless Zero',
    description: 'Draw a closed digit 0 with at least 90% confidence.',
    minConfidence: 0.90,
    points: 120,
    completed: false
  },
  {
    id: 'ch_doodle_cat',
    mode: 'doodle',
    target: 'cat',
    title: 'Feline Feature',
    description: 'Draw a cat with pointed ears and whiskers (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_car',
    mode: 'doodle',
    target: 'car',
    title: 'Cruising Wheels',
    description: 'Draw a car with wheels and body (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_house',
    mode: 'doodle',
    target: 'house',
    title: 'Sweet Home',
    description: 'Draw a house with triangular roof and base (>85% confidence).',
    minConfidence: 0.85,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_tree',
    mode: 'doodle',
    target: 'tree',
    title: 'Forest Canopy',
    description: 'Draw an upright tree with trunk and foliage (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_flower',
    mode: 'doodle',
    target: 'flower',
    title: 'Floral Bloom',
    description: 'Draw a blossom with petals (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_star',
    mode: 'doodle',
    target: 'star',
    title: 'Celestial Star',
    description: 'Draw a crisp 5-pointed star with sharp tips (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_apple',
    mode: 'doodle',
    target: 'apple',
    title: 'Crisp Orchard Apple',
    description: 'Draw an apple with top indentation and stem (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_fish',
    mode: 'doodle',
    target: 'fish',
    title: 'Aquatic Creature',
    description: 'Draw a swimming fish with tail fin (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_airplane',
    mode: 'doodle',
    target: 'airplane',
    title: 'Sky Jet',
    description: 'Draw an airplane with fuselage and wings (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  },
  {
    id: 'ch_doodle_cloud',
    mode: 'doodle',
    target: 'cloud',
    title: 'Cumulus Cloud',
    description: 'Draw a puffy cloud with scalloped curves (>80% confidence).',
    minConfidence: 0.80,
    points: 150,
    completed: false
  }
];

export const BADGES = [
  { id: 'first_stroke', title: 'First Stroke', desc: 'Completed your first drawing prediction', icon: '✏️' },
  { id: 'bullseye', title: 'Bullseye', desc: 'Achieved 95%+ confidence on any drawing', icon: '🎯' },
  { id: 'streak_3', title: 'Triple Streak', desc: 'Achieved 3 consecutive practice matches', icon: '🔥' },
  { id: 'model_explorer', title: 'Model Explorer', desc: 'Tested both ANN and CNN models', icon: '🔬' },
  { id: 'master_sketcher', title: 'Master Sketcher', desc: 'Earned 500 total practice points', icon: '👑' },
  { id: 'doodle_all', title: 'Doodle Maestro', desc: 'Successfully drew cat, car, house, tree & flower', icon: '🌟' }
];

// --- Prediction History ---
export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read history:', e);
    return [];
  }
}

export function saveHistoryItem(item) {
  try {
    const history = getHistory();
    const newItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      ...item
    };
    // Keep max 100 recent entries
    const updated = [newItem, ...history].slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newItem;
  } catch (e) {
    console.error('Failed to save history item:', e);
    return null;
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}

// --- User Gamification Progress ---
export function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read progress:', e);
  }

  return {
    points: 0,
    streak: 0,
    bestStreak: 0,
    totalAttempts: 0,
    successfulAttempts: 0,
    completedChallenges: {},
    unlockedBadges: {},
    drawnClasses: {}
  };
}

export function updateProgress(updateFn) {
  try {
    const current = getProgress();
    const updated = updateFn(current);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to update progress:', e);
    return getProgress();
  }
}
