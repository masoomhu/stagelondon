#!/usr/bin/env python3
"""
STAGE LONDON — Automated Show Scraper
Visits each London venue's What's On page, uses Claude API to extract
structured show data, generates shows-data.js, and commits to GitHub.

Usage:
  python3 scrape_shows.py                    # Full scrape
  python3 scrape_shows.py --venues 5         # Test with 5 venues
  python3 scrape_shows.py --commit           # Scrape + commit to GitHub
"""
import json, os, sys, time, re, csv, argparse, base64
from datetime import datetime, timedelta
from pathlib import Path
import requests

# ── Config ──
CLAUDE_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = "masoomhu/stagelondon"
CLAUDE_MODEL = "claude-sonnet-4-20250514"
VENUES_FILE = Path(__file__).parent / "venues.json"
OUTPUT_DIR = Path(__file__).parent / "output"
CATEGORIES = ["musical","play","comedy","standup","ballet","opera","immersive","cabaret","dance"]

def fetch_page(url, timeout=30):
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
        return r.text[:100000]
    except Exception as e:
        print(f"  [!] fetch failed: {e}")
        return ""

def strip_html(html):
    for tag in ['script','style','noscript','svg','iframe']:
        html = re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', html, flags=re.DOTALL|re.IGNORECASE)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'\s+', ' ', html)
    return html[:60000]

