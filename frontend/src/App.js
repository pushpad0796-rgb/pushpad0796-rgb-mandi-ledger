import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import AddBusiness from "./pages/AddBusiness";
import AllBusiness from "./pages/AllBusiness";
import ManageBusiness from "./pages/ManageBusiness";
import Login from "./pages/Login";
import "bootstrap/dist/css/bootstrap.min.css";

function Navbar({ onLogout }) {
  const loc = useLocation();
  const isManage = loc.pathname.startsWith("/manage");

  return (
    <nav style={navStyles.nav}>
      <span style={navStyles.brand}>🌾 Mandi Ledger</span>
      {!isManage && (
        <div style={navStyles.links}>
          <Link to="/" style={{ ...navStyles.link, ...(loc.pathname === "/" ? navStyles.activeLink : {}) }}>
            + Add Business
          </Link>
          <Link to="/all" style={{ ...navStyles.link, ...(loc.pathname === "/all" ? navStyles.activeLink : {}) }}>
            All Business
          </Link>
        </div>
      )}
      <button style={navStyles.logoutBtn} onClick={onLogout}>
        🚪 Logout
      </button>
    </nav>
  );
}

const navStyles = {
  nav: {
    background: "#b71c1c",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    height: 56,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    gap: 12,
  },
  brand: { color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: -0.5, marginRight: "auto" },
  links: { display: "flex", gap: 4 },
  link: {
    color: "rgba(255,255,255,0.75)", textDecoration: "none",
    fontWeight: 500, fontSize: 14, padding: "6px 14px", borderRadius: 8,
  },
  activeLink: { color: "#fff", fontWeight: 700, background: "rgba(255,255,255,0.2)" },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff", borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
  },
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("mandi_auth") === "true") setIsLoggedIn(true);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("mandi_auth");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#f5f6fa" }}>
        <Navbar onLogout={handleLogout} />
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 16px" }}>
          <Routes>
            <Route path="/" element={<AddBusiness />} />
            <Route path="/all" element={<AllBusiness />} />
            <Route path="/manage/:id/:name" element={<ManageBusiness />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;