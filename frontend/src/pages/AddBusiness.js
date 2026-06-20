import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://mandihisaab.com/api";

function AddBusiness() {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !owner) { alert("Dono fields zaroori hain"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/add-business`, { name, owner });
      alert(`"${name}" business add ho gaya!`);
      setName(""); setOwner("");
      navigate("/all");
    } catch (err) {
      alert("Business add nahi hua, dobara try karo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>🏪</div>
        <h3 style={styles.title}>Add New Business</h3>
        <p style={styles.sub}></p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Business Name *</label>
            <input
              className="form-control"
              placeholder=""
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Owner Name *</label>
            <input
              className="form-control"
              placeholder=""
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "⏳ Saving..." : "✓ Add Business"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", justifyContent: "center", padding: "30px 12px" },
  card: {
    background: "#fff", borderRadius: 18, border: "1px solid #e0e0e0",
    padding: "32px 28px", width: "100%", maxWidth: 420,
    textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  icon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 800, color: "#1a237e", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#888", marginBottom: 24 },
  field: { marginBottom: 14, textAlign: "left" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 },
  btn: {
    width: "100%", background: "#1565c0", color: "#fff", border: "none",
    borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 15,
    cursor: "pointer", marginTop: 8,
  },
};

export default AddBusiness;