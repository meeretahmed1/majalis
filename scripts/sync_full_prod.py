import urllib.request
import json
import re
import os

HEADERS = {
    'RSC': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def fetch_rsc(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode()

def parse_flight_chunks(raw):
    chunks = {}
    for line in raw.split('\n'):
        # Format id:Tlen,text
        m = re.match(r'^([0-9a-zA-Z]+):T[0-9a-fA-F]+,(.*)$', line)
        if m:
            chunks['$' + m.group(1)] = m.group(2)
            continue
        m2 = re.match(r'^([0-9a-zA-Z]+):\"(.*)\"$', line)
        if m2:
            try:
                chunks['$' + m2.group(1)] = json.loads('"' + m2.group(2) + '"')
            except Exception:
                chunks['$' + m2.group(1)] = m2.group(2)
    return chunks

def resolve_value(val, chunks):
    if isinstance(val, str):
        if val.startswith('$D'):
            return val[2:]
        if val in chunks:
            resolved = chunks[val]
            # Recursively resolve if needed
            return resolve_value(resolved, chunks)
        return val
    elif isinstance(val, list):
        return [resolve_value(item, chunks) for item in val]
    elif isinstance(val, dict):
        return {k: resolve_value(v, chunks) for k, v in val.items()}
    return val

def extract_session_obj(book_slug, session_slug):
    url = f'https://majalis-alpha.vercel.app/books/{book_slug}/sessions/{session_slug}'
    raw = fetch_rsc(url)
    chunks = parse_flight_chunks(raw)

    for line in raw.split('\n'):
        idx = line.find('\"session\":{')
        if idx != -1:
            try:
                sub = line[idx+10:]
                obj, _ = json.JSONDecoder().raw_decode(sub)
                resolved_obj = resolve_value(obj, chunks)
                return resolved_obj
            except Exception as e:
                pass
    return None

def main():
    books_meta = fetch_json('https://majalis-alpha.vercel.app/api/books')
    print("Found books:", [b['title'] for b in books_meta])

    synced_data = {
        "categories": [
            {
                "id": "cms770ssd00028d7zc2b1hyjv",
                "name": "التزكية والعقيدة",
                "slug": "aqeedah-tarbiyah",
                "order": 1
            },
            {
                "id": "cat_fiqh_shafii",
                "name": "الفقه الشافعي",
                "slug": "fiqh-shafii",
                "order": 2
            }
        ],
        "authors": [
            {
                "id": "cms770uks00038d7z7exmeqwc",
                "name": "الشيخ عبد الله المُدرِّس",
                "bio": "مدرّس ومؤلف في العلوم الشرعية والتزكية"
            },
            {
                "id": "auth_ibn_ataillah",
                "name": "ابن عطاء الله السكندري",
                "bio": "الإمام تاج الدين أحمد بن عطاء الله السكندري (ت 709هـ)"
            },
            {
                "id": "auth_ibn_qasim",
                "name": "ابن قاسم الغزي",
                "bio": "صاحب شرح فتح القريب المجيب على متن أبي شجاع"
            }
        ],
        "books": [],
        "bookSections": [],
        "sessions": [],
        "sessionSummaries": [],
        "mindMaps": [],
        "flashcards": [],
        "quizQuestions": [],
        "lifeApplications": [],
        "sessionLinks": [],
    }

    book_sessions_map = {
        'fadl-al-ilm': [
            'session-1',
            'session-2',
            'session-1788334064750',
            'session-1790241182100',
            'session-1791273823404',
            'session-1791494808119',
            'session-1791633872635',
            'session-1791636229063',
            'session-1791784424540'
        ],
        'fath-al-qareeb': [
            'session-1788167988942',
            'session-1791538782836'
        ],
        'book-8c380bf3d820': [
            'session-1791369447878'
        ]
    }

    seen_sections = set()
    seen_sessions = set()

    for b in books_meta:
        b_slug = b['slug']
        print(f"\n======================================")
        print(f"Syncing Book: {b['title']} ({b_slug})")
        print(f"======================================")

        book_entry = {
            "id": b["id"],
            "title": b["title"],
            "slug": b["slug"],
            "cover": b.get("cover") or "📗",
            "description": b.get("description", ""),
            "goals": b.get("goals", []),
            "level": b.get("level", "مبتدئ"),
            "estimatedDuration": b.get("estimatedDuration", ""),
            "status": b.get("status", "PUBLISHED"),
            "publishedAt": b.get("publishedAt"),
            "createdAt": b.get("createdAt"),
            "categoryId": b.get("categoryId") or "cms770ssd00028d7zc2b1hyjv",
            "authorId": b.get("authorId") or "cms770uks00038d7z7exmeqwc",
            "teacherId": b.get("teacherId") or "cms770uks00038d7z7exmeqwc",
        }
        synced_data['books'].append(book_entry)

        session_slugs = book_sessions_map.get(b_slug, [])
        for s_slug in session_slugs:
            print(f"Fetching session: {s_slug}...")
            sess_obj = extract_session_obj(b_slug, s_slug)
            if not sess_obj:
                print(f"  Warning: could not fetch {s_slug}")
                continue

            bsec = sess_obj.get('bookSection')
            sec_id = bsec['id'] if bsec else f"sec_{b['id']}"
            if sec_id not in seen_sections:
                sec_entry = {
                    "id": sec_id,
                    "title": bsec.get("title", "الباب الأول") if bsec else "الباب الأول",
                    "order": bsec.get("order", 1) if bsec else 1,
                    "bookId": b["id"],
                }
                synced_data['bookSections'].append(sec_entry)
                seen_sections.add(sec_id)

            sess_id = sess_obj["id"]
            if sess_id not in seen_sessions:
                sess_entry = {
                    "id": sess_id,
                    "bookSectionId": sec_id,
                    "title": sess_obj.get("title", ""),
                    "slug": sess_obj.get("slug", s_slug),
                    "orderInBook": sess_obj.get("orderInBook", 1),
                    "date": sess_obj.get("date"),
                    "duration": sess_obj.get("duration"),
                    "videoUrl": sess_obj.get("videoUrl", ""),
                    "audioUrl": sess_obj.get("audioUrl", ""),
                    "textContent": sess_obj.get("textContent", ""),
                    "status": sess_obj.get("status", "PUBLISHED"),
                    "createdAt": sess_obj.get("createdAt"),
                }
                synced_data['sessions'].append(sess_entry)
                seen_sessions.add(sess_id)

                summary = sess_obj.get("summary")
                if summary:
                    synced_data["sessionSummaries"].append({
                        "id": summary.get("id", f"sum_{sess_id}"),
                        "sessionId": sess_id,
                        "keyIdeas": summary.get("keyIdeas", []),
                        "terms": summary.get("terms", []),
                        "evidences": summary.get("evidences", []),
                        "benefits": summary.get("benefits", []),
                        "reviewPoints": summary.get("reviewPoints", []),
                    })

                mindMap = sess_obj.get("mindMap")
                if mindMap:
                    synced_data["mindMaps"].append({
                        "id": mindMap.get("id", f"mm_{sess_id}"),
                        "sessionId": sess_id,
                        "nodesJson": mindMap.get("nodesJson", {}),
                    })

                for fc in sess_obj.get("flashcards", []):
                    synced_data["flashcards"].append({
                        "id": fc.get("id"),
                        "sessionId": sess_id,
                        "front": fc.get("front", ""),
                        "back": fc.get("back", ""),
                        "type": fc.get("type", "qa"),
                    })

                for q in sess_obj.get("quizQuestions", []):
                    synced_data["quizQuestions"].append({
                        "id": q.get("id"),
                        "sessionId": sess_id,
                        "type": q.get("type", "MCQ"),
                        "question": q.get("question", ""),
                        "options": q.get("options", []),
                        "correctAnswer": q.get("correctAnswer", 0),
                        "explanation": q.get("explanation", ""),
                    })

                for la in sess_obj.get("lifeApplications", []):
                    synced_data["lifeApplications"].append({
                        "id": la.get("id"),
                        "sessionId": sess_id,
                        "title": la.get("title", ""),
                        "description": la.get("description", ""),
                    })

                for l in sess_obj.get("linksFrom", []):
                    synced_data["sessionLinks"].append({
                        "id": l.get("id"),
                        "sessionId": sess_id,
                        "linkedSessionId": l.get("linkedSessionId"),
                        "linkType": l.get("linkType", "COMPLEMENTARY"),
                        "label": l.get("label", ""),
                    })

    os.makedirs("src/lib", exist_ok=True)
    with open("src/lib/prod_data.json", "w", encoding="utf-8") as f:
        json.dump(synced_data, f, ensure_ascii=False, indent=2)

    print("\n✅ Clean Sync to src/lib/prod_data.json Complete!")
    print(f"Books: {len(synced_data['books'])}")
    print(f"Book Sections: {len(synced_data['bookSections'])}")
    print(f"Sessions: {len(synced_data['sessions'])}")
    print(f"Summaries: {len(synced_data['sessionSummaries'])}")
    print(f"Flashcards: {len(synced_data['flashcards'])}")

if __name__ == '__main__':
    main()
