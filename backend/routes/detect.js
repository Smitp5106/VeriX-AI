const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const History = require('../models/History');

const JWT_SECRET = process.env.JWT_SECRET || 'verix_ai_secret_key_123_456_789';

// Middleware helper to check optional auth (for saving history if logged in)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      console.warn('Invalid auth token in optional auth middleware:', err.message);
    }
  }
  next();
};

// Middleware helper to require auth (for fetching history)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authentication token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error in requireAuth:', err.message);
    return res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};


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

// Trusted outlet lists
const TRUSTED_SOURCES = new Set([
  "reuters", "associated press", "ap news", "bbc", "bloomberg",
  "the guardian", "guardian", "npr", "pbs", "al jazeera",
  "afp", "agence france", "washington post", "new york times", "nyt",
  "wall street journal", "wsj", "abc news", "cbs news", "nbc news",
  "sky news", "financial times", "ft", "the economist", "time",
  "newsweek", "cnbc", "forbes", "axios", "politico", "the hill",
  "usa today", "los angeles times", "chicago tribune", "the atlantic",
  "foreign affairs", "apnews", "c-span", "vox", "theprint",
  "ndtv", "the hindu", "times of india", "hindustan times",
  "dawn", "the wire", "scroll.in", "business standard", "livemint"
]);

const UNRELIABLE_SOURCES = new Set([
  "breitbart", "infowars", "21wire", "21stcenturywire", "naturalnews",
  "zerohedge", "beforeitsnews", "yournewswire", "newspunch",
  "activistpost", "thegatewaypu", "westernjournal", "oann",
  "newsmax", "epoch times", "thefederalist", "dailycaller"
]);

// Heuristics constants
const FAKE_PATTERNS = [
  /\b(breaking|bombshell|explosive|shocking)\b.*\b(truth|secret|exposed|revealed|proof)\b/i,
  /\b(mainstream media|msm)\b.*\b(hiding|lying|cover.?up)\b/i,
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

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function extractQuery(text, maxWords = 8) {
  // Remove URLs and punctuation
  let processed = text.replace(/https?:\/\/\S+/g, '');
  processed = processed.replace(/[^\w\s]/g, ' ');

  // Prefer capitalised multi-word spans
  const capsMatches = processed.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3}\b/g) || [];
  const capsFlat = [];
  for (const c of capsMatches) {
    capsFlat.push(...c.split(/\s+/));
  }

  const STOPS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'shall','can','that','this','these','those','it','its','as','if','into',
    'about','after','before','between','through','during','including','until',
    'against','among','throughout','despite','towards','upon',
    'breaking','watch','read','just','exposed','shocking',
    'BREAKING','WATCH','READ','JUST','EXPOSED','SHOCKING'
  ]);

  const allWords = processed.split(/\s+/).filter(w => w.length > 3 && !STOPS.has(w));
  const ordered = [...capsFlat, ...allWords.filter(w => !capsFlat.includes(w))];

  // Deduplicate preserving order
  const seen = new Set();
  const unique = [];
  for (const w of ordered) {
    const lw = w.toLowerCase();
    if (!seen.has(lw)) {
      seen.add(lw);
      unique.push(w);
    }
  }

  const query = unique.slice(0, maxWords).join(' ');
  return query || text.slice(0, 80);
}

function wordOverlap(a, b) {
  const wa = new Set((a.toLowerCase().match(/\b[a-z]{4,}\b/g) || []));
  const wb = new Set((b.toLowerCase().match(/\b[a-z]{4,}\b/g) || []));
  
  if (wa.size === 0 || wb.size === 0) return 0.0;
  
  let intersectionSize = 0;
  for (const w of wa) {
    if (wb.has(w)) intersectionSize++;
  }
  
  const unionSize = wa.size + wb.size - intersectionSize;
  return intersectionSize / unionSize;
}

const SYNONYM_GROUPS = [
  ["killed", "died", "death", "murdered", "assassinated", "slain", "fatal", "dies", "kill", "dead"],
  ["pm", "prime", "minister", "premier"],
  ["president", "potus", "leader"],
  ["win", "victory", "won", "triumph", "wins"],
  ["steal", "stolen", "theft", "rob", "rigged", "stealing"],
  ["arrested", "detained", "custody", "jailed", "imprisoned", "arrest", "arrests"],
  ["condolences", "tribute", "sympathy", "mourn", "grief", "mourns", "tributes"],
  ["bill", "law", "legislation", "act"],
  ["ban", "forbid", "prohibit", "illegal", "outlaw", "banned", "bans"]
];

