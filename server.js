require("dotenv").config();
const express = require("express");
const cors = require("cors");

// 🔹 Import Routes ที่เราแยกไว้
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 log ทุก request
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ✅ route เช็คว่า server รัน
app.get("/", (req, res) => {
    res.send("Server is running ✅");
});

// 🛣️ เชื่อมต่อ Routes (กำหนด Prefix ให้แต่ละหมวดหมู่)
app.use("/api", authRoutes); // จะกลายเป็น /api/login
app.use("/api/transactions", transactionRoutes); // จะกลายเป็น /api/transactions/...
app.use("/api/budgets", budgetRoutes); // จะกลายเป็น /api/budgets/...

// 🚀 start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});