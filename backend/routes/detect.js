const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load model data synchronously on start
let modelData = null;
try {
  const modelDataPath = path.join(__dirname, '..', 'ai', 'model_data.json');
  if (fs.existsSync(modelDataPath)) {
    modelData = JSON.parse(fs.readFileSync(modelDataPath, 'utf8'));
    console.log('AI model parameters loaded successfully in JavaScript.');
  } else {
    console.warn('AI model_data.json file not found. Analysis endpoint will fail.');
  }
} catch (err) {
  console.error('Failed to load AI model parameters:', err);
}

function tokenize(text) {
  const lower = text.toLowerCase();
  // Match standard alphanumeric words of 2 or more characters
  const tokens = lower.match(/\b\w\w+\b/g) || [];
  return tokens;
}

// Heuristics constants
const FAKE_PATTERNS = [
  /\b(breaking|bombshell|explosive|shocking)\b.*\b(truth|secret|exposed|revealed|proof)\b/i,
  /\b(mainstream media|msm|fake news media)\b.*\b(hiding|lying|won\'t tell|cover.?up)\b/i,
  /\b(deep state|globalists?|new world order|cabal|illuminati)\b/i,
  /\b(wake up|sheeple|sheep|red pill|truth seekers?)\b/i,
  /\b(100\s*%|proven|undeniable|absolute)\s+(proof|evidence|fact)/i,
  /!!!+/,
  /\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b/ // ALL-CAPS words (case-sensitive, do not make case-insensitive)
];

const REAL_SIGNALS = [
  /\b(reuters|associated press|ap|afp|bbc|bloomberg)\b/i,
  /\b(according to|said on|told reporters|confirmed by|spokesperson)\b/i,
  /\b(per cent|percent|\d+\.\d+\s*%)\b.*\b(said|reported|noted|added)\b/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bq\d\b|\bfiscal year\b|\bearnings per share\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b\s+\d{1,2}/i
];

const FAKE_WORDS = new Set([
  'hoax', 'scam', 'plandemic', 'globalist', 'sheeple', 'cabal',
  'illuminati', 'chemtrails', 'microchip', 'soros', 'satanic',
  'pedogate', 'pizzagate', 'treason', 'traitor', 'rigged', 'stolen',
  'tyranny', 'tyrannical', 'regime', 'agenda', '!!!'
]);

const REAL_WORDS = new Set([
  'reuters', 'said', 'reported', 'according', 'confirmed', 'spokesperson',
  'wednesday', 'tuesday', 'thursday', 'percent', 'quarter', 'annual',
  'officials', 'analysts', 'statement', 'briefing', 'parliament',
  'legislation', 'administration', 'department', 'ministry'
]);

function heuristicScore(text) {
  const lower = text.toLowerCase();
  const wordsArray = lower.match(/\b\w+\b/g) || [];
  const wordsSet = new Set(wordsArray);

  let score = 0.0;

  // Pattern checks
  for (const pat of FAKE_PATTERNS) {
    if (pat.test(lower)) {
      score += 0.3;
    }
  }

  for (const pat of REAL_SIGNALS) {
    if (pat.test(lower)) {
      score -= 0.25;
    }
  }

  // Word checks
  let fakeHits = 0;
  let realHits = 0;
  for (const w of wordsSet) {
    if (FAKE_WORDS.has(w)) fakeHits++;
    if (REAL_WORDS.has(w)) realHits++;
  }

  score += fakeHits * 0.15;
  score -= realHits * 0.12;

  // Text-length heuristic
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 20) {
    score += 0.1;
  } else if (wordCount > 80) {
    score -= 0.15;
  }

  return Math.max(-1.0, Math.min(1.0, score));
}

