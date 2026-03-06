import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, LogOut, Menu, X, Send, Upload, FileText,
  ChevronDown, BookOpen, Layers, Search,
  RefreshCw, Copy, ThumbsUp, ThumbsDown, Trash2
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import CitationPanel from './CitationPanel';

// ── Personas ─────────────────────────────────────────────────
const PERSONAS = [
  { id: 'general',      icon: '🙋', label: 'General',      desc: 'Balanced tone' },
  { id: 'student',      icon: '🎓', label: 'Student',      desc: 'Simplify & explain' },
  { id: 'professional', icon: '💼', label: 'Professional', desc: 'Concise & business' },
  { id: 'legal',        icon: '⚖️', label: 'Legal',        desc: 'Risks & clauses' },
  { id: 'researcher',   icon: '🔬', label: 'Researcher',   desc: 'Deep analysis' },
];

// ── Typing indicator ─────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: '50%', background: '#4F6EF7',
        display: 'inline-block',
        animation: `bounce 1.1s ease-in-out ${i * 0.16}s infinite`,
      }} />
    ))}
  </div>
);

// ── Message bubble ────────────────────────────────────────────
const MessageBubble = ({ msg, onCiteClick }) => {
  if (msg.type === 'system') return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
      <span style={{
        fontSize: '0.75rem', color: '#8896B3', fontWeight: 500,
        padding: '5px 14px', borderRadius: 20,
        background: 'rgba(79,110,247,0.07)',
        border: '1px solid rgba(79,110,247,0.12)',
      }}>{msg.text}</span>
    </div>
  );

  if (msg.type === 'user') return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '65%', padding: '11px 16px',
        background: 'linear-gradient(135deg, #4F6EF7, #3355E0)',
        borderRadius: '16px 16px 3px 16px',
        fontSize: '0.875rem', color: '#fff', lineHeight: 1.6,
        boxShadow: '0 3px 14px rgba(79,110,247,0.28)',
      }}>{msg.text}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: 'linear-gradient(135deg, #4F6EF7, #22D3EE)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: '#fff',
        boxShadow: '0 3px 10px rgba(79,110,247,0.35)',
      }}>D</div>

      <div style={{ flex: 1, maxWidth: '70%' }}>
        <div style={{
          padding: '12px 16px',
          background: '#131C2E',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '3px 16px 16px 16px',
          fontSize: '0.875rem', color: '#D8E1F5', lineHeight: 1.7,
          boxShadow: '0 3px 14px rgba(0,0,0,0.18)',
        }}>
          {msg.typing ? <TypingDots /> : msg.text}
          {msg.citationData && (
            <div onClick={() => onCiteClick?.(msg.citationData)} style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 5,
              background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.2)',
              fontSize: '0.7rem', color: '#7B96FA', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,110,247,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,110,247,0.1)'}
            >📌 {msg.citationData.text || 'View source'}</div>
          )}
        </div>

        {!msg.typing && (
          <div style={{ display: 'flex', gap: 2, marginTop: 5, paddingLeft: 2 }}>
            {[
              { icon: <Copy size={11} />, tip: 'Copy' },
              { icon: <ThumbsUp size={11} />, tip: 'Good' },
              { icon: <ThumbsDown size={11} />, tip: 'Bad' },
              { icon: <RefreshCw size={11} />, tip: 'Retry' },
            ].map(({ icon, tip }) => (
              <button key={tip} title={tip} style={{
                padding: '3px 7px', borderRadius: 5, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: '#4A5878', display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#4F6EF7'}
                onMouseLeave={e => e.currentTarget.style.color = '#4A5878'}
              >{icon}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([{
    id: 1, type: 'assistant',
    text: "Hi! I'm DocMind AI. Upload a document and ask me anything — I'll give you cited, accurate answers.",
  }]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [documentType, setDocumentType] = useState(null);
  const [documentMeta, setDocumentMeta] = useState({ totalPages: 1 });
  const [persona, setPersona] = useState(() => localStorage.getItem('persona') || 'general');
  const [personaOpen, setPersonaOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [citationPanel, setCitationPanel] = useState({ open: false, citation: null });

  const currentPersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  const updateLast = (update) => setMessages(prev => {
    const next = [...prev];
    next[next.length - 1] = { ...next[next.length - 1], ...update };
    return next;
  });

  const toCitationData = (data) => {
    if (data?.citation) return data.citation;

    const sources = Array.isArray(data?.sources) ? data.sources : [];
    if (!sources.length) return null;

    const chunks = sources.slice(0, 5).map((source, idx) => {
      if (typeof source === 'string') {
        return {
          id: `chunk_${idx}`,
          page: 1,
          section: '',
          text: source,
          score: Math.max(0.5, 1 - idx * 0.1),
        };
      }

      return {
        id: source?.id || `chunk_${idx}`,
        page: source?.page || 1,
        section: source?.section || '',
        text: source?.text || '',
        score: typeof source?.score === 'number' ? source.score : Math.max(0.5, 1 - idx * 0.1),
      };
    });

    const first = chunks[0];
    return {
      text: `p.${first.page}${first.section ? `, ${first.section}` : ''}`,
      page: first.page,
      section: first.section,
      excerpt: first.text,
      chunks,
    };
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const handleNewChat = () => {
    setMessages([{ id: Date.now(), type: 'assistant', text: "Hi! I'm DocMind AI. Upload a document and start asking questions." }]);
    setUploadedFile(null);
    setDocumentId(null);
    setDocumentType(null);
    setDocumentMeta({ totalPages: 1 });
    setCitationPanel({ open: false, citation: null });
    setActiveChat(null);
  };

  const processFile = async (file) => {
    if (!file) return;
    addMsg({ type: 'system', text: `Uploading ${file.name}…` });
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.UPLOAD, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setUploadedFile(file); setDocumentId(data.documentId); setDocumentType(data.docType);
      setDocumentMeta({ totalPages: data.totalPages || 1 });
      updateLast({ text: `✅ ${file.name} ready${data.docType ? ` · ${data.docType}` : ''}` });
      const newId = Date.now();
      const title = file.name.replace(/\.pdf$/i, '');
      setHistory(prev => [{ id: newId, title, time: 'Just now' }, ...prev]);
      setActiveChat(newId);
      setTimeout(() => addMsg({ type: 'assistant', text: 'Document indexed! Ask me anything about it.' }), 300);
    } catch (err) {
      updateLast({ text: `❌ ${err.message}` });
    }
  };

  const handleFileUpload = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); };

  const handleSummarize = async () => {
    if (!documentId || isSummarizing) return;
    setIsSummarizing(true);
    addMsg({ type: 'assistant', typing: true, text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.SUMMARY, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ documentId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Summary failed');
      updateLast({ typing: false, text: data.summary || 'No summary returned.' });
    } catch (err) { updateLast({ typing: false, text: `❌ ${err.message}` }); }
    finally { setIsSummarizing(false); }
  };

  const handleSearch = async () => {
    if (!inputValue.trim() || isSearching) return;
    const query = inputValue.trim(); setInputValue(''); setIsSearching(true);
    addMsg({ type: 'assistant', typing: true, text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.SEARCH, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ query, documentId: documentId || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const results = Array.isArray(data.results) ? data.results : [];
      updateLast({ typing: false, text: results.length ? results.map((r, i) => `${i + 1}. ${r}`).join('\n\n') : 'No relevant context found.' });
    } catch (err) { updateLast({ typing: false, text: `❌ ${err.message}` }); }
    finally { setIsSearching(false); }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isAsking) return;
    const question = inputValue.trim(); setInputValue('');
    addMsg({ type: 'user', text: question });
    setIsAsking(true);
    addMsg({ type: 'assistant', typing: true, text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.ASK, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ question, documentId: documentId || null, docType: documentType, persona }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Query failed');
      updateLast({ typing: false, text: data.answer || 'No answer returned.', citationData: toCitationData(data) });
    } catch (err) { updateLast({ typing: false, text: `❌ ${err.message}` }); }
    finally { setIsAsking(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ── Colors ──────────────────────────────────────────────────
  const bg      = '#0B1120';
  const sidebar  = '#0E1525';
  const topbar   = '#0E1525';
  const border   = 'rgba(255,255,255,0.07)';
  const text     = '#D8E1F5';
  const muted    = '#5A6A8A';
  const input    = '#111D31';
  const accent   = '#4F6EF7';

  return (
    <div style={{ display: 'flex', height: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: text, overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .msg-wrap { animation: msgIn 0.25s ease-out both; }
        textarea { resize: none; }
        textarea::placeholder { color: #4A5878; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(79,110,247,0.25); border-radius: 3px; }
        .hist-item { transition: background 0.15s; }
        .hist-item:hover { background: rgba(79,110,247,0.07) !important; }
        .hist-item:hover .del-btn { opacity: 1 !important; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
        background: sidebar, borderRight: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'width 0.28s ease, min-width 0.28s ease',
      }}>
        {/* Logo + New Chat */}
        <div style={{ padding: '18px 14px 14px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, background: 'linear-gradient(135deg, #4F6EF7, #22D3EE)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>D</div>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Doc<span style={{ color: accent }}>Mind</span>
              <span style={{ color: muted, fontWeight: 400, fontSize: '0.62rem', marginLeft: 2 }}>AI</span>
            </span>
          </div>
          <button onClick={handleNewChat} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 0', borderRadius: 9,
            background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.22)',
            color: '#7B96FA', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem',
            cursor: 'pointer', transition: 'background 0.18s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,110,247,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,110,247,0.12)'}
          ><Plus size={14} /> New Chat</button>
        </div>

        {/* History — only shows real items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {history.length > 0 && (
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: muted, letterSpacing: '0.09em', textTransform: 'uppercase', padding: '2px 8px 8px' }}>Recent</div>
          )}
          {history.map(h => (
            <div key={h.id} className="hist-item"
              onClick={() => setActiveChat(h.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                background: h.id === activeChat ? 'rgba(79,110,247,0.1)' : 'transparent',
                border: '1px solid transparent',
                borderColor: h.id === activeChat ? 'rgba(79,110,247,0.2)' : 'transparent',
              }}>
              <FileText size={13} style={{ color: h.id === activeChat ? accent : muted, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: text }}>{h.title}</div>
                <div style={{ fontSize: '0.66rem', color: muted, marginTop: 1 }}>{h.time}</div>
              </div>
              <button className="del-btn" onClick={e => { e.stopPropagation(); setHistory(prev => prev.filter(x => x.id !== h.id)); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, opacity: 0, padding: 2, display: 'flex', transition: 'opacity 0.15s' }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {history.length === 0 && (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: muted, fontSize: '0.78rem' }}>
              No recent chats yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 8px 14px', borderTop: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 8, borderRadius: 9, background: 'rgba(79,110,247,0.07)', border: '1px solid rgba(79,110,247,0.12)' }}>
            <span style={{ fontSize: 15 }}>{currentPersona.icon}</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7B96FA' }}>{currentPersona.label}</div>
              <div style={{ fontSize: '0.65rem', color: muted }}>{currentPersona.desc}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '8px 0', borderRadius: 9, border: '1px solid rgba(239,68,68,0.15)',
            background: 'rgba(239,68,68,0.05)', color: '#F87171',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
          ><LogOut size={13} /> Sign out</button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px', background: topbar, borderBottom: `1px solid ${border}`, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              width: 32, height: 32, borderRadius: 7, border: `1px solid ${border}`,
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: muted, transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{sidebarOpen ? <X size={15} /> : <Menu size={15} />}</button>

            {uploadedFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 7, background: 'rgba(79,110,247,0.09)', border: '1px solid rgba(79,110,247,0.18)' }}>
                <FileText size={13} color={accent} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7B96FA', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</span>
                {documentType && <span style={{ fontSize: '0.66rem', padding: '2px 6px', borderRadius: 99, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE', fontWeight: 700 }}>{documentType}</span>}
              </div>
            ) : (
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: text }}>DocMind <span style={{ color: accent }}>AI</span></span>
            )}
          </div>

          {/* Persona switcher */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setPersonaOpen(!personaOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 8,
              border: `1px solid ${personaOpen ? 'rgba(79,110,247,0.35)' : border}`,
              background: personaOpen ? 'rgba(79,110,247,0.09)' : 'transparent',
              color: text, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <span>{currentPersona.icon}</span>
              <span>{currentPersona.label}</span>
              <ChevronDown size={12} style={{ color: muted, transform: personaOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {personaOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                background: '#111D31', border: `1px solid ${border}`, borderRadius: 12,
                padding: 6, minWidth: 210,
                boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
                animation: 'fadeIn 0.18s ease-out both',
              }}>
                {PERSONAS.map(p => (
                  <div key={p.id}
                    onClick={() => { setPersona(p.id); localStorage.setItem('persona', p.id); setPersonaOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                      background: persona === p.id ? 'rgba(79,110,247,0.1)' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (persona !== p.id) e.currentTarget.style.background = 'rgba(79,110,247,0.06)'; }}
                    onMouseLeave={e => { if (persona !== p.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.81rem', fontWeight: 600, color: persona === p.id ? '#7B96FA' : text }}>{p.label}</div>
                      <div style={{ fontSize: '0.67rem', color: muted }}>{p.desc}</div>
                    </div>
                    {persona === p.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }} onClick={() => setPersonaOpen(false)}>
          {messages.length === 1 && !uploadedFile ? (
            // Empty state — clean, no hardcoded suggestions
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: '0 24px', animation: 'fadeIn 0.5s ease-out both' }}>
              <div style={{
                width: 56, height: 56, background: 'linear-gradient(135deg, #4F6EF7, #22D3EE)',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: '#fff',
                boxShadow: '0 12px 32px rgba(79,110,247,0.35)',
              }}>D</div>
              <div style={{ textAlign: 'center', maxWidth: 380 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8, color: text }}>
                  Upload a document to get started
                </h2>
                <p style={{ color: muted, fontSize: '0.86rem', lineHeight: 1.6 }}>
                  I'll help you extract insights, get summaries, and answer questions with citations.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map(msg => (
                <div key={msg.id} className="msg-wrap">
                  <MessageBubble msg={msg} onCiteClick={(c) => setCitationPanel({ open: true, citation: c })} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '14px 18px 18px', borderTop: `1px solid ${border}`, background: topbar, flexShrink: 0 }}>
          <div style={{ maxWidth: 740, margin: '0 auto' }}>

            {/* Action pills — only when doc is uploaded */}
            {uploadedFile && (
              <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={handleSummarize} disabled={isSummarizing} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(79,110,247,0.22)',
                  background: 'rgba(79,110,247,0.08)', color: '#7B96FA',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  opacity: isSummarizing ? 0.6 : 1, transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (!isSummarizing) e.currentTarget.style.background = 'rgba(79,110,247,0.14)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,110,247,0.08)'}
                ><BookOpen size={12} /> {isSummarizing ? 'Summarizing…' : 'Summarize'}</button>

                <button onClick={handleSearch} disabled={isSearching || !inputValue.trim()} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(34,211,238,0.18)',
                  background: 'rgba(34,211,238,0.06)', color: '#22D3EE',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  opacity: (isSearching || !inputValue.trim()) ? 0.45 : 1, transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (!isSearching && inputValue.trim()) e.currentTarget.style.background = 'rgba(34,211,238,0.1)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.06)'}
                ><Search size={12} /> {isSearching ? 'Searching…' : 'Search Context'}</button>

                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(167,139,250,0.18)',
                  background: 'rgba(167,139,250,0.06)', color: '#A78BFA',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                }}><Layers size={12} /> Multi-Doc</button>

                <label style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 11px', borderRadius: 7, border: `1px solid ${border}`,
                  color: muted, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >
                  <Upload size={12} /> Replace
                  <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} ref={fileInputRef} />
                </label>
              </div>
            )}

            {/* Drop zone — only when no doc */}
            {!uploadedFile && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px', borderRadius: 10, marginBottom: 10, cursor: 'pointer',
                  border: `1.5px dashed ${dragOver ? accent : border}`,
                  background: dragOver ? 'rgba(79,110,247,0.06)' : 'transparent',
                  transition: 'all 0.18s ease',
                }}
              >
                <Upload size={15} style={{ color: dragOver ? accent : muted }} />
                <span style={{ fontSize: '0.82rem', color: dragOver ? '#7B96FA' : muted, fontWeight: 500 }}>
                  {dragOver ? 'Drop to upload' : 'Drop a PDF here, or click to browse'}
                </span>
                <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} ref={fileInputRef} />
              </div>
            )}

            {/* Text input */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 9,
              background: input, border: `1px solid ${border}`,
              borderRadius: 12, padding: '9px 9px 9px 14px',
              transition: 'border-color 0.18s, box-shadow 0.18s',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.1)'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
                }}
                onKeyDown={handleKey}
                placeholder={uploadedFile ? `Ask about ${uploadedFile.name}…` : 'Upload a document first…'}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: text, fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
                  lineHeight: 1.6, minHeight: 22, maxHeight: 110, overflow: 'hidden',
                }}
              />
              <button onClick={handleSend} disabled={!inputValue.trim() || isAsking} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 15px', borderRadius: 9,
                background: (!inputValue.trim() || isAsking) ? 'rgba(79,110,247,0.3)' : 'linear-gradient(135deg, #4F6EF7, #3355E0)',
                border: 'none', color: '#fff',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem',
                cursor: (!inputValue.trim() || isAsking) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
                onMouseEnter={e => { if (inputValue.trim() && !isAsking) e.currentTarget.style.boxShadow = '0 6px 18px rgba(79,110,247,0.38)'; }}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {isAsking
                  ? <><RefreshCw size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> Thinking</>
                  : <><Send size={14} /> Send</>
                }
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, gap: 3 }}>
              <span style={{ fontSize: '0.68rem', color: muted }}>Press Enter to send · Shift+Enter for new line</span>
            </div>
          </div>
        </div>

        {/* Citation Panel */}
        <CitationPanel
          isOpen={citationPanel.open}
          onClose={() => setCitationPanel({ open: false, citation: null })}
          citation={citationPanel.citation}
          documentId={documentId}
          documentName={uploadedFile?.name || 'Document'}
          totalPages={documentMeta.totalPages}
        />
      </div>
    </div>
  );
};

export default Dashboard;