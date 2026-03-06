# 🏗️ Visual Architecture & Data Flow Diagrams

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                       DOCMIND AI SYSTEM                      │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React/Vite)                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Dashboard Component                                         │ │
│ │ ┌─────────────────────┐  ┌──────────────────────────────┐ │ │
│ │ │  File Upload Input  │  │  PersonaSelector Component ✨ │ │ │
│ │ │  (PDF files)        │  │  🎓 Student / ⚙️ Engineer    │ │ │
│ │ │                     │  │  📊 Manager / 👤 General    │ │ │
│ │ └─────────────────────┘  └──────────────────────────────┘ │ │
│ │           ↓                         ↓                        │ │
│ │ ┌─────────────────────┐  ┌──────────────────────────────┐ │ │
│ │ │   Messages Display  │  │   Chat Input with Persona   │ │ │
│ │ │   (conversation)    │  │   Send: {q, docType, persona} │ │ │
│ │ └─────────────────────┘  └──────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                      HTTP Requests
                    /api/documents/upload
                      /api/query/ask
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND (Node.js/Express)                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Document Controller                                         │ │
│ │ ├─ uploadPDF()                                              │ │
│ │ │  ├─ Extract text from PDF                                │ │
│ │ │  ├─ Call /classify endpoint (FastAPI) ✨ NEW             │ │
│ │ │  └─ Store in MongoDB with docType                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Query Controller (ENHANCED ✨)                              │ │
│ │ ├─ askQuestion(question, documentId, docType, persona) ✨  │ │
│ │ │  ├─ Search vector store for context                      │ │
│ │ │  ├─ Build persona-aware prompt ✨                        │ │
│ │ │      (using personaService)                              │ │
│ │ │  ├─ Call FastAPI /answer with systemPrompt ✨            │ │
│ │ │  └─ Return persona-customized answer                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PersonaService (NEW ✨)                                     │ │
│ │ ├─ PERSONA_PROMPTS = {                                      │ │
│ │ │    student: "...",                                        │ │
│ │ │    engineer: "...",                                       │ │
│ │ │    manager: "...",                                        │ │
│ │ │    general: "..."                                         │ │
│ │ │  }                                                         │ │
│ │ └─ buildSystemPrompt(docType, persona)                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Database (MongoDB)                                          │ │
│ │ ├─ Document {                                               │ │
│ │ │    originalName,                                          │ │
│ │ │    docType: "sales_report",        ← Classification       │ │
│ │ │    classificationConfidence: 0.92,                        │ │
│ │ │    userPersona: "manager"          ← Optional              │ │
│ │ │  }                                                         │ │
│ │ └─ User, Chunks, etc.                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Vector Store (FAISS)                                        │ │
│ │ ├─ Document chunks with embeddings                          │ │
│ │ └─ Semantic search functionality                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                      HTTP Requests
                   /answer, /classify
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ FASTAPI (Python/FastAPI)                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ /answer Endpoint (ENHANCED ✨)                              │ │
│ │ ├─ Input: {question, context, systemPrompt ✨}             │ │
│ │ └─ Output: {answer: "..."}                                  │ │
│ │                                                              │ │
│ │ ask_llm(context, question, system_prompt) ✨               │ │
│ │ ├─ Use custom system_prompt (persona-aware)                │ │
│ │ ├─ Call HuggingFace LLM API                                 │ │
│ │ │  (Mistral-7B-Instruct-v0.2)                              │ │
│ │ └─ Return generated answer                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ /classify Endpoint (Existing ✨)                            │ │
│ │ ├─ Input: {text: sample_text}                               │ │
│ │ ├─ classify_document(sample_text)                           │ │
│ │ └─ Output: {doc_type, confidence}                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ LLM Service                                                 │ │
│ │ ├─ LLM Model: Mistral-7B-Instruct-v0.2                      │ │
│ │ ├─ Provider: HuggingFace Inference API                      │ │
│ │ └─ Features: Chat completion, streaming                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Request/Response Flow Diagram

