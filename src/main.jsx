import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚙️ CONFIGURAÇÕES
const SUPABASE_URL = "https://ytxjikrcubokcpkfydlw.supabase.co";
const SUPABASE_KEY = "sb_publishable_HfnPsIQBEqGOGUysp5YP9g_nZ3SCS4q";
const STRIPE_KEY = "pk_test_51TYrnAGu1tQYMMXaaRaJMpXoHsR9gE7ETrd1L8xCVj23JdjFE0Sckl0zI51ZGPIyhZLZUkL3e2KItK5aGqY7Ppxm00zhDFmW2F";
const FREE_LIMIT = 10;
const PRICE_MONTHLY = "9,90€";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GENRES = ["Pop", "Hip-Hop", "Rock", "R&B", "Eletrônico", "Sertanejo", "Funk", "Jazz", "Lo-fi", "K-Pop"];
const MOODS = ["Animado", "Melancólico", "Romântico", "Intenso", "Relaxante", "Épico", "Rebelde", "Sonhador"];
const INSTRUMENTS = ["Guitarra", "Piano", "Bateria", "Baixo", "Sintetizador", "Violão", "Violino", "Trompete"];

async function callClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.map(i => i.text || "").join("\n") || "";
}

function Tag({ label, selected, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20,
      border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.15)"}`,
      background: selected ? `${color}22` : "transparent",
      color: selected ? color : "rgba(255,255,255,0.55)",
      fontSize: 13, fontFamily: "inherit", cursor: "pointer",
      transition: "all 0.2s", fontWeight: selected ? 600 : 400,
    }}>{label}</button>
  );
}

