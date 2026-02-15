const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// DATABASE SETUP
// ============================================================
const db = new Database(path.join(__dirname, "orders.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee TEXT NOT NULL,
    retailer TEXT NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    special_price TEXT DEFAULT '-',
    remarks TEXT DEFAULT '-',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ============================================================
// EMPLOYEE CREDENTIALS — Add/remove employees here
// ============================================================
const employees = [
  { username: "sam",    password: "sam123",    displayName: "Sam",    role: "employee" },
  { username: "rahul",  password: "rahul123",  displayName: "Rahul",  role: "employee" },
  { username: "vijay",  password: "vijay123",  displayName: "Vijay",  role: "employee" },
  { username: "amit",   password: "amit123",   displayName: "Amit",   role: "employee" },
  { username: "admin",  password: "admin123",  displayName: "Admin",  role: "admin"    }
];

// ============================================================
// DUMMY DATA — Replace with your Excel data later
// ============================================================
const retailers = [
  "Bob General Store", "Sharma Traders", "Patel Supermart",
  "Gupta Provision Store", "Krishna Retail Hub", "Mahalaxmi Traders",
  "Rajesh Kirana Store", "Sai Enterprises", "Balaji Mart",
  "Agarwal & Sons", "Mehta General Store", "Verma Traders",
  "Jain Provision House", "Singh Retail Centre", "Devi Stores"
];

const products = [
  "Sainath Gold Aggarbatti 100g", "Sainath Silver Aggarbatti 100g",
  "Sainath Premium Dhoop 50g", "Sainath Rose Aggarbatti 200g",
  "Sainath Mogra Aggarbatti 200g", "Sainath Chandan Aggarbatti 100g",
  "Sainath Lavender Aggarbatti 100g", "Sainath Guggal Dhoop 50g",
  "Sainath Mix Fragrance Pack 500g", "Sainath Economy Aggarbatti 250g",
  "Sainath Kewda Aggarbatti 100g", "Sainath Loban Dhoop 50g"
];

// ============================================================
// API ROUTES
// ============================================================

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const emp = employees.find(
    e => e.username.toLowerCase() === username.toLowerCase() && e.password === password
  );
  if (!emp) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  res.json({ username: emp.username, displayName: emp.displayName, role: emp.role });
});

// Get dropdown data
app.get("/api/data", (req, res) => {
  res.json({ retailers: retailers.sort(), products: products.sort() });
});

// Submit order
app.post("/api/orders", (req, res) => {
  const { employee, retailer, product, quantity, specialPrice, remarks } = req.body;
  if (!employee || !retailer || !product || !quantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const stmt = db.prepare(
    "INSERT INTO orders (employee, retailer, product, quantity, special_price, remarks) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(employee, retailer, product, quantity, specialPrice || "-", remarks || "-");
  res.json({ success: true, id: result.lastInsertRowid });
});

// Get orders (admin only) — optional date filter
app.get("/api/orders", (req, res) => {
  const { date } = req.query;
  let rows;
  if (date) {
    rows = db.prepare(
      "SELECT * FROM orders WHERE DATE(created_at) = ? ORDER BY created_at DESC"
    ).all(date);
  } else {
    // Default: today
    rows = db.prepare(
      "SELECT * FROM orders WHERE DATE(created_at) = DATE('now') ORDER BY created_at DESC"
    ).all();
  }
  res.json(rows);
});

// Delete order (admin only)
app.delete("/api/orders/:id", (req, res) => {
  db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Serve employee page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
