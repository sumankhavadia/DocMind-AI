import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, User, Sparkles, Shield, Zap } from 'lucide-react';

const PERSONAS = [
  { id: "student", icon: "🎓", label: "Student", desc: "Simplify concepts & jargon" },
  { id: "professional", icon: "💼", label: "Professional", desc: "Concise, business-focused" },
  { id: "legal", icon: "⚖️", label: "Legal", desc: "Highlight risks & clauses" },
  { id: "researcher", icon: "🔬", label: "Researcher", desc: "Deep analysis & citations" },
  { id: "general", icon: "🙋", label: "General", desc: "Balanced, no assumptions" },
];

const NoiseBg = () => (
  <svg className="fixed inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.03 }} xmlns="http://www.w3.org/2000/svg">
    <filter id="noise2">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#noise2)"/>
  </svg>
);

const STEPS = ["Account", "Persona"];

const THEME_STORAGE_KEY = "docmind-theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light") return false;
  if (savedTheme === "dark") return true;
  return true;
};

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = account info, 1 = persona
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persona, setPersona] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const [pwStrength, setPwStrength] = useState(0);

  useEffect(() => {
    const fn = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    setPwStrength(s);
  }, [password]);

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, persona }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type");
        const data = ct?.includes("application/json") ? await res.json() : { message: `Server error: ${res.status}` };
        throw new Error(data.message || "Signup failed");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      if (persona) localStorage.setItem("persona", persona);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Connection failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDark ? "#080C14" : "#F0F4FF",
    surface: isDark ? "#0D1626" : "#FFFFFF",
    card: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#F1F5FF" : "#0A1128",
    muted: isDark ? "#6B7FA3" : "#5A6A8A",
    input: isDark ? "#0D1626" : "#F8FAFF",
    inputBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    accent: "#3B6FFF",
    accentAlt: "#00D4FF",
  };

  const strengthColors = ["#EF4444", "#F59E0B", "#34D399"];
  const strengthLabels = ["Weak", "Fair", "Strong"];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.3; }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fade-up { animation: fadeUp 0.6s ease-out both; }
        .slide-left { animation: slideLeft 0.45s cubic-bezier(.22,1,.36,1) both; }
        .slide-right { animation: slideRight 0.45s cubic-bezier(.22,1,.36,1) both; }

        .shimmer-text {
          background: linear-gradient(90deg, #3B6FFF 0%, #00D4FF 30%, #A78BFA 50%, #3B6FFF 70%, #00D4FF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .input-field {
          width: 100%;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          border-color: #3B6FFF !important;
          box-shadow: 0 0 0 3px rgba(59,111,255,0.15);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3B6FFF 0%, #2252DD 100%);
          color: white;
          border: none;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(.22,1,.36,1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(59,111,255,0.4);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .persona-card {
          cursor: pointer;
          transition: all 0.25s cubic-bezier(.22,1,.36,1);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
        }
        .persona-card:hover {
          transform: translateY(-3px);
          border-color: rgba(59,111,255,0.5) !important;
        }

        .glow-orb {
          border-radius: 50%;
          filter: blur(80px);
          position: absolute;
          pointer-events: none;
        }

        .step-dot {
          transition: all 0.35s ease;
        }
      `}</style>

      <NoiseBg />

      {/* Cursor glow */}
      <div style={{ position: "fixed", left: mouse.x - 180, top: mouse.y - 180, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,111,255,0.10) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1, transition: "left 0.15s ease-out, top 0.15s ease-out" }} />

      {/* Orbs */}
      <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(59,111,255,0.10)", top: -150, right: -100 }} />
      <div className="glow-orb" style={{ width: 350, height: 350, background: "rgba(0,212,255,0.07)", bottom: -80, left: -80 }} />
      <div className="glow-orb" style={{ width: 250, height: 250, background: "rgba(167,139,250,0.06)", top: "40%", left: "5%" }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 2 }}>

        {/* Logo + dark toggle */}
        <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3B6FFF, #00D4FF)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", boxShadow: "0 4px 16px rgba(59,111,255,0.5)" }}>D</div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", color: theme.text }}>
              DOC<span style={{ color: theme.accent }}>MIND</span>
              <span style={{ color: theme.muted, fontWeight: 400, fontSize: "0.7rem", marginLeft: 4 }}>AI</span>
            </span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="step-dot" style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i <= step ? "linear-gradient(135deg, #3B6FFF, #00D4FF)" : theme.surface,
                  border: i <= step ? "none" : `1px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700,
                  color: i <= step ? "white" : theme.muted,
                  boxShadow: i === step ? "0 0 0 4px rgba(59,111,255,0.2)" : "none",
                }}>{i < step ? "✓" : i + 1}</div>
                <span style={{ fontSize: "0.8rem", fontWeight: i === step ? 700 : 400, color: i === step ? theme.text : theme.muted }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, margin: "0 12px", background: i < step ? "linear-gradient(90deg, #3B6FFF, #00D4FF)" : theme.border, transition: "background 0.5s ease" }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 36, boxShadow: `0 32px 80px rgba(0,0,0,${isDark ? 0.5 : 0.1})`, position: "relative", overflow: "hidden" }}>
          {/* Subtle card top accent */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #3B6FFF, #00D4FF, #A78BFA)" }} />

          {/* ── STEP 0: Account Info ── */}
          {step === 0 && (
            <div className="slide-right">
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: isDark ? "rgba(59,111,255,0.1)" : "rgba(59,111,255,0.07)", border: "1px solid rgba(59,111,255,0.2)", fontSize: "0.72rem", fontWeight: 700, color: "#6B9FFF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                  <Sparkles size={11} /> Step 1 of 2
                </div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>
                  Create your <span className="shimmer-text">account</span>
                </h1>
                <p style={{ color: theme.muted, fontSize: "0.875rem" }}>Get started with DocMind AI in seconds</p>
              </div>

              <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 7, color: theme.text }}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.muted }} />
                    <input
                      className="input-field"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      style={{ padding: "12px 14px 12px 40px", background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 7, color: theme.text }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.muted }} />
                    <input
                      className="input-field"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      style={{ padding: "12px 14px 12px 40px", background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 7, color: theme.text }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.muted }} />
                    <input
                      className="input-field"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      style={{ padding: "12px 14px 12px 40px", background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                  </div>

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < pwStrength ? strengthColors[pwStrength - 1] : theme.border, transition: "background 0.3s ease" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: "0.72rem", color: pwStrength > 0 ? strengthColors[pwStrength - 1] : theme.muted, fontWeight: 600 }}>
                        {pwStrength > 0 ? strengthLabels[pwStrength - 1] : "Too short"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <p style={{ fontSize: "0.85rem", color: "#F87171" }}>{error}</p>
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ padding: "14px", borderRadius: 12, fontSize: "0.95rem", marginTop: 4 }}>
                  Continue <ArrowRight size={16} />
                </button>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
                <span style={{ fontSize: "0.75rem", color: theme.muted, fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
              </div>

              <p style={{ textAlign: "center", fontSize: "0.875rem", color: theme.muted }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: theme.accent, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 1: Persona ── */}
          {step === 1 && (
            <div className="slide-left">
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: isDark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", fontSize: "0.72rem", fontWeight: 700, color: "#00D4FF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                  <Sparkles size={11} /> Step 2 of 2
                </div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>
                  Choose your <span className="shimmer-text">persona</span>
                </h1>
                <p style={{ color: theme.muted, fontSize: "0.875rem", lineHeight: 1.6 }}>
                  How DocMind responds will be tailored to you. You can switch anytime from the dashboard.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {PERSONAS.map(p => {
                  const selected = persona === p.id;
                  return (
                    <div
                      key={p.id}
                      className="persona-card"
                      onClick={() => setPersona(p.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px",
                        background: selected
                          ? (isDark ? "rgba(59,111,255,0.12)" : "rgba(59,111,255,0.06)")
                          : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                        border: selected ? "1px solid rgba(59,111,255,0.5)" : `1px solid ${theme.border}`,
                        boxShadow: selected ? "0 4px 20px rgba(59,111,255,0.15)" : "none",
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, fontSize: "1.2rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: selected ? "rgba(59,111,255,0.15)" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                        border: selected ? "1px solid rgba(59,111,255,0.3)" : `1px solid ${theme.border}`,
                        flexShrink: 0,
                        transition: "all 0.25s ease",
                      }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: selected ? theme.accent : theme.text }}>{p.label}</div>
                        <div style={{ fontSize: "0.78rem", color: theme.muted, marginTop: 2 }}>{p.desc}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: selected ? "none" : `2px solid ${theme.border}`,
                        background: selected ? "linear-gradient(135deg, #3B6FFF, #00D4FF)" : "transparent",
                        flexShrink: 0, transition: "all 0.25s ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 12, background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <p style={{ fontSize: "0.85rem", color: "#F87171" }}>{error}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setStep(0); setError(""); }}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 12, fontSize: "0.9rem",
                    background: "transparent", border: `1px solid ${theme.border}`,
                    color: theme.muted, cursor: "pointer", fontFamily: "'Sora', sans-serif",
                    fontWeight: 600, transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 2, padding: "14px", borderRadius: 12, fontSize: "0.95rem" }}
                >
                  {loading ? "Creating account…" : persona ? `Start as ${PERSONAS.find(p => p.id === persona)?.label}` : "Skip & Continue"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 16 }}>
                <Shield size={12} color={theme.muted} />
                <span style={{ fontSize: "0.72rem", color: theme.muted }}>You can change your persona anytime in settings</span>
              </div>
            </div>
          )}
        </div>

        {/* Trust row */}
        <div className="fade-up" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 24 }}>
          {[
            { icon: <Shield size={13} />, label: "SOC 2 Compliant" },
            { icon: <Zap size={13} />, label: "256-bit Encryption" },
            { icon: <Sparkles size={13} />, label: "No data training" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, color: theme.muted, fontSize: "0.72rem", fontWeight: 500 }}>
              {icon} {label}
            </div>
          ))}
        </div>

        {/* Terms */}
        <p style={{ textAlign: "center", fontSize: "0.72rem", color: theme.muted, marginTop: 16 }}>
          By signing up, you agree to our{" "}
          <a href="#" style={{ color: theme.accent, textDecoration: "none" }}>Terms</a>{" "}
          and{" "}
          <a href="#" style={{ color: theme.accent, textDecoration: "none" }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;