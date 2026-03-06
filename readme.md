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
## 🚢 Deployment Guide

### Prerequisites
- MongoDB Atlas already configured ✅
- Cloudinary already configured ✅
- GitHub repo ready to deploy

---

### 🎨 Frontend Deployment (Vercel)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com) and sign in with GitHub
   - Click **"Add New Project"**
   - Import your `DocMind-AI` repository
   - Configure:
     - **Framework Preset:** Vite
     - **Root Directory:** `frontend`
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   
3. **Environment Variables** (Vercel Dashboard)
   ```env
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

4. **Deploy** → Click Deploy button

5. **Update CORS:** Note your Vercel URL (e.g., `https://docmind-ai.vercel.app`) and add it to backend CORS settings

---

### ⚙️ Backend Deployment (Render)

1. **Create Render Account**
   - Visit [render.com](https://render.com)
   - Sign in with GitHub

2. **Create New Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select `DocMind-AI`

3. **Configure Service**
   - **Name:** `docmind-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free (or paid for better performance)

4. **Environment Variables** (Render Dashboard → Environment)
   ```env
   PORT=10000
   MONGO_URI=mongodb+srv://<user>:<encoded-password>@<cluster>.mongodb.net/?appName=<app>
   JWT_SECRET=your_jwt_secret_here_use_strong_random_string
   
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   ANSWER_URL=https://docmind-embeddings.onrender.com/answer
   ADD_URL=https://docmind-embeddings.onrender.com/add
   SEARCH_URL=https://docmind-embeddings.onrender.com/search
   CLASSIFY_URL=https://docmind-embeddings.onrender.com/classify
   
   NODE_ENV=production
   FRONTEND_URL=https://docmind-ai.vercel.app
   ```

5. **Click "Create Web Service"**

6. **Note the URL** (e.g., `https://docmind-backend.onrender.com`)

---

### 🐍 Python Embeddings Service (Render)

1. **Create Another Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect same GitHub repository

2. **Configure Service**
   - **Name:** `docmind-embeddings`
   - **Region:** Same as backend for lower latency
   - **Branch:** `main`
   - **Root Directory:** `embeddings`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free tier (or paid for faster cold starts)

3. **Environment Variables** (Render Dashboard → Environment)
   ```env
   PYTHON_VERSION=3.11.0
   PYTHONUNBUFFERED=1
   PORT=10000
   ```

4. **Click "Create Web Service"**

5. **Note the URL** (e.g., `https://docmind-embeddings.onrender.com`)

6. **Update Backend ENV:** Go back to backend service → Environment, update `ANSWER_URL`, `ADD_URL`, etc. with this embeddings URL

---

### ⚠️ Important Render Notes

- **Free Tier Limitations:**
  - Services spin down after 15 minutes of inactivity
  - Cold starts take 30-60 seconds
  - 750 hours/month free (not enough for 24/7 uptime)

- **Keep Services Awake** (Optional):
  - Use [UptimeRobot](https://uptimerobot.com/) to ping endpoints every 5-10 minutes
  - Or upgrade to paid tier ($7/month per service)

- **Disk Storage:**
  - Render's filesystem is ephemeral on free tier
  - FAISS index rebuilds on each deploy
  - Consider paid plan with persistent disk for production

---

### 🔄 Update Frontend API URL

After backend is deployed, update `frontend/src/api/auth.js` and other API files:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

Then redeploy frontend on Vercel (automatic if connected to GitHub).

---

### ✅ Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Render
- [ ] Python embeddings deployed on Render
- [ ] MongoDB Atlas whitelist: 0.0.0.0/0 (or specific Render IPs)
- [ ] Environment variables configured for all services
- [ ] CORS updated with production frontend URL
- [ ] Frontend VITE_API_URL points to Render backend URL
- [ ] Backend ANSWER_URL/ADD_URL point to Render embeddings URL
- [ ] Test registration/login flow
- [ ] Test PDF upload to Cloudinary
- [ ] Test Q&A with citations and PDF preview

---

### 🌐 Alternative Platforms

| Service | Frontend | Backend | Python |
|---------|----------|---------|--------|
| **Vercel** | ✅ Best | ❌ Serverless only | ❌ |
| **Railway** | ⚠️ OK | ✅ Excellent | ✅ Excellent |
| **Render** | ✅ Good | ✅ Good | ✅ Good |
| **Fly.io** | ⚠️ Manual | ✅ Good | ✅ Good |
| **Netlify** | ✅ Excellent | ❌ Functions only | ❌ |

**Recommended Stack:**
- Frontend: **Vercel** (automatic GitHub deploys, edge network, free SSL)
- Backend + Python: **Render** (unified platform, great free tier, easy setup)

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

