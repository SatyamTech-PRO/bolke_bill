बोलके बिल 🧾 Bolke Bill

A Hinglish voice billing assistant for Indian kirana stores. Speak the order, get the bill.

Built for the Great Indian AI Internship Challenge by Gnani AI, using Gnani Prisma (speech-to-text) and Gnani Timbre (text-to-speech).

🎥 Demo video: PASTE_VIDEO_LINK_HERE 💼 Launch post: PASTE_LINKEDIN_OR_X_POST_LINK_HERE

1. The problem

Millions of small shopkeepers still write bills and credit (khata) entries by hand, often with a queue waiting and their hands full. Most billing software assumes typing, English menus and a steady hand on a screen. For a busy kirana owner, the natural interface is talking, and the way they talk is Hinglish: Hindi number words, English product names, and customer names mixed in one sentence.

2. The solution

The shopkeeper just says:

"Do kilo cheeni, ek Maggi, teen Parle-G, Sharma ji ke khate mein likh do."

Bolke Bill then:

🎙️ Transcribes the Hinglish speech with Gnani Prisma
🧠 Parses it into items, quantities, units and a customer name
🧾 Builds an itemised, editable bill with prices from the inventory
📒 Saves the bill and updates the customer's khata (credit ledger)
🔊 Reads the bill back aloud with Gnani Timbre
3. Why Gnani's models

Hinglish code-mixing, Indian number words and noisy shop audio are exactly where generic speech tools struggle. In testing, Prisma handled mixed Devanagari/Latin output, Hindi numerals and background noise well enough to drive a real billing flow, and Timbre gives the shopkeeper spoken confirmation without looking at the screen.

4. How it works
 Mic (browser)
     │  records audio, converts to 16 kHz mono WAV in the browser
     ▼
 POST /transcribe ──► Gnani Prisma (STT)
     │  transcript (Devanagari + Latin mixed)
     ▼
 POST /parse ──► Hinglish parser + RapidFuzz inventory matching
     │  {customer, items[], grand_total}
     ▼
 Editable bill  ──► POST /confirm ──► SQLite (bills + khata)
     │
     ▼
 POST /speak ──► Gnani Timbre (TTS) ──► spoken bill in the browser

Parser highlights

Understands digits and Hindi number words (एक, दो, तीन, डेढ़, ढाई, आधा, ...)
Handles mixed Devanagari and Latin text (2 किलो चीनी, ek packet Maggi)
Recognises units: kilo/किलो, packet/पैकेट, litre/लीटर, dozen/दर्जन
Matches messy spoken item names (parle ji → Parle-G) with RapidFuzz against a 30-item synthetic inventory
Detects the customer from phrases like Sharma ji ke khate mein / शर्मा जी के खाते में

Audio handling: Chrome's recorder produces webm, which Gnani rejects. The app converts the recording to 16 kHz mono WAV entirely in the browser (no ffmpeg or extra backend dependency) before uploading.

5. Features
🎙️ One-tap voice input, plus a text fallback if the mic is unavailable
✏️ Editable bill table (change quantities, remove items) before confirming
📒 Khata ledger with running credit per customer
🗑️ Delete a customer's khata, or reset all demo data with one click
🔊 Spoken bill readback (Gnani Timbre)
⚠️ Real API errors shown in the UI (nothing is faked)
🔒 API key stays on the server, never exposed to the frontend
6. Tech stack
Layer	Tech
Backend	Python 3.11+, FastAPI, Uvicorn
Speech-to-text	Gnani Prisma (api.vachana.ai)
Text-to-speech	Gnani Timbre (api.vachana.ai)
Parsing / matching	Custom Hinglish parser, RapidFuzz
Database	SQLite (created automatically on first run)
Frontend	Vanilla HTML + JavaScript (single page)
7. Run it locally (Windows PowerShell)

Prerequisites: Python 3.11+ and a Gnani API key from app.gnani.ai/voice.

powershell
git clone https://github.com/YOUR_USERNAME/bolke-bill.git
cd bolke-bill\backend

python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env      # then open .env and paste your key
uvicorn main:app --reload --port 8000

Open http://localhost:8000 in Chrome and allow microphone access.

.env format (no quotes, no spaces):

GNANI_API_KEY=your_key_here
Run the tests
powershell
# from backend/, with the venv active
pytest tests/ -v
8. Try these phrases
Say this	Result
2 kilo cheeni, ek Maggi, teen Parle-G, Sharma ji ke khate mein likh do	Sugar 2 kg, Maggi 1, Parle-G 3, customer Sharma ji
दो किलो चीनी एक मैगी तीन पारले जी	Same items, Devanagari input
डेढ़ किलो आटा, आधा litre tel	Atta 1.5 kg, Oil 0.5 L
5 kg chawal, 1 packet namak, Verma ji ke khate mein	Rice 5 kg, Salt 1 packet, customer Verma ji
9. API reference
Method	Path	Description
POST	/transcribe	Audio file → Gnani Prisma → transcript
POST	/parse	Text → {customer, items, grand_total}
POST	/confirm	Save bill and update khata
POST	/speak	Text → Gnani Timbre → WAV audio
GET	/khata	List khata (credit ledger) entries
GET	/bills	List saved bills
DELETE	/khata/{customer}	Remove a customer's khata and bills
POST	/reset	Clear all demo data
GET	/	Serve the frontend

Example, parse text directly:

bash
curl -X POST http://localhost:8000/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "2 kilo cheeni, teen Parle-G, Sharma ji ke khate mein"}'
10. Project structure
bolke-bill/
├── backend/
│   ├── main.py            # FastAPI app and routes
│   ├── parser.py          # Hinglish bill parser
│   ├── inventory.py       # 30-item synthetic inventory
│   ├── database.py        # SQLite helpers
│   ├── requirements.txt
│   ├── .env.example       # template (real .env is git-ignored)
│   └── tests/
│       └── test_parser.py
├── frontend/
│   └── index.html         # single-page app
├── .gitignore
└── README.md
11. Security and data
The API key lives only in backend/.env, which is git-ignored.
The browser talks only to the local backend; it never sees the Gnani key.
All inventory, customers and bills in the demo are synthetic. No real personal data is used.
12. Limitations and next steps
 "Settle khata" / payment button
 More Indian languages beyond Hindi/Hinglish
 Inventory upload and editing from the UI
 Send the bill on WhatsApp
 Printable bill (PDF or thermal printer)
 Offline mode for low-connectivity shops
13. Models used
Gnani Prisma: speech-to-text
Gnani Timbre: text-to-speech

Built by Satyam Kumar, Chandigarh University, for the Great Indian AI Internship Challenge.   make 