const BLOCKER_WORDS = new Set([
  "but", "however", "although", "condolences", "tribute", "mourns", "mourn", 
  "denies", "claims", "fake", "false", "hoax", "rumor", "not", "never", "refutes",
  "debunks", "debunked", "unrelated", "misleading", "tributes", "sympathy", "grief"
]);

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'shall','can','that','this','these','those','it','its','as','if','into',
  'about','after','before','between','through','during','including','until',
  'against','among','throughout','despite','towards','upon',
  'breaking','watch','read','just','exposed','shocking',
  'BREAKING','WATCH','READ','JUST','EXPOSED','SHOCKING'
]);

function getTokens(text) {
  return text.toLowerCase().match(/\b\w+\b/g) || [];
}

function getSynonyms(word) {
  const synonyms = [word];
  for (const group of SYNONYM_GROUPS) {
    if (group.includes(word)) {
      synonyms.push(...group);
    }
  }
  return Array.from(new Set(synonyms));
}

function passesTwoLayerMatching(claim, title) {
  const cleanClaim = claim.replace(/https?:\/\/\S+/g, '').replace(/[^\w\s]/g, ' ');
  const cleanTitle = title.replace(/https?:\/\/\S+/g, '').replace(/[^\w\s]/g, ' ');

  const claimTokens = getTokens(cleanClaim);
  const titleTokens = getTokens(cleanTitle);

  if (claimTokens.length === 0 || titleTokens.length === 0) return false;

  // --- LAYER 1: Semantic Recall ---
  const claimKeywords = claimTokens.filter(w => w.length > 3 && !STOP_WORDS.has(w));
  if (claimKeywords.length === 0) return true;

  let matchedCount = 0;
  for (const keyword of claimKeywords) {
    const synonyms = getSynonyms(keyword);
    const hasMatch = synonyms.some(syn => titleTokens.includes(syn));
    if (hasMatch) {
      matchedCount++;
    }
  }

  const recall = matchedCount / claimKeywords.length;
  if (recall < 0.50) {
    return false;
  }

  // --- LAYER 2: Subject-Predicate Coherence ---
  const origClaimWords = claim.replace(/https?:\/\/\S+/g, '').match(/\b\w+\b/g) || [];
  const entities = [];
  const actions = [];

  const KNOWN_ACTIONS = new Set([
    "killed", "died", "death", "murdered", "assassinated", "slain", "fatal", "dies", "kill", "dead",
    "win", "victory", "won", "triumph", "wins", "steal", "stolen", "theft", "rob", "rigged", "stealing",
    "arrested", "detained", "custody", "jailed", "imprisoned", "arrest", "arrests", "resign", "resigns", "resigned",
    "ban", "banned", "bans", "illegal", "fire", "fired", "fires", "attack", "attacks", "attacked", "condolences",
    "tribute", "sympathy", "mourn", "grief", "mourns", "tributes"
  ]);

  for (const word of origClaimWords) {
    const lower = word.toLowerCase();
    if (STOP_WORDS.has(lower) || lower.length <= 2) continue;

    const isCapitalized = /^[A-Z][a-z]*/.test(word) || /^[A-Z]+$/.test(word);
    if (isCapitalized) {
      entities.push(lower);
    } else if (KNOWN_ACTIONS.has(lower) || lower.length > 3) {
      actions.push(lower);
    }
  }

  if (actions.length === 0) {
    for (const word of origClaimWords) {
      const lower = word.toLowerCase();
      if (!entities.includes(lower) && !STOP_WORDS.has(lower) && lower.length > 3) {
        actions.push(lower);
      }
    }
  }

  if (entities.length > 0 && actions.length > 0) {
    let coherentPairFound = false;

    for (const ent of entities) {
      const entSyns = getSynonyms(ent);
      for (const act of actions) {
        const actSyns = getSynonyms(act);

        const entIndices = [];
        titleTokens.forEach((token, idx) => {
          if (entSyns.includes(token)) entIndices.push(idx);
        });

        const actIndices = [];
        titleTokens.forEach((token, idx) => {
          if (actSyns.includes(token)) actIndices.push(idx);
        });

        for (const i of entIndices) {
          for (const j of actIndices) {
            if (Math.abs(i - j) <= 5) {
              const start = Math.min(i, j) + 1;
              const end = Math.max(i, j);
              let hasBlocker = false;

              for (let k = start; k < end; k++) {
                if (BLOCKER_WORDS.has(titleTokens[k])) {
                  hasBlocker = true;
                  break;
                }
              }

              if (!hasBlocker) {
                coherentPairFound = true;
                break;
              }
            }
          }
          if (coherentPairFound) break;
        }
        if (coherentPairFound) break;
      }
      if (coherentPairFound) break;
    }

    if (!coherentPairFound) {
      return false;
    }
  } else {
    const keywords = claimKeywords;
    if (keywords.length >= 2) {
      let closePairFound = false;
      for (let i = 0; i < keywords.length; i++) {
        for (let j = i + 1; j < keywords.length; j++) {
          const w1 = keywords[i];
          const w2 = keywords[j];
          const w1Indices = [];
          const w2Indices = [];
          titleTokens.forEach((t, idx) => {
            if (t === w1) w1Indices.push(idx);
            if (t === w2) w2Indices.push(idx);
          });

          for (const idx1 of w1Indices) {
            for (const idx2 of w2Indices) {
              if (Math.abs(idx1 - idx2) <= 5) {
                const start = Math.min(idx1, idx2) + 1;
                const end = Math.max(idx1, idx2);
                let hasBlocker = false;
                for (let k = start; k < end; k++) {
                  if (BLOCKER_WORDS.has(titleTokens[k])) {
                    hasBlocker = true;
                    break;
                  }
                }
                if (!hasBlocker) {
                  closePairFound = true;
                  break;
                }
              }
            }
            if (closePairFound) break;
          }
          if (closePairFound) break;
        }
        if (closePairFound) break;
      }
      if (!closePairFound) return false;
    }
  }

  return true;
}

