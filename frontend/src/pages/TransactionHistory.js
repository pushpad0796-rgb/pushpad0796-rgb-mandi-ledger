import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://mandihisaab.com/api";

function TransactionHistory({ client, businessName, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [kalamHistory, setKalamHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" | "kalam"

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [txRes, klRes] = await Promise.all([
        axios.get(`${API}/transactions/${client.id}`),
        axios.get(`${API}/kalam-history/${client.id}`),
      ]);
      setTransactions(txRes.data);
      setKalamHistory(klRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,"0")}-${String(dt.getMonth()+1).padStart(2,"0")}-${dt.getFullYear()}`;
  };

  const months = [...new Set(
    transactions.map(t => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    })
  )].sort().reverse();

  const filteredTx = filterMonth
    ? transactions.filter(t => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` === filterMonth;
      })
    : transactions;

  const totalCredit = filteredTx.filter(t => t.type === "credit").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalDebit = filteredTx.filter(t => t.type === "debit").reduce((s, t) => s + parseFloat(t.amount), 0);

  // Kalam history totals
  const totalKalamAdd = kalamHistory.filter(k => k.type === "add").reduce((s, k) => s + parseFloat(k.amount), 0);
  const totalKalamMinus = kalamHistory.filter(k => k.type === "minus").reduce((s, k) => s + parseFloat(k.amount), 0);

  const printPDF = () => {
    const txRows = filteredTx.map((t, i) => `
      <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i+1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${formatDate(t.date)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          <span style="background:${t.type==="credit"?"#e8f5e9":"#ffebee"};color:${t.type==="credit"?"#2e7d32":"#c62828"};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">
            ${t.type==="credit"?"जमा":"उधार"}
          </span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${t.type==="credit"?"#2e7d32":"#c62828"};">
          ${t.type==="credit"?"+":"-"}₹${parseFloat(t.amount).toLocaleString("en-IN")}
        </td>
      </tr>
    `).join("");

    const klRows = kalamHistory.map((k, i) => `
      <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i+1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${formatDate(k.date)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          <span style="background:${k.type==="add"?"#fff3e0":"#e8f5e9"};color:${k.type==="add"?"#e65100":"#2e7d32"};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">
            ${k.type==="add"?"+ जोड़ा":"- घटाया"}
          </span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">
          ₹${parseFloat(k.amount).toLocaleString("en-IN")}
        </td>
      </tr>
    `).join("");

    const win = window.open("", "_blank");
    win.document.write(`
      <html><head>
        <title>${businessName} - ${client.name} - Hisaab</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box;}
          body{font-family:Arial,sans-serif;padding:24px;color:#222;}
          .header{border-bottom:2px solid #b71c1c;padding-bottom:16px;margin-bottom:20px;}
          .biz{font-size:22px;font-weight:900;color:#b71c1c;}
          .sub{font-size:13px;color:#666;margin-top:4px;}
          table{width:100%;border-collapse:collapse;margin-top:8px;}
          th{background:#b71c1c;color:#fff;padding:10px 12px;text-align:left;font-size:13px;}
          th:last-child{text-align:right;}
          h3{margin:24px 0 8px;color:#333;}
          .summary{margin-top:16px;display:flex;gap:12px;}
          .sum-box{flex:1;padding:10px;border-radius:8px;text-align:center;}
          @media print{body{padding:12px;}}
        </style>
      </head><body>
        <div class="header">
          <div class="biz">🌾 ${businessName}</div>
          <div class="sub">Client: <strong>${client.name}</strong> | 📞 ${client.number}${client.address?" | 📍 "+client.address:""} | Print: ${formatDate(new Date().toISOString())}</div>
        </div>

        <h3>📋 Transaction History</h3>
        <table>
          <thead><tr><th>#</th><th>Tarikh</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${txRows}</tbody>
        </table>
        <div class="summary">
          <div class="sum-box" style="background:#e8f5e9"><div style="font-size:11px;color:#888">कुल जमा</div><div style="font-size:18px;font-weight:900;color:#2e7d32">+₹${totalCredit.toLocaleString("en-IN")}</div></div>
          <div class="sum-box" style="background:#ffebee"><div style="font-size:11px;color:#888">कुल उधार</div><div style="font-size:18px;font-weight:900;color:#c62828">-₹${totalDebit.toLocaleString("en-IN")}</div></div>
        </div>

        <h3>📊 कलम History</h3>
        <table>
          <thead><tr><th>#</th><th>Tarikh</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${klRows}</tbody>
        </table>
        <div class="summary">
          <div class="sum-box" style="background:#fff3e0"><div style="font-size:11px;color:#888">कुल जोड़ा</div><div style="font-size:18px;font-weight:900;color:#e65100">+₹${totalKalamAdd.toLocaleString("en-IN")}</div></div>
          <div class="sum-box" style="background:#e8f5e9"><div style="font-size:11px;color:#888">कुल घटाया</div><div style="font-size:18px;font-weight:900;color:#2e7d32">-₹${totalKalamMinus.toLocaleString("en-IN")}</div></div>
        </div>
        <p style="margin-top:24px;font-size:11px;color:#aaa;text-align:center;">Mandi Ledger software se nikala gaya</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>

        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>{client.name} — History</div>
            <div style={styles.modalSub}>📞 {client.number}{client.address ? ` · 📍 ${client.address}` : ""}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === "transactions" ? styles.tabActive : {}) }}
            onClick={() => setActiveTab("transactions")}
          >
            📋 जमा / उधार
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "kalam" ? styles.tabActive : {}) }}
            onClick={() => setActiveTab("kalam")}
          >
            📊 कलम History
          </button>
        </div>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          {activeTab === "transactions" && (
            <select style={styles.monthSelect} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="">📅 Sab Mahine</option>
              {months.map(m => {
                const [yr, mo] = m.split("-");
                const mName = new Date(yr, mo-1).toLocaleString("hi-IN", { month: "long" });
                return <option key={m} value={m}>{mName} {yr}</option>;
              })}
            </select>
          )}
          <button style={styles.printBtn} onClick={printPDF}>🖨 PDF / Print</button>
        </div>

        {/* Summary */}
        {activeTab === "transactions" && (
          <div style={styles.summaryRow}>
            <div style={styles.sumBox}>
              <span style={styles.sumLabel}>कुल जमा</span>
              <span style={styles.sumCredit}>+₹{totalCredit.toLocaleString("en-IN")}</span>
            </div>
            <div style={styles.sumBox}>
              <span style={styles.sumLabel}>कुल उधार</span>
              <span style={styles.sumDebit}>-₹{totalDebit.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {activeTab === "kalam" && (
          <div style={styles.summaryRow}>
            <div style={styles.sumBox}>
              <span style={styles.sumLabel}>कुल जोड़ा</span>
              <span style={{ ...styles.sumCredit, color: "#e65100" }}>+₹{totalKalamAdd.toLocaleString("en-IN")}</span>
            </div>
            <div style={styles.sumBox}>
              <span style={styles.sumLabel}>कुल घटाया</span>
              <span style={styles.sumDebit}>-₹{totalKalamMinus.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={styles.tableWrap}>
          {loading ? (
            <div style={styles.center}>Loading...</div>
          ) : activeTab === "transactions" ? (
            filteredTx.length === 0 ? (
              <div style={styles.center}>Koi transaction nahi</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Tarikh</th>
                    <th style={styles.th}>Type</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((t, i) => (
                    <tr key={t.id} style={{ background: i%2===0?"#fff":"#fafafa" }}>
                      <td style={styles.td}>{i+1}</td>
                      <td style={styles.td}>{formatDate(t.date)}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: t.type==="credit"?"#e8f5e9":"#ffebee",
                          color: t.type==="credit"?"#2e7d32":"#c62828",
                          padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                        }}>
                          {t.type==="credit"?"जमा":"उधार"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign:"right", fontWeight:700, color: t.type==="credit"?"#2e7d32":"#c62828" }}>
                        {t.type==="credit"?"+":"-"}₹{parseFloat(t.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            kalamHistory.length === 0 ? (
              <div style={styles.center}>Koi kalam entry nahi</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Tarikh</th>
                    <th style={styles.th}>Type</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {kalamHistory.map((k, i) => (
                    <tr key={k.id} style={{ background: i%2===0?"#fff":"#fafafa" }}>
                      <td style={styles.td}>{i+1}</td>
                      <td style={styles.td}>{formatDate(k.date)}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: k.type==="add"?"#fff3e0":"#e8f5e9",
                          color: k.type==="add"?"#e65100":"#2e7d32",
                          padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                        }}>
                          {k.type==="add"?"+ जोड़ा":"- घटाया"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign:"right", fontWeight:700, color: k.type==="add"?"#e65100":"#2e7d32" }}>
                        ₹{parseFloat(k.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 },
  modal: { background:"#fff", borderRadius:20, width:"100%", maxWidth:640, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" },
  modalHeader: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"20px 24px 14px", borderBottom:"1px solid #eee", gap:12 },
  modalTitle: { fontSize:17, fontWeight:800, color:"#1a237e" },
  modalSub: { fontSize:12, color:"#888", marginTop:3 },
  closeBtn: { background:"#f5f5f5", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" },
  tabs: { display:"flex", borderBottom:"1px solid #eee" },
  tab: { flex:1, padding:"10px 0", border:"none", background:"none", fontSize:13, fontWeight:600, color:"#888", cursor:"pointer" },
  tabActive: { color:"#b71c1c", borderBottom:"2px solid #b71c1c", background:"#fff9f9" },
  toolbar: { display:"flex", gap:10, padding:"12px 24px", borderBottom:"1px solid #f0f0f0", flexWrap:"wrap" },
  monthSelect: { flex:1, minWidth:160, border:"1px solid #ddd", borderRadius:9, padding:"8px 12px", fontSize:13, outline:"none", background:"#fff" },
  printBtn: { background:"#1565c0", color:"#fff", border:"none", borderRadius:9, padding:"8px 18px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" },
  summaryRow: { display:"flex", gap:10, padding:"12px 24px", borderBottom:"1px solid #f0f0f0" },
  sumBox: { flex:1, background:"#f5f5f5", borderRadius:10, padding:"8px 10px", textAlign:"center" },
  sumLabel: { display:"block", fontSize:10, color:"#888", marginBottom:2 },
  sumCredit: { display:"block", fontSize:15, fontWeight:800, color:"#2e7d32" },
  sumDebit: { display:"block", fontSize:15, fontWeight:800, color:"#c62828" },
  tableWrap: { overflowY:"auto", flex:1 },
  center: { padding:40, textAlign:"center", color:"#888" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { background:"#b71c1c", color:"#fff", padding:"10px 16px", fontSize:13, fontWeight:700, textAlign:"left", position:"sticky", top:0 },
  td: { padding:"10px 16px", fontSize:13, borderBottom:"1px solid #f0f0f0" },
};

export default TransactionHistory;