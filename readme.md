# DocMind AI 🧠

DocMind AI is a full-stack RAG app where users upload PDFs, ask questions, and get cited answers with persona-aware responses.

## ✨ Current Features

- 📄 PDF upload with Cloudinary storage
- 🧩 Ingestion pipeline: extract → clean → chunk → embed
- 🔍 Semantic retrieval with FAISS via Python service
- 🤖 Q&A endpoint using retrieved context + persona prompt
- 👤 Persona modes: `general`, `student`, `professional`, `legal`, `researcher`
- 📌 Citation panel with page navigation and source chips
- ✅ Simple citation marker on cited page (non-intrusive)
- 💬 Chat sessions/messages/citations persisted in MongoDB
- 🔐 JWT-based auth (`register/login`) + protected routes

---

## 🏗️ Architecture

```
React (Vite)  ->  Node/Express API  ->  FastAPI embeddings service
                     |                         |
                     v                         v
                MongoDB Atlas               FAISS index
                     |
                     v
                 Cloudinary (PDFs)
```

---

## 🧱 Tech Stack

### Frontend
- React 19
- Vite
- react-router-dom
- react-pdf + pdfjs-dist
- lucide-react

### Backend
- Node.js + Express
- Mongoose (MongoDB)
- Multer + Cloudinary storage
- JWT auth
- Axios (service-to-service calls)

### AI Service (`embeddings/`)
- FastAPI
- sentence-transformers (`all-MiniLM-L6-v2`)
- FAISS

---

## 📁 Project Structure (Actual)

```
DocMind AI/
├─ backend/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  │  ├─ cloudinary.js
│  │  ├─ db.js
│  │  └─ multerconfig.js
│  ├─ controllers/
│  │  ├─ authcontroller.js
│  │  ├─ documents.js
│  │  └─ queryController.js
│  ├─ middlewares/
│  │  └─ authmiddleware.js
│  ├─ models/
│  │  ├─ usermodel.js
│  │  ├─ documentmodel.js
│  │  ├─ chunkmodel.js
│  │  ├─ chatsessionmodel.js
│  │  ├─ messagemodel.js
│  │  └─ citationmodel.js
│  ├─ pipeline/
│  │  └─ ingestion.pipeline.js
│  ├─ routes/
│  │  ├─ authroutes.js
│  │  ├─ documents.js
│  │  ├─ query.js
│  │  ├─ citations.js
│  │  └─ embed.js
│  ├─ services/
│  │  ├─ embeddingService.js
│  │  ├─ pdfTextExtractor.js
│  │  └─ personaService.js
│  └─ utils/
│     ├─ textChunker.js
│     └─ textCleaner.js
├─ embeddings/
│  ├─ app.py
│  ├─ vector_store.py
│  ├─ llm_service.py
│  └─ requirements.txt
└─ frontend/
   ├─ src/
   │  ├─ App.jsx
   │  ├─ api/auth.js
   │  ├─ components/
   │  │  ├─ ProtectedRoute.jsx
   │  │  ├─ home.jsx
   │  │  ├─ auth/
   │  │  │  ├─ login.jsx
   │  │  │  └─ signup.jsx
   │  │  └─ dashboard/
   │  │     ├─ dashboard.jsx
   │  │     └─ CitationPanel.jsx
   │  └─ utils/auth.js
   └─ public/pdf.worker.min.js
```

---

## 🚀 Local Setup

## 1) Clone

```bash
git clone https://github.com/sumankhavadia/DocMind-AI.git
cd "DocMind AI"
```

## 2) Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ANSWER_URL=http://localhost:8000/answer
ADD_URL=http://localhost:8000/add
SEARCH_URL=http://localhost:8000/search
CLASSIFY_URL=http://localhost:8000/classify
```

> If your Mongo password contains `@`, encode it as `%40`.

Run backend:

```bash
npm start
```

## 3) Python embeddings service

```bash
cd ../embeddings
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## 4) Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Documents
- `POST /api/documents/upload`
- `GET /api/documents/:documentId/file` (protected)

### Query
- `POST /api/query/search`
- `POST /api/query/ask`
- `POST /api/query/summary`

### Citations
- `GET /api/citations/:messageId` (protected)

---

## 📝 Notes

- Citation preview currently uses a simple marker (✓ Answer source) on the cited page.
- PDFs are stored in Cloudinary; ingestion downloads securely server-side when needed.
- `embeddings/vector_store_data` is local runtime data and should remain gitignored.

---

## � UI Preview

> **Note:** Screenshots hosted on Cloudinary

![Login Screen](https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/docmind/screenshots/login.png)

![Dashboard](https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/docmind/screenshots/dashboard.png)

![Document Upload](https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/docmind/screenshots/upload.png)

![Chat Interface](https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/docmind/screenshots/chat.png)

![Citation Panel](https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/docmind/screenshots/citation-panel.png)

---

## �🛠️ Common Troubleshooting

### MongoDB `ENOTFOUND _mongodb._tcp...`
- Usually malformed `MONGO_URI`.
- Ensure cluster hostname is correct and special chars in password are URL-encoded.

### Cloudinary `401 deny or ACL failure`
- Raw file delivery may be restricted.
- Ensure Cloudinary credentials are correct.
- Backend now supports signed fallback for restricted raw URLs.

### `I don't know — no relevant context found`
- Ensure embeddings service is running on port `8000`.
- Re-upload PDF after ingestion logic changes.

---