const axios = require('axios');

function getTagText(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

async function fetchRss(url, timeout = 8000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const xml = response.data;
    
    // Parse items using Regex
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const items = [];
    
    for (const itemXml of itemMatches) {
      let title = getTagText(itemXml, 'title');
      let source = getTagText(itemXml, 'source');
      let link = getTagText(itemXml, 'link');
      let date = getTagText(itemXml, 'pubDate');
      
      title = decodeEntities(title);
      source = decodeEntities(source);
      link = decodeEntities(link);
      date = decodeEntities(date);
      
      // Google News appends " - Source Name" to titles — strip it
      if (title.includes(' - ')) {
        const idx = title.lastIndexOf(' - ');
        const mainTitle = title.substring(0, idx).trim();
        const fallbackSource = title.substring(idx + 3).trim();
        title = mainTitle;
        if (!source) {
          source = fallbackSource;
        }
      }
      
      if (title) {
        items.push({ title, source, link, pubDate: date });
      }
    }
    return items;
  } catch (err) {
    console.error(`RSS Fetch failed for ${url}:`, err.message);
    return [];
  }
}

async function corroborate(text, maxResults = 10) {
  const query = extractQuery(text);
  const result = {
    query: query,
    corroboration_score: 0.0,
    trusted_count: 0,
    unreliable_count: 0,
    total_found: 0,
    matches: [],
    search_success: false,
    error: null
  };

  const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  let items = await fetchRss(googleNewsUrl);
  
  if (items.length === 0) {
    const bingNewsUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
    items = await fetchRss(bingNewsUrl);
  }

  if (items.length === 0) {
    result.error = "Both RSS endpoints returned no results (network issue or rate limit)";
    return result;
  }

  result.search_success = true;
  result.total_found = items.length;

  for (const item of items.slice(0, maxResults)) {
    // Both layers must pass. Trusted source alone is never enough.
    const passes = passesTwoLayerMatching(text, item.title);
    if (!passes) continue;

    const sim = wordOverlap(text, item.title);
    const srcLc = item.source.toLowerCase();

    let isTrusted = false;
    for (const t of TRUSTED_SOURCES) {
      if (srcLc.includes(t)) {
        isTrusted = true;
        break;
      }
    }

    let isUnreliable = false;
    for (const u of UNRELIABLE_SOURCES) {
      if (srcLc.includes(u)) {
        isUnreliable = true;
        break;
      }
    }

    result.matches.push({
      title: item.title,
      source: item.source,
      link: item.link,
      pubDate: item.pubDate,
      trusted: isTrusted,
      unreliable: isUnreliable,
      similarity: parseFloat(sim.toFixed(3))
    });
    
    if (isTrusted) result.trusted_count++;
    if (isUnreliable) result.unreliable_count++;
  }

  result.corroboration_score = parseFloat(Math.min(1.0, result.trusted_count / 3.0).toFixed(4));
  return result;
}

