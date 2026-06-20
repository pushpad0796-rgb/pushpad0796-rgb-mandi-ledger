const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

const FAST2SMS_API_KEY    = "qAKQgYy0WBwE0eYzC8S1lQvu9B387QbHf0bOV5onShc75Px5rNB6hPlqPnss";
const FAST2SMS_MESSAGE_ID = "23573";
const FAST2SMS_SENDER_ID  = "919009158743";

const db = mysql.createConnection({
  host: "localhost", user: "root",
  password: "R@hul1225", database: "rahul_ledger",
});
db.connect(err => {
  if (err) console.log("❌ DB Error:", err.message);
  else console.log("✅ MySQL Connected");
});

app.get("/", (req, res) => res.send("✅ Mandi Ledger Backend Running"));

// =========================
// BUSINESS
// =========================
app.post("/add-business", (req, res) => {
  const { name, owner } = req.body;
  db.query("INSERT INTO businesses (name,owner) VALUES (?,?)", [name, owner], err => {
    if (err) return res.status(500).send("error");
    res.send("added");
  });
});
app.get("/businesses", (req, res) => {
  db.query("SELECT * FROM businesses ORDER BY id DESC", (err, r) => {
    if (err) return res.status(500).send("error");
    res.send(r);
  });
});
app.delete("/delete-business/:id", (req, res) => {
  db.query("DELETE FROM businesses WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).send("error");
    res.send("deleted");
  });
});

// =========================
// CLIENTS
// =========================
app.post("/add-client", (req, res) => {
  const { business_id, name, number, address, created_at, kalam } = req.body;
  const kalamValue = parseFloat(kalam) || 0;
  db.query(
    "INSERT INTO clients (business_id,name,number,address,created_at,kalam) VALUES (?,?,?,?,?,?)",
    [business_id, name, number, address, created_at, kalamValue],
    (err, result) => {
      if (err) return res.status(500).send("error");
      if (kalamValue > 0) {
        db.query(
          "INSERT INTO kalam_history (client_id, type, amount, date) VALUES (?,?,?,?)",
          [result.insertId, "add", kalamValue, created_at], () => {}
        );
      }
      res.send("added");
    }
  );
});
app.get("/clients/:id", (req, res) => {
  db.query("SELECT * FROM clients WHERE business_id=? ORDER BY name ASC", [req.params.id], (err, r) => {
    if (err) return res.status(500).send("error");
    res.send(r);
  });
});
app.delete("/delete-client/:id", (req, res) => {
  db.query("DELETE FROM clients WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).send("error");
    res.send("deleted");
  });
});

// =========================
// KALAM UPDATE
// =========================
app.post("/update-kalam", (req, res) => {
  const { client_id, type, amount, date } = req.body;
  const amt = Number(amount);
  const change = type === "add" ? amt : -amt;
  const entryDate = date || new Date().toISOString().split("T")[0];

  db.query(
    "INSERT INTO kalam_history (client_id, type, amount, date) VALUES (?,?,?,?)",
    [client_id, type, amt, entryDate],
    err => {
      if (err) return res.status(500).send("error");
      db.query(
        "UPDATE clients SET kalam = kalam + ? WHERE id = ?",
        [change, client_id],
        err2 => {
          if (err2) return res.status(500).send("error");
          res.send("updated");
        }
      );
    }
  );
});

app.get("/kalam-latest/:client_id", (req, res) => {
  db.query(
    "SELECT * FROM kalam_history WHERE client_id=? ORDER BY created_at DESC, id DESC LIMIT 1",
    [req.params.client_id],
    (err, r) => {
      if (err) return res.status(500).send("error");
      res.send(r[0] || { amount: 0, type: "add" });
    }
  );
});

app.get("/kalam-history/:client_id", (req, res) => {
  db.query(
    "SELECT * FROM kalam_history WHERE client_id=? ORDER BY date DESC, id DESC",
    [req.params.client_id],
    (err, r) => {
      if (err) return res.status(500).send("error");
      res.send(r);
    }
  );
});

// =========================
// TRANSACTIONS
// =========================
app.post("/add-transaction", (req, res) => {
  const { client_id, type, amount, date } = req.body;
  db.query(
    "INSERT INTO transactions (client_id,type,amount,`date`) VALUES (?,?,?,?)",
    [client_id, type, Number(amount), date],
    err => {
      if (err) return res.status(500).send("error");
      res.send("added");
    }
  );
});

app.get("/balance/:id", (req, res) => {
  db.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END),0) AS credit,
      COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END),0) AS debit
    FROM transactions WHERE client_id=?`,
    [req.params.id],
    (err, r) => {
      if (err) return res.status(500).send("error");
      res.send(r[0]);
    }
  );
});

// Jama reset ke BAAD ka jama — jama_reset_at ke baad jo transactions hue
app.get("/jama-after-reset/:id", (req, res) => {
  // pehle reset time lo
  db.query("SELECT jama_reset_at FROM clients WHERE id=?", [req.params.id], (err, r) => {
    if (err) return res.status(500).send("error");
    const resetAt = r[0]?.jama_reset_at || null;

    let sql, params;
    if (resetAt) {
      // reset ke baad ka jama
      sql = `SELECT COALESCE(SUM(amount),0) AS jama
             FROM transactions
             WHERE client_id=? AND type='credit' AND created_at > ?`;
      params = [req.params.id, resetAt];
    } else {
      // kabhi reset nahi hua — sab jama
      sql = `SELECT COALESCE(SUM(amount),0) AS jama
             FROM transactions
             WHERE client_id=? AND type='credit'`;
      params = [req.params.id];
    }

    db.query(sql, params, (err2, r2) => {
      if (err2) return res.status(500).send("error");
      res.send({ jama: parseFloat(r2[0]?.jama) || 0 });
    });
  });
});

app.get("/transactions/:client_id", (req, res) => {
  db.query(
    "SELECT * FROM transactions WHERE client_id=? ORDER BY `date` DESC, id DESC",
    [req.params.client_id],
    (err, r) => {
      if (err) return res.status(500).send("error");
      res.send(r);
    }
  );
});

// =========================
// SEND WHATSAPP + JAMA RESET
// =========================
app.post("/send-message", async (req, res) => {
  const { number, v1, v2, v3, v4, v5, v6, client_id } = req.body;
  console.log("📱 Sending to:", number, { v1, v2, v3, v4, v5, v6 });

  try {
    const variables = [v1, v2, v3, v4, v5, v6].join("|");
    const url = "https://www.fast2sms.com/dev/whatsapp"
      + "?authorization=" + FAST2SMS_API_KEY
      + "&numbers=" + number
      + "&message_id=" + FAST2SMS_MESSAGE_ID
      + "&variables_values=" + encodeURIComponent(variables)
      + "&sender_id=" + FAST2SMS_SENDER_ID;

    const response = await axios.get(url);
    console.log("Fast2SMS:", JSON.stringify(response.data));

    if (response.data.return === true) {
      // Message gaya — jama reset karo
      if (client_id) {
        db.query(
          "UPDATE clients SET jama_reset_at = NOW() WHERE id = ?",
          [client_id],
          () => {}
        );
      }
      res.json({ success: true });
    } else {
      res.json({ success: false, error: response.data.message || "Send nahi hua" });
    }
  } catch (err) {
    const e = err.response?.data;
    res.status(500).json({ success: false, error: e?.message || err.message });
  }
});

app.listen(5000, () => { console.log("🚀 Server: http://localhost:5000"); });