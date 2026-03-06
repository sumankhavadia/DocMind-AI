import os

# ── Memory optimizations — must be set before any imports ────
os.environ["TOKENIZERS_PARALLELISM"]        = "false"
os.environ["HF_HOME"]                       = "/tmp/huggingface"
os.environ["TRANSFORMERS_CACHE"]            = "/tmp/huggingface"
os.environ["SENTENCE_TRANSFORMERS_HOME"]    = "/tmp/huggingface"

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from vector_store import VectorStore
from llm_service import ask_llm, classify_document

app = FastAPI()

# ── Smallest model that still works well — only ~30MB ────────
# Swapped from all-MiniLM-L6-v2 (~80MB + runtime overhead)
# to paraphrase-MiniLM-L3-v2 (~30MB) to fit Render's 512MB limit
model = SentenceTransformer("paraphrase-MiniLM-L3-v2")
vector_store = VectorStore(dim=384)

# ── Request models ────────────────────────────────────────────

class AddDocsRequest(BaseModel):
    chunks: list[str]
    doc_id: str

class QueryRequest(BaseModel):
    query: str
    doc_id: str = None

class AskRequest(BaseModel):
    question: str
    context: str
    systemPrompt: str = None

class ClassifyRequest(BaseModel):
    text: str

# ── Routes ────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "model": "paraphrase-MiniLM-L3-v2"}

@app.post("/add")
def add_documents(req: AddDocsRequest):
    embeddings = model.encode(req.chunks, batch_size=8).tolist()  # batch_size=8 saves memory
    vector_store.add(embeddings, req.chunks, req.doc_id)
    return {"status": "stored", "count": len(req.chunks), "embeddings": embeddings}

@app.post("/search")
def search(req: QueryRequest):
    query_emb = model.encode(req.query).tolist()
    results = vector_store.search(query_emb, doc_id=req.doc_id)
    print(f"[SEARCH] Query: '{req.query[:50]}', doc_id: {req.doc_id}, Results: {len(results)}")
    return {"context": results}

@app.post("/answer")
def answer(req: AskRequest):
    try:
        response = ask_llm(req.context, req.question, req.systemPrompt)
        return {"answer": response}
    except Exception as e:
        print(f"[ANSWER ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return {"answer": "Sorry, I could not generate an answer. Please try again."}

@app.post("/classify")
def classify(req: ClassifyRequest):
    try:
        result = classify_document(req.text)
        return result
    except Exception as e:
        print(f"[CLASSIFY ERROR] {str(e)}")
        return {"doc_type": "general", "confidence": 0.0}