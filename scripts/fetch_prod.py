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

def extract_book_page_data(book_slug):
    url = f'https://majalis-alpha.vercel.app/books/{book_slug}'
    raw = fetch_rsc(url)
    book_obj = None
    for line in raw.split('\n'):
        # Look for "book":{"id":
        idx = line.find('\"book\":{')
        if idx != -1:
            try:
                sub = line[idx+7:]
                obj, _ = json.JSONDecoder().raw_decode(sub)
                book_obj = obj
                break
            except Exception as e:
                pass
    return book_obj

def extract_session_data(book_slug, session_slug):
    url = f'https://majalis-alpha.vercel.app/books/{book_slug}/sessions/{session_slug}'
    raw = fetch_rsc(url)
    session_obj = None
    for line in raw.split('\n'):
        idx = line.find('\"session\":{')
        if idx != -1:
            try:
                sub = line[idx+10:]
                obj, _ = json.JSONDecoder().raw_decode(sub)
                session_obj = obj
                break
            except Exception as e:
                pass
    return session_obj

def main():
    print("Fetching books list...")
    books_meta = fetch_json('https://majalis-alpha.vercel.app/api/books')
    print(f"Found {len(books_meta)} books from API")

    complete_data = {
        "books": [],
        "sections": [],
        "sessions": [],
        "summaries": [],
        "mindMaps": [],
        "flashcards": [],
        "quizQuestions": [],
        "lifeApplications": [],
        "sessionLinks": [],
    }

    for b in books_meta:
        slug = b['slug']
        print(f"\nProcessing book: {b['title']} (slug: {slug})")
        book_page = extract_book_page_data(slug)
        if not book_page:
            print(f"Could not extract book page for {slug}, using meta")
            book_page = b

        book_entry = {
            "id": book_page.get("id", b["id"]),
            "title": book_page.get("title", b["title"]),
            "slug": book_page.get("slug", b["slug"]),
            "cover": book_page.get("cover", b.get("cover") or "📗"),
            "description": book_page.get("description", b.get("description", "")),
            "goals": book_page.get("goals", b.get("goals", [])),
            "level": book_page.get("level", b.get("level", "مبتدئ")),
            "estimatedDuration": book_page.get("estimatedDuration", b.get("estimatedDuration", "")),
            "status": book_page.get("status", "PUBLISHED"),
            "publishedAt": book_page.get("publishedAt"),
            "createdAt": book_page.get("createdAt"),
            "categoryId": book_page.get("categoryId"),
            "authorId": book_page.get("authorId"),
            "teacherId": book_page.get("teacherId"),
            "category": book_page.get("category"),
            "author": book_page.get("author"),
            "teacher": book_page.get("teacher"),
        }
        complete_data["books"].append(book_entry)

        sections = book_page.get("sections", [])
        for sec in sections:
            sec_entry = {
                "id": sec["id"],
                "title": sec["title"],
                "order": sec.get("order", 1),
                "bookId": book_entry["id"],
            }
            complete_data["sections"].append(sec_entry)

            sessions = sec.get("sessions", [])
            for s in sessions:
                s_slug = s["slug"]
                print(f"  Fetching session: {s.get('title')} ({s_slug})")
                full_session = extract_session_data(slug, s_slug)
                if not full_session:
                    print(f"    Failed to fetch full session for {s_slug}, using basic info")
                    full_session = s

                sess_id = full_session["id"]
                sess_entry = {
                    "id": sess_id,
                    "bookSectionId": sec["id"],
                    "title": full_session.get("title", s.get("title")),
                    "slug": full_session.get("slug", s_slug),
                    "orderInBook": full_session.get("orderInBook", s.get("orderInBook", 1)),
                    "date": full_session.get("date"),
                    "duration": full_session.get("duration"),
                    "videoUrl": full_session.get("videoUrl", ""),
                    "audioUrl": full_session.get("audioUrl", ""),
                    "textContent": full_session.get("textContent", ""),
                    "status": full_session.get("status", "PUBLISHED"),
                    "createdAt": full_session.get("createdAt"),
                }
                complete_data["sessions"].append(sess_entry)

                # Summary
                summary = full_session.get("summary")
                if summary:
                    complete_data["summaries"].append({
                        "id": summary.get("id", f"sum_{sess_id}"),
                        "sessionId": sess_id,
                        "keyIdeas": summary.get("keyIdeas", []),
                        "terms": summary.get("terms", []),
                        "evidences": summary.get("evidences", []),
                        "benefits": summary.get("benefits", []),
                        "reviewPoints": summary.get("reviewPoints", []),
                    })

                # MindMap
                mindMap = full_session.get("mindMap")
                if mindMap:
                    complete_data["mindMaps"].append({
                        "id": mindMap.get("id", f"mm_{sess_id}"),
                        "sessionId": sess_id,
                        "nodesJson": mindMap.get("nodesJson", {}),
                    })

                # Flashcards
                for fc in full_session.get("flashcards", []):
                    complete_data["flashcards"].append({
                        "id": fc.get("id"),
                        "sessionId": sess_id,
                        "front": fc.get("front", ""),
                        "back": fc.get("back", ""),
                        "type": fc.get("type", "qa"),
                    })

                # QuizQuestions
                for q in full_session.get("quizQuestions", []):
                    complete_data["quizQuestions"].append({
                        "id": q.get("id"),
                        "sessionId": sess_id,
                        "type": q.get("type", "MCQ"),
                        "question": q.get("question", ""),
                        "options": q.get("options", []),
                        "correctAnswer": q.get("correctAnswer", 0),
                        "explanation": q.get("explanation", ""),
                    })

                # LifeApplications
                for la in full_session.get("lifeApplications", []):
                    complete_data["lifeApplications"].append({
                        "id": la.get("id"),
                        "sessionId": sess_id,
                        "title": la.get("title", ""),
                        "description": la.get("description", ""),
                    })

                # Links
                for l in full_session.get("linksFrom", []):
                    complete_data["sessionLinks"].append({
                        "id": l.get("id"),
                        "sessionId": sess_id,
                        "linkedSessionId": l.get("linkedSessionId"),
                        "linkType": l.get("linkType", "COMPLEMENTARY"),
                        "label": l.get("label", ""),
                    })

    os.makedirs("data", exist_ok=True)
    with open("data/prod_data.json", "w", encoding="utf-8") as f:
        json.dump(complete_data, f, ensure_ascii=False, indent=2)

    print("\n✅ Successfully dumped all production data to data/prod_data.json!")
    print(f"Books: {len(complete_data['books'])}")
    print(f"Sections: {len(complete_data['sections'])}")
    print(f"Sessions: {len(complete_data['sessions'])}")
    print(f"Summaries: {len(complete_data['summaries'])}")
    print(f"MindMaps: {len(complete_data['mindMaps'])}")
    print(f"Flashcards: {len(complete_data['flashcards'])}")
    print(f"LifeApplications: {len(complete_data['lifeApplications'])}")

if __name__ == '__main__':
    main()
