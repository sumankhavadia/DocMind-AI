import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, Shield, Zap, Sparkles } from 'lucide-react';
import { API_ENDPOINTS } from "../../config/api";

const NoiseBg = () => (
  <svg className="fixed inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.03 }} xmlns="http://www.w3.org/2000/svg">
    <filter id="noise3">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#noise3)"/>
  </svg>
);

const THEME_STORAGE_KEY = "docmind-theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light") return false;
  if (savedTheme === "dark") return true;
  return true;
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const [focused, setFocused] = useState("");

  useEffect(() => {
    const fn = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type");
        const data = ct?.includes("application/json") ? await res.json() : { message: `Server error: ${res.status}` };
        throw new Error(data.message || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Connection failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDark ? "#080C14" : "#F0F4FF",
    card: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#F1F5FF" : "#0A1128",
    muted: isDark ? "#6B7FA3" : "#5A6A8A",
    input: isDark ? "#0D1626" : "#F8FAFF",
    inputBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    accent: "#3B6FFF",
    surface: isDark ? "#0D1626" : "#FFFFFF",
  };

  const inputStyle = (name) => ({
    width: "100%",
    padding: "12px 14px 12px 42px",
    background: theme.input,
    border: `1px solid ${focused === name ? "#3B6FFF" : theme.inputBorder}`,
    borderRadius: 10,
    color: theme.text,
    fontFamily: "'Sora', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    boxShadow: focused === name ? "0 0 0 3px rgba(59,111,255,0.15)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

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
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        .fade-up-0 { animation: fadeUp 0.6s ease-out 0s both; }
        .fade-up-1 { animation: fadeUp 0.6s ease-out 0.08s both; }
        .fade-up-2 { animation: fadeUp 0.6s ease-out 0.16s both; }
        .fade-up-3 { animation: fadeUp 0.6s ease-out 0.24s both; }

        .shimmer-text {
          background: linear-gradient(90deg, #3B6FFF 0%, #00D4FF 30%, #A78BFA 50%, #3B6FFF 70%, #00D4FF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3B6FFF 0%, #2252DD 100%);
          color: white;
          border: none;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(.22,1,.36,1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(59,111,255,0.4);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .glow-orb {
          border-radius: 50%;
          filter: blur(80px);
          position: absolute;
          pointer-events: none;
          animation: float-orb 8s ease-in-out infinite;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .social-btn:hover { transform: translateY(-1px); }
      `}</style>

      <NoiseBg />

      {/* Cursor glow */}
      <div style={{ position: "fixed", left: mouse.x - 180, top: mouse.y - 180, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,111,255,0.10) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1, transition: "left 0.15s ease-out, top 0.15s ease-out" }} />

      {/* Background orbs */}
      <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(59,111,255,0.10)", top: -150, right: -100, animationDelay: "0s" }} />
      <div className="glow-orb" style={{ width: 350, height: 350, background: "rgba(0,212,255,0.07)", bottom: -80, left: -80, animationDelay: "2s" }} />
      <div className="glow-orb" style={{ width: 250, height: 250, background: "rgba(167,139,250,0.06)", top: "40%", left: "5%", animationDelay: "4s" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 2 }}>

        {/* Logo + dark toggle */}
        <div className="fade-up-0" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3B6FFF, #00D4FF)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", boxShadow: "0 4px 16px rgba(59,111,255,0.5)" }}>D</div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", color: theme.text }}>
              DOC<span style={{ color: theme.accent }}>MIND</span>
              <span style={{ color: theme.muted, fontWeight: 400, fontSize: "0.7rem", marginLeft: 4 }}>AI</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="fade-up-1" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 36, boxShadow: `0 32px 80px rgba(0,0,0,${isDark ? 0.5 : 0.1})`, position: "relative", overflow: "hidden" }}>

          {/* Top gradient accent */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #3B6FFF, #00D4FF, #A78BFA)" }} />

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: isDark ? "rgba(59,111,255,0.1)" : "rgba(59,111,255,0.07)", border: "1px solid rgba(59,111,255,0.2)", fontSize: "0.72rem", fontWeight: 700, color: "#6B9FFF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              <Sparkles size={11} /> Welcome back
            </div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>
              Sign in to <span className="shimmer-text">DocMind</span>
            </h1>
            <p style={{ color: theme.muted, fontSize: "0.875rem" }}>Access your documents and conversations</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 7, color: theme.text }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focused === "email" ? theme.accent : theme.muted, transition: "color 0.2s" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  required
                  placeholder="you@example.com"
                  style={inputStyle("email")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.text }}>Password</label>
                <a href="#" style={{ fontSize: "0.75rem", color: theme.accent, textDecoration: "none", fontWeight: 600 }}
                  onMouseEnter={e => e.target.style.textDecoration = "underline"}
                  onMouseLeave={e => e.target.style.textDecoration = "none"}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focused === "password" ? theme.accent : theme.muted, transition: "color 0.2s" }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  required
                  placeholder="••••••••"
                  style={inputStyle("password")}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: "12px 14px", borderRadius: 10, background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p style={{ fontSize: "0.85rem", color: "#F87171" }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "14px", borderRadius: 12, fontSize: "0.95rem", marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
            <span style={{ fontSize: "0.72rem", color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Google", svg: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
              { label: "GitHub", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill={isDark ? "white" : "#24292e"}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> },
            ].map(({ label, svg }) => (
              <button key={label} className="social-btn" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${theme.border}`, color: theme.text }}>
                {svg} {label}
              </button>
            ))}
          </div>

          {/* Sign up link */}
          <p style={{ textAlign: "center", fontSize: "0.875rem", color: theme.muted }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: theme.accent, fontWeight: 700, textDecoration: "none" }}>Create one free</Link>
          </p>
        </div>

        {/* Trust row */}
        <div className="fade-up-2" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 24 }}>
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

        {/* Back to home */}
        <div className="fade-up-3" style={{ textAlign: "center", marginTop: 18 }}>
          <Link to="/" style={{ color: theme.muted, fontSize: "0.8rem", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = theme.accent}
            onMouseLeave={e => e.target.style.color = theme.muted}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;