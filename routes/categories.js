const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// 📋 GET: ดึงหมวดหมู่ (กลาง + ส่วนตัว)
router.get("/", async (req, res) => {
    const { userId } = req.query;

    if (!userId || userId === 'undefined' || userId === 'null') {
        return res.status(400).json({ error: "Invalid or missing UserID" });
    }

    try {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            // ใช้ Template Literal แบบไม่มีฟันหนูครอบข้างใน (Supabase จัดการ UUID ให้เอง)
            .or(`user_id.is.null,user_id.eq.${userId}`)
            .order("name", { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Supabase GET Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ➕ POST: สร้างหมวดหมู่
router.post("/", async (req, res) => {
    const { name, type, color, user_id } = req.body;

    // 🛡️ ดักข้อมูลไม่ครบ
    if (!name || !type || !user_id) {
        return res.status(400).json({ error: "Missing required fields: name, type, or user_id" });
    }

    try {
        const { data, error } = await supabase
            .from("categories")
            .insert([{ name, type, color, user_id }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: "Category created", category: data });
    } catch (err) {
        console.error("Supabase POST Error:", err.message);
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params; // ID หมวดที่จะลบ
    const { user_id } = req.body; // ID ของผู้ใช้

    if (!user_id) return res.status(400).json({ error: "UserID is required" });

    try {
        // 1. ตรวจสอบก่อนว่าหมวดที่จะลบเป็น 'income' หรือ 'expense'
        const { data: catData } = await supabase
            .from("categories")
            .select("type")
            .eq("id", id)
            .single();

        // 2. กำหนด ID กลางที่จะย้ายไป (อ้างอิงจาก ID ใน DB ของคุณ)
        // ถ้าเป็น expense ย้ายไป 54 (เบ็ดเตล็ด), ถ้าเป็น income ย้ายไป 56 (รายได้เสริม/อื่นๆ)
        const defaultId = catData?.type === 'expense' ? 54 : 56;

        // 3. ย้าย Transaction ทั้งหมดที่เคยใช้ ID นี้ ไปที่หมวดกลาง
        const { error: updateError } = await supabase
            .from("transactions")
            .update({ category_id: defaultId })
            .eq("category_id", id)
            .eq("user_id", user_id);

        if (updateError) throw updateError;

        // 4. เมื่อไม่มี Transaction ค้างแล้ว ก็ลบ Category ได้อย่างปลอดภัย
        const { error: deleteError } = await supabase
            .from("categories")
            .delete()
            .eq("id", id)
            .eq("user_id", user_id);

        if (deleteError) throw deleteError;

        res.json({ message: "ลบหมวดหมู่และย้ายรายการไปหมวดมาตรฐานเรียบร้อย" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบ" });
    }
});

module.exports = router;