```
USER UPLOAD & SELECT PERSONA
═════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 1. UPLOAD PDF                                                   │
│    POST /api/documents/upload                                   │
│    Body: FormData { pdf: File }                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND PROCESSES                                            │
│    - Extract text from PDF                                      │
│    - Send to FastAPI /classify                                  │
│    - Get back: {doc_type: "sales_report", confidence: 0.92}    │
│    - Store in MongoDB                                           │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND RECEIVES RESPONSE                                   │
│    {                                                             │
│      documentId: "6984abc123...",                               │
│      docType: "sales_report",                  ← Classified!    │
│      classificationConfidence: 0.92                             │
│    }                                                             │
│    ▼                                                             │
│    SHOW PersonaSelector COMPONENT                              │
│    ┌─────────────────────────────────────┐                     │
│    │ 👤 Who are you?                    │                     │
│    │ 🎓 Student   ⚙️ Engineer           │                     │
│    │ 📊 Manager   👤 General            │                     │
│    └─────────────────────────────────────┘                     │
│    ▼                                                             │
│    User clicks "Manager"                                        │
│    setPersona('manager')                                        │
└─────────────────────────────────────────────────────────────────┘

USER ASKS QUESTION
═════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ 4. SEND QUESTION WITH PERSONA                                   │
│    POST /api/query/ask                                          │
│    Body: {                                                      │
│      question: "What were top growth drivers?",                │
│      documentId: "6984abc123...",                              │
│      docType: "sales_report",             ← From upload!       │
│      persona: "manager"                   ← User selected!     │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND PROCESSES QUESTION                                   │
│                                                                 │
│    Step A: Search vector store                                  │
│    context = [                                                  │
│      "Q4 Revenue: $2.5M, Growth: 15% YoY",                     │
│      "Top Products: Product A ($800K), Product B ($600K)",     │
│      "Regional Performance: North America (40%)..."            │
│    ]                                                             │
│                                                                 │
│    Step B: Build persona-aware prompt                          │
│    systemPrompt = buildSystemPrompt(                           │
│      "sales_report",                                            │
│      "manager"                                                  │
│    )                                                             │
│    ▼                                                             │
│    Returns:                                                      │
│    "You are analyzing a sales_report document.                 │
│     You are helping a manager review this document.            │
│     - Focus on key business insights...                        │
│     - Highlight risks, opportunities...                        │
│     - Provide actionable recommendations..."                   │
│                                                                 │
│    Step C: Call FastAPI /answer                                │
│    POST http://localhost:8000/answer                           │
│    Body: {                                                      │
│      question: "What were top growth drivers?",                │
│      context: "Q4 Revenue: $2.5M...",                          │
│      systemPrompt: "You are analyzing..."  ← PERSONA! ✨       │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. FASTAPI PROCESSES                                            │
│                                                                 │
│    ask_llm(                                                     │
│      context="Q4 Revenue: $2.5M...",                           │
│      question="What were top growth drivers?",                 │
│      system_prompt="You are analyzing a sales_report.." ✨    │
│    )                                                             │
│                                                                 │
│    Build messages:                                              │
│    messages = [                                                 │
│      {                                                          │
│        "role": "system",                                        │
│        "content": "You are analyzing a sales_report..." ✨     │
│      },                                                         │
│      {                                                          │
│        "role": "user",                                          │
│        "content": "Context: Q4 Revenue...Question:..."         │
│      }                                                          │
│    ]                                                             │
│                                                                 │
│    Call HuggingFace LLM API                                     │
│    ▼                                                             │
│    LLM Response (MANAGER-FOCUSED!):                            │
│    "Our top growth drivers in Q4 were:                         │
│     1. Product A Leadership ($800K)...                         │
│     2. Regional Expansion Success...                           │
│     3. 15% YoY Growth Achievement...                           │
│     Executive Summary: Recommend..."                           │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. BACKEND RETURNS RESPONSE                                     │
│    {                                                             │
│      success: true,                                             │
│      answer: "Our top growth drivers in Q4 were...",           │
│      persona: "manager",                   ← Echo persona!     │
│      docType: "sales_report"                                    │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND DISPLAYS ANSWER                                     │
│                                                                 │
│    📄 Q4_2025_Sales_Report.pdf • Type: sales_report             │
│    ┌─────────────────────────────────────┐                     │
│    │ Who are you?                        │                     │
│    │ ✓ Manager (selected)               │                     │
│    └─────────────────────────────────────┘                     │
│                                                                 │
│    User: "What were top growth drivers?"                       │
│                                                                 │
│    Assistant: "Our top growth drivers in Q4 were:              │
│    1. Product A Leadership ($800K)                             │
│       - Strong market acceptance in North America (65%)         │
│       - Recommendation: Increase NA marketing budget 20%        │
│    2. Regional Expansion Success...                            │
│    3. 15% YoY Growth Achievement...                            │
│    Executive Summary: Product A and geographic expansion       │
│    were key drivers. Recommend..."                             │
│                                                                 │
│    (vs STUDENT would get simpler explanation)                 │
│    (vs ENGINEER would get technical focus)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND STATE                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ const [persona, setPersona] = useState('general')           │ │
│ │ const [documentType, setDocumentType] = useState(null)      │ │
│ │ const [documentId, setDocumentId] = useState(null)          │ │
│ │ const [messages, setMessages] = useState([...])             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ When sending question:                                          │
│ {                                                               │
│   question: "What...",                                         │
│   documentId: "6984abc...",      ← From state                  │
│   docType: "sales_report",       ← From state  ✨             │
│   persona: "manager"             ← From state  ✨             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DATABASE (MongoDB Document)                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   _id: ObjectId("6984abc123..."),                          │ │
│ │   user: ObjectId("..."),                                    │ │
│ │   originalName: "Q4_2025_Sales_Report.pdf",               │ │
│ │   fileName: "q4report_1234567890.pdf",                     │ │
│ │   filePath: "uploads/pdfs/...",                            │ │
│ │   size: 2500000,                                            │ │
│ │   mimeType: "application/pdf",                              │ │
│ │   textFilePath: "uploads/texts/6984abc123....txt",         │ │
│ │   chunkCount: 45,                                           │ │
│ │                                                              │ │
│ │   docType: "sales_report",          ← CLASSIFICATION ✨    │ │
│ │   classificationConfidence: 0.92,   ← Confidence ✨        │ │
│ │                                                              │ │
│ │   userPersona: "manager",           ← USER'S PERSONA ✨    │ │
│ │                                                              │ │
│ │   createdAt: "2025-02-06T10:30:00Z",                       │ │
│ │   updatedAt: "2025-02-06T10:35:00Z"                        │ │
│ │ }                                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ VECTOR STORE (FAISS)                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Chunk 1: [0.23, 0.45, 0.12, ...] → "Q4 Revenue: $2.5M..."  │ │
│ │ Chunk 2: [0.34, 0.56, 0.23, ...] → "Top Products..."      │ │
│ │ Chunk 3: [0.45, 0.67, 0.34, ...] → "Regional Perf..."     │ │
│ │ ...                                                          │ │
│ │ Chunk 45: [0.12, 0.34, 0.56, ...] → "Conclusion..."      │ │
│ │                                                              │ │
│ │ Metadata: { docId: "6984abc123..." }                        │ │
│ │ (Links chunks to document)                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PERSONA SERVICE (Backend)                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ personaService.js                                           │ │
│ │                                                              │ │
│ │ buildSystemPrompt(docType, persona)                         │ │
│ │                                                              │ │
│ │ Input: ("sales_report", "manager")                          │ │
│ │ Output: "You are analyzing a sales_report document.        │ │
│ │          You are helping a manager review...               │ │
│ │          - Focus on key business insights..."              │ │
│ │                                                              │ │
│ │ Used by: queryController.askQuestion()                      │ │
│ │ Returns: systemPrompt string                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Persona Routing Diagram

```
                          SAME QUESTION
                              ↓
                  "What are the key points?"
                              ↓
                 ┌────────────┼────────────┐
                 ↓            ↓            ↓
            STUDENT      ENGINEER      MANAGER
                 ↓            ↓            ↓
           System Prompt:
         "Break down,        "Technical  "Business
          examples,          details,    insights,
          why"              performance" actions"
                 ↓            ↓            ↓
            ┌────────────────────────────────────┐
            │         SAME LLM MODEL             │
            │   (Mistral-7B-Instruct-v0.2)       │
            └────────────────────────────────────┘
                 ↓            ↓            ↓
           RESPONSE:
         "Here's an     "The system     "Key business
          analogy...     scales at      implications:
          Think of it    O(n log n)..  1. Risk... 2.
          like...                       Opportunity..."
                 ↓            ↓            ↓
              FRONTEND DISPLAYS PERSONA-SPECIFIC RESPONSE