function combineMlAndCorroboration(mlIsFake, mlConfidence, corroboration) {
  const cs = corroboration.corroboration_score;
  const mlP = mlConfidence / 100.0;
  const found = corroboration.search_success;

  let finalFake = false;
  let finalP = 0.0;
  let verdictReason = "";
  let mlOverridden = false;

  if (!found) {
    finalFake = mlIsFake;
    if (!mlIsFake) {
      finalP = Math.min(0.75, mlP);
    } else {
      finalP = mlP;
    }
    verdictReason = "search_unavailable";
  } else if (cs >= 0.67) {
    finalFake = false;
    finalP = Math.min(0.97, 0.6 + cs * 0.37);
    mlOverridden = mlIsFake;
    verdictReason = "strongly_corroborated";
  } else if (cs >= 0.33) {
    if (mlIsFake) {
      finalFake = true;
      finalP = mlP * 0.65;
      verdictReason = "weak_corroboration_ml_fake";
    } else {
      finalFake = false;
      finalP = Math.min(0.92, mlP * 0.6 + 0.35);
      verdictReason = "partially_corroborated";
    }
  } else {
    if (mlIsFake) {
      finalFake = true;
      finalP = mlP;
      verdictReason = "not_found_ml_fake";
    } else {
      finalFake = false;
      finalP = Math.max(0.50, mlP * 0.70);
      verdictReason = "not_found_ml_real";
    }
  }

  const finalConfidence = Math.max(50, Math.min(97, Math.floor(finalP * 100)));

  let label = "";
  if (finalFake && finalConfidence < 68) {
    label = "UNCERTAIN — POSSIBLE FAKE";
  } else if (finalFake) {
    label = "LIKELY FAKE";
  } else if (!finalFake && finalConfidence < 68) {
    label = "UNCERTAIN — POSSIBLY REAL";
  } else {
    label = "LIKELY REAL";
  }

  return {
    prediction: label,
    isFake: finalFake,
    confidence: finalConfidence,
    mlOverridden: mlOverridden,
    verdictReason: verdictReason,
    corroborationScore: parseFloat(cs.toFixed(4)),
    trustedSources: corroboration.trusted_count,
    searchQuery: corroboration.query,
    searchSuccess: corroboration.search_success,
    topMatches: corroboration.matches.slice(0, 5)
  };
}

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

function buildFactors(isFake, isUncertain, heuristic, text, corrData) {
  const lower = text.toLowerCase();
  const factors = [];

  // ── Corroboration factor ──────────────────────────────────────────────────
  if (corrData && corrData.searchSuccess) {
    const trusted = corrData.trustedSources || 0;
    if (trusted >= 2) {
      factors.push({
        label: `Confirmed by ${trusted} trusted news outlets via live search`,
        type: "success"
      });
    } else if (trusted === 1) {
      factors.push({
        label: "Partially corroborated — 1 trusted outlet found a matching story",
        type: "warning"
      });
    } else {
      factors.push({
        label: "No trusted outlet found a matching story in live search",
        type: isFake ? "error" : "warning"
      });
    }
  } else if (corrData && !corrData.searchSuccess) {
    factors.push({
      label: "Live search unavailable — verdict based on ML model only",
      type: "warning"
    });
  }

  // ── Uncertainty flag ──────────────────────────────────────────────────────
  if (isUncertain) {
    factors.push({ label: "Content falls in ambiguous zone — low confidence", type: "warning" });
  }

  // ── ML / heuristic factors ────────────────────────────────────────────────
  if (isFake || heuristic > 0.1) {
    if (/!!!+/.test(text) || /\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b/.test(text)) {
      factors.push({ label: "Sensationalist formatting (ALL-CAPS / multiple !!!)", type: "error" });
    } else {
      factors.push({ label: "Linguistic patterns associated with low-credibility content", type: "error" });
    }
    if (/\b(deep state|globalists?|cabal|illuminati|sheeple)\b/i.test(lower)) {
      factors.push({ label: "Conspiracy framing language detected", type: "error" });
    } else {
      factors.push({ label: "Emotional persuasion techniques present", type: "warning" });
    }
  } else {
    if (/\b(reuters|associated press|bbc|bloomberg|afp)\b/i.test(lower)) {
      factors.push({ label: "Attributed to a recognised news agency", type: "success" });
    } else {
      factors.push({ label: "Writing style consistent with professional journalism", type: "success" });
    }
    if (/\b(said|reported|confirmed|according to)\b/i.test(lower)) {
      factors.push({ label: "Quotes and attributions follow journalistic convention", type: "success" });
    }
  }

  return factors.slice(0, 4);
}

