from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

client = InferenceClient(
    model="mistralai/Mistral-7B-Instruct-v0.2",
    token=os.getenv("HF_API_TOKEN")
)

# Document types for classification
DOCUMENT_TYPES = [
    "class_notes",
    "research_paper",
    "sales_report",
    "legal_contract",
    "code",
    "general"
]

# Classification prompt
CLASSIFIER_PROMPT = """You are a document classifier. Your job is to classify documents accurately.

Classify the following document into ONE of the categories below:

- class_notes: Lecture notes, course materials, study guides, homework assignments
- research_paper: Academic papers, scholarly articles, technical research documents
- sales_report: Business reports, sales metrics, quarterly reviews, financial reports
- legal_contract: Contracts, agreements, legal documents, terms and conditions
- code: Source code files, programming scripts, technical code
- general: Everything else, unclear documents

Rules:
1. Read the ENTIRE sample carefully for context clues
2. Look for keywords like: lecture, homework, professor (→ class_notes), abstract, research, methodology (→ research_paper), revenue, sales, Q1-Q4 (→ sales_report), whereas, agreement, party (→ legal_contract), function, class, import (→ code)
3. If multiple categories fit, choose the PRIMARY one
4. If truly unsure, return "general"
5. Output ONLY the category name, nothing else

Document:
"""

def ask_llm(context, question, system_prompt=None):
    """Generate answer based on context using LLM
    
    Args:
        context: Document context to answer from
        question: User's question
        system_prompt: Optional persona-aware system prompt
    """
    if system_prompt is None:
        system_prompt = """You are an AI assistant.
Answer ONLY using the context below.
If the answer is not in the context, say "I don't know"."""

    prompt = f"""Context:
{context}

Question:
{question}

Answer:"""

    try:
        # Use chat_completion with custom system prompt
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = client.chat_completion(
            messages=messages,
            max_tokens=500,
            temperature=0.3  # Slightly higher for more natural responses
        )
        
        # Extract text from response
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"LLM error: {str(e)}")


def classify_document(sample_text: str) -> dict:
    """
    Classify document type using LLM.
    
    Args:
        sample_text: First ~1500 characters of the document (raw, before cleaning)
        
    Returns:
        dict with 'doc_type' and 'confidence' keys
    """
    # Use first 1500 characters for classification
    text_sample = sample_text[:1500]
    
    try:
        messages = [
            {"role": "system", "content": CLASSIFIER_PROMPT},
            {"role": "user", "content": f'"""\n{text_sample}\n"""'}
        ]
        
        response = client.chat_completion(
            messages=messages,
            max_tokens=20,  # Reduced since we only want the category name
            temperature=0.05  # Very low temperature for deterministic output
        )
        
        # Extract and validate response
        raw_response = response.choices[0].message.content.strip().lower()
        
        print(f"[CLASSIFY DEBUG] Raw response: '{raw_response}'")
        
        # Parse if response includes confidence (format: type:category\nconfidence:0.X)
        doc_type = raw_response
        confidence = 1.0
        
        if "type:" in raw_response or "confidence:" in raw_response:
            lines = raw_response.split("\n")
            for line in lines:
                if line.startswith("type:"):
                    doc_type = line.split("type:")[1].strip()
                elif line.startswith("confidence:"):
                    try:
                        confidence = float(line.split("confidence:")[1].strip())
                    except:
                        confidence = 1.0
        else:
            # If response is just the category name, extract just the word
            doc_type = raw_response.strip().split()[0].strip('"-.,')
        
        # Clean up the doc_type: remove backslashes and extra characters
        doc_type = doc_type.replace("\\", "").strip()
        
        print(f"[CLASSIFY DEBUG] Cleaned doc_type: '{doc_type}'")
        
        # Validate output is in allowed types
        if doc_type not in DOCUMENT_TYPES:
            print(f"[CLASSIFY WARNING] Invalid doc_type: '{doc_type}', defaulting to 'general'")
            doc_type = "general"
            confidence = 0.5  # Low confidence for fallback
        
        # Confidence gating: if too uncertain, mark as general
        if confidence < 0.6:
            doc_type = "general"
        
        print(f"[CLASSIFY SUCCESS] Type: {doc_type}, Confidence: {confidence}")
        
        return {
            "doc_type": doc_type,
            "confidence": confidence
        }
        
    except Exception as e:
        # On error, return general with low confidence
        print(f"[CLASSIFICATION ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "doc_type": "general",
            "confidence": 0.0
        }

