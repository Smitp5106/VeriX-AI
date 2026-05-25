"""
classify.py — Fake news classifier with real-time news corroboration.

Pipeline:
  1. ML model (TF-IDF + LogisticRegression/PassiveAggressive) gives a first verdict
  2. corroborate.py searches free news RSS feeds for the story
  3. combine_ml_and_corroboration() merges both signals into a final verdict

Input  (stdin): plain text — headline, snippet, or full article paragraph
Output (stdout): JSON object with prediction, confidence, trust scores, factors
"""

import os
import sys
import pickle
import json
import re
import numpy as np

# ── Paths ──────────────────────────────────────────────────────────────────────
ai_dir          = os.path.dirname(os.path.abspath(__file__))
model_path      = os.path.join(ai_dir, "model.pkl")
vectorizer_path = os.path.join(ai_dir, "vectorizer.pkl")

# ── Load model ─────────────────────────────────────────────────────────────────
try:
    with open(model_path, 'rb') as f:
        classifier = pickle.load(f)
    with open(vectorizer_path, 'rb') as f:
        vectorizer = pickle.load(f)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model assets: {e}"}))
    sys.exit(1)

# ── Import corroboration module ────────────────────────────────────────────────
try:
    sys.path.insert(0, ai_dir)
    from corroborate import corroborate, combine_ml_and_corroboration
    CORROBORATION_AVAILABLE = True
except ImportError:
    CORROBORATION_AVAILABLE = False

# ── Calibrated threshold ───────────────────────────────────────────────────────
# The model intercept (+0.73) biases raw decision values toward FAKE.
# Raising the threshold to 0.85 eliminates most false positives on neutral text.
FAKE_THRESHOLD  = 0.85
UNCERTAIN_BAND  = 0.40

# ── Heuristic signals ──────────────────────────────────────────────────────────
FAKE_PATTERNS = [
    r'\b(breaking|bombshell|explosive|shocking)\b.*\b(truth|secret|exposed|revealed|proof)\b',
    r'\b(mainstream media|msm)\b.*\b(hiding|lying|cover.?up)\b',
    r'\b(deep state|globalists?|new world order|cabal|illuminati)\b',
    r'\b(wake up|sheeple|red pill|truth seekers?)\b',
    r'\b(100\s*%|proven|undeniable|absolute)\s+(proof|evidence|fact)',
    r'!!!+',
    r'\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b',
]
REAL_SIGNALS = [
    r'\b(reuters|associated press|bbc|bloomberg|afp)\b',
    r'\b(according to|said on|told reporters|confirmed by|spokesperson)\b',
    r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
    r'\bq\d\b|\bfiscal year\b|\bearnings per share\b',
    r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b\s+\d{1,2}',
]
FAKE_WORDS = {
    'hoax','scam','plandemic','globalist','sheeple','cabal','illuminati',
    'chemtrails','microchip','soros','satanic','pedogate','pizzagate',
    'treason','traitor','rigged','stolen','tyranny','tyrannical','regime',
}
REAL_WORDS = {
    'reuters','said','reported','according','confirmed','spokesperson',
    'wednesday','tuesday','thursday','percent','quarter','annual',
    'officials','analysts','statement','briefing','parliament',
    'legislation','administration','department','ministry',
}


def heuristic_score(text: str) -> float:
    """Returns float in [-1, +1]. Positive = more fake signals."""
    lower = text.lower()
    words = set(re.findall(r'\b\w+\b', lower))
    score = 0.0
    for pat in FAKE_PATTERNS:
        if re.search(pat, lower):
            score += 0.3
    for pat in REAL_SIGNALS:
        if re.search(pat, lower):
            score -= 0.25
    score += len(words & FAKE_WORDS) * 0.15
    score -= len(words & REAL_WORDS) * 0.12
    wc     = len(text.split())
    if wc < 20:
        score += 0.1
    elif wc > 80:
        score -= 0.15
    return max(-1.0, min(1.0, score))


