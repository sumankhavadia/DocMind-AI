import faiss
import numpy as np
import pickle
import os

class VectorStore:
    def __init__(self, dim=384, persist_path="vector_store_data"):
        self.dim = dim
        self.persist_path = persist_path
        self.index_file = f"{persist_path}/faiss.index"
        self.metadata_file = f"{persist_path}/metadata.pkl"
        
        # Create directory if it doesn't exist
        os.makedirs(persist_path, exist_ok=True)
        
        # Load existing data or create new
        if os.path.exists(self.index_file) and os.path.exists(self.metadata_file):
            self._load()
        else:
            self.index = faiss.IndexFlatL2(dim)
            self.texts = []
            self.doc_ids = []

    def add(self, embeddings, chunks, doc_id):
        vectors = np.array(embeddings).astype("float32")
        self.index.add(vectors)

        self.texts.extend(chunks)
        self.doc_ids.extend([doc_id] * len(chunks))
        
        # Persist after adding
        self._save()

    def search(self, query_embedding, doc_id=None, k=5):
        if len(self.texts) == 0:
            return []

        # If filtering by doc_id, search more candidates first
        search_k = k * 3 if doc_id else k
        search_k = min(search_k, len(self.texts))

        D, I = self.index.search(
            np.array([query_embedding]).astype("float32"), search_k
        )

        results = []
        for idx in I[0]:
            if idx >= 0 and idx < len(self.texts):
                # Filter by doc_id if provided
                if doc_id is None or self.doc_ids[idx] == doc_id:
                    results.append(self.texts[idx])
                    if len(results) >= k:  # Stop when we have enough results
                        break

        return results

    def _save(self):
        """Save index and metadata to disk"""
        try:
            faiss.write_index(self.index, self.index_file)
            with open(self.metadata_file, 'wb') as f:
                pickle.dump({'texts': self.texts, 'doc_ids': self.doc_ids}, f)
            print(f"[VectorStore] Saved {len(self.texts)} chunks to disk")
        except Exception as e:
            print(f"[VectorStore] Error saving: {e}")

    def _load(self):
        """Load index and metadata from disk"""
        try:
            self.index = faiss.read_index(self.index_file)
            with open(self.metadata_file, 'rb') as f:
                data = pickle.load(f)
                self.texts = data['texts']
                self.doc_ids = data['doc_ids']
            print(f"[VectorStore] Loaded {len(self.texts)} chunks from disk")
        except Exception as e:
            print(f"[VectorStore] Error loading: {e}")
            self.index = faiss.IndexFlatL2(self.dim)
            self.texts = []
            self.doc_ids = []