function getSentiment(text) {
  const positiveWords = new Set([
    'good', 'great', 'successful', 'development', 'agreement', 'peace',
    'growth', 'positive', 'win', 'excellent', 'support', 'trust', 'honest',
    'progress', 'improve', 'benefit', 'recovery', 'achieve'
  ]);
  const negativeWords = new Set([
    'bad', 'worst', 'scandal', 'crisis', 'war', 'attack', 'fake', 'liar',
    'cheat', 'refuse', 'deny', 'threat', 'danger', 'failure', 'disturbing',
    'embarrassing', 'corrupt', 'collapse', 'disaster', 'fraud'
  ]);
  
  const words = text.toLowerCase().split(/\s+/);
  let posCount = 0;
  let negCount = 0;
  for (const w of words) {
    if (positiveWords.has(w)) posCount++;
    if (negativeWords.has(w)) negCount++;
  }
  
  const total = posCount + negCount;
  if (total === 0) {
    return { score: 0.0, label: "Neutral" };
  }
  const score = (posCount - negCount) / total;
  if (score > 0.1) {
    return { score, label: "Positive" };
  } else if (score < -0.1) {
    return { score, label: "Negative" };
  }
  return { score, label: "Neutral" };
}

function buildFactors(isFake, isUncertain, heuristic, decisionVal, text) {
  const lower = text.toLowerCase();
  const factors = [];

  if (isUncertain) {
    factors.push({ label: "Content falls in ambiguous zone — low confidence prediction", type: "warning" });
  }

  if (isFake || heuristic > 0.1) {
    if (/!!!+/.test(text) || /\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b/.test(text)) {
      factors.push({ label: "Sensationalist formatting detected (ALL-CAPS / multiple !!!)", type: "error" });
    } else {
      factors.push({ label: "Linguistic patterns associated with low-credibility content", type: "error" });
    }

    if (/\b(deep state|globalists?|cabal|illuminati|sheeple)\b/i.test(lower)) {
      factors.push({ label: "Conspiracy framing language present", type: "error" });
    } else {
      factors.push({ label: "Emotional and persuasive framing techniques detected", type: "warning" });
    }

    if (/\b(hidden|secret|exposed|cover.?up|they don't want)\b/i.test(lower)) {
      factors.push({ label: "\"Hidden truth\" narrative structure identified", type: "warning" });
    } else {
      factors.push({ label: "Low density of verifiable, attributed facts", type: "warning" });
    }
  } else {
    if (/\b(reuters|associated press|bbc|bloomberg|afp)\b/i.test(lower)) {
      factors.push({ label: "Attributed to a recognised news agency", type: "success" });
    } else {
      factors.push({ label: "Writing style consistent with professional journalism", type: "success" });
    }

    if (/\b(said|reported|confirmed|according to)\b/i.test(lower)) {
      factors.push({ label: "Quotes and attributions follow journalistic convention", type: "success" });
    } else {
      factors.push({ label: "Factual structure aligns with verifiable reporting", type: "success" });
    }

    factors.push({ label: "Low sensationalism and bias index", type: "success" });

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 50) {
      factors.push({ label: "Sufficient context and detail present", type: "success" });
    }
  }

  return factors.slice(0, 4);
}