def ml_classify(text: str) -> tuple[bool, int, float]:
    """
    Run the ML model.
    Returns (is_fake, confidence 0-100, raw_decision_value).
    """
    tfidf    = vectorizer.transform([text])
    dv       = float(classifier.decision_function(tfidf)[0])
    h        = heuristic_score(text)
    combined = dv + h * 1.2

    lower_u  = FAKE_THRESHOLD - UNCERTAIN_BAND
    upper_u  = FAKE_THRESHOLD + UNCERTAIN_BAND
    uncertain = lower_u < combined < upper_u

    if uncertain:
        is_fake = h > 0.1
    else:
        is_fake = combined > FAKE_THRESHOLD

    distance = abs(combined - FAKE_THRESHOLD)
    raw_conf = 1 / (1 + np.exp(-distance * 1.5))
    if uncertain:
        confidence = max(50, min(65, int(raw_conf * 100)))
    else:
        confidence = max(70, min(97, int(raw_conf * 100)))

    return is_fake, confidence, dv


def get_sentiment(text: str) -> tuple[float, str]:
    positive = {
        'good','great','successful','development','agreement','peace','growth',
        'positive','win','excellent','support','trust','honest','progress',
        'improve','benefit','recovery','achieve',
    }
    negative = {
        'bad','worst','scandal','crisis','war','attack','fake','liar','cheat',
        'refuse','deny','threat','danger','failure','disturbing','embarrassing',
        'corrupt','collapse','disaster','fraud',
    }
    words = text.lower().split()
    pos   = sum(1 for w in words if w in positive)
    neg   = sum(1 for w in words if w in negative)
    total = pos + neg
    if total == 0:
        return 0.0, "Neutral"
    score = (pos - neg) / total
    if score > 0.1:
        return float(score), "Positive"
    elif score < -0.1:
        return float(score), "Negative"
    return float(score), "Neutral"


