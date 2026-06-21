import { useState } from "react";

const CORRECT_USER = "mandiappsrg";
const CORRECT_PASS = "R@hul1225";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

    

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (username === CORRECT_USER && password === CORRECT_PASS) {
        localStorage.setItem("mandi_auth", "true");
        onLogin();
      } else {
        setError("Username ya Password galat hai");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🌾</div>
          <h1 style={styles.logoText}>Mandi Ledger</h1>
          <p style={styles.logoSub}>Sarangpur Sabji Mandi</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Username daalo"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              autoComplete="username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...styles.input, paddingRight: 44 }}
                type={showPass ? "text" : "password"}
                placeholder="Password daalo"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>⚠ {error}</div>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "⏳ Login ho raha hai..." : "Login Karo →"}
          </button>
        </form>

        <p style={styles.footer}>© 2025 Mandi Ledger · Rahul</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #7f0000 0%, #b71c1c 40%, #e53935 100%)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  card: {
    background: "#fff", borderRadius: 24, padding: "36px 32px 24px",
    width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoWrap: { textAlign: "center", marginBottom: 28 },
  logoIcon: { fontSize: 48, lineHeight: 1, marginBottom: 8 },
  logoText: { margin: 0, fontSize: 26, fontWeight: 900, color: "#b71c1c", letterSpacing: -0.5 },
  logoSub: { margin: "4px 0 0", fontSize: 13, color: "#888" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: "#444" },
  input: {
    border: "1.5px solid #e0e0e0", borderRadius: 10,
    padding: "11px 14px", fontSize: 15, outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4,
  },
  error: {
    background: "#ffebee", color: "#c62828", borderRadius: 8,
    padding: "10px 14px", fontSize: 13, fontWeight: 600, textAlign: "center",
  },
  btn: {
    background: "#b71c1c", color: "#fff", border: "none", borderRadius: 12,
    padding: "13px", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 4,
  },
  footer: { textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 20, marginBottom: 0 },
};

export default Login;