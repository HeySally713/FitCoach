// seed/convert_seed.js
// Usage: node seed/convert_seed.js > src/data/exerciseDB.json
const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname);
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'exerciseDB.json');

// Columns that should ALWAYS be string arrays (even single value)
const ARRAY_COLUMNS = new Set(['primary_muscles', 'secondary_muscles']);

const parseCSV = (filename) => {
  const text = fs.readFileSync(path.join(SEED_DIR, filename), 'utf8').trim();
  const [header, ...lines] = text.split(/\r?\n/);
  const cols = header.split(',');
  return lines.map(line => {
    const parts = line.split(',');
    const row = {};
    cols.forEach((c, i) => {
      let v = (parts[i] ?? '').trim();
      if (ARRAY_COLUMNS.has(c)) {
        // Always array; empty → []
        row[c] = v === '' ? [] : v.split('|').map(s => s.trim());
        return;
      }
      if (v === '') v = null;
      else if (v === 'true') v = true;
      else if (v === 'false') v = false;
      else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
      else if (v.includes('|')) v = v.split('|').map(s => s.trim());
      row[c] = v;
    });
    return row;
  });
};


const exercises = parseCSV('exercises.csv');
const alternatives = parseCSV('exercise_alternatives.csv');
const goalScores = parseCSV('goal_scores.csv');
const ruleTags = parseCSV('rule_tags.csv');
const goalTargets = parseCSV('goal_targets.csv');

// Merge goal scores and rule tags into each exercise for fast lookup
const scoreMap = new Map(goalScores.map(g => [g.exercise_id, g]));
const tagMap = new Map(ruleTags.map(t => [t.exercise_id, t]));

// Heuristic fallback for exercises missing scores (uses category + movement_pattern)
const fallbackScore = (ex) => {
  const isCardio = ex.category === 'cardio';
  const isYoga = ex.category === 'yoga';
  const isCompound = ['squat','hip_hinge','vertical_push','vertical_pull','horizontal_push','horizontal_pull','lunge','full_body'].includes(ex.movement_pattern);
  return {
    weight_loss: isCardio ? 9 : isCompound ? 6 : isYoga ? 3 : 4,
    muscle_gain: isCardio ? 3 : isCompound ? 8 : isYoga ? 2 : 6,
    health: isCardio ? 9 : isYoga ? 8 : 7,
    endurance: isCardio ? 9 : 5,
    flexibility: isYoga ? 10 : 2,
    maintenance: isCardio ? 8 : isCompound ? 8 : 6,
  };
};

const merged = exercises.map(ex => ({
  ...ex,
  goal_scores: scoreMap.get(ex.exercise_id) ?? fallbackScore(ex),
  tags: tagMap.get(ex.exercise_id) ?? null,
  alternatives: alternatives
    .filter(a => a.exercise_id === ex.exercise_id)
    .sort((a, b) => a.priority - b.priority)
    .map(a => ({ id: a.alt_exercise_id, reason: a.reason })),
}));

const bundle = {
  version: 1,
  generated_at: new Date().toISOString(),
  exercises: merged,
  goal_targets: goalTargets,
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(bundle, null, 2));
console.log(`✅ ${merged.length} exercises written to ${OUT_FILE}`);
console.log(`   - With explicit goal scores: ${goalScores.length}`);
console.log(`   - With fallback scores: ${merged.length - goalScores.length}`);
console.log(`   - Total alternatives: ${alternatives.length}`);
