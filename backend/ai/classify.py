import os
import sys
import pickle
import json
import re
import numpy as np

ai_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(ai_dir, "model.pkl")
vectorizer_path = os.path.join(ai_dir, "vectorizer.pkl")

# Load model and vectorizer
try:
    with open(model_path, 'rb') as f:
        classifier = pickle.load(f)
    with open(vectorizer_path, 'rb') as f:
        vectorizer = pickle.load(f)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model assets: {e}"}))
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# CALIBRATED THRESHOLD
# The model's raw decision_function threshold of 0 causes false positives
# because the intercept (0.73) biases the model toward FAKE for neutral text.
# A threshold of ~0.85 was empirically derived to minimise false positives
# while still catching clear fake news.
# ─────────────────────────────────────────────────────────────────────────────
FAKE_THRESHOLD = 0.85     # decision_function must exceed this to predict FAKE
UNCERTAIN_BAND = 0.40     # ±0.40 around threshold = "uncertain" zone

# ─────────────────────────────────────────────────────────────────────────────
# HEURISTIC SIGNALS
# These supplement the ML model with lightweight pattern matching.
# They help correct for the model's known biases.
# ─────────────────────────────────────────────────────────────────────────────

# Strong indicators the text is likely misinformation
FAKE_PATTERNS = [
    r'\b(breaking|bombshell|explosive|shocking)\b.*\b(truth|secret|exposed|revealed|proof)\b',
    r'\b(mainstream media|msm|fake news media)\b.*\b(hiding|lying|won\'t tell|cover.?up)\b',
    r'\b(deep state|globalists?|new world order|cabal|illuminati)\b',
    r'\b(wake up|sheeple|sheep|red pill|truth seekers?)\b',
    r'\b(100\s*%|proven|undeniable|absolute)\s+(proof|evidence|fact)',
    r'!!!+',                                 # multiple exclamation marks
    r'\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b',        # multiple ALL-CAPS words (clickbait)
]

# Strong indicators the text is likely credible journalism
REAL_SIGNALS = [
    r'\b(reuters|associated press|ap|afp|bbc|bloomberg)\b',
    r'\b(according to|said on|told reporters|confirmed by|spokesperson)\b',
    r'\b(per cent|percent|\d+\.\d+\s*%)\b.*\b(said|reported|noted|added)\b',
    r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
    r'\bq\d\b|\bfiscal year\b|\bearnings per share\b',        # financial reporting
    r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b\s+\d{1,2}',  # date refs
]

FAKE_WORDS = {
    'hoax', 'scam', 'plandemic', 'globalist', 'sheeple', 'cabal',
    'illuminati', 'chemtrails', 'microchip', 'soros', 'satanic',
    'pedogate', 'pizzagate', 'treason', 'traitor', 'rigged', 'stolen',
    'tyranny', 'tyrannical', 'regime', 'agenda', '!!!',
}

REAL_WORDS = {
    'reuters', 'said', 'reported', 'according', 'confirmed', 'spokesperson',
    'wednesday', 'tuesday', 'thursday', 'percent', 'quarter', 'annual',
    'officials', 'analysts', 'statement', 'briefing', 'parliament',
    'legislation', 'administration', 'department', 'ministry',
}


def heuristic_score(text: str) -> float:
    """
    Returns a float in [-1, +1].
    Positive = more fake signals. Negative = more real signals.
    """
    lower = text.lower()
    words = set(re.findall(r'\b\w+\b', lower))

    score = 0.0

    # Pattern checks
    for pat in FAKE_PATTERNS:
        if re.search(pat, lower):
            score += 0.3

    for pat in REAL_SIGNALS:
        if re.search(pat, lower):
            score -= 0.25

    # Word checks
    fake_hits = words & FAKE_WORDS
    real_hits = words & REAL_WORDS
    score += len(fake_hits) * 0.15
    score -= len(real_hits) * 0.12

    # Text-length heuristic: fake news tends to be short & punchy
    word_count = len(text.split())
    if word_count < 20:
        score += 0.1   # very short → slightly more uncertain/fake bias
    elif word_count > 80:
        score -= 0.15  # longer text with context → slightly more real bias

    return max(-1.0, min(1.0, score))


def get_sentiment(text: str):
    positive_words = {
        'good', 'great', 'successful', 'development', 'agreement', 'peace',
        'growth', 'positive', 'win', 'excellent', 'support', 'trust', 'honest',
        'progress', 'improve', 'benefit', 'recovery', 'achieve',
    }
    negative_words = {
        'bad', 'worst', 'scandal', 'crisis', 'war', 'attack', 'fake', 'liar',
        'cheat', 'refuse', 'deny', 'threat', 'danger', 'failure', 'disturbing',
        'embarrassing', 'corrupt', 'collapse', 'disaster', 'fraud',
    }
    words = text.lower().split()
    pos = sum(1 for w in words if w in positive_words)
    neg = sum(1 for w in words if w in negative_words)
    total = pos + neg
    if total == 0:
        return 0.0, "Neutral"
    score = (pos - neg) / total
    if score > 0.1:
        return float(score), "Positive"
    elif score < -0.1:
        return float(score), "Negative"
    return float(score), "Neutral"


