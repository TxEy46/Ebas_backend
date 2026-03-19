const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// 📋 1. GET transactions (ดึงเฉพาะของ User ที่ Login อยู่)
router.get("/", async (req, res) => {
    // 🔹 รับ userId จาก Query Parameter (เช่น /api/transactions?userId=xxx)
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const { data, error } = await supabase
            .from("transactions")
            .select(`
                id, type, amount, name, createdate, category_id, user_id,
                categories (name, color)
            `)
            .eq("user_id", userId) // 👈 Filter เฉพาะข้อมูลของ User คนนี้เท่านั้น
            .order("createdate", { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.log("DB fetch error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// ➕ 2. POST (Create) transaction
router.post("/", async (req, res) => {
    // 🔹 เพิ่ม user_id เข้ามาในตอนรับค่าจาก Body
    const { type, amount, category_id, name, user_id } = req.body;

    if (!type || !amount || !category_id || !name || !user_id) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const { data, error } = await supabase
            .from("transactions")
            .insert([{
                type,
                amount,
                category_id,
                name,
                user_id, // 👈 บันทึก ID ผู้ใช้ลงไปในแถวนี้ด้วย
                createdate: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: "Transaction created", transaction: data });
    } catch (err) {
        console.log("DB insert error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// ✏️ 3. PUT (Update) transaction
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { type, amount, category_id, name, user_id } = req.body;

    try {
        const { data, error } = await supabase
            .from("transactions")
            .update({ type, amount, category_id, name })
            .eq("id", id)
            .eq("user_id", user_id) // 👈 Check เพื่อความชัวร์ว่าคนแก้คือเจ้าของข้อมูล
            .select()
            .single();

        if (error) throw error;
        res.json({ message: "Transaction updated", transaction: data });
    } catch (err) {
        console.log("DB update error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// 🗑️ 4. DELETE transaction
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body; // รับ user_id มาเพื่อยืนยันสิทธิ์

    try {
        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id)
            .eq("user_id", user_id); // 👈 ลบได้เฉพาะของตัวเองเท่านั้น

        if (error) throw error;
        res.json({ message: "Transaction deleted successfully" });
    } catch (err) {
        console.log("DB delete error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;