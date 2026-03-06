import { Link } from "react-router-dom";
import { UploadCloud, FileText, Quote, Layers, Moon, Sun, ChevronRight, Zap, Shield, Sparkles, ArrowRight, Check, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ── Noise texture SVG (inline) ─────────────────────────────
const NoiseBg = () => (
  <svg className="fixed inset-0 w-full h-full opacity-[0.03] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)"/>
  </svg>
);

// ── Animated counter ───────────────────────────────────────
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = () => {
        start += Math.ceil(to / 60);
        if (start >= to) { setVal(to); return; }
        setVal(start);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Floating particle ──────────────────────────────────────
function Particle({ style }) {
  return <div className="particle" style={style} />;
}

const THEME_STORAGE_KEY = "docmind-theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light") return false;
  if (savedTheme === "dark") return true;
  return true;
};

export default function Home() {
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [typed, setTyped] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const full = "Stop Reading.\nStart Asking.";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) { setTyped(full.slice(0, i)); i++; }
      else clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const theme = {
    bg: isDark ? "#080C14" : "#F0F4FF",
    surface: isDark ? "#0D1626" : "#FFFFFF",
    card: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#F1F5FF" : "#0A1128",
    muted: isDark ? "#6B7FA3" : "#5A6A8A",
    accent: "#3B6FFF",
    accentAlt: "#00D4FF",
    glow: isDark ? "rgba(59,111,255,0.18)" : "rgba(59,111,255,0.10)",
  };

  const particles = Array.from({ length: 18 }, (_, i) => ({
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${8 + Math.random() * 10}s`,
    opacity: Math.random() * 0.4 + 0.1,
    background: i % 3 === 0 ? theme.accent : i % 3 === 1 ? theme.accentAlt : "#A78BFA",
    borderRadius: "50%",
    position: "absolute",
    animation: `drift ${8 + Math.random() * 10}s ease-in-out infinite`,
  }));

  return (
    <div style={{ background: theme.bg, color: theme.text, fontFamily: "'Sora', sans-serif", minHeight: "100vh", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes drift {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          33% { transform: translateY(-40px) translateX(15px) scale(1.1); }
          66% { transform: translateY(20px) translateX(-10px) scale(0.9); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes line-grow {
          from { width: 0; } to { width: 100%; }
        }
        @keyframes slide-right {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .fade-up { animation: fadeUp 0.7s ease-out both; }
        .fade-up-1 { animation: fadeUp 0.7s ease-out 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.7s ease-out 0.2s both; }
        .fade-up-3 { animation: fadeUp 0.7s ease-out 0.3s both; }
        .fade-up-4 { animation: fadeUp 0.7s ease-out 0.4s both; }
        .fade-up-5 { animation: fadeUp 0.7s ease-out 0.5s both; }

        .shimmer-text {
          background: linear-gradient(90deg, #3B6FFF 0%, #00D4FF 30%, #A78BFA 50%, #3B6FFF 70%, #00D4FF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .card-hover {
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 24px 60px rgba(59,111,255,0.18);
          border-color: rgba(59,111,255,0.5) !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3B6FFF 0%, #2252DD 100%);
          color: white;
          border: none;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(.22,1,.36,1);
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #5B8FFF 0%, #3B6FFF 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(59,111,255,0.4); }
        .btn-primary span { position: relative; z-index: 1; }

        .btn-ghost {
          background: transparent;
          font-family: 'Sora', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-ghost:hover { transform: translateY(-2px); }

        .nav-link {
          position: relative;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #3B6FFF;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        .step-line {
          position: absolute;
          top: 32px;
          left: calc(50% + 32px);
          right: calc(-50% + 32px);
          height: 1px;
          background: linear-gradient(90deg, #3B6FFF, transparent);
          animation: line-grow 1.5s ease-out 0.5s both;
        }

        .glow-orb {
          border-radius: 50%;
          filter: blur(80px);
          position: absolute;
          pointer-events: none;
        }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .hero-visual {
          animation: float-card 6s ease-in-out infinite;
        }

        .scroll-indicator {
          animation: fadeUp 1s ease-out 1.5s both;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(59,111,255,0.4); border-radius: 4px; }
      `}</style>

      <NoiseBg />

      {/* Cursor glow */}
      <div style={{
        position: "fixed",
        left: mouse.x - 200,
        top: mouse.y - 200,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(59,111,255,0.12) 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 1,
        transition: "left 0.15s ease-out, top 0.15s ease-out",
      }} />

      {/* ── HEADER ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 2rem",
        height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? (isDark ? "rgba(8,12,20,0.88)" : "rgba(240,244,255,0.88)") : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${theme.border}` : "none",
        transition: "all 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #3B6FFF, #00D4FF)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "white",
            boxShadow: "0 4px 16px rgba(59,111,255,0.5)",
          }}>D</div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
            DOC<span style={{ color: theme.accent }}>MIND</span>
            <span style={{ color: theme.muted, fontWeight: 400, fontSize: "0.75rem", marginLeft: 4 }}>AI</span>
          </span>
        </div>

        <nav style={{ display: "flex", gap: 32 }}>
          {["Features", "How it Works", "Pricing", "Docs"].map(n => (
            <a key={n} href={`#${n.toLowerCase().replace(/ /g, "")}`}
              className="nav-link"
              style={{ color: theme.muted }}>
              {n}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setIsDark(!isDark)} style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`,
            background: theme.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: theme.muted, transition: "all 0.2s",
          }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/signup">
            <button className="btn-primary" style={{ padding: "10px 22px", borderRadius: 10, fontSize: "0.875rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>Get Started <ArrowRight size={15} /></span>
            </button>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem 80px", overflow: "hidden" }}>
        {/* Orbs */}
        <div className="glow-orb" style={{ width: 600, height: 600, background: "rgba(59,111,255,0.12)", top: -100, right: -100 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: "rgba(0,212,255,0.08)", bottom: 0, left: -100 }} />
        <div className="glow-orb" style={{ width: 300, height: 300, background: "rgba(167,139,250,0.08)", top: "30%", left: "10%" }} />

        {/* Particles */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {particles.map((p, i) => <Particle key={i} style={p} />)}
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <span className="tag-pill" style={{
              background: isDark ? "rgba(59,111,255,0.12)" : "rgba(59,111,255,0.08)",
              border: "1px solid rgba(59,111,255,0.25)",
              color: "#6B9FFF",
            }}>
              <Sparkles size={12} />
              Powered by Advanced AI · Now in Beta
            </span>
          </div>

          <h1 className="fade-up-1" style={{
            fontSize: "clamp(3rem, 8vw, 6.5rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: 28,
            whiteSpace: "pre-line",
          }}>
            {typed.split("\n").map((line, i) => (
              <span key={i} style={{ display: "block" }}>
                {i === 1 ? <span className="shimmer-text">{line}</span> : line}
              </span>
            ))}
            {typed.length < full.length && showCursor && (
              <span style={{ color: theme.accent }}>|</span>
            )}
          </h1>

          <p className="fade-up-2" style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            color: theme.muted,
            maxWidth: 600,
            margin: "0 auto 48px",
            lineHeight: 1.7,
            fontWeight: 400,
          }}>
            Turn any document into a brilliant AI assistant. Ask questions, get cited answers, and extract insights — in seconds.
          </p>

          <div className="fade-up-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
            <Link to="/signup">
              <button className="btn-primary" style={{ padding: "16px 32px", borderRadius: 12, fontSize: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Upload Your First Doc <ChevronRight size={18} />
                </span>
              </button>
            </Link>
            <button className="btn-ghost" style={{
              padding: "16px 32px", borderRadius: 12, fontSize: "1rem",
              border: `1px solid ${theme.border}`,
              color: theme.text,
            }}>
              Watch Demo →
            </button>
          </div>

          {/* Social proof */}
          <div className="fade-up-4" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 64 }}>
            <div style={{ display: "flex" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: `hsl(${210 + i * 25}, 80%, 55%)`,
                  border: `2px solid ${theme.bg}`,
                  marginLeft: i ? -8 : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "white", fontWeight: 700,
                }}>
                  {["R","S","A","M","J"][i]}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />)}
            </div>
            <span style={{ color: theme.muted, fontSize: "0.875rem" }}>
              Loved by <strong style={{ color: theme.text }}>5,000+</strong> professionals
            </span>
          </div>

          {/* Hero visual */}
          <div className="fade-up-5 hero-visual" style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}>
            {/* Glow behind card */}
            <div style={{
              position: "absolute", inset: -2,
              background: "linear-gradient(135deg, #3B6FFF33, #00D4FF22, #A78BFA33)",
              borderRadius: 22, filter: "blur(1px)",
              zIndex: 0,
            }} />
            <div style={{
              position: "relative", zIndex: 1,
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: `0 32px 80px rgba(0,0,0,${isDark ? 0.6 : 0.12})`,
            }}>
              {/* Window chrome */}
              <div style={{
                padding: "12px 20px",
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                borderBottom: `1px solid ${theme.border}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#FF5F57","#FEBC2E","#28C840"].map(c => (
                    <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, height: 24, borderRadius: 6, marginLeft: 12,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", paddingLeft: 10,
                }}>
                  <span style={{ color: theme.muted, fontSize: "0.75rem" }}>app.docmind.ai/chat</span>
                </div>
              </div>

              {/* Chat UI */}
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 280 }}>
                {[
                  { side: "doc", text: "📄  Q3_Financial_Report.pdf  ·  48 pages", sub: "Processed in 1.2s" },
                  { side: "user", text: "What were the top revenue drivers in Q3?" },
                  { side: "ai", text: "Based on page 12, the top drivers were: (1) Enterprise subscriptions +34%, (2) API usage +28%, and (3) Professional Services +19%. Total revenue reached $4.2M.", cite: "Page 12, §Revenue Analysis" },
                ].map((msg, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: msg.side === "user" ? "flex-end" : "flex-start",
                    animation: `fadeUp 0.5s ease-out ${i * 0.15}s both`,
                  }}>
                    {msg.side === "doc" && (
                      <div style={{
                        background: isDark ? "rgba(59,111,255,0.1)" : "rgba(59,111,255,0.07)",
                        border: "1px solid rgba(59,111,255,0.2)",
                        borderRadius: 12, padding: "10px 16px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <FileText size={18} color="#3B6FFF" />
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: theme.text }}>{msg.text}</div>
                          <div style={{ fontSize: "0.72rem", color: theme.muted, marginTop: 2 }}>{msg.sub}</div>
                        </div>
                      </div>
                    )}
                    {msg.side === "user" && (
                      <div style={{
                        background: "linear-gradient(135deg, #3B6FFF, #2252DD)",
                        borderRadius: "16px 16px 4px 16px",
                        padding: "10px 16px",
                        fontSize: "0.875rem",
                        color: "white",
                        maxWidth: "70%",
                      }}>{msg.text}</div>
                    )}
                    {msg.side === "ai" && (
                      <div style={{ maxWidth: "80%" }}>
                        <div style={{
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${theme.border}`,
                          borderRadius: "16px 16px 16px 4px",
                          padding: "12px 16px",
                          fontSize: "0.875rem",
                          color: theme.text,
                          lineHeight: 1.6,
                        }}>
                          {msg.text}
                          <div style={{
                            marginTop: 8, padding: "4px 10px",
                            background: "rgba(59,111,255,0.1)",
                            border: "1px solid rgba(59,111,255,0.2)",
                            borderRadius: 6,
                            fontSize: "0.72rem",
                            color: "#6B9FFF",
                            display: "inline-block",
                          }}>
                            📌 {msg.cite}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: theme.accent,
                        animation: `pulse-ring 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: theme.muted }}>DocMind is thinking…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: "60px 2rem", borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }}>
          {[
            { n: 10000, suf: "+", label: "Docs Processed" },
            { n: 5000, suf: "+", label: "Active Users" },
            { n: 99, suf: ".9%", label: "Uptime SLA" },
            { n: 1, suf: ".2s", label: "Avg Response" },
          ].map(({ n, suf, label }) => (
            <div key={label}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.04em", color: theme.accent }}>
                <Counter to={n} suffix={suf} />
              </div>
              <div style={{ fontSize: "0.85rem", color: theme.muted, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="tag-pill" style={{
              background: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", marginBottom: 20, display: "inline-flex",
            }}>
              <Zap size={12} /> Features
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.04em", marginTop: 12 }}>
              Everything your documents<br />
              <span className="shimmer-text">deserve to unlock</span>
            </h2>
            <p style={{ color: theme.muted, fontSize: "1.1rem", marginTop: 16, maxWidth: 500, margin: "16px auto 0" }}>
              Built for researchers, professionals, and teams who need more than just search.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {[
              { icon: <FileText size={22} />, title: "Smart Summaries", desc: "Distill 200-page reports into crisp, actionable briefs. Choose your depth — overview, detailed, or executive.", color: "#3B6FFF" },
              { icon: <Quote size={22} />, title: "Verified Citations", desc: "Every response pinpoints the exact page and paragraph. No hallucinations. Full transparency.", color: "#00D4FF", featured: true },
              { icon: <Layers size={22} />, title: "Multi-Doc Chat", desc: "Cross-reference multiple documents in one conversation. Ask holistic questions across your entire library.", color: "#A78BFA" },
              { icon: <Zap size={22} />, title: "Lightning Fast", desc: "Sub-2-second responses on documents up to 500 pages, powered by optimized transformer models.", color: "#F59E0B" },
              { icon: <Shield size={22} />, title: "Enterprise Security", desc: "AES-256 encryption, zero data retention policy, SOC 2 compliant. Your data never trains our models.", color: "#34D399" },
              { icon: <UploadCloud size={22} />, title: "Any Format", desc: "PDF, DOCX, PPTX, TXT, CSV and more. Drag-drop or connect Google Drive, Notion, or SharePoint.", color: "#FB7185" },
            ].map(({ icon, title, desc, color, featured }) => (
              <div key={title} className="card-hover" style={{
                padding: 28,
                borderRadius: 16,
                background: featured
                  ? `linear-gradient(135deg, ${isDark ? "rgba(59,111,255,0.12)" : "rgba(59,111,255,0.05)"}, ${isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.04)"})`
                  : theme.card,
                border: featured ? "1px solid rgba(59,111,255,0.3)" : `1px solid ${theme.border}`,
                boxShadow: featured ? "0 8px 32px rgba(59,111,255,0.12)" : "none",
                position: "relative",
                overflow: "hidden",
              }}>
                {featured && (
                  <div style={{
                    position: "absolute", top: 14, right: 14,
                    background: "linear-gradient(135deg, #3B6FFF, #00D4FF)",
                    borderRadius: 6, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700, color: "white",
                  }}>POPULAR</div>
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 18,
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color,
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ color: theme.muted, fontSize: "0.875rem", lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="howitworks" style={{ padding: "100px 2rem", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <span className="tag-pill" style={{
            background: isDark ? "rgba(167,139,250,0.1)" : "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.25)", color: "#A78BFA", marginBottom: 20, display: "inline-flex",
          }}>
            <Sparkles size={12} /> How it Works
          </span>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", marginTop: 12, marginBottom: 64 }}>
            Three steps to document mastery
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, position: "relative" }}>
            {[
              { n: "01", icon: <UploadCloud size={28} />, title: "Upload", desc: "Drop any document or connect your cloud storage. We handle PDFs, Word docs, presentations, and more.", color: "#3B6FFF" },
              { n: "02", icon: <Zap size={28} />, title: "Process", desc: "Our AI indexes every sentence, building a semantic map for instant, precise retrieval.", color: "#00D4FF" },
              { n: "03", icon: <Quote size={28} />, title: "Ask Anything", desc: "Type your question. Get cited, accurate answers in under 2 seconds — every time.", color: "#A78BFA" },
            ].map(({ n, icon, title, desc, color }, i) => (
              <div key={n} style={{ position: "relative" }}>
                {i < 2 && (
                  <div style={{
                    position: "absolute", top: 32, left: "calc(50% + 36px)", right: "calc(-50% + 36px)",
                    height: 1,
                    background: `linear-gradient(90deg, ${color}60, transparent)`,
                  }} />
                )}
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px",
                  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                  border: `2px solid ${color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", color,
                  boxShadow: `0 0 0 8px ${color}10`,
                  animation: "pulse-ring 3s ease-in-out infinite",
                }}>
                  {icon}
                </div>
                <div style={{
                  fontSize: "0.7rem", fontWeight: 800, color, letterSpacing: "0.1em",
                  textTransform: "uppercase", marginBottom: 10,
                }}>Step {n}</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ color: theme.muted, fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "100px 2rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 56 }}>
            What our users say
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { quote: "DocMind cut our contract review time by 70%. The citation feature is a game-changer for our legal team.", name: "Sarah K.", role: "General Counsel, TechCorp", avatar: "S", color: "#3B6FFF" },
              { quote: "I processed 3 years of research papers in an afternoon. It found connections I'd been searching for months.", name: "Dr. Amir R.", role: "Research Scientist, MIT", avatar: "A", color: "#00D4FF" },
              { quote: "My team uses it for due diligence. The multi-doc feature is absolutely incredible for cross-referencing.", name: "Maya T.", role: "VP, Sequoia Capital", avatar: "M", color: "#A78BFA" },
            ].map(({ quote, name, role, avatar, color }) => (
              <div key={name} className="card-hover" style={{
                padding: 28, borderRadius: 16,
                background: theme.card,
                border: `1px solid ${theme.border}`,
                textAlign: "left",
              }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ color: theme.text, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 20 }}>"{quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: "0.9rem",
                  }}>{avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{name}</div>
                    <div style={{ color: theme.muted, fontSize: "0.78rem" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px 2rem", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 16 }}>
            Simple, honest pricing
          </h2>
          <p style={{ color: theme.muted, marginBottom: 56 }}>Start free. Scale when ready.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {[
              { name: "Free", price: "$0", period: "/month", features: ["5 documents", "50 questions/mo", "PDF support", "Basic summaries"], cta: "Get Started", featured: false },
              { name: "Pro", price: "$19", period: "/month", features: ["Unlimited documents", "Unlimited questions", "All file formats", "Multi-doc chat", "Priority support", "API access"], cta: "Start Free Trial", featured: true },
              { name: "Enterprise", price: "Custom", period: "", features: ["Everything in Pro", "SSO & SAML", "Custom data retention", "Dedicated instance", "SLA guarantee", "White-labeling"], cta: "Contact Sales", featured: false },
            ].map(({ name, price, period, features, cta, featured }) => (
              <div key={name} className="card-hover" style={{
                padding: 32, borderRadius: 18,
                background: featured ? "linear-gradient(135deg, #1a2e6a, #0f1e4d)" : theme.card,
                border: featured ? "1px solid rgba(59,111,255,0.5)" : `1px solid ${theme.border}`,
                boxShadow: featured ? "0 24px 60px rgba(59,111,255,0.25)" : "none",
                position: "relative", transform: featured ? "scale(1.04)" : "none",
              }}>
                {featured && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #3B6FFF, #00D4FF)",
                    borderRadius: 999, padding: "4px 16px", fontSize: "0.72rem", fontWeight: 800, color: "white",
                    whiteSpace: "nowrap", letterSpacing: "0.05em",
                  }}>MOST POPULAR</div>
                )}
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: featured ? "#6B9FFF" : theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{name}</div>
                <div style={{ fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4, color: featured ? "white" : theme.text }}>
                  {price}<span style={{ fontSize: "1rem", fontWeight: 400, color: featured ? "rgba(255,255,255,0.6)" : theme.muted }}>{period}</span>
                </div>
                <div style={{ height: 1, background: featured ? "rgba(255,255,255,0.1)" : theme.border, margin: "20px 0" }} />
                <ul style={{ listStyle: "none", marginBottom: 28, textAlign: "left" }}>
                  {features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: "0.875rem", color: featured ? "rgba(255,255,255,0.85)" : theme.text }}>
                      <Check size={15} color={featured ? "#00D4FF" : theme.accent} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={featured ? "btn-primary" : "btn-ghost"} style={{
                  width: "100%", padding: "13px 0", borderRadius: 10, fontSize: "0.9rem",
                  border: featured ? "none" : `1px solid ${theme.border}`,
                  color: featured ? "white" : theme.text,
                }}>
                  <span>{cta}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 2rem", margin: "0 2rem 60px", borderRadius: 24, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1a2e6a 0%, #0f1e4d 50%, #1a1a3e 100%)" }}>
        <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(59,111,255,0.3)", top: -150, right: -100, filter: "blur(100px)" }} />
        <div className="glow-orb" style={{ width: 300, height: 300, background: "rgba(0,212,255,0.2)", bottom: -80, left: -50, filter: "blur(80px)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "white", marginBottom: 20 }}>
            Ready to talk to<br /><span className="shimmer-text">your documents?</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", marginBottom: 40 }}>
            Join thousands of professionals extracting insights at the speed of thought.
          </p>
          <Link to="/signup">
            <button className="btn-primary" style={{ padding: "18px 44px", borderRadius: 14, fontSize: "1.1rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                Start Free — No credit card required <ArrowRight size={20} />
              </span>
            </button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "60px 2rem 40px", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, background: "linear-gradient(135deg, #3B6FFF, #00D4FF)",
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "white",
                }}>D</div>
                <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>DOCMIND AI</span>
              </div>
              <p style={{ color: theme.muted, fontSize: "0.875rem", lineHeight: 1.7, maxWidth: 260 }}>
                The intelligent document assistant for modern professionals and teams.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "GDPR", "Cookies"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 16 }}>{title}</div>
                <ul style={{ listStyle: "none" }}>
                  {links.map(l => (
                    <li key={l} style={{ marginBottom: 10 }}>
                      <a href="#" style={{ color: theme.muted, fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => e.target.style.color = theme.text}
                        onMouseLeave={e => e.target.style.color = theme.muted}>
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: theme.muted, fontSize: "0.8rem" }}>© 2025 DocMind AI. All rights reserved.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Twitter", "LinkedIn", "GitHub"].map(s => (
                <a key={s} href="#" style={{ color: theme.muted, fontSize: "0.8rem", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = theme.accent}
                  onMouseLeave={e => e.target.style.color = theme.muted}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}