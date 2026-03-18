require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 log ทุก request
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// 🔑 connect supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// ✅ route เช็คว่า server รัน
app.get("/", (req, res) => {
    res.send("Server is running ✅");
});

// 🔐 login API
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    console.log("Login attempt:", username);

    try {
        console.time("supabase");

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const query = supabase
            .from("users")
            .select("id, username, password")
            .eq("username", username)
            .maybeSingle();

        const { data, error } = await Promise.race([query, timeout]);

        console.timeEnd("supabase");

        if (error) return res.status(500).json({ message: "DB error" });
        if (!data) return res.status(401).json({ message: "User not found" });
        if (data.password !== password) return res.status(401).json({ message: "Wrong password" });

        console.log("Login success:", username);
        res.json({ message: "Login success", user: data });
    } catch (err) {
        console.log("❌ ERROR:", err.message);
        res.status(500).json({ message: "Server timeout or error" });
    }
});

// GET transactions
app.get("/api/transactions", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .order("createdat", { ascending: false }); // ใช้ lowercase ตามจริง

        if (error) {
            console.log("DB fetch error:", error);
            return res.status(500).json({ message: "DB error" });
        }

        res.json(data);
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ➕ create transaction
app.post("/api/transactions", async (req, res) => {
    const { type, amount, category, name } = req.body;

    if (!type || !amount || !category || !name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const { data, error } = await supabase
            .from("transactions")
            .insert([{ type, amount, category, name }])
            .select()
            .single(); // คืนค่า transaction ที่สร้าง

        if (error) {
            console.log("DB insert error:", error);
            return res.status(500).json({ message: "DB insert error" });
        }

        res.status(201).json({ message: "Transaction created", transaction: data });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 🚀 start server
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 3001}`);
});