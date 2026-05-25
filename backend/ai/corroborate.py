"""
corroborate.py — Real-time news corroboration via free RSS feeds.

How it works:
1. Extract key noun phrases from the input text (headline / article snippet)
2. Query Google News RSS (no API key needed) with those phrases
3. Check how many *trusted* outlets reported a matching story
4. Return a corroboration score (0.0–1.0) + the list of matching sources

No external dependencies beyond the Python standard library.
"""

import re
import time
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Optional

# ── Trusted outlet list ────────────────────────────────────────────────────────
# These are sources whose presence in search results boosts the "REAL" verdict.
# Add / remove entries to fit your region or language.
TRUSTED_SOURCES: set[str] = {
    "reuters", "associated press", "ap news", "bbc", "bloomberg",
    "the guardian", "guardian", "npr", "pbs", "al jazeera",
    "afp", "agence france", "washington post", "new york times", "nyt",
    "wall street journal", "wsj", "abc news", "cbs news", "nbc news",
    "sky news", "financial times", "ft", "the economist", "time",
    "newsweek", "cnbc", "forbes", "axios", "politico", "the hill",
    "usa today", "los angeles times", "chicago tribune", "the atlantic",
    "foreign affairs", "apnews", "c-span", "vox", "theprint",
    "ndtv", "the hindu", "times of india", "hindustan times",
    "dawn", "the wire", "scroll.in", "business standard", "livemint",
}

# Outlets that are themselves known misinformation vectors — their presence
# is a weak negative signal (we don't penalise hard, just note it)
UNRELIABLE_SOURCES: set[str] = {
    "breitbart", "infowars", "21wire", "21stcenturywire", "naturalnews",
    "zerohedge", "beforeitsnews", "yournewswire", "newspunch",
    "activistpost", "thegatewaypu", "westernjournal", "oann",
    "newsmax", "epoch times", "thefederalist", "dailycaller",
}

# ── RSS feed endpoints ─────────────────────────────────────────────────────────
# Primary: Google News RSS (no key, rate-limited but generous for low volume)
# Fallbacks: Bing News RSS, DuckDuckGo HTML scrape (lightweight)
GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
BING_NEWS_RSS   = "https://www.bing.com/news/search?q={query}&format=rss"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Text utilities ─────────────────────────────────────────────────────────────

def _extract_query(text: str, max_words: int = 8) -> str:
    """
    Pull the most informative words from the text to form a search query.
    Strips stop words and keeps named-entity-style capitalised tokens first.
    """
    # Remove URLs, punctuation bursts, numbers-only tokens
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'[^\w\s]', ' ', text)

    # Prefer capitalised multi-word spans (likely named entities / proper nouns)
    caps = re.findall(r'\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3}\b', text)
    caps_flat = []
    for c in caps:
        caps_flat.extend(c.split())

    # Common stop words to drop
    stops = {
        'the','a','an','and','or','but','in','on','at','to','for','of','with',
        'by','from','is','are','was','were','be','been','being','have','has',
        'had','do','does','did','will','would','could','should','may','might',
        'shall','can','that','this','these','those','it','its','as','if','into',
        'about','after','before','between','through','during','including','until',
        'against','among','throughout','despite','towards','upon',
        'BREAKING','WATCH','READ','JUST','EXPOSED','SHOCKING',
    }

    # Build token list: caps first, then remaining meaningful words
    all_words = [w for w in text.split() if len(w) > 3 and w not in stops]
    ordered = caps_flat + [w for w in all_words if w not in caps_flat]

    # Deduplicate preserving order
    seen = set()
    unique = []
    for w in ordered:
        lw = w.lower()
        if lw not in seen:
            seen.add(lw)
            unique.append(w)

    query = ' '.join(unique[:max_words])
    return query or text[:80]  # fallback: first 80 chars


def _word_overlap(a: str, b: str) -> float:
    """Jaccard similarity on 4+ char words."""
    wa = set(re.findall(r'\b[a-z]{4,}\b', a.lower()))
    wb = set(re.findall(r'\b[a-z]{4,}\b', b.lower()))
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


SYNONYM_GROUPS = [
    ["killed", "died", "death", "murdered", "assassinated", "slain", "fatal", "dies", "kill", "dead"],
    ["pm", "prime", "minister", "premier"],
    ["president", "potus", "leader"],
    ["win", "victory", "won", "triumph", "wins"],
    ["steal", "stolen", "theft", "rob", "rigged", "stealing"],
    ["arrested", "detained", "custody", "jailed", "imprisoned", "arrest", "arrests"],
    ["condolences", "tribute", "sympathy", "mourn", "grief", "mourns", "tributes"],
    ["bill", "law", "legislation", "act"],
    ["ban", "forbid", "prohibit", "illegal", "outlaw", "banned", "bans"]
]