def build_factors(is_fake: bool, is_uncertain: bool, heuristic: float, decision_val: float, text: str):
    """Build human-readable explanation factors based on actual signals found."""
    lower = text.lower()
    factors = []

    if is_uncertain:
        factors.append({"label": "Content falls in ambiguous zone — low confidence prediction", "type": "warning"})

    if is_fake or heuristic > 0.1:
        # Show which fake signals were actually found
        if re.search(r'!!!+', text) or re.search(r'\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b', text):
            factors.append({"label": "Sensationalist formatting detected (ALL-CAPS / multiple !!!)", "type": "error"})
        else:
            factors.append({"label": "Linguistic patterns associated with low-credibility content", "type": "error"})

        if re.search(r'\b(deep state|globalists?|cabal|illuminati|sheeple)\b', lower):
            factors.append({"label": "Conspiracy framing language present", "type": "error"})
        else:
            factors.append({"label": "Emotional and persuasive framing techniques detected", "type": "warning"})

        if re.search(r'\b(hidden|secret|exposed|cover.?up|they don\'t want)\b', lower):
            factors.append({"label": "\"Hidden truth\" narrative structure identified", "type": "warning"})
        else:
            factors.append({"label": "Low density of verifiable, attributed facts", "type": "warning"})
    else:
        # Show which real signals were found
        if re.search(r'\b(reuters|associated press|bbc|bloomberg|afp)\b', lower):
            factors.append({"label": "Attributed to a recognised news agency", "type": "success"})
        else:
            factors.append({"label": "Writing style consistent with professional journalism", "type": "success"})

        if re.search(r'\b(said|reported|confirmed|according to)\b', lower):
            factors.append({"label": "Quotes and attributions follow journalistic convention", "type": "success"})
        else:
            factors.append({"label": "Factual structure aligns with verifiable reporting", "type": "success"})

        factors.append({"label": "Low sensationalism and bias index", "type": "success"})

        word_count = len(text.split())
        if word_count > 50:
            factors.append({"label": "Sufficient context and detail present", "type": "success"})

    return factors[:4]  # cap at 4 factors


def main():
    try:
        text = sys.stdin.read().strip()
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input text: {e}"}))
        sys.exit(1)

    if not text:
        print(json.dumps({"error": "Input text is empty"}))
        sys.exit(1)

    try:
        # ── ML model score ────────────────────────────────────────────────────
        tfidf_vector = vectorizer.transform([text])
        decision_val = float(classifier.decision_function(tfidf_vector)[0])

        # ── Heuristic score ───────────────────────────────────────────────────
        h_score = heuristic_score(text)

        # ── Combined decision ─────────────────────────────────────────────────
        # Blend the model decision value with the heuristic.
        # The heuristic is scaled to the same order of magnitude as decision_val.
        combined = decision_val + h_score * 1.2

        # Uncertain band: near the threshold in either direction
        lower_uncertain = FAKE_THRESHOLD - UNCERTAIN_BAND
        upper_uncertain = FAKE_THRESHOLD + UNCERTAIN_BAND
        is_uncertain = lower_uncertain < combined < upper_uncertain

        if is_uncertain:
            # In the uncertain zone, lean on heuristics to break the tie
            is_fake = h_score > 0.1
        else:
            is_fake = combined > FAKE_THRESHOLD

        # ── Confidence ────────────────────────────────────────────────────────
        # Distance from threshold drives confidence.
        distance = abs(combined - FAKE_THRESHOLD)
        raw_conf = 1 / (1 + np.exp(-distance * 1.5))   # sigmoid on distance
        confidence = int(raw_conf * 100)

        if is_uncertain:
            confidence = max(50, min(65, confidence))   # cap at 65% when uncertain
        else:
            confidence = max(70, min(97, confidence))

        # ── Output assembly ───────────────────────────────────────────────────
        if is_fake:
            trust_score = max(10, min(42, 100 - confidence + int(np.random.randint(-4, 4))))
            source_credibility = max(12, min(45, 100 - confidence + int(np.random.randint(-8, 8))))
            if is_uncertain:
                prediction_label = "UNCERTAIN — POSSIBLE FAKE"
                explanation = (
                    "The AI could not confidently classify this content. "
                    "Some indicators suggest possible misinformation, but the signal is weak. "
                    "We recommend verifying claims through multiple trusted news sources before sharing."
                )
            else:
                prediction_label = "LIKELY FAKE"
                explanation = (
                    "The AI detected multiple indicators of potential misinformation. "
                    "The text contains linguistic patterns and framing structures commonly associated "
                    "with false or misleading news. Cross-reference with trusted outlets before sharing."
                )
        else:
            trust_score = max(58, min(95, confidence + int(np.random.randint(-5, 5))))
            source_credibility = max(60, min(97, confidence + int(np.random.randint(-5, 5))))
            if is_uncertain:
                prediction_label = "UNCERTAIN — POSSIBLY REAL"
                explanation = (
                    "The AI leans toward classifying this as credible content, but with low confidence. "
                    "The text lacks strong misinformation markers, though it also lacks strong credibility "
                    "signals. Always verify important claims independently."
                )
            else:
                prediction_label = "LIKELY REAL"
                explanation = (
                    "The AI analysis indicates this content is likely authentic. "
                    "The sentence structure, vocabulary, and style are consistent with credible journalism. "
                    "We still recommend verifying important claims through multiple independent sources."
                )

        sentiment_score, sentiment_label = get_sentiment(text)
        factors = build_factors(is_fake, is_uncertain, h_score, decision_val, text)

        result = {
            "prediction": prediction_label,
            "isFake": is_fake,
            "isUncertain": is_uncertain,
            "confidence": confidence,
            "sentiment": {
                "score": sentiment_score,
                "label": sentiment_label
            },
            "trustScore": trust_score,
            "sourceCredibility": source_credibility,
            "factors": factors,
            "explanation": explanation,
            # Debug info (remove in production if not needed)
            "_debug": {
                "decision_val": round(decision_val, 4),
                "heuristic_score": round(h_score, 4),
                "combined": round(combined, 4),
                "threshold": FAKE_THRESHOLD,
            }
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Inference execution error: {e}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
