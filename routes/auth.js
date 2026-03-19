const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs"); // 🔹 สำหรับ Hash รหัส
const jwt = require("jsonwebtoken"); // 🔹 สำหรับสร้าง Token

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// 📝 1. Register API (แบบ Hash Password)
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Hash รหัสผ่านก่อนเก็บ (10 คือความละเอียดในการสุ่ม)
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from("users")
            .insert([{ username, password: hashedPassword }])
            .select().single();

        if (error) return res.status(400).json({ message: "Username นี้ถูกใช้ไปแล้ว" });

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 🔐 2. Login API (แบบเช็ค Hash และสร้าง JWT)
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .maybeSingle();

        if (!user) return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });

        // ตรวจสอบรหัสผ่านที่ส่งมา กับ Hash ใน DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

        // สร้าง JWT Token (เก็บ id และ username ไว้ข้างใน)
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1d" } // Token หมดอายุใน 1 วัน
        );

        res.json({
            message: "Login success",
            token, // 🔹 ส่ง Token กลับไปให้ Frontend
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;