BLOCKER_WORDS = {
    "but", "however", "although", "condolences", "tribute", "mourns", "mourn", 
    "denies", "claims", "fake", "false", "hoax", "rumor", "not", "never", "refutes",
    "debunks", "debunked", "unrelated", "misleading", "tributes", "sympathy", "grief",
    "says", "reports", "report", "warns", "warned"
}

STOP_WORDS = {
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'shall','can','that','this','these','those','it','its','as','if','into',
    'about','after','before','between','through','during','including','until',
    'against','among','throughout','despite','towards','upon',
    'breaking','watch','read','just','exposed','shocking',
    'BREAKING','WATCH','READ','JUST','EXPOSED','SHOCKING'
}

def get_tokens(text: str) -> list[str]:
    return re.findall(r'\b\w+\b', text.lower())

def get_synonyms(word: str) -> list[str]:
    syns = {word}
    for group in SYNONYM_GROUPS:
        if word in group:
            syns.update(group)
    return list(syns)

def passes_two_layer_matching(claim: str, title: str) -> bool:
    clean_claim = re.sub(r'https?://\S+', '', claim)
    clean_claim = re.sub(r'[^\w\s]', ' ', clean_claim)
    
    clean_title = re.sub(r'https?://\S+', '', title)
    clean_title = re.sub(r'[^\w\s]', ' ', clean_title)

    claim_tokens = get_tokens(clean_claim)
    title_tokens = get_tokens(clean_title)

    if not claim_tokens or not title_tokens:
        return False

    # --- Symmetric Blocker Check ---
    SYMMETRIC_BLOCKERS = [
        "condolences", "tribute", "tributes", "sympathy", "mourn", "mourns", "mourned", "grief",
        "denies", "refutes", "debunks", "debunked", "hoax", "hoaxes", "fake", "false", "rumor", "rumors", "rumours",
        "threat", "threats"
    ]
    for blocker in SYMMETRIC_BLOCKERS:
        if blocker in title_tokens and blocker not in claim_tokens:
            return False

    # --- LAYER 1: Semantic Recall ---
    claim_keywords = [w for w in claim_tokens if len(w) > 3 and w not in STOP_WORDS]
    if not claim_keywords:
        return True

    matched_count = 0
    for keyword in claim_keywords:
        syns = get_synonyms(keyword)
        if any(syn in title_tokens for syn in syns):
            matched_count += 1

    recall = matched_count / len(claim_keywords)
    if recall < 0.50:
        return False

    # --- LAYER 2: Subject-Predicate Coherence ---
    orig_words = re.findall(r'\b\w+\b', re.sub(r'https?://\S+', '', claim))
    entities = []
    actions = []

    KNOWN_ACTIONS = {
        "killed", "died", "death", "murdered", "assassinated", "slain", "fatal", "dies", "kill", "dead",
        "win", "victory", "won", "triumph", "wins", "steal", "stolen", "theft", "rob", "rigged", "stealing",
        "arrested", "detained", "custody", "jailed", "imprisoned", "arrest", "arrests", "resign", "resigns", "resigned",
        "ban", "banned", "bans", "illegal", "fire", "fired", "fires", "attack", "attacks", "attacked", "condolences",
        "tribute", "sympathy", "mourn", "grief", "mourns", "tributes"
    }

    for word in orig_words:
        lower = word.lower()
        if lower in STOP_WORDS or len(lower) <= 2:
            continue
        
        is_capitalized = bool(re.match(r'^[A-Z][a-z]*', word)) or bool(re.match(r'^[A-Z]+$', word))
        if is_capitalized:
            entities.append(lower)
        elif lower in KNOWN_ACTIONS or len(lower) > 3:
            actions.append(lower)

    # Fallback actions
    if not actions:
        for word in orig_words:
            lower = word.lower()
            if lower not in entities and lower not in STOP_WORDS and len(lower) > 3:
                actions.append(lower)

    if entities and actions:
        coherent_pair_found = False
        for ent in entities:
            ent_syns = get_synonyms(ent)
            for act in actions:
                act_syns = get_synonyms(act)

                ent_indices = [idx for idx, token in enumerate(title_tokens) if token in ent_syns]
                act_indices = [idx for idx, token in enumerate(title_tokens) if token in act_syns]

                for i in ent_indices:
                    for j in act_indices:
                        if abs(i - j) <= 5:
                            start = min(i, j) + 1
                            end = max(i, j)
                            has_blocker = False
                            for k in range(start, end):
                                if title_tokens[k] in BLOCKER_WORDS:
                                    has_blocker = True
                                    break
                            if not has_blocker:
                                coherent_pair_found = True
                                break
                    if coherent_pair_found:
                        break
                if coherent_pair_found:
                    break
            if coherent_pair_found:
                break
        if not coherent_pair_found:
            return False
    else:
        # Fallback keywords proximity
        keywords = claim_keywords
        if len(keywords) >= 2:
            close_pair_found = False
            for i_idx, w1 in enumerate(keywords):
                for w2 in keywords[i_idx+1:]:
                    w1_indices = [idx for idx, t in enumerate(title_tokens) if t == w1]
                    w2_indices = [idx for idx, t in enumerate(title_tokens) if t == w2]

                    for idx1 in w1_indices:
                        for idx2 in w2_indices:
                            if abs(idx1 - idx2) <= 5:
                                start = min(idx1, idx2) + 1
                                end = max(idx1, idx2)
                                has_blocker = False
                                for k in range(start, end):
                                    if title_tokens[k] in BLOCKER_WORDS:
                                        has_blocker = True
                                        break
                                if not has_blocker:
                                    close_pair_found = True
                                    break
                        if close_pair_found:
                            break
                    if close_pair_found:
                        break
                if close_pair_found:
                    break
            if not close_pair_found:
                return False

    return True