def extract_shows(venue_name, venue_type, venue_url, html):
    if not CLAUDE_API_KEY:
        print("  [!] No ANTHROPIC_API_KEY"); return []
    today = datetime.now().strftime("%Y-%m-%d")
    six_months = (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")
    prompt = f"""Extract ALL shows/events from the "{venue_name}" website ({venue_type} London venue).
Today is {today}. Include everything playing now through {six_months}.

For each show return a JSON object with these fields:
- title (string): show name
- category (string): one of: musical, play, comedy, standup, ballet, opera, immersive, cabaret, dance
- description (string): 1-2 sentence description
- dates (string): date range e.g. "Until 30 Jun 2026" or "1-15 Apr 2026" or "Ongoing" or "Nightly"
- priceRange (string|null): e.g. "£15-£65"
- duration (string|null): e.g. "2h 30m"
- cast (array): notable cast names, or []
- ticketUrl (string): booking URL or venue URL

Rules:
- Only real performances (not workshops/talks/tours)
- For comedy clubs with nightly shows, ONE entry for the regular format
- Named comedian specials get individual entries
- Stand-up = "standup", comedy plays = "comedy"
- Return ONLY a JSON array. No markdown, no explanation.

Venue URL: {venue_url}
Page content:
{html}"""

    for attempt in range(3):
        try:
            r = requests.post("https://api.anthropic.com/v1/messages",
                headers={"x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={"model": CLAUDE_MODEL, "max_tokens": 4096, "messages": [{"role": "user", "content": prompt}]},
                timeout=120)
            r.raise_for_status()
            text = r.json()["content"][0]["text"].strip()
            if text.startswith("```"): text = re.sub(r'^```(?:json)?\s*', '', text); text = re.sub(r'\s*```$', '', text)
            shows = json.loads(text)
            return shows if isinstance(shows, list) else []
        except (json.JSONDecodeError, requests.RequestException, KeyError) as e:
            print(f"  [!] attempt {attempt+1} failed: {e}")
            if attempt < 2: time.sleep(3)
    return []

def scrape_all(max_venues=None):
    with open(VENUES_FILE) as f: venues = json.load(f)
    if max_venues: venues = venues[:max_venues]
    all_shows, sid = [], 1
    print(f"\n{'='*60}\n STAGE LONDON Scraper — {len(venues)} venues\n {datetime.now()}\n{'='*60}\n")
    for i, v in enumerate(venues):
        print(f"[{i+1}/{len(venues)}] {v['name']} ({v['type']})")
        html = fetch_page(v["whatsOnUrl"])
        if not html: print("  ✗ skip\n"); continue
        cleaned = strip_html(html)
        print(f"  fetched {len(cleaned)} chars")
        shows = extract_shows(v["name"], v["type"], v["whatsOnUrl"], cleaned)
        print(f"  → {len(shows)} shows")
        for s in shows:
            s["id"] = sid; sid += 1
            s.setdefault("venue", v["name"])
            s["venueType"] = v["type"]
            if s.get("category") not in CATEGORIES: s["category"] = "play"
            for f in ["title","description","dates"]: s.setdefault(f, "")
            for f in ["priceRange","duration"]: s.setdefault(f, None)
            s.setdefault("cast", []); s.setdefault("ticketUrl", v["whatsOnUrl"])
        all_shows.extend(shows)
        if i < len(venues)-1: time.sleep(1.5)
        print()
    print(f"\n{'='*60}\n DONE: {len(all_shows)} total shows\n{'='*60}\n")
    return all_shows

def deduplicate(shows):
    seen, unique = set(), []
    for s in shows:
        key = (s["title"].lower().strip(), s.get("venue","").lower().strip())
        if key not in seen: seen.add(key); unique.append(s)
    for i, s in enumerate(unique): s["id"] = i+1
    return unique

def gen_js(shows, path):
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    path.write_text(f'// Auto-generated by STAGE LONDON scraper\n// Last updated: {now}\n// Total shows: {len(shows)}\nexport const LAST_UPDATED = "{now}";\nexport const SHOWS = {json.dumps(shows, indent=2, ensure_ascii=False)};\n', encoding="utf-8")
    print(f"✓ {path} ({len(shows)} shows)")

def gen_json(shows, path):
    path.write_text(json.dumps({"lastUpdated": datetime.utcnow().isoformat()+"Z", "totalShows": len(shows), "shows": shows}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✓ {path}")

def gen_csv(shows, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ID","Title","Category","Venue","VenueType","Dates","PriceRange","Duration","Cast","Description","TicketUrl"])
        for s in shows:
            w.writerow([s.get("id"),s.get("title"),s.get("category"),s.get("venue"),s.get("venueType"),s.get("dates"),s.get("priceRange"),s.get("duration"),", ".join(s.get("cast",[])),s.get("description"),s.get("ticketUrl")])
    print(f"✓ {path}")

def commit_github(js_content, json_content):
    if not GITHUB_TOKEN: print("[!] No GITHUB_TOKEN"); return False
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Content-Type": "application/json"}
    base = f"https://api.github.com/repos/{GITHUB_REPO}/contents"
    for path, content in {"app/shows-data.js": js_content, "public/shows-data.json": json_content}.items():
        url = f"{base}/{path}"
        sha = None
        try:
            r = requests.get(url, headers=headers)
            if r.ok: sha = r.json()["sha"]
        except: pass
        body = {"message": f"Auto-update shows ({datetime.now().strftime('%Y-%m-%d %H:%M')})", "content": base64.b64encode(content.encode()).decode()}
        if sha: body["sha"] = sha
        try:
            r = requests.put(url, headers=headers, json=body)
            if r.status_code in (200,201): print(f"✓ committed {path}")
            else: print(f"✗ {path}: {r.status_code}"); return False
        except Exception as e: print(f"✗ {path}: {e}"); return False
    return True

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--venues", type=int, help="Limit venues (for testing)")
    p.add_argument("--commit", action="store_true", help="Commit to GitHub")
    args = p.parse_args()
    if not CLAUDE_API_KEY: print("ERROR: Set ANTHROPIC_API_KEY"); sys.exit(1)
    OUTPUT_DIR.mkdir(exist_ok=True)
    shows = deduplicate(scrape_all(args.venues))
    print(f"After dedup: {len(shows)} unique shows\n")
    from collections import Counter
    for cat, n in sorted(Counter(s["category"] for s in shows).items(), key=lambda x:-x[1]):
        print(f"  {cat}: {n}")
    gen_js(shows, OUTPUT_DIR/"shows-data.js")
    gen_json(shows, OUTPUT_DIR/"shows-data.json")
    gen_csv(shows, OUTPUT_DIR/"shows-data.csv")
    if args.commit:
        print("\nCommitting to GitHub...")
        js = (OUTPUT_DIR/"shows-data.js").read_text()
        jn = (OUTPUT_DIR/"shows-data.json").read_text()
        if commit_github(js, jn): print("\n✓ Committed. Vercel will auto-deploy.\n")
        else: print("\n✗ Commit failed.\n")
    else:
        print(f"\nFiles in {OUTPUT_DIR}/")

if __name__ == "__main__":
    main()