```

---

## 5. File Organization

```
DocMind AI/
├── backend/
│   ├── controllers/
│   │   └── queryController.js         ← Updated: Use persona ✨
│   ├── models/
│   │   └── documentmodel.js           ← Updated: +userPersona ✨
│   ├── services/
│   │   ├── embeddingService.js
│   │   └── personaService.js          ← NEW! ✨
│   └── routes/
│       └── query.js
│
├── frontend/
│   └── src/components/dashboard/
│       ├── dashboard.jsx              ← Updated: +persona state ✨
│       └── PersonaSelector.jsx        ← NEW COMPONENT! ✨
│
├── embeddings/
│   ├── app.py                         ← Updated: +systemPrompt ✨
│   └── llm_service.py                 ← Updated: use custom prompt ✨
│
└── docs/
    ├── PERSONA_IMPLEMENTATION.md      ← Full documentation
    ├── PERSONA_QUICK_START.md         ← Quick guide
    └── CODE_FLOW_EXAMPLE.md           ← Real examples
```

---

## Key Insight: The Power of Persona Prompting

```
         STANDARD PROMPT               PERSONA-AWARE PROMPT
               ↓                                ↓
    "Answer based on context"     "You are helping a MANAGER
                                   review a SALES_REPORT.
                                   Focus on business insights..."
               ↓                                ↓
         ┌─────────────┐              ┌──────────────┐
         │   RESPONSE  │              │   RESPONSE   │
         │ (Generic,   │              │ (Specific,   │
         │ balanced)   │              │ role-focused)│
         └─────────────┘              └──────────────┘

Example: "What revenue did we generate?"

Standard: "According to the document, Q4 
         revenue was $2.5M."

Manager:  "Q4 Revenue Performance: $2.5M (↑15% YoY)
          This exceeds targets by 8%. Key drivers:
          • Product A leadership ($800K, 32%)
          • Regional expansion (Europe +35%)
          Risks: Q1 seasonality may impact growth.
          Recommendation: Plan promotional campaign now."

Same LLM. Different system prompt. Different output. ✨
```
