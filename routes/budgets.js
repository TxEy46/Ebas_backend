const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// 🔍 GET ดึงงบประมาณของเดือนที่ต้องการ
router.get("/:monthYear", async (req, res) => {
    const { monthYear } = req.params;
    const { userId } = req.query; // รับ userId จาก query parameter

    try {
        const { data, error } = await supabase
            .from("budgets")
            .select("*")
            .eq("month_year", monthYear)
            .eq("user_id", userId) // Filter เฉพาะของ user นี้
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.json({ month_year: monthYear, amount: 0 });
        
        res.json(data);
    } catch (err) {
        console.log("DB fetch budget error:", err);
        res.status(500).json({ message: "DB error" });
    }
});

// 💾 POST บันทึกหรืออัปเดตงบประมาณ
router.post("/", async (req, res) => {
    const { month_year, amount, user_id } = req.body;

    if (!month_year || amount === undefined || !user_id) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        // เช็คว่ามี budget เดิมไหม
        const { data: existingData } = await supabase
            .from("budgets")
            .select("id")
            .eq("month_year", month_year)
            .eq("user_id", user_id)
            .maybeSingle();

        let result;
        if (existingData) {
            result = await supabase
                .from("budgets")
                .update({ amount })
                .eq("id", existingData.id)
                .select().single();
        } else {
            result = await supabase
                .from("budgets")
                .insert([{ month_year, amount, user_id }])
                .select().single();
        }

        if (result.error) throw result.error;
        res.json({ message: "Budget saved successfully", budget: result.data });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router; // 👈 ต้องมีบรรทัดนี้ปิดท้ายเสมอ