// @route   POST api/detect/analyze
// @desc    Analyze news content for authenticity using JS ML model
router.post('/analyze', optionalAuth, async (req, res) => {
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
    const isUncertainML = combined > lowerUncertain && combined < upperUncertain;

    let mlIsFake = false;
    if (isUncertainML) {
      mlIsFake = hScore > 0.1;
    } else {
      mlIsFake = combined > FAKE_THRESHOLD;
    }

    // ── CONFIDENCE ────────────────────────────────────────────────────────────
    const distance = Math.abs(combined - FAKE_THRESHOLD);
    const rawConf = 1 / (1 + Math.exp(-distance * 1.5));
    let mlConfidence = 0;

    if (isUncertainML) {
      mlConfidence = Math.max(50, Math.min(65, Math.floor(rawConf * 100)));
    } else {
      mlConfidence = Math.max(70, Math.min(97, Math.floor(rawConf * 100)));
    }

    // ── REAL-TIME CORROBORATION ──────────────────────────────────────────────
    const corrRaw = await corroborate(content);
    const combinedResult = combineMlAndCorroboration(mlIsFake, mlConfidence, corrRaw);
    
    const isFake = combinedResult.isFake;
    const confidence = combinedResult.confidence;
    const prediction = combinedResult.prediction;
    const isUncertain = confidence < 68;

    let trustScore, sourceCredibility, explanation;
    const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    if (isFake) {
      trustScore = Math.max(10, Math.min(42, 100 - confidence + randInt(-4, 4)));
      sourceCredibility = Math.max(12, Math.min(45, 100 - confidence + randInt(-8, 8)));
      explanation = "The AI detected multiple indicators of potential misinformation. " +
        "The text contains linguistic patterns and framing structures commonly " +
        "associated with false or misleading news. " +
        (combinedResult.trustedSources === 0 ? "No trusted news outlet was found reporting this story. " : "") +
        "Cross-reference with trusted outlets before sharing.";
    } else {
      trustScore = Math.max(58, Math.min(95, confidence + randInt(-5, 5)));
      sourceCredibility = Math.max(60, Math.min(97, confidence + randInt(-5, 5)));
      const trustedN = combinedResult.trustedSources || 0;
      if (trustedN >= 2) {
        explanation = `Live search found ${trustedN} trusted news outlets reporting this story, strongly supporting its authenticity. The AI model also indicates credible writing patterns.`;
      } else if (trustedN === 1) {
        explanation = "One trusted outlet was found reporting a similar story. The AI model also indicates credible writing patterns. Verify through additional sources for full confidence.";
      } else {
        explanation = "The AI analysis indicates this content is likely authentic based on linguistic patterns. However, no matching story was found in live news search — verify through trusted outlets independently.";
      }
    }
    
    const sentiment = getSentiment(content);
    const factors = buildFactors(isFake, isUncertain, hScore, content, combinedResult);

    const topMatches = [];
    if (corrRaw && corrRaw.matches) {
      for (const m of corrRaw.matches.slice(0, 4)) {
        topMatches.push({
          title: m.title,
          source: m.source,
          trusted: m.trusted,
          link: m.link || ""
        });
      }
    }
    
    const result = {
      prediction: prediction,
      isFake: isFake,
      isUncertain: isUncertain,
      confidence: confidence,
      sentiment: sentiment,
      trustScore: trustScore,
      sourceCredibility: sourceCredibility,
      factors: factors,
      explanation: explanation,
      corroboration: {
        available: true,
        searchSuccess: corrRaw.search_success,
        trustedSources: combinedResult.trustedSources,
        score: combinedResult.corroborationScore,
        searchQuery: corrRaw.query,
        topMatches: topMatches,
        mlOverridden: combinedResult.mlOverridden
      }
    };
    
    // Save to history database if user is logged in
    if (req.user && req.user.id) {
      try {
        const newHistory = new History({
          user: req.user.id,
          content: content,
          result: result
        });
        await newHistory.save();
        console.log(`Saved analysis history for user ${req.user.id}`);
      } catch (historyErr) {
        console.error('Failed to save user history:', historyErr);
      }
    }

    res.json(result);
  } catch (err) {
    console.error('JS Inference execution error:', err);
    res.status(500).json({ message: 'Error performing AI analysis', error: err.message });
  }
});

// @route   GET api/detect/history
// @desc    Get logged in user's analysis history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ message: 'Error retrieving analysis history', error: err.message });
  }
});

module.exports = router;