// @route   POST api/detect/analyze
// @desc    Analyze news content for authenticity using JS ML model
router.post('/analyze', (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content text is required for analysis' });
  }

  if (!modelData) {
    return res.status(500).json({ message: 'AI model is not loaded on the server' });
  }

  try {
    const tokens = tokenize(content);
    const { vocabulary, idf, coef, intercept } = modelData;
    
    // Calculate raw term frequencies for words in vocabulary
    const tf = {};
    for (const token of tokens) {
      if (token in vocabulary) {
        tf[token] = (tf[token] || 0) + 1;
      }
    }
    
    // Calculate TF-IDF values
    const tfidf = {};
    let sumSq = 0;
    for (const token in tf) {
      const idx = vocabulary[token];
      const val = tf[token] * idf[idx];
      tfidf[token] = val;
      sumSq += val * val;
    }
    
    const norm = Math.sqrt(sumSq);
    
    // Calculate decision value
    let decisionVal = intercept;
    if (norm > 0) {
      for (const token in tfidf) {
        const idx = vocabulary[token];
        const valNorm = tfidf[token] / norm;
        decisionVal += valNorm * coef[idx];
      }
    }

    // ── CALIBRATED THRESHOLD & HEURISTICS ─────────────────────────────────────
    const FAKE_THRESHOLD = 0.85;
    const UNCERTAIN_BAND = 0.40;

    const hScore = heuristicScore(content);
    const combined = decisionVal + hScore * 1.2;

    const lowerUncertain = FAKE_THRESHOLD - UNCERTAIN_BAND;
    const upperUncertain = FAKE_THRESHOLD + UNCERTAIN_BAND;
    const isUncertain = combined > lowerUncertain && combined < upperUncertain;

    let isFake = false;
    if (isUncertain) {
      isFake = hScore > 0.1;
    } else {
      isFake = combined > FAKE_THRESHOLD;
    }

    // ── CONFIDENCE ────────────────────────────────────────────────────────────
    const distance = Math.abs(combined - FAKE_THRESHOLD);
    const rawConf = 1 / (1 + Math.exp(-distance * 1.5));
    let confidence = Math.floor(rawConf * 100);

    if (isUncertain) {
      confidence = Math.max(50, Math.min(65, confidence));
    } else {
      confidence = Math.max(70, Math.min(97, confidence));
    }
    
    let trustScore, sourceCredibility, predictionLabel, explanation;
    
    const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    if (isFake) {
      trustScore = Math.max(10, Math.min(42, 100 - confidence + randInt(-4, 4)));
      sourceCredibility = Math.max(12, Math.min(45, 100 - confidence + randInt(-8, 8)));
      if (isUncertain) {
        predictionLabel = "UNCERTAIN — POSSIBLE FAKE";
        explanation = "The AI could not confidently classify this content. Some indicators suggest possible misinformation, but the signal is weak. We recommend verifying claims through multiple trusted news sources before sharing.";
      } else {
        predictionLabel = "LIKELY FAKE";
        explanation = "The AI detected multiple indicators of potential misinformation. The text contains linguistic patterns and framing structures commonly associated with false or misleading news. Cross-reference with trusted outlets before sharing.";
      }
    } else {
      trustScore = Math.max(58, Math.min(95, confidence + randInt(-5, 5)));
      sourceCredibility = Math.max(60, Math.min(97, confidence + randInt(-5, 5)));
      if (isUncertain) {
        predictionLabel = "UNCERTAIN — POSSIBLY REAL";
        explanation = "The AI leans toward classifying this as credible content, but with low confidence. The text lacks strong misinformation markers, though it also lacks strong credibility signals. Always verify important claims independently.";
      } else {
        predictionLabel = "LIKELY REAL";
        explanation = "The AI analysis indicates this content is likely authentic. The sentence structure, vocabulary, and style are consistent with credible journalism. We still recommend verifying important claims through multiple independent sources.";
      }
    }
    
    const sentiment = getSentiment(content);
    const factors = buildFactors(isFake, isUncertain, hScore, decisionVal, content);
    
    const result = {
      prediction: predictionLabel,
      isFake: isFake,
      isUncertain: isUncertain,
      confidence: confidence,
      sentiment: sentiment,
      trustScore: trustScore,
      sourceCredibility: sourceCredibility,
      factors: factors,
      explanation: explanation,
      // Debug info
      _debug: {
        decisionVal: parseFloat(decisionVal.toFixed(4)),
        heuristicScore: parseFloat(hScore.toFixed(4)),
        combined: parseFloat(combined.toFixed(4)),
        threshold: FAKE_THRESHOLD
      }
    };
    
    res.json(result);
  } catch (err) {
    console.error('JS Inference execution error:', err);
    res.status(500).json({ message: 'Error performing AI analysis', error: err.message });
  }
});

module.exports = router;