# ── RSS fetching ───────────────────────────────────────────────────────────────

def _fetch_rss(url: str, timeout: int = 8) -> list[dict]:
    """
    Fetch an RSS feed and return a list of {title, source, link, pubDate} dicts.
    Returns [] on any error so callers never raise.
    """
    try:
        req = urllib.request.Request(url, headers=_HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
        root = ET.fromstring(raw)
        items = []
        for item in root.findall('.//item'):
            title_el  = item.find('title')
            source_el = item.find('source')
            link_el   = item.find('link')
            date_el   = item.find('pubDate')

            title  = title_el.text.strip()  if title_el  is not None else ''
            source = source_el.text.strip() if source_el is not None else ''
            link   = link_el.text.strip()   if link_el   is not None else ''
            date   = date_el.text.strip()   if date_el   is not None else ''

            # Google News appends " - Source Name" to titles — strip it
            if ' - ' in title:
                parts  = title.rsplit(' - ', 1)
                title  = parts[0].strip()
                if not source:
                    source = parts[1].strip()

            if title:
                items.append({
                    "title":   title,
                    "source":  source,
                    "link":    link,
                    "pubDate": date,
                })
        return items
    except Exception:
        return []


def _fetch_google_news(query: str) -> list[dict]:
    url = GOOGLE_NEWS_RSS.format(query=urllib.parse.quote(query))
    return _fetch_rss(url, timeout=8)


def _fetch_bing_news(query: str) -> list[dict]:
    url = BING_NEWS_RSS.format(query=urllib.parse.quote(query))
    return _fetch_rss(url, timeout=8)


# ── Core corroboration function ────────────────────────────────────────────────

def corroborate(text: str, max_results: int = 10) -> dict:
    """
    Search for the story described in `text` across free news RSS feeds.

    Returns a dict:
    {
      "query":               str,        # the search string used
      "corroboration_score": float,      # 0.0–1.0 (higher = more trusted sources confirmed)
      "trusted_count":       int,        # how many trusted outlets matched
      "unreliable_count":    int,        # how many unreliable outlets matched
      "total_found":         int,        # total RSS results retrieved
      "matches":             list[dict], # [{title, source, trusted, similarity, link}]
      "search_success":      bool,       # False if both RSS endpoints failed
      "error":               str|None,   # error message if search failed
    }
    """
    query = _extract_query(text)
    result = {
        "query":               query,
        "corroboration_score": 0.0,
        "trusted_count":       0,
        "unreliable_count":    0,
        "total_found":         0,
        "matches":             [],
        "search_success":      False,
        "error":               None,
    }

    # Try Google News first, fall back to Bing
    items = _fetch_google_news(query)
    if not items:
        items = _fetch_bing_news(query)
    if not items:
        result["error"] = "Both RSS endpoints returned no results (network issue or rate limit)"
        return result

    result["search_success"] = True
    result["total_found"]    = len(items)

    # Score each result
    for item in items[:max_results]:
        # Both layers must pass. Trusted source alone is never enough.
        passes = passes_two_layer_matching(text, item["title"])
        if not passes:
            continue

        sim    = _word_overlap(text, item["title"])
        src_lc = item["source"].lower()

        is_trusted    = any(t in src_lc for t in TRUSTED_SOURCES)
        is_unreliable = any(u in src_lc for u in UNRELIABLE_SOURCES)

        result["matches"].append({
            "title":      item["title"],
            "source":     item["source"],
            "link":       item["link"],
            "pubDate":    item["pubDate"],
            "trusted":    is_trusted,
            "unreliable": is_unreliable,
            "similarity": round(sim, 3),
        })
        if is_trusted:
            result["trusted_count"] += 1
        if is_unreliable:
            result["unreliable_count"] += 1

    # Score: 1.0 = 3+ trusted sources confirmed; scales linearly below that
    result["corroboration_score"] = round(min(1.0, result["trusted_count"] / 3.0), 4)
    return result


# ── Score combiner ─────────────────────────────────────────────────────────────

def combine_ml_and_corroboration(
    ml_is_fake:          bool,
    ml_confidence:       int,         # 0–100
    corroboration:       dict,        # output of corroborate()
    original_text:       str = "",
) -> dict:
    """
    Merge the ML classifier result with real-time corroboration evidence.

    Decision logic:
      - 2+ trusted sources corroborate → REAL (overrides ML if needed)
      - 1 trusted source corroborates  → lean toward ML but soften fake verdict
      - 0 trusted sources, ML says real → reduce confidence (story not findable)
      - 0 trusted sources, ML says fake → confirm fake at ML confidence
    """
    cs   = corroboration["corroboration_score"]   # 0.0 – 1.0
    ml_p = ml_confidence / 100.0                  # 0.0 – 1.0
    found = corroboration["search_success"]

    ml_overridden = False

    if not found:
        # Can't reach news APIs — trust ML entirely, cap real confidence at 75%
        final_fake = ml_is_fake
        if not ml_is_fake:
            final_p = min(0.75, ml_p)
        else:
            final_p = ml_p
        verdict_reason = "search_unavailable"

    elif cs >= 0.67:          # ≥2 trusted sources found the story
        final_fake    = False
        final_p       = min(0.97, 0.6 + cs * 0.37)
        ml_overridden = ml_is_fake
        verdict_reason = "strongly_corroborated"

    elif cs >= 0.33:          # 1 trusted source found the story
        if ml_is_fake:
            # Partial corroboration vs ML fake signal — flag as uncertain
            final_fake = True
            final_p    = ml_p * 0.65
            verdict_reason = "weak_corroboration_ml_fake"
        else:
            final_fake = False
            final_p    = min(0.92, ml_p * 0.6 + 0.35)
            verdict_reason = "partially_corroborated"

    else:                     # no corroboration found
        if ml_is_fake:
            final_fake = True
            final_p    = ml_p
            verdict_reason = "not_found_ml_fake"
        else:
            # Sensational or extreme claim check: if no trusted source confirms it, it is likely fake
            text_lower = (original_text or corroboration.get("query", "") or "").lower()
            has_extreme_claim = any(
                ext in text_lower for ext in 
                ["killed", "died", "death", "assassinated", "arrested", "coup", "resigns", "resigned", "dead", "murdered", "slain"]
            )
            if has_extreme_claim:
                final_fake = True
                final_p = 0.72  # Mark as fake with 72% confidence (LIKELY FAKE)
                ml_overridden = True
                verdict_reason = "not_found_sensational_claim"
            else:
                # ML says real but nobody reported it — reduce confidence
                final_fake = False
                final_p    = max(0.50, ml_p * 0.70)
                verdict_reason = "not_found_ml_real"

    final_confidence = max(50, min(97, int(final_p * 100)))

    # Build label
    if final_fake and final_confidence < 68:
        label = "UNCERTAIN — POSSIBLE FAKE"
    elif final_fake:
        label = "LIKELY FAKE"
    elif not final_fake and final_confidence < 68:
        label = "UNCERTAIN — POSSIBLY REAL"
    else:
        label = "LIKELY REAL"

    return {
        "prediction":        label,
        "isFake":            final_fake,
        "confidence":        final_confidence,
        "mlOverridden":      ml_overridden,
        "verdictReason":     verdict_reason,
        "corroborationScore": round(cs, 4),
        "trustedSources":    corroboration["trusted_count"],
        "searchQuery":       corroboration["query"],
        "searchSuccess":     corroboration["search_success"],
        "topMatches":        corroboration["matches"][:5],
    }


# ── CLI convenience ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    text = sys.stdin.read().strip()
    if not text:
        print(json.dumps({"error": "empty input"}))
        sys.exit(1)
    result = corroborate(text)
    print(json.dumps(result, indent=2))
