import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Layers } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { API_ENDPOINTS } from '../../config/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─────────────────────────────────────────────────────────────
// Simple answer marker (no overlay on text)
const AnswerMarker = () => (
  <div style={{
    position: 'absolute', top: 8, right: 8, zIndex: 3,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 999,
    background: 'rgba(16,185,129,0.14)',
    border: '1px solid rgba(16,185,129,0.45)',
    color: '#34D399', fontSize: '0.66rem', fontWeight: 700,
    letterSpacing: '0.02em', pointerEvents: 'none',
  }}>
    <span style={{ fontSize: '0.72rem', lineHeight: 1 }}>✓</span>
    Answer source
  </div>
);

// ─────────────────────────────────────────────────────────────
// Source chips — compact switcher at bottom of panel
// ─────────────────────────────────────────────────────────────
const SourceChips = ({ chunks, activeIdx, onSelect }) => {
  if (!chunks?.length) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      padding: '10px 16px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: '#060B17', flexShrink: 0,
    }}>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1E2A3A', textTransform: 'uppercase', letterSpacing: '0.09em', marginRight: 2 }}>
        Sources
      </span>
      {chunks.map((chunk, idx) => {
        const pct   = Math.round((chunk.score || 0) * 100);
        const isAct = idx === activeIdx;
        const dot   = pct >= 80 ? '#34D399' : pct >= 55 ? '#FBBF24' : '#F87171';
        return (
          <button key={chunk.id || idx} onClick={() => onSelect(idx)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
            background: isAct ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
            outline: isAct ? '1.5px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.06)',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600,
            color: isAct ? '#FBBF24' : '#4A5878', transition: 'all 0.14s',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isAct ? '#FBBF24' : dot, flexShrink: 0 }} />
            p.{chunk.page}
            <span style={{ color: isAct ? '#FBBF24' : dot }}>{pct}%</span>
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────
const CitationPanel = ({
  isOpen,
  onClose,
  citation,
  documentId,
  documentName = 'Document',
  totalPages   = 1,
}) => {
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [zoom,        setZoom]        = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages,    setNumPages]    = useState(totalPages);
  const [pdfError,    setPdfError]    = useState(null);
  const wrapRef = useRef(null);

  const token  = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const pdfUrl = documentId ? API_ENDPOINTS.GET_DOCUMENT(documentId) : null;

  const pdfFile = useMemo(() => {
    if (!pdfUrl) return null;
    return { url: pdfUrl, httpHeaders: token ? { Authorization: `Bearer ${token}` } : {} };
  }, [pdfUrl, token]);

  const chunks = citation?.chunks || (citation ? [{
    id: 'main', page: citation.page || 1,
    section: citation.section || '', text: citation.excerpt || '',
    score: 1, matchedTerms: [], bbox: null,
  }] : []);

  const active = chunks[activeIdx];

  useEffect(() => { if (active?.page) setCurrentPage(active.page); }, [activeIdx, citation]);
  useEffect(() => { setActiveIdx(0); setZoom(1.0); }, [citation]);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const onDocLoad  = useCallback(({ numPages: n }) => { setNumPages(n); setPdfError(null); }, []);
  const onPageLoad = useCallback(() => {
    if (wrapRef.current) {
      wrapRef.current.offsetWidth;
    }
  }, []);

  const goPage = d => setCurrentPage(p => Math.max(1, Math.min(numPages, p + d)));

  const PAGE_W = 490;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes hlIn {
          from { opacity:0; transform:scaleY(0.65); }
          to   { opacity:1; transform:scaleY(1); }
        }
        @keyframes excerptIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position:-200% 0; }
        }
        .cpanel-scroll::-webkit-scrollbar { width: 4px; }
        .cpanel-scroll::-webkit-scrollbar-track { background: transparent; }
        .cpanel-scroll::-webkit-scrollbar-thumb { background: rgba(251,191,36,0.18); border-radius: 4px; }
        .cpanel-scroll::-webkit-scrollbar-thumb:hover { background: rgba(251,191,36,0.35); }
        .react-pdf__Page { position: relative !important; }
        .react-pdf__Page__canvas { display: block !important; }
        .cp-btn:hover { background: rgba(255,255,255,0.08) !important; color: #C4D0E8 !important; }
        .cp-btn:disabled { opacity: 0.22 !important; cursor: not-allowed; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(2,5,12,0.72)', backdropFilter: 'blur(5px)',
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.22s ease',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 560, background: '#060B17',
        borderLeft: '1px solid rgba(255,255,255,0.055)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: '-32px 0 80px rgba(0,0,0,0.75)',
        overflow: 'hidden',
      }}>

        {/* ── Slim topbar ── */}
        <div style={{
          height: 50, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
          background: '#04080F',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* File name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={13} color="#FBBF24" />
            </div>
            <span style={{
              fontSize: '0.77rem', fontWeight: 700, color: '#8896B3',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240,
            }}>{documentName}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button className="cp-btn" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.15).toFixed(2)))} style={nb}><ZoomOut size={12} /></button>
            <span style={{ fontSize: '0.65rem', color: '#2E3D58', fontWeight: 700, minWidth: 34, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="cp-btn" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)))} style={nb}><ZoomIn size={12} /></button>

            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

            <button className="cp-btn" onClick={() => goPage(-1)} disabled={currentPage <= 1} style={nb}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, minWidth: 44, textAlign: 'center', color: '#3A4A6A' }}>
              <span style={{ color: '#FBBF24' }}>{currentPage}</span>
              <span style={{ margin: '0 2px', color: '#1E2A3A' }}>/</span>
              {numPages}
            </span>
            <button className="cp-btn" onClick={() => goPage(1)} disabled={currentPage >= numPages} style={nb}><ChevronRight size={13} /></button>

            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

            <button className="cp-btn" onClick={onClose} style={nb}><X size={14} /></button>
          </div>
        </div>

        {/* ── Excerpt strip ── */}
        {active && (
          <div style={{
            padding: '9px 16px', flexShrink: 0,
            borderBottom: '1px solid rgba(251,191,36,0.08)',
            background: 'rgba(251,191,36,0.03)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'excerptIn 0.28s ease-out both',
          }}>
            {/* Answer bar */}
            <div style={{ width: 3, borderRadius: 2, background: 'linear-gradient(180deg,#22D3EE,rgba(34,211,238,0.3))', alignSelf: 'stretch', minHeight: 18, flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Page {active.page}
                </span>
                {active.section && (
                  <span style={{ fontSize: '0.64rem', color: '#2E3D58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                    {active.section}
                  </span>
                )}
                {/* Score */}
                <span style={{
                  marginLeft: 'auto', flexShrink: 0,
                  fontSize: '0.63rem', fontWeight: 700,
                  color: (active.score||0) >= 0.8 ? '#34D399' : (active.score||0) >= 0.55 ? '#FBBF24' : '#F87171',
                }}>
                  {Math.round((active.score || 0) * 100)}% match
                </span>
              </div>

              {/* Excerpt */}
              <p style={{
                margin: 0, fontSize: '0.74rem', lineHeight: 1.55,
                color: '#5A6A8A', fontFamily: "'DM Mono', monospace",
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                "{active.text?.slice(0, 180)}{(active.text?.length || 0) > 180 ? '…' : ''}"
              </p>

              {/* Matched terms */}
              {active.matchedTerms?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.59rem', color: '#1E2A3A', fontWeight: 700 }}>matched:</span>
                  {active.matchedTerms.map(t => (
                    <span key={t} style={{
                      fontSize: '0.61rem', padding: '1px 6px', borderRadius: 3,
                      background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)',
                      color: '#FBBF24', fontWeight: 600,
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PDF canvas — takes all remaining space ── */}
        <div className="cpanel-scroll" style={{
          flex: 1, minHeight: 0,
          overflowY: 'auto', overflowX: 'hidden',
          background: '#030609',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '18px 14px 24px',
        }}>
          {pdfFile ? (
            <div ref={wrapRef} style={{
              position: 'relative',
              display: 'inline-block',
              width: PAGE_W * zoom,
              boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
              borderRadius: 3,
              overflow: 'visible',
            }}>
              <Document
                file={pdfFile}
                onLoadSuccess={onDocLoad}
                onLoadError={e => setPdfError(e?.message || 'Load error')}
                loading={<SkeletonPage width={PAGE_W * zoom} />}
                error={<ErrorState error={pdfError} />}
              >
                <Page
                  pageNumber={currentPage}
                  width={PAGE_W * zoom}
                  onLoadSuccess={onPageLoad}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Simple marker on cited page */}
              {active?.page === currentPage && <AnswerMarker />}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* ── Source chips ── */}
        <SourceChips chunks={chunks} activeIdx={activeIdx} onSelect={setActiveIdx} />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Micro helpers
// ─────────────────────────────────────────────────────────────

const SkeletonPage = ({ width }) => (
  <div style={{
    width, height: 640, borderRadius: 3,
    background: 'linear-gradient(90deg,#0A1020 25%,#0F1A2E 50%,#0A1020 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.6s ease-in-out infinite',
  }} />
);

const ErrorState = ({ error }) => (
  <div style={{
    width: 460, padding: '40px 24px', borderRadius: 8, textAlign: 'center',
    background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  }}>
    <FileText size={34} color="#F87171" style={{ opacity: 0.45 }} />
    <div style={{ fontSize: '0.84rem', color: '#F87171', fontWeight: 600 }}>Failed to load PDF</div>
    <div style={{ fontSize: '0.7rem', color: '#3A4A6A' }}>{error || 'Check browser console'}</div>
  </div>
);

const EmptyState = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, padding: '80px 24px', color: '#1A2336', textAlign: 'center',
  }}>
    <Layers size={40} style={{ opacity: 0.25 }} />
    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>No document loaded</div>
    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Upload a PDF to see source previews</div>
  </div>
);

const nb = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 6, border: 'none',
  background: 'rgba(255,255,255,0.03)', cursor: 'pointer', color: '#3A4A6A',
};

export default CitationPanel;

// ─────────────────────────────────────────────────────────────
// WIRING INTO Dashboard.jsx (unchanged from before)
// ─────────────────────────────────────────────────────────────
// 1. const [citationPanel, setCitationPanel] = useState({ open:false, citation:null });
//    const [documentMeta, setDocumentMeta]   = useState({ totalPages:1 });
//
// 2. After upload: setDocumentMeta({ totalPages: data.totalPages || 1 });
//
// 3. After ask:
//    updateLast({ typing:false, text:data.answer,
//      cite:data.citation?.label, citationData:data.citation, messageId:data.messageId });
//
// 4. MessageBubble:
//    <div onClick={() => onCiteClick(msg.citationData)} style={{cursor:'pointer'}}>📌 {msg.cite}</div>
//    <MessageBubble ... onCiteClick={c => setCitationPanel({open:true, citation:c})} />
//
// 5. <CitationPanel isOpen={citationPanel.open}
//      onClose={() => setCitationPanel({open:false,citation:null})}
//      citation={citationPanel.citation} documentId={documentId}
//      documentName={uploadedFile?.name} totalPages={documentMeta.totalPages} />