function ResultCard({ title, content, accent }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${accent}44`,
      borderRadius: 16, padding: "1.5rem", marginBottom: "1rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <span style={{ color: accent, fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</span>
        <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          style={{ background: "transparent", border: `1px solid ${accent}55`, color: accent, borderRadius: 8, padding: "3px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "rgba(255,255,255,0.82)", lineHeight: 1.7, fontSize: 14, margin: 0, fontFamily: "inherit" }}>{content}</pre>
    </div>
  );
}

function PaywallModal({ onClose, accent }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "1rem",
    }}>
      <div style={{
        background: "#0d0d1a", border: `1px solid ${accent}66`,
        borderRadius: 24, padding: "2rem", maxWidth: 380, width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🎵</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
          Limite gratuito atingido!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, margin: "0 0 1.5rem" }}>
          Usaste as tuas {FREE_LIMIT} gerações gratuitas. Assina para gerações ilimitadas!
        </p>
        <div style={{
          background: `${accent}18`, border: `1px solid ${accent}44`,
          borderRadius: 16, padding: "1.2rem", marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>{PRICE_MONTHLY}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>por mês · cancela quando quiseres</div>
          <div style={{ marginTop: "0.8rem", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            ✅ Gerações ilimitadas<br />
            ✅ Músicas e personagens<br />
            ✅ Suporte prioritário
          </div>
        </div>
        <button style={{
          width: "100%", padding: "14px", background: accent,
          border: "none", borderRadius: 12, color: "#000",
          fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          marginBottom: "0.8rem",
        }}
          onClick={() => alert("Em breve! Integração Stripe a ser configurada.")}>
          Assinar agora — {PRICE_MONTHLY}/mês
        </button>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: "rgba(255,255,255,0.35)",
          fontSize: 13, cursor: "pointer", fontFamily: "inherit",
        }}>Fechar</button>
      </div>
    </div>
  );
}

// ── AUTH SCREEN ──
function AuthScreen({ onAuth, accent }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handle = async () => {
    setLoading(true); setMsg("");
    try {
      let result;
      if (mode === "login") {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
        if (!result.error) setMsg("✅ Confirma o teu email e volta para fazer login!");
      }
      if (result.error) setMsg("❌ " + result.error.message);
      else if (mode === "login" && result.data.user) onAuth(result.data.user);
    } catch (e) { setMsg("❌ Erro. Tenta novamente."); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12,
    color: "#fff", fontSize: 15, padding: "13px 14px",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080810",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", fontFamily: "'Syne', sans-serif",
    }}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 48, marginBottom: "0.5rem" }}>🎵</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Music<span style={{ color: accent }}>AI</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "8px 0 0" }}>
            Cria músicas e personagens com IA
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "1.8rem",
        }}>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: "1.5rem" }}>
            {[["login", "Entrar"], ["signup", "Registar"]].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} style={{
                flex: 1, padding: "9px", borderRadius: 9, border: "none",
                background: mode === k ? accent : "transparent",
                color: mode === k ? "#000" : "rgba(255,255,255,0.4)",
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" type="email" style={inputStyle} />
            <input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" type="password" style={inputStyle} />
          </div>

          {msg && <p style={{ color: msg.startsWith("✅") ? "#39e09b" : "#ff6b6b", fontSize: 13, marginTop: 12, textAlign: "center" }}>{msg}</p>}

          <button onClick={handle} disabled={loading || !email || !password} style={{
            width: "100%", padding: "14px", marginTop: "1.2rem",
            background: (!email || !password) ? "rgba(255,255,255,0.08)" : accent,
            border: "none", borderRadius: 12,
            color: (!email || !password) ? "rgba(255,255,255,0.3)" : "#000",
            fontSize: 15, fontWeight: 800, cursor: (!email || !password) ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}>
            {loading ? "A carregar..." : mode === "login" ? "Entrar" : "Criar conta grátis"}
          </button>

          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginTop: "1rem", lineHeight: 1.5 }}>
            Registo grátis · {FREE_LIMIT} gerações incluídas
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const accent = "#ff2d78";
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState("musica");
  const [usageCount, setUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // Music
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [musicTheme, setMusicTheme] = useState("");
  const [musicResult, setMusicResult] = useState(null);
  const [musicLoading, setMusicLoading] = useState(false);

  // Character
  const [charStyle, setCharStyle] = useState("");
  const [charPersonality, setCharPersonality] = useState("");
  const [charBackground, setCharBackground] = useState("");
  const [charResult, setCharResult] = useState(null);
  const [charLoading, setCharLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        loadUsage(data.session.user.id);
      }
      setCheckingAuth(false);
    });
  }, []);

  const loadUsage = (uid) => {
    const key = `musicai_usage_${uid}_${new Date().toDateString()}`;
    const count = parseInt(localStorage.getItem(key) || "0");
    setUsageCount(count);
  };

  const incrementUsage = () => {
    const key = `musicai_usage_${user.id}_${new Date().toDateString()}`;
    const newCount = usageCount + 1;
    localStorage.setItem(key, newCount.toString());
    setUsageCount(newCount);
    return newCount;
  };

  const canGenerate = () => usageCount < FREE_LIMIT;

  const toggleInstrument = (inst) =>
    setSelectedInstruments(prev => prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const generateMusic = async () => {
    if (!genre || !mood) return;
    if (!canGenerate()) { setShowPaywall(true); return; }
    setMusicLoading(true); setMusicResult(null);
    incrementUsage();
    try {
      const raw = await callClaude(`Você é um compositor criativo. Crie uma música em português:
Gênero: ${genre}, Mood: ${mood}, Instrumentos: ${selectedInstruments.join(", ") || "livre"}, Tema: ${musicTheme || "livre"}
Responda APENAS em JSON sem markdown:
{"titulo":"...","artista_sugerido":"...","descricao":"...","letra":"...","producao":"...","hashtags":"..."}`);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setMusicResult(parsed);
    } catch { setMusicResult({ erro: "Erro ao gerar. Tenta novamente!" }); }
    setMusicLoading(false);
  };

  const generateCharacter = async () => {
    if (!charStyle || !charPersonality) return;
    if (!canGenerate()) { setShowPaywall(true); return; }
    setCharLoading(true); setCharResult(null);
    incrementUsage();
    try {
      const raw = await callClaude(`Crie um personagem musical único:
Estilo: ${charStyle}, Personalidade: ${charPersonality}, Background: ${charBackground || "livre"}
Responda APENAS em JSON sem markdown:
{"nome_artistico":"...","idade":"...","origem":"...","bio":"...","visual":"...","influencias":"...","primeiro_hit":"...","frase_iconica":"...","redes_sociais":"..."}`);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setCharResult(parsed);
    } catch { setCharResult({ erro: "Erro ao gerar. Tenta novamente!" }); }
    setCharLoading(false);
  };

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); loadUsage(u.id); }} accent={accent} />;

  const remaining = Math.max(0, FREE_LIMIT - usageCount);

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12,
    color: "#fff", fontSize: 14, padding: "12px 14px",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080810", fontFamily: "'Syne', sans-serif", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        * { box-sizing: border-box; }
        textarea:focus, input:focus { border-color: ${accent} !important; }
      `}</style>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} accent={accent} />}

      {/* Header */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Music<span style={{ color: accent }}>AI</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "2px 0 0" }}>{user.email}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Usage counter */}
            <div style={{
              background: remaining <= 3 ? "#ff4d4d22" : `${accent}18`,
              border: `1px solid ${remaining <= 3 ? "#ff4d4d44" : accent + "44"}`,
              borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700,
              color: remaining <= 3 ? "#ff4d4d" : accent,
            }}>
              {remaining > 0 ? `${remaining} grátis` : "⚠️ Limite"}
            </div>
            <button onClick={handleLogout} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.4)", borderRadius: 10, padding: "5px 12px",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>Sair</button>
          </div>
        </div>

        {/* Upgrade banner when low */}
        {remaining <= 3 && remaining > 0 && (
          <div style={{
            background: "#ff4d4d18", border: "1px solid #ff4d4d44",
            borderRadius: 12, padding: "10px 14px", marginBottom: "1rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: "#ff9999" }}>⚠️ Só tens {remaining} gerações grátis restantes!</span>
            <button onClick={() => setShowPaywall(true)} style={{
              background: accent, border: "none", borderRadius: 8,
              color: "#000", fontSize: 12, fontWeight: 700, padding: "5px 12px",
              cursor: "pointer", fontFamily: "inherit",
            }}>Assinar</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, background: "rgba(255,255,255,0.05)",
          borderRadius: 14, padding: 4, marginBottom: "1.5rem",
        }}>
          {[["musica", "🎵 Criar Música"], ["personagem", "🎭 Criar Personagem"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
              background: tab === key ? accent : "transparent",
              color: tab === key ? "#000" : "rgba(255,255,255,0.5)",
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 1.5rem 4rem" }}>

        {/* MUSIC TAB */}
        {tab === "musica" && (
          <div className="fade-up">
            <Section title="Gênero" accent={accent}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {GENRES.map(g => <Tag key={g} label={g} selected={genre === g} onClick={() => setGenre(g)} color={accent} />)}
              </div>
            </Section>
            <Section title="Mood" accent={accent}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MOODS.map(m => <Tag key={m} label={m} selected={mood === m} onClick={() => setMood(m)} color={accent} />)}
              </div>
            </Section>
            <Section title="Instrumentos (opcional)" accent={accent}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {INSTRUMENTS.map(inst => <Tag key={inst} label={inst} selected={selectedInstruments.includes(inst)} onClick={() => toggleInstrument(inst)} color={accent} />)}
              </div>
            </Section>
            <Section title="Tema (opcional)" accent={accent}>
              <textarea value={musicTheme} onChange={e => setMusicTheme(e.target.value)}
                placeholder="Ex: saudade, amor de verão, autoconfiança..." rows={3}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
            </Section>
            <button onClick={generateMusic} disabled={!genre || !mood || musicLoading} style={{
              width: "100%", padding: "15px",
              background: (!genre || !mood) ? "rgba(255,255,255,0.08)" : accent,
              border: "none", borderRadius: 14,
              color: (!genre || !mood) ? "rgba(255,255,255,0.3)" : "#000",
              fontSize: 15, fontWeight: 800, cursor: (!genre || !mood) ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginBottom: "1.5rem", transition: "all 0.2s",
            }}>
              {musicLoading ? "A compor..." : remaining === 0 ? "🔒 Assinar para gerar" : "✨ Gerar Música"}
            </button>
            {musicLoading && <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>}
            {musicResult && !musicLoading && (
              <div className="fade-up">
                {musicResult.erro ? <p style={{ color: "#ff6b6b" }}>{musicResult.erro}</p> : (
                  <>
                    <div style={{ background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 16, padding: "1.2rem 1.5rem", marginBottom: "1rem" }}>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{musicResult.titulo}</div>
                      <div style={{ color: accent, fontSize: 14, fontWeight: 600, marginTop: 4 }}>{musicResult.artista_sugerido}</div>
                      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{musicResult.descricao}</div>
                    </div>
                    <ResultCard title="🎤 Letra" content={musicResult.letra} accent={accent} />
                    <ResultCard title="🎛️ Produção" content={musicResult.producao} accent={accent} />
                    <ResultCard title="📱 Hashtags" content={musicResult.hashtags} accent={accent} />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CHARACTER TAB */}
        {tab === "personagem" && (
          <div className="fade-up">
            <Section title="Estilo Musical" accent={accent}>
              <input value={charStyle} onChange={e => setCharStyle(e.target.value)}
                placeholder="Ex: trap melódico, indie folk, pagode..." style={inputStyle} />
            </Section>
            <Section title="Personalidade" accent={accent}>
              <input value={charPersonality} onChange={e => setCharPersonality(e.target.value)}
                placeholder="Ex: rebelde, alegre, misterioso..." style={inputStyle} />
            </Section>
            <Section title="Background (opcional)" accent={accent}>
              <textarea value={charBackground} onChange={e => setCharBackground(e.target.value)}
                placeholder="Ex: cresceu em Lisboa, filha de músicos..." rows={3}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
            </Section>
            <button onClick={generateCharacter} disabled={!charStyle || !charPersonality || charLoading} style={{
              width: "100%", padding: "15px",
              background: (!charStyle || !charPersonality) ? "rgba(255,255,255,0.08)" : accent,
              border: "none", borderRadius: 14,
              color: (!charStyle || !charPersonality) ? "rgba(255,255,255,0.3)" : "#000",
              fontSize: 15, fontWeight: 800, cursor: (!charStyle || !charPersonality) ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginBottom: "1.5rem", transition: "all 0.2s",
            }}>
              {charLoading ? "A criar..." : remaining === 0 ? "🔒 Assinar para gerar" : "🎭 Gerar Personagem"}
            </button>
            {charLoading && <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>}
            {charResult && !charLoading && (
              <div className="fade-up">
                {charResult.erro ? <p style={{ color: "#ff6b6b" }}>{charResult.erro}</p> : (
                  <>
                    <div style={{ background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 16, padding: "1.2rem 1.5rem", marginBottom: "1rem" }}>
                      <div style={{ fontSize: 26, fontWeight: 800 }}>{charResult.nome_artistico}</div>
                      <div style={{ color: accent, fontSize: 13, fontWeight: 600, marginTop: 4 }}>{charResult.idade} anos · {charResult.origem}</div>
                      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 8, lineHeight: 1.6, fontStyle: "italic" }}>"{charResult.frase_iconica}"</div>
                    </div>
                    <ResultCard title="📖 Biografia" content={charResult.bio} accent={accent} />
                    <ResultCard title="👁️ Visual" content={charResult.visual} accent={accent} />
                    <ResultCard title="🎸 Influências" content={charResult.influencias} accent={accent} />
                    <ResultCard title="🏆 Primeiro Hit" content={charResult.primeiro_hit} accent={accent} />
                    <ResultCard title="📲 Redes Sociais" content={charResult.redes_sociais} accent={accent} />
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
