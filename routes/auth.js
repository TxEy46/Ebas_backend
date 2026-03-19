const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase"); // 🔹 ดึง database มาใช้

// 🔐 login API (จะเป็น /api/login เมื่อไปประกอบในไฟล์หลัก)
router.post("/login", async (req, res) => {
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

module.exports = router;