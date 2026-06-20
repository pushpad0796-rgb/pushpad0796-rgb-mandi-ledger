import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://mandihisaab.com/api";

function AllBusiness() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/businesses`);
      setList(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getData(); }, []);

  const deleteBusiness = async (id, name) => {
    if (!window.confirm(`"${name}" business delete karna chahte hain?`)) return;
    try {
      await axios.delete(`${API}/delete-business/${id}`);
      getData();
    } catch (e) { alert("Delete nahi hua"); }
  };

  const filtered = list.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Sab Businesses</h2>
          <span style={styles.sub}>{list.length} businesses registered</span>
        </div>
        <button style={styles.addBtn} onClick={() => navigate("/")}>
          + New Business
        </button>
      </div>

      <div style={styles.searchWrap}>
        <span>🔍</span>
        <input
          style={styles.searchInp}
          placeholder="Business ya owner ka naam search karo..."
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: "#888" }}>{filtered.length}</span>
      </div>

      {loading ? (
        <div style={styles.center}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.center}>
          {list.length === 0 ? "Koi business nahi hai. Pehla business add karo!" : "Koi result nahi mila"}
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((b) => (
            <div key={b.id} style={styles.card}>
              <div style={styles.cardLeft}>
                <div style={styles.avatar}>{b.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={styles.bizName}>{b.name}</div>
                  <div style={styles.bizOwner}>👤 {b.owner}</div>
                </div>
              </div>
              <div style={styles.cardBtns}>
                <button
                  style={styles.manageBtn}
                  onClick={() => navigate(`/manage/${b.id}/${encodeURIComponent(b.name)}`)}
                >
                  ⚙ Manage
                </button>
                <button style={styles.delBtn} onClick={() => deleteBusiness(b.id, b.name)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 900, margin: "0 auto", padding: "0 12px 40px" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 0 16px", borderBottom: "2px solid #e53935",
    marginBottom: 20, flexWrap: "wrap", gap: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#b71c1c" },
  sub: { fontSize: 12, color: "#888" },
  addBtn: {
    background: "#1565c0", color: "#fff", border: "none", borderRadius: 10,
    padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  searchWrap: {
    display: "flex", alignItems: "center", background: "#fff",
    border: "1px solid #ddd", borderRadius: 12,
    padding: "8px 16px", marginBottom: 20, gap: 10,
  },
  searchInp: { border: "none", outline: "none", flex: 1, fontSize: 14 },
  center: { textAlign: "center", padding: 40, color: "#999", fontSize: 14 },
  grid: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "#fff", borderRadius: 14, border: "1px solid #eee",
    padding: "14px 18px", display: "flex", alignItems: "center",
    justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    flexWrap: "wrap", gap: 12,
  },
  cardLeft: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 46, height: 46, borderRadius: "50%", background: "#b71c1c",
    color: "#fff", fontSize: 22, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  bizName: { fontSize: 16, fontWeight: 700, color: "#1a237e" },
  bizOwner: { fontSize: 13, color: "#666", marginTop: 2 },
  cardBtns: { display: "flex", gap: 8 },
  manageBtn: {
    background: "#1565c0", color: "#fff", border: "none", borderRadius: 9,
    padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13,
  },
  delBtn: {
    background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a",
    borderRadius: 9, padding: "8px 12px", cursor: "pointer", fontSize: 14,
  },
};

export default AllBusiness;