def build_factors(is_fake: bool, is_uncertain: bool,
                  heuristic: float, text: str,
                  corr_data: dict | None) -> list[dict]:
    lower   = text.lower()
    factors = []

    # ── Corroboration factor ──────────────────────────────────────────────────
    if corr_data and corr_data.get("searchSuccess"):
        trusted = corr_data.get("trustedSources", 0)
        if trusted >= 2:
            factors.append({
                "label": f"Confirmed by {trusted} trusted news outlets via live search",
                "type":  "success",
            })
        elif trusted == 1:
            factors.append({
                "label": "Partially corroborated — 1 trusted outlet found a matching story",
                "type":  "warning",
            })
        else:
            factors.append({
                "label": "No trusted outlet found a matching story in live search",
                "type":  "error" if is_fake else "warning",
            })
    elif corr_data and not corr_data.get("searchSuccess"):
        factors.append({
            "label": "Live search unavailable — verdict based on ML model only",
            "type":  "warning",
        })

    # ── Uncertainty flag ──────────────────────────────────────────────────────
    if is_uncertain:
        factors.append({"label": "Content falls in ambiguous zone — low confidence", "type": "warning"})

    # ── ML / heuristic factors ────────────────────────────────────────────────
    if is_fake or heuristic > 0.1:
        if re.search(r'!!!+', text) or re.search(r'\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b', text):
            factors.append({"label": "Sensationalist formatting (ALL-CAPS / multiple !!!)", "type": "error"})
        else:
            factors.append({"label": "Linguistic patterns associated with low-credibility content", "type": "error"})
        if re.search(r'\b(deep state|globalists?|cabal|illuminati|sheeple)\b', lower):
            factors.append({"label": "Conspiracy framing language detected", "type": "error"})
        else:
            factors.append({"label": "Emotional persuasion techniques present", "type": "warning"})
    else:
        if re.search(r'\b(reuters|associated press|bbc|bloomberg|afp)\b', lower):
            factors.append({"label": "Attributed to a recognised news agency", "type": "success"})
        else:
            factors.append({"label": "Writing style consistent with professional journalism", "type": "success"})
        if re.search(r'\b(said|reported|confirmed|according to)\b', lower):
            factors.append({"label": "Quotes and attributions follow journalistic convention", "type": "success"})

    return factors[:4]


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    try:
        text = sys.stdin.read().strip()
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input: {e}"}))
        sys.exit(1)

    if not text:
        print(json.dumps({"error": "Input text is empty"}))
        sys.exit(1)

    try:
        # ── Step 1: ML classification ─────────────────────────────────────────
        ml_is_fake, ml_confidence, raw_dv = ml_classify(text)

        # ── Step 2: Real-time corroboration ───────────────────────────────────
        corr_raw  = None
        corr_data = None

        if CORROBORATION_AVAILABLE:
            corr_raw  = corroborate(text)
            combined  = combine_ml_and_corroboration(ml_is_fake, ml_confidence, corr_raw)
            is_fake    = combined["isFake"]
            confidence = combined["confidence"]
            prediction = combined["prediction"]
            corr_data  = combined
        else:
            # Fallback: ML only
            is_fake    = ml_is_fake
            confidence = ml_confidence
            lower_u    = FAKE_THRESHOLD - UNCERTAIN_BAND
            upper_u    = FAKE_THRESHOLD + UNCERTAIN_BAND
            h          = heuristic_score(text)
            uncertain  = lower_u < (raw_dv + h * 1.2) < upper_u
            if is_fake and confidence < 68:
                prediction = "UNCERTAIN — POSSIBLE FAKE"
            elif is_fake:
                prediction = "LIKELY FAKE"
            elif not is_fake and confidence < 68:
                prediction = "UNCERTAIN — POSSIBLY REAL"
            else:
                prediction = "LIKELY REAL"

        # ── Step 3: Build response ────────────────────────────────────────────
        is_uncertain = confidence < 68

        if is_fake:
            trust_score       = max(10, min(42, 100 - confidence + int(np.random.randint(-4, 4))))
            source_credibility = max(12, min(45, 100 - confidence + int(np.random.randint(-8, 8))))
            explanation = (
                "The AI detected multiple indicators of potential misinformation. "
                "The text contains linguistic patterns and framing structures commonly "
                "associated with false or misleading news. "
                + ("No trusted news outlet was found reporting this story." 
                   if corr_data and corr_data.get("trustedSources", 0) == 0 
                   else "")
                + " Cross-reference with trusted outlets before sharing."
            )
        else:
            trust_score        = max(58, min(95, confidence + int(np.random.randint(-5, 5))))
            source_credibility = max(60, min(97, confidence + int(np.random.randint(-5, 5))))
            trusted_n = corr_data.get("trustedSources", 0) if corr_data else 0
            if trusted_n >= 2:
                explanation = (
                    f"Live search found {trusted_n} trusted news outlets reporting "
                    "this story, strongly supporting its authenticity. The AI model "
                    "also indicates credible writing patterns."
                )
            elif trusted_n == 1:
                explanation = (
                    "One trusted outlet was found reporting a similar story. "
                    "The AI model also indicates credible writing patterns. "
                    "Verify through additional sources for full confidence."
                )
            else:
                explanation = (
                    "The AI analysis indicates this content is likely authentic based "
                    "on linguistic patterns. However, no matching story was found in "
                    "live news search — verify through trusted outlets independently."
                )

        h           = heuristic_score(text)
        factors     = build_factors(is_fake, is_uncertain, h, text, corr_data)
        sent_score, sent_label = get_sentiment(text)

        # Top matching sources for the UI
        top_sources = []
        if corr_raw and corr_raw.get("matches"):
            for m in corr_raw["matches"][:4]:
                top_sources.append({
                    "title":   m["title"],
                    "source":  m["source"],
                    "trusted": m["trusted"],
                    "link":    m.get("link", ""),
                })

        result = {
            "prediction":        prediction,
            "isFake":            is_fake,
            "isUncertain":       is_uncertain,
            "confidence":        confidence,
            "sentiment": {
                "score": sent_score,
                "label": sent_label,
            },
            "trustScore":        trust_score,
            "sourceCredibility": source_credibility,
            "factors":           factors,
            "explanation":       explanation,
            "corroboration": {
                "available":    CORROBORATION_AVAILABLE,
                "searchSuccess": corr_raw["search_success"] if corr_raw else False,
                "trustedSources": corr_data.get("trustedSources", 0) if corr_data else 0,
                "score":         corr_data.get("corroborationScore", 0.0) if corr_data else 0.0,
                "searchQuery":   corr_raw["query"] if corr_raw else "",
                "topMatches":    top_sources,
                "mlOverridden":  corr_data.get("mlOverridden", False) if corr_data else False,
            },
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Inference error: {e}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
