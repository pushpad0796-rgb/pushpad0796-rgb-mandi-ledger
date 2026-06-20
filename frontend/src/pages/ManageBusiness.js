import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import TransactionHistory from "./TransactionHistory";

const API = "https://mandihisaab.com/api";

function ManageBusiness() {
  const { id, name: businessName } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");
  const [kalam, setKalam] = useState("0");
  const todayDB = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayDB);

  const [list, setList] = useState([]);
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState(null);
  const [transType, setTransType] = useState("");
  const [credits, setCredits] = useState({}); // total credit (display ke liye)
  const [jamaAfterReset, setJamaAfterReset] = useState({}); // msg ke liye
  const [search, setSearch] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [historyClient, setHistoryClient] = useState(null);
  const [msgLoading, setMsgLoading] = useState(null);

  const [kalamSelected, setKalamSelected] = useState(null);
  const [kalamType, setKalamType] = useState("");
  const [kalamAmount, setKalamAmount] = useState("");
  const [savingKalam, setSavingKalam] = useState(false);
  const [lastKalam, setLastKalam] = useState({});

  const getClients = async () => {
    try {
      const res = await axios.get(`${API}/clients/${id}`);
      setList(res.data);
      res.data.forEach((c) => {
        getBalance(c.id);
        getJamaAfterReset(c.id);
        getLastKalam(c.id);
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getClients();
  }, []);

  const getBalance = async (cid) => {
    try {
      const res = await axios.get(`${API}/balance/${cid}`);
      setCredits((p) => ({ ...p, [cid]: parseFloat(res.data.credit) || 0 }));
    } catch (e) {
      console.error(e);
    }
  };

  const getJamaAfterReset = async (cid) => {
    try {
      const res = await axios.get(`${API}/jama-after-reset/${cid}`);
      setJamaAfterReset((p) => ({
        ...p,
        [cid]: parseFloat(res.data.jama) || 0,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const getLastKalam = async (cid) => {
    try {
      const res = await axios.get(`${API}/kalam-latest/${cid}`);
      setLastKalam((p) => ({ ...p, [cid]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  const addTransaction = async (cid) => {
    if (!amount || amount <= 0 || !transType) {
      alert("Amount daalo aur जमा ya उधार select karo");
      return;
    }
    setSavingTx(true);
    try {
      await axios.post(`${API}/add-transaction`, {
        client_id: cid,
        type: transType,
        amount: Number(amount),
        date,
      });
      setAmount("");
      setSelected(null);
      setTransType("");
      await getBalance(cid);
      await getJamaAfterReset(cid);
    } catch (e) {
      alert("Transaction save nahi hua");
    } finally {
      setSavingTx(false);
    }
  };

  const updateKalam = async (cid) => {
    if (!kalamAmount || kalamAmount <= 0) {
      alert("Amount daalo");
      return;
    }
    setSavingKalam(true);
    try {
      await axios.post(`${API}/update-kalam`, {
        client_id: cid,
        type: kalamType,
        amount: Number(kalamAmount),
        date: todayDB,
      });
      setKalamSelected(null);
      setKalamAmount("");
      setKalamType("");
      await getClients();
    } catch (e) {
      alert("Kalam update nahi hua");
    } finally {
      setSavingKalam(false);
    }
  };

  const addClient = async (e) => {
    e.preventDefault();
    if (!name || !number) {
      alert("Naam aur Number zaroori hai");
      return;
    }
    try {
      await axios.post(`${API}/add-client`, {
        business_id: id,
        name,
        number,
        address,
        created_at: date,
        kalam: parseFloat(kalam) || 0,
      });
      setName("");
      setNumber("");
      setAddress("");
      setKalam("0");
      setDate(todayDB);
      setAddFormOpen(false);
      await getClients();
    } catch (e) {
      alert("Client add nahi hua");
    }
  };

  const deleteClient = async (cid, cname) => {
    if (!window.confirm(`"${cname}" ko delete karna hai?`)) return;
    try {
      await axios.delete(`${API}/delete-client/${cid}`);
      await getClients();
    } catch (e) {
      alert("Delete nahi hua");
    }
  };

  const sendMsg = async (c) => {
    const totalKalam = parseFloat(c.kalam) || 0;
    const totalCredit = credits[c.id] || 0;
    const jamaForMsg = jamaAfterReset[c.id] || 0; // reset ke baad ka jama
    const shesh = totalKalam - totalCredit;
    const lk = lastKalam[c.id];
    const latestKalamAmt = lk ? parseFloat(lk.amount) || 0 : 0;
    const today = new Date().toLocaleDateString("en-IN");

    const v1 = c.name;
    const v2 = latestKalamAmt.toLocaleString("en-IN");
    const v3 = jamaForMsg.toLocaleString("en-IN"); // reset ke baad ka jama — 0 agar nahi hua
    const v4 = shesh.toLocaleString("en-IN");
    const v5 = decodeURIComponent(businessName);
    const v6 = today;

    setMsgLoading(c.id);
    try {
      const res = await axios.post(`${API}/send-message`, {
        number: c.number,
        v1,
        v2,
        v3,
        v4,
        v5,
        v6,
        client_id: c.id, // reset ke liye
      });
      if (res.data.success) {
        alert(`✅ WhatsApp message bhej diya!\n${c.name} (${c.number})`);
        // jama reset ho gaya — refresh karo
        await getJamaAfterReset(c.id);
      } else {
        alert("❌ Message nahi gaya: " + (res.data.error || "Unknown error"));
      }
    } catch (e) {
      alert("❌ Error: " + (e.response?.data?.error || e.message));
    } finally {
      setMsgLoading(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`;
  };

  const filtered = list.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 12px 40px" }}>
      <div style={styles.pageHeader}>
        <button onClick={() => navigate("/all")} style={styles.backBtn}>
          ← Wapas
        </button>
        <div>
          <h2 style={styles.bizName}>{decodeURIComponent(businessName)}</h2>
          <span style={styles.bizSub}>Client Ledger</span>
        </div>
        <button
          style={styles.addClientBtn}
          onClick={() => setAddFormOpen(!addFormOpen)}
        >
          {addFormOpen ? "✕ Band Karo" : "+ Client Add Karo"}
        </button>
      </div>

      {addFormOpen && (
        <div style={styles.formCard}>
          <h5 style={styles.formTitle}>Naya Client Add Karo</h5>
          <form onSubmit={addClient}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Naam *</label>
                <input
                  className="form-control"
                  placeholder="Client ka naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mobile Number *</label>
                <input
                  className="form-control"
                  placeholder="10 digit number"
                  value={number}
                  maxLength={10}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>पिछला बकाया (कलम) *</label>
                <input
                  className="form-control"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={kalam}
                  onChange={(e) => setKalam(e.target.value)}
                />
                <small style={{ color: "#888", fontSize: 11 }}>
                  0 agar naya client hai
                </small>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pata (Address)</label>
                <input
                  className="form-control"
                  placeholder="Ghar ka pata"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tarikh</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>
              ✓ Client Save Karo
            </button>
          </form>
        </div>
      )}

      <div style={styles.searchBar}>
        <span>🔍</span>
        <input
          style={styles.searchInput}
          placeholder="Client ka naam search karo..."
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: "#888" }}>
          {filtered.length} client
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Koi client nahi mila</p>
          {list.length === 0 && (
            <small>Upar "+ Client Add Karo" se pehla client add karo</small>
          )}
        </div>
      ) : (
        <div style={styles.clientGrid}>
          {filtered.map((c) => {
            const totalKalam = parseFloat(c.kalam) || 0;
            const totalCredit = credits[c.id] || 0;
            const jamaDisplay = jamaAfterReset[c.id] || 0;
            const shesh = totalKalam - totalCredit;
            const isActive = selected === c.id;
            const isKalamActive = kalamSelected === c.id;

            return (
              <div
                key={c.id}
                style={{
                  ...styles.clientCard,
                  ...(isActive || isKalamActive ? styles.clientCardActive : {}),
                }}
              >
                <div style={styles.clientCardHeader}>
                  <div style={styles.avatar}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.clientInfo}>
                    <strong style={styles.clientName}>{c.name}</strong>
                    <span style={styles.clientPhone}>📞 {c.number}</span>
                    {c.address && (
                      <span style={styles.clientAddr}>📍 {c.address}</span>
                    )}
                    <span style={styles.clientDate}>
                      📅 {formatDate(c.created_at)}
                    </span>
                  </div>
                </div>

                {/* कलम */}
                <div style={styles.kalamSection}>
                  <div style={styles.kalamHeader}>
                    <div>
                      <span style={styles.kalamLabel}>कलम (कुल बकाया)</span>
                      <span style={styles.kalamAmt}>
                        ₹{totalKalam.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div style={styles.kalamBtns}>
                      <button
                        style={styles.kalamAddBtn}
                        onClick={() => {
                          setKalamSelected(c.id);
                          setKalamType("add");
                          setKalamAmount("");
                          setSelected(null);
                        }}
                      >
                        + कलम
                      </button>
                      <button
                        style={styles.kalamMinusBtn}
                        onClick={() => {
                          setKalamSelected(c.id);
                          setKalamType("minus");
                          setKalamAmount("");
                          setSelected(null);
                        }}
                      >
                        - कलम
                      </button>
                    </div>
                  </div>

                  {isKalamActive && (
                    <div style={styles.kalamInputBox}>
                      <div style={styles.txTypeLabel}>
                        {kalamType === "add"
                          ? "➕ कलम में जोड़ो"
                          : "➖ कलम से घटाओ"}
                      </div>
                      <div style={styles.txRow}>
                        <span style={styles.rupeeSign}>₹</span>
                        <input
                          style={styles.amtInput}
                          type="number"
                          min="1"
                          placeholder="0"
                          value={kalamAmount}
                          onChange={(e) => setKalamAmount(e.target.value)}
                          autoFocus
                        />
                        <button
                          style={styles.saveBtn}
                          onClick={() => updateKalam(c.id)}
                          disabled={savingKalam}
                        >
                          {savingKalam ? "..." : "Save"}
                        </button>
                        <button
                          style={styles.cancelBtn}
                          onClick={() => {
                            setKalamSelected(null);
                            setKalamAmount("");
                            setKalamType("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* शेष */}
                <div
                  style={{
                    ...styles.sheshBox,
                    background:
                      shesh > 0 ? "#fff3e0" : shesh < 0 ? "#e8f5e9" : "#f5f5f5",
                    borderColor:
                      shesh > 0 ? "#ffb74d" : shesh < 0 ? "#81c784" : "#ddd",
                  }}
                >
                  <span style={styles.sheshLabel}>शेष (बकाया)</span>
                  <span
                    style={{
                      ...styles.sheshAmt,
                      color:
                        shesh > 0 ? "#e65100" : shesh < 0 ? "#2e7d32" : "#555",
                    }}
                  >
                    ₹{Math.abs(shesh).toLocaleString("en-IN")}
                    <span style={{ fontSize: 11, marginLeft: 4 }}>
                      {shesh > 0 ? "(देना है)" : shesh < 0 ? "(लेना है)" : ""}
                    </span>
                  </span>
                </div>

                {/* जमा — 2 sections */}
                <div style={styles.balRow}>
                  <div style={styles.balBox}>
                    <span style={styles.balLabel}>जमा (नया)</span>
                    <span style={styles.balCredit}>
                      +₹{jamaDisplay.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div style={styles.balBox}>
                    <span style={styles.balLabel}>कुल जमा</span>
                    <span style={styles.balCredit}>
                      +₹{totalCredit.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Transaction Input */}
                {isActive && (
                  <div style={styles.txBox}>
                    <div style={styles.txTypeLabel}>
                      {transType === "credit"
                        ? "💚 जमा Amount Daalo"
                        : "🔴 उधार Amount Daalo"}
                    </div>
                    <div style={styles.txRow}>
                      <span style={styles.rupeeSign}>₹</span>
                      <input
                        style={styles.amtInput}
                        type="number"
                        min="1"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                      />
                      <button
                        style={styles.saveBtn}
                        onClick={() => addTransaction(c.id)}
                        disabled={savingTx}
                      >
                        {savingTx ? "..." : "Save"}
                      </button>
                      <button
                        style={styles.cancelBtn}
                        onClick={() => {
                          setSelected(null);
                          setAmount("");
                          setTransType("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div style={styles.actionRow}>
                  <button
                    style={styles.creditBtn}
                    onClick={() => {
                      setSelected(c.id);
                      setTransType("credit");
                      setAmount("");
                      setKalamSelected(null);
                    }}
                  >
                    + जमा
                  </button>
                  <button
                    style={styles.debitBtn}
                    onClick={() => {
                      setSelected(c.id);
                      setTransType("debit");
                      setAmount("");
                      setKalamSelected(null);
                    }}
                  >
                    - उधार
                  </button>
                  <button
                    style={styles.historyBtn}
                    onClick={() => setHistoryClient(c)}
                  >
                    📋 History
                  </button>
                  <button
                    style={{
                      ...styles.waBtn,
                      opacity: msgLoading === c.id ? 0.6 : 1,
                    }}
                    onClick={() => sendMsg(c)}
                    disabled={msgLoading === c.id}
                  >
                    {msgLoading === c.id ? "⏳" : "📲 MSG"}
                  </button>
                  <button
                    style={styles.delBtn}
                    onClick={() => deleteClient(c.id, c.name)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historyClient && (
        <TransactionHistory
          client={historyClient}
          businessName={decodeURIComponent(businessName)}
          onClose={() => setHistoryClient(null)}
        />
      )}
    </div>
  );
}

const styles = {
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 0 16px",
    borderBottom: "2px solid #e53935",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  backBtn: {
    background: "none",
    border: "1px solid #999",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 14,
    color: "#555",
  },
  bizName: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "#b71c1c",
    letterSpacing: -0.5,
  },
  bizSub: { fontSize: 12, color: "#888", display: "block" },
  addClientBtn: {
    marginLeft: "auto",
    background: "#1565c0",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  formCard: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e0e0e0",
    padding: "20px 24px",
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a237e",
    marginBottom: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "#555" },
  submitBtn: {
    background: "#43a047",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 24px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 12,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: "8px 16px",
    marginBottom: 20,
    gap: 10,
  },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 14 },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#999" },
  clientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  clientCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e8e8e8",
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  clientCardActive: {
    border: "1.5px solid #1565c0",
    boxShadow: "0 4px 16px rgba(21,101,192,0.12)",
  },
  clientCardHeader: { display: "flex", gap: 12, marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#1565c0",
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  clientInfo: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  clientName: { fontSize: 16, color: "#1a237e", lineHeight: 1.2 },
  clientPhone: { fontSize: 12, color: "#555" },
  clientAddr: { fontSize: 11, color: "#888" },
  clientDate: { fontSize: 11, color: "#aaa" },
  kalamSection: {
    background: "#fafafa",
    border: "1.5px solid #e0e0e0",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 10,
  },
  kalamHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kalamLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#777",
    marginBottom: 2,
  },
  kalamAmt: { display: "block", fontSize: 16, fontWeight: 900, color: "#333" },
  kalamBtns: { display: "flex", gap: 6 },
  kalamAddBtn: {
    background: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #a5d6a7",
    borderRadius: 7,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  kalamMinusBtn: {
    background: "#fce4ec",
    color: "#c62828",
    border: "1px solid #ef9a9a",
    borderRadius: 7,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  kalamInputBox: {
    marginTop: 10,
    background: "#f0f4ff",
    borderRadius: 8,
    padding: "8px 10px",
  },
  sheshBox: {
    borderRadius: 10,
    border: "1.5px solid",
    padding: "8px 12px",
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheshLabel: { fontSize: 11, fontWeight: 700, color: "#666" },
  sheshAmt: { fontSize: 18, fontWeight: 900 },
  jamaBox: {
    background: "#e8f5e9",
    borderRadius: 10,
    padding: "8px 12px",
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jamaLabel: { fontSize: 11, fontWeight: 700, color: "#2e7d32" },
  jamaAmt: { fontSize: 15, fontWeight: 800, color: "#2e7d32" },
  txBox: {
    background: "#f0f4ff",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 10,
  },
  txTypeLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#333",
    marginBottom: 8,
  },
  txRow: { display: "flex", alignItems: "center", gap: 8 },
  rupeeSign: { fontSize: 18, fontWeight: 700, color: "#444" },
  amtInput: {
    flex: 1,
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 16,
    outline: "none",
  },
  saveBtn: {
    background: "#43a047",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  cancelBtn: {
    background: "#eee",
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 14,
  },
  actionRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  creditBtn: {
    flex: 1,
    background: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #a5d6a7",
    borderRadius: 8,
    padding: "7px 0",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    minWidth: 55,
  },
  debitBtn: {
    flex: 1,
    background: "#fce4ec",
    color: "#c62828",
    border: "1px solid #ef9a9a",
    borderRadius: 8,
    padding: "7px 0",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    minWidth: 55,
  },
  historyBtn: {
    flex: 1,
    background: "#e8eaf6",
    color: "#3949ab",
    border: "1px solid #9fa8da",
    borderRadius: 8,
    padding: "7px 0",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    minWidth: 65,
  },
  waBtn: {
    flex: 1,
    background: "#e8f5e9",
    color: "#1b5e20",
    border: "1px solid #66bb6a",
    borderRadius: 8,
    padding: "7px 0",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    minWidth: 55,
  },
  delBtn: {
    background: "#ffebee",
    color: "#c62828",
    border: "1px solid #ef9a9a",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 14,
  },
};

export default ManageBusiness;
