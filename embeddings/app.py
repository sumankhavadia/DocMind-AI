from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from vector_store import VectorStore
from llm_service import ask_llm, classify_document

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")
vector_store = VectorStore(dim=384)

class AddDocsRequest(BaseModel):
    chunks: list[str]
    doc_id: str

class QueryRequest(BaseModel):
    query: str
    doc_id: str = None

class AskRequest(BaseModel):
    question: str
    context: str
    systemPrompt: str = None  # Optional persona-aware system prompt

class ClassifyRequest(BaseModel):
    text: str


@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/add")
def add_documents(req: AddDocsRequest):
    embeddings = model.encode(req.chunks).tolist()
    vector_store.add(embeddings, req.chunks, req.doc_id)
    return {"status": "stored", "count": len(req.chunks), "embeddings": embeddings}

@app.post("/search")
def search(req: QueryRequest):
    query_emb = model.encode(req.query).tolist()
    results = vector_store.search(query_emb, doc_id=req.doc_id)
    print(f"[SEARCH] Query: '{req.query[:50]}...', doc_id: {req.doc_id}, Results: {len(results)}")
    return {"context": results}

@app.post("/answer")
def answer(req: AskRequest):
    """Generate answer based on context using LLM with optional persona-aware prompting"""
    try:
        response = ask_llm(req.context, req.question, req.systemPrompt)
        return {"answer": response}
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500

@app.post("/classify")
def classify(req: ClassifyRequest):
    """
    Classify document type using LLM.
    Runs once at upload time to determine document type.
    """
    try:
        result = classify_document(req.text)
        return result
    except Exception as e:
        print(f"[CLASSIFICATION ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "doc_type": "general", "confidence": 